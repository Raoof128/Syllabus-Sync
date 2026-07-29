# Lane D — RLS Policies & Database Migrations Audit

**Scope:** `supabase/migrations/` — 64 files, reviewed chronologically (by filename timestamp, which is also Supabase's application order), from `20260104000000_initial_schema.sql` through `20260405125806_remove_sample_user_seed.sql`.
**Method:** Read every migration in order; tracked each table's RLS/grant/policy state as it was created, weakened, re-fixed, or re-weakened; derived the **effective schema state as of the last migration touching each object**. No DB access — all findings are inferred from tracked SQL only. Two "PLAUSIBLE" findings depend on a standard Supabase platform default (view-owner role has `BYPASSRLS`) that cannot be confirmed from migration files alone; this is called out explicitly where it applies.
**Repo audited:** `/Users/raoof.r12/Desktop/Raouf/MQ_Research/Syllabus-Sync-backend-audit` (read-only).

---

## 0. Headline summary

| Metric                                                                     | Count                                                                                                                                                |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tables created (tracked migrations)                                        | 26                                                                                                                                                   |
| Views / materialized views with cross-tenant exposure risk                 | 5 (`user_details`, `mv_deadline_analytics`, `mv_user_activity_summary`, `mv_xp_leaderboard`, plus `recent_audit_activity` / `security_audit_events`) |
| P0 findings (cross-tenant exposure / auth bypass, live today)              | 5                                                                                                                                                    |
| P1 findings (high-impact exploitable, live today)                          | 4                                                                                                                                                    |
| P2 findings (material defect, concrete reachability)                       | 6                                                                                                                                                    |
| P3 findings (low impact / hardening gaps)                                  | 10                                                                                                                                                   |
| Distinct "later migration silently undid an earlier fix" regressions found | 2 (both on the `user_details` view)                                                                                                                  |

The single most important pattern in this migration history: **this codebase repeatedly fixes a security issue and then re-introduces it in a later, unrelated-looking migration** ("add a column", "add faculty field") that drops and recreates the same view/function without the security option the fix migration had added. This happened **twice** to the same view (`user_details`). Anyone reviewing "the fix commit" in isolation would conclude the system is safe; only a full chronological replay (as done here) reveals it is not, as of the last tracked migration.

---

## 1. Per-table matrix

Legend: ✅ = present and effective in final state · ⚠️ = present but weak/gap · ❌ = absent · SD = `SECURITY DEFINER`.

| Table                      | RLS enabled                                 | anon grants (final)                                                              | authenticated grants (final)                                     | SELECT policy                                                | INSERT policy (WITH CHECK)                                    | UPDATE policy (WITH CHECK)                                   | DELETE policy       | Indexes on predicate cols                                                              | Service-role callers                                                  | Findings                                                   |
| -------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `profiles`                 | ✅                                          | ❌ (revoked)                                                                     | SELECT, INSERT, UPDATE                                           | `auth.uid()=id` ✅                                           | ✅ `auth.uid()=id`                                            | ⚠️ USING only (safe: implicit reuse)                         | ❌ none (by design) | PK on `id`                                                                             | `handle_new_user`, `handle_new_user_safe`, `ensure_user_profile` (SD) | **P0-2** `ensure_user_profile` bypass; view exposure below |
| `units`                    | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE/DELETE                                      | own-row                                                      | ✅                                                            | ⚠️ USING only                                                | ✅                  | `idx_units_user_id`, unique `(user_id,code) WHERE deleted_at IS NULL`                  | seed/restore fns                                                      | soft-delete not enforced (P3)                              |
| `class_times`              | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE/DELETE                                      | `EXISTS` on owning unit                                      | ✅                                                            | ⚠️ USING only                                                | ✅                  | `idx_class_times_unit_id`                                                              | —                                                                     | none material                                              |
| `deadlines`                | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE/DELETE                                      | own-row + `deleted_at`                                       | ✅                                                            | ⚠️ USING only                                                | ✅                  | `idx_deadlines_user_id`, `_due_date`, `_unit_code`                                     | —                                                                     | drives double-XP race (P1-8)                               |
| `events`                   | ✅                                          | ❌ (was briefly re-granted then re-revoked; public read now via `public_events`) | SELECT/INSERT/UPDATE/DELETE                                      | own-row only (`user_id` now `NOT NULL`)                      | ✅                                                            | ⚠️ USING only                                                | ✅                  | `idx_events_user_id`, `_start_at`, `_end_at`                                           | `add_public_event_to_calendar` (SD)                                   | historic public-events churn, resolved                     |
| `notifications`            | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE/DELETE                                      | own-row                                                      | ✅                                                            | ⚠️ USING only                                                | ✅                  | `idx_notifications_user_id`                                                            | —                                                                     | none material                                              |
| `user_preferences`         | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE                                             | own-row                                                      | ✅                                                            | ⚠️ USING only                                                | ❌ (by design)      | PK-adjacent `UNIQUE(user_id)`                                                          | —                                                                     | none material                                              |
| `todos`                    | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE/DELETE                                      | own-row                                                      | ✅                                                            | ⚠️ USING only                                                | ✅                  | `idx_todos_user_id`                                                                    | —                                                                     | best-guarded table in repo                                 |
| `gamification_profiles`    | ✅                                          | ❌                                                                               | **SELECT/INSERT/UPDATE**                                         | own-row                                                      | ✅                                                            | ❌ **USING only, no column restriction**                     | ❌ (none)           | `idx_gamification_profiles_user_id`                                                    | `award_xp`, `update_streak` (SD)                                      | **P1-6 live self-XP tampering**                            |
| `xp_events`                | ✅                                          | ❌                                                                               | **SELECT/INSERT**                                                | own-row                                                      | **✅ but unrestricted amount/type**                           | ❌ (no UPDATE policy)                                        | ❌                  | `idx_xp_events_user_id`, `_event_type`, non-unique `(user_id,event_type,reference_id)` | `award_xp` (SD)                                                       | **P1-9 audit forgery; P1-8 double-award**                  |
| `xp_config`                | ✅                                          | ❌                                                                               | SELECT, + SELECT via own `USING(true)` policy (`20260226000000`) | `USING(true)` (read-only ref table)                          | ❌                                                            | ❌                                                           | ❌                  | PK on `event_type`                                                                     | —                                                                     | low risk (static config)                                   |
| `public_events`            | ✅                                          | ✅ SELECT (`deleted_at IS NULL`)                                                 | SELECT (via same policy, PUBLIC)                                 | `deleted_at IS NULL`, no `TO` clause                         | ❌ (service-role only writes)                                 | ❌                                                           | ❌                  | `idx_public_events_start_at/category/featured/not_deleted`                             | all writes                                                            | none material                                              |
| `webauthn_credentials`     | ✅                                          | ❌ (implicit; no `TO` clause but predicate blocks anon)                          | SELECT/INSERT/UPDATE/DELETE via policy                           | own-row                                                      | ✅                                                            | ⚠️ USING only                                                | ✅                  | `idx_webauthn_credentials_user_id/credential_id`, `credential_id` UNIQUE               | service_role full-access                                              | none material                                              |
| `webauthn_challenges`      | ✅                                          | **⚠️ effectively PUBLIC** (`OR user_id IS NULL`, no `TO` clause)                 | same                                                             | **`auth.uid()=user_id OR user_id IS NULL`, no role scoping** | same predicate                                                | — (no UPDATE policy)                                         | same predicate      | `idx_webauthn_challenges_challenge/expires_at` — **no index on `user_id`**             | service_role full-access                                              | **P0-5 unauthenticated cross-tenant read/delete**          |
| `backup_codes`             | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE/DELETE                                      | own-row                                                      | ✅                                                            | ⚠️ USING only                                                | ✅                  | `idx_backup_codes_user_id`; no UNIQUE on `code`                                        | service_role                                                          | P3 (no unique on `code`)                                   |
| `email_verifications`      | ✅                                          | ❌                                                                               | **none** (service_role only)                                     | —                                                            | —                                                             | —                                                            | —                   | non-unique partial indexes only                                                        | `cleanup_expired_email_verifications` (SD)                            | P3: "1 active token" invariant not DB-enforced             |
| `password_resets`          | ✅                                          | ❌                                                                               | **none** (service_role only)                                     | —                                                            | —                                                             | —                                                            | —                   | non-unique partial indexes only                                                        | `cleanup_expired_password_resets` (SD)                                | P3: same as above; no FK to `auth.users`                   |
| `rate_limits`              | ✅                                          | ❌                                                                               | **none** (service_role only, explicit table REVOKE)              | —                                                            | —                                                             | —                                                            | —                   | PK on `key` (atomic upsert)                                                            | `ratelimit_*` (SD)                                                    | best-hardened table in repo                                |
| `auth_audit_logs`          | ✅                                          | ❌                                                                               | **none** (service_role only)                                     | —                                                            | ✅ INSERT `WITH CHECK(true)` TO service_role                  | —                                                            | —                   | `idx_auth_audit_logs_event_type/created_at/ip`                                         | service_role                                                          | none material                                              |
| `audit_logs`               | ✅                                          | ❌                                                                               | SELECT only                                                      | own-row                                                      | ❌ `WITH CHECK(false)` for all non-definer paths              | ❌ `USING(false)`                                            | ❌ `USING(false)`   | `idx_audit_logs_user_id/created_at/action/table_name/severity`                         | `log_audit`, `cleanup_old_audit_logs` (SD)                            | table itself correct; **views leak it, see P0-4**          |
| `audit_settings`           | — (no RLS statement found)                  | not granted                                                                      | not granted                                                      | —                                                            | —                                                             | —                                                            | —                   | PK on `key`                                                                            | `cleanup_old_audit_logs`                                              | inaccessible via API by default; low risk                  |
| `app_config`               | ✅                                          | ❌                                                                               | **none** (service_role only)                                     | —                                                            | —                                                             | —                                                            | —                   | `idx_app_config_key`                                                                   | service_role (`USING(true)` policy, scoped to service_role)           | none material                                              |
| `user_sessions`            | ✅                                          | ❌ (explicit REVOKE)                                                             | SELECT/INSERT/UPDATE/DELETE                                      | own-row `TO authenticated`                                   | ✅                                                            | ✅ **explicit matching WITH CHECK**                          | ✅                  | `idx_user_sessions_*`                                                                  | —                                                                     | model example — no gaps                                    |
| `push_subscriptions`       | ✅                                          | ❌ (explicit REVOKE)                                                             | SELECT/INSERT/UPDATE/DELETE                                      | own-row                                                      | ✅                                                            | ✅ **explicit matching WITH CHECK**                          | ✅                  | `idx_push_subscriptions_user_id`; `endpoint` UNIQUE                                    | —                                                                     | none material                                              |
| `push_reminder_deliveries` | ✅                                          | ❌ (explicit REVOKE)                                                             | SELECT only                                                      | own-row                                                      | — (writes = service_role)                                     | —                                                            | —                   | `idx_push_reminder_deliveries_user_id`                                                 | service_role/backend                                                  | none material                                              |
| `schedules`                | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE/DELETE                                      | own + shared-membership                                      | ✅ `owner_id=auth.uid()`                                      | ⚠️ USING only (safe: single-column)                          | ✅                  | `idx_schedules_owner`                                                                  | —                                                                     | none material                                              |
| `schedule_members`         | ✅                                          | ❌                                                                               | SELECT/INSERT/UPDATE/DELETE                                      | own membership + owner-of-schedule                           | ✅ but only checks `schedule_id`, not target `user_id`/`role` | ❌ **USING only checks `schedule_id`, not `user_id`/`role`** | ✅                  | `idx_schedule_members_schedule/user`                                                   | —                                                                     | **P1-7 role/ownership reassignment**                       |
| `edge_response_cache`      | ✅ (added late, was previously unprotected) | ❌                                                                               | ❌                                                               | service_role only, `USING(true)`                             | service_role only                                             | service_role only                                            | service_role only   | n/a                                                                                    | service_role                                                          | fixed correctly; formerly a real gap                       |

**Views / materialized views (cannot carry independent RLS in the "own-row" sense the tables above have):**

| Object                                      | RLS-equivalent protection                                                                        | Grants                              | Status                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------ |
| `public.user_details` (view)                | `security_invoker=true` **toggled on/off three times**; final state (`20260304100000`) = **OFF** | `GRANT SELECT ... TO authenticated` | **P0-1 — live cross-tenant PII exposure**        |
| `public.mv_deadline_analytics` (matview)    | none possible (Postgres limitation)                                                              | `GRANT SELECT ... TO authenticated` | **P0-3 — live cross-tenant exposure**            |
| `public.mv_user_activity_summary` (matview) | none possible                                                                                    | `GRANT SELECT ... TO authenticated` | **P0-3 — live cross-tenant exposure**            |
| `public.mv_xp_leaderboard` (matview)        | none possible; final def dropped its `LIMIT 100`                                                 | `GRANT SELECT ... TO authenticated` | **P0-3 — full-roster leak, not top-100**         |
| `public.recent_audit_activity` (view)       | no `security_invoker`, no filter                                                                 | `GRANT SELECT ... TO authenticated` | **P0-4 — plausible cross-tenant audit-log leak** |
| `public.security_audit_events` (view)       | no `security_invoker`, no filter                                                                 | `GRANT SELECT ... TO authenticated` | **P0-4 — plausible cross-tenant audit-log leak** |

**Storage:** `storage.buckets` row `avatars` (`public=true`), 4 policies on `storage.objects`: `avatars_insert_own`/`avatars_update_own`/`avatars_delete_own` scoped by `(storage.foldername(name))[1] = auth.uid()::text`, `avatars_select_public` intentionally public. `avatars_update_own` lacks an explicit `WITH CHECK` (P3, low risk — Postgres reuses `USING` for UPDATE by default).

---

## 2. Findings

### P0 — Cross-tenant data exposure / auth bypass (live in the final migration state)

#### P0-1. `user_details` view repeatedly loses `security_invoker`, currently exposed

- **File:line (introduces the bug the 2nd time, currently live):** `supabase/migrations/20260304100000_add_faculty_to_views_and_functions.sql:6-31`
- **Effective policy today:** `DROP VIEW IF EXISTS public.user_details;` followed by `CREATE VIEW public.user_details AS SELECT p.id, p.email, p.full_name, p.student_id, p.avatar_url, p.course, p.year, p.faculty, p.created_at, p.updated_at, COALESCE(gp.xp,0), COALESCE(gp.streak_days,0), ... FROM public.profiles p LEFT JOIN public.gamification_profiles gp ON p.id = gp.user_id` — **no `WITH (security_invoker = true)`**, no `WHERE`. `GRANT SELECT ON public.user_details TO authenticated;` (`:31`).
- **Root cause:** Postgres views default to executing with the **view owner's** privileges unless `security_invoker = true` is set (PG15+/Supabase-recommended). The migration-runner role that creates Supabase objects typically has `BYPASSRLS`. Without `security_invoker`, RLS policies on `profiles` (`auth.uid()=id`) and `gamification_profiles` (`auth.uid()=user_id`) are evaluated using the _owner's_ bypass privilege, not the querying user's, so the view returns **every row** to any caller with `SELECT` on the view.
- **Regression timeline (the key finding of this audit):**
  1. `20260113000000_reenable_auth_trigger_with_user_view.sql:104` — `ALTER VIEW public.user_details SET (security_invoker = true);` → **fixed**.
  2. `20260114011650_fix_schema_comprehensive.sql:865-890` — view dropped/recreated **without** the option → **regressed** (1 day later).
  3. Redefined again, still unfiltered, in `20260114013136_complete_schema_audit_fix.sql`, `20260124000000_complete_schema_initialization.sql:345-367` — regression persists.
  4. `20260226000000_fix_security_definer_and_rls.sql:16-40` — `CREATE VIEW public.user_details WITH (security_invoker = true) AS ...` → **fixed again**, explicitly titled "fix SECURITY DEFINER and RLS."
  5. `20260304100000_add_faculty_to_views_and_functions.sql:6-31` — view dropped/recreated to add a `faculty` column, **again omits `security_invoker`** → **regressed a second time, and this is the last migration to touch the view.**
- **Failure scenario:** Any signed-up user (lowest capability: one valid session) runs `supabase.from('user_details').select('*')`. They receive every user's email, full name, student ID, avatar URL, course, year, faculty, XP, streak, and computed level — the entire user roster's PII and academic profile data.
- **Attacker capability required:** one authenticated session (self-signup, free). **Reachable:** yes, directly via PostgREST/supabase-js with the standard anon+auth flow; no special app code path needed since the view is client-queryable.
- **Corrective migration sketch:**
  ```sql
  -- 20260406000000_fix_user_details_security_invoker_permanently.sql
  DROP VIEW IF EXISTS public.user_details;
  CREATE VIEW public.user_details
  WITH (security_invoker = true)
  AS
  SELECT p.id, p.email, p.full_name, p.student_id, p.avatar_url,
         p.course, p.year, p.faculty, p.created_at, p.updated_at,
         COALESCE(gp.xp,0) AS xp, COALESCE(gp.streak_days,0) AS streak_days,
         COALESCE(gp.longest_streak,0) AS longest_streak, gp.last_activity_date,
         CASE WHEN gp.xp IS NULL OR gp.xp < 0 THEN 1
              ELSE LEAST(100, FLOOR(SQRT(gp.xp::float/25))+1)::integer END AS level
  FROM public.profiles p
  LEFT JOIN public.gamification_profiles gp ON p.id = gp.user_id;
  GRANT SELECT ON public.user_details TO authenticated;
  -- Regression guard: add a CI check that greps every `CREATE (OR REPLACE )?VIEW` in
  -- new migrations touching public.user_details/recent_audit_activity/security_audit_events
  -- for the literal string "security_invoker = true" and fails the build if absent.
  ```

#### P0-2. `ensure_user_profile()` — unrestricted cross-tenant profile overwrite (IDOR)

- **File:line:** `supabase/migrations/20260109013302_disable_all_auth_triggers.sql:52-75`
- **Effective policy today:** function is never redefined or dropped by any later migration (confirmed: only one `CREATE OR REPLACE FUNCTION public.ensure_user_profile` in the whole 64-file set, and no matching `DROP FUNCTION`).
  ```sql
  CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_user_id uuid, p_email text, p_full_name text DEFAULT NULL)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
      INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
      VALUES (p_user_id, p_email, COALESCE(p_full_name, ''), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
      INSERT INTO public.gamification_profiles (user_id, xp, streak_days, longest_streak, created_at, updated_at)
      VALUES (p_user_id, 0, 0, 0, NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING;
  END; $$;
  GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid, text, text) TO authenticated;  -- :74
  ```
- **Root cause:** `SECURITY DEFINER` function with no `p_user_id = auth.uid()` ownership check, directly `GRANT EXECUTE`d to `authenticated`. Contrast with its sibling `create_user_profile()` (same-era file `20260109012136_create_user_profile_function.sql:15-17`), which does check `IF p_user_id != auth.uid() THEN RAISE EXCEPTION`.
- **Failure scenario:** Any authenticated user calls `supabase.rpc('ensure_user_profile', { p_user_id: '<victim-uuid>', p_email: 'attacker@evil.com', p_full_name: 'pwned' })`. Victim's `profiles.email`/`updated_at` are overwritten immediately (the `ON CONFLICT DO UPDATE` branch fires since the victim's profile already exists), and if the victim had no `gamification_profiles` row yet, one is silently created for them. Victim UUIDs are trivially discoverable via the leaderboard/materialized-view leaks above (P0-3), or simply by enumerating UUIDs returned in any shared-content list (event RSVPs, `schedule_members`, etc.).
- **Attacker capability required:** one authenticated session + a target UUID. **Reachable:** yes, directly via `supabase.rpc()`, no server-side code path needed.
- **Corrective migration sketch:**
  ```sql
  -- 20260406000100_fix_ensure_user_profile_idor.sql
  CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_user_id uuid, p_email text, p_full_name text DEFAULT NULL)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
      IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
          RAISE EXCEPTION 'Unauthorized profile write attempt' USING ERRCODE = '42501';
      END IF;
      INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
      VALUES (p_user_id, p_email, COALESCE(p_full_name, ''), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
      INSERT INTO public.gamification_profiles (user_id, xp, streak_days, longest_streak, created_at, updated_at)
      VALUES (p_user_id, 0, 0, 0, NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING;
  END; $$;
  REVOKE ALL ON FUNCTION public.ensure_user_profile(uuid, text, text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid, text, text) TO authenticated, service_role;
  ```
  (Given the app now has `handle_new_user()` trigger-based profile creation as of `20260314_auto_create_profile_trigger.sql`, the better fix is likely to **drop `ensure_user_profile` entirely**, the same way `20260405125806_remove_sample_user_seed.sql` dropped the demo-seed family, if nothing in the current app calls it.)

#### P0-3. Materialized views expose the entire user roster's PII/analytics to any authenticated user

- **File:line (final, live definitions):** `supabase/migrations/20260124000000_complete_schema_initialization.sql:370-412` (redefining the views first introduced at `20260114000000_add_missing_materialized_views.sql:6-59` and `20260114013519_add_soft_deletes_constraints_seeds.sql:245-325`)
- **Effective policy today:** `GRANT SELECT ON public.mv_deadline_analytics TO authenticated;`, same for `mv_user_activity_summary`, `mv_xp_leaderboard` (`:410-412`). No RLS is possible on a materialized view in Postgres (confirmed limitation, not a config gap).
- **Root cause:** materialized views are physically-stored snapshots; they do not consult the querying role's RLS policies on their source tables at query time — they were already flattened at `REFRESH` time by whichever role ran the refresh (a service-role/definer context). Granting `SELECT` on the matview to `authenticated` is therefore a **direct, un-filterable grant of every row to every logged-in user.**
  - `mv_user_activity_summary`: per-user `xp, streak_days, longest_streak, last_activity_date, total_actions, last_action_at` for **every** user, no filter.
  - `mv_deadline_analytics`: per-user deadline/completion/overdue counts for **every** user, no filter.
  - `mv_xp_leaderboard`: intentionally cross-user by design (a leaderboard), but the final redefinition (`20260124000000:384-394`) **drops the `LIMIT 100`** present in the prior version (`20260114013519_add_soft_deletes_constraints_seeds.sql:303`), so it now returns the **full** user base's `user_id, full_name, avatar_url, xp, streak_days, level, rank` rather than a top-100 leaderboard.
- **Failure scenario:** `select * from mv_user_activity_summary` from any authenticated client returns the whole user base's activity data — not just a leaderboard (which is at least intentional for `mv_xp_leaderboard`), but private academic-planning telemetry (deadline counts, overdue counts) for every student in the system.
- **Attacker capability required:** one authenticated session. **Reachable:** yes, directly via `supabase.from('mv_user_activity_summary').select('*')`.
- **Corrective migration sketch:** materialized views cannot be RLS-protected; replace the grant with a `SECURITY INVOKER` wrapper function or a `security_barrier` view over a _non-materialized_, `auth.uid()`-filtered query, and revoke direct table-level access:

  ```sql
  -- 20260406000200_lock_down_materialized_views.sql
  REVOKE SELECT ON public.mv_deadline_analytics, public.mv_user_activity_summary, public.mv_xp_leaderboard FROM authenticated;
  GRANT SELECT ON public.mv_deadline_analytics, public.mv_user_activity_summary, public.mv_xp_leaderboard TO service_role;

  CREATE OR REPLACE FUNCTION public.get_my_activity_summary()
  RETURNS SETOF public.mv_user_activity_summary
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT * FROM public.mv_user_activity_summary WHERE user_id = auth.uid();
  $$;
  GRANT EXECUTE ON FUNCTION public.get_my_activity_summary() TO authenticated;
  -- repeat pattern for mv_deadline_analytics (get_my_deadline_analytics())

  -- Re-add the LIMIT 100 leaderboard boundary intentionally:
  CREATE OR REPLACE FUNCTION public.get_xp_leaderboard()
  RETURNS SETOF public.mv_xp_leaderboard
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT * FROM public.mv_xp_leaderboard ORDER BY rank LIMIT 100;
  $$;
  GRANT EXECUTE ON FUNCTION public.get_xp_leaderboard() TO authenticated;
  ```

#### P0-4. Audit-log views likely bypass `audit_logs` RLS (PLAUSIBLE, needs one live check)

- **File:line:** `supabase/migrations/20260129000000_add_audit_logging.sql:308-331`
- **Effective policy today:** unchanged since creation — never touched by any later migration.

  ```sql
  CREATE OR REPLACE VIEW public.recent_audit_activity AS
  SELECT al.*, CASE ... END AS category FROM public.audit_logs al
  WHERE al.created_at > now() - interval '24 hours' ORDER BY al.created_at DESC;   -- no user_id filter
  GRANT SELECT ON public.recent_audit_activity TO authenticated;                    -- :321

  CREATE OR REPLACE VIEW public.security_audit_events AS
  SELECT * FROM public.audit_logs
  WHERE severity IN ('warning','critical') OR action IN ('PASSWORD_CHANGE','EMAIL_CHANGE','MFA_ENABLE','MFA_DISABLE','LOGIN','LOGOUT')
  ORDER BY created_at DESC;                                                         -- no user_id filter
  GRANT SELECT ON public.security_audit_events TO authenticated;                    -- :331
  ```

  Underlying table `audit_logs` itself has a correct policy: `"Users can view their own audit logs" ... USING (user_id = auth.uid())` (`20260214003000_restore_missing_core_security_tables.sql:121-126`). Neither view declares `security_invoker = true`.

- **Root cause:** identical class of bug as P0-1 — a plain view over an RLS-protected table, created by a role that (per standard Supabase project defaults) has `BYPASSRLS`, with no per-row filter and a broad `GRANT SELECT ... TO authenticated`.
- **Failure scenario (pending live confirmation):** any authenticated user runs `select * from security_audit_events` and receives every user's password-change/email-change/login/logout/MFA events, including `ip_address`, `user_agent`, and `old_data`/`new_data` JSON payloads for the last N days.
- **Attacker capability required:** one authenticated session. **Reachability caveat:** this finding assumes the migration-applying role owns these views and has `BYPASSRLS` — the standard Supabase project default, not overridden anywhere in tracked migrations — but was not independently confirmed against a live database (no DB access for this audit). Recommend verifying with `SELECT viewname, viewowner FROM pg_views WHERE viewname IN ('recent_audit_activity','security_audit_events'); SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = '<viewowner>';` before treating as fully confirmed; treat as P0 until disproven given the blast radius.
- **Corrective migration sketch:**

  ```sql
  -- 20260406000300_fix_audit_views_security_invoker.sql
  DROP VIEW IF EXISTS public.recent_audit_activity;
  CREATE VIEW public.recent_audit_activity WITH (security_invoker = true) AS
  SELECT al.*, CASE ... END AS category FROM public.audit_logs al
  WHERE al.created_at > now() - interval '24 hours' ORDER BY al.created_at DESC;
  GRANT SELECT ON public.recent_audit_activity TO authenticated;

  DROP VIEW IF EXISTS public.security_audit_events;
  CREATE VIEW public.security_audit_events WITH (security_invoker = true) AS
  SELECT * FROM public.audit_logs
  WHERE severity IN ('warning','critical') OR action IN ('PASSWORD_CHANGE','EMAIL_CHANGE','MFA_ENABLE','MFA_DISABLE','LOGIN','LOGOUT')
  ORDER BY created_at DESC;
  GRANT SELECT ON public.security_audit_events TO authenticated;
  ```

#### P0-5. `webauthn_challenges` RLS allows unauthenticated (anon) cross-tenant read/insert/delete

- **File:line:** `supabase/migrations/20260207000000_add_webauthn_tables.sql:95-108`, faithfully re-created (not fixed) at `supabase/migrations/20260214003000_restore_missing_core_security_tables.sql:251-271`
- **Effective policy today:**
  ```sql
  CREATE POLICY "Users can view own challenges" ON public.webauthn_challenges
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);      -- no TO clause => PUBLIC
  CREATE POLICY "Users can insert challenges" ON public.webauthn_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL); -- no TO clause => PUBLIC
  CREATE POLICY "Users can delete own challenges" ON public.webauthn_challenges
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);      -- no TO clause => PUBLIC
  ```
- **Root cause:** the `user_id IS NULL` branch exists to support pre-authentication passkey registration/login (before a session exists, the challenge row legitimately has no owner yet). But the policy has **no `TO authenticated` clause**, so it applies to `PUBLIC`, which includes the `anon` role — and Supabase's client-side `anon` key is shipped in every web bundle. There is no per-request scoping (e.g., a random token in the row plus a match on that token) limiting a caller to _their own_ NULL-owner challenge; **any** caller can see/insert/delete **all** NULL-owner challenge rows system-wide, i.e. everyone else's in-flight passkey ceremonies.
- **Failure scenario:** an unauthenticated attacker (no account required) polls `select * from webauthn_challenges where user_id is null` during any window when other users are registering/logging in with a passkey, harvesting `challenge` values, or runs `delete from webauthn_challenges where user_id is null` to continuously break every other user's in-progress passkey registration/login (denial of service), all without ever authenticating.
- **Attacker capability required:** none (anon key only, shipped client-side). **Reachable:** yes, directly via PostgREST with the public anon key — no signup needed.
- **Corrective migration sketch:**
  ```sql
  -- 20260406000400_fix_webauthn_challenges_anon_exposure.sql
  DROP POLICY IF EXISTS "Users can view own challenges" ON public.webauthn_challenges;
  DROP POLICY IF EXISTS "Users can insert challenges" ON public.webauthn_challenges;
  DROP POLICY IF EXISTS "Users can delete own challenges" ON public.webauthn_challenges;
  -- Pre-auth challenges should never be directly queryable by REST clients at all;
  -- route creation/verification exclusively through SECURITY DEFINER RPCs that
  -- check a caller-supplied opaque challenge_id + short-lived cookie/nonce instead
  -- of relying on RLS row visibility. Minimal in-place fix if RPC refactor isn't
  -- feasible immediately: restrict to authenticated-only, and stop allowing
  -- anonymous pre-auth challenge rows to be publicly listable/deletable:
  CREATE POLICY "Users can view own challenges" ON public.webauthn_challenges
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own challenges" ON public.webauthn_challenges
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own challenges" ON public.webauthn_challenges
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
  -- Pre-auth (user_id IS NULL) registration/login challenges must be created,
  -- fetched, and consumed exclusively via SECURITY DEFINER functions that mint
  -- and validate an opaque, single-use, IP/UA-bound challenge token server-side,
  -- never via direct table SELECT/INSERT/DELETE from the client.
  CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON public.webauthn_challenges(user_id);
  ```

---

### P1 — High-impact, exploitable in the final migration state

#### P1-6. `gamification_profiles` — any user can set their own XP/streak to any value, bypassing `award_xp()`

- **File:line:** policy `supabase/migrations/20260124000000_complete_schema_initialization.sql:334`; grant `:276`.
- **Effective policy today:**
  ```sql
  GRANT SELECT, INSERT, UPDATE ON public.gamification_profiles TO authenticated;                          -- :276
  CREATE POLICY "Users can update their own gamification profile" ON public.gamification_profiles
    FOR UPDATE USING (auth.uid() = user_id);                                                                -- :334, no WITH CHECK
  ```
- **Root cause:** the USING predicate only constrains _which row_ may be updated (must be the caller's own), not _which columns/values_ the update may set. Postgres's implicit reuse of `USING` as `WITH CHECK` for UPDATE (when no explicit `WITH CHECK` is given) still only re-checks `auth.uid() = user_id` on the new row — it does not, and structurally cannot, constrain `xp`/`streak_days`/`longest_streak` to be "only what `award_xp()` would have computed." Only `xp >= 0` / `streak_days >= 0` CHECK constraints bound the values (added `20260114013519_add_soft_deletes_constraints_seeds.sql:151-178`); there is no upper bound and no monotonicity enforcement. `20260214000000_harden_gamification_rpc.sql`, which hardened the `award_xp`/`update_streak` **functions**, never touched this table-level grant/policy, so the direct-write path remains open even after that "hardening" migration.
- **Failure scenario:** any authenticated user runs `supabase.from('gamification_profiles').update({ xp: 999999999, streak_days: 9999 }).eq('user_id', myUid)` directly via PostgREST — no RPC involved — instantly topping the leaderboard (`mv_xp_leaderboard`, once refreshed) and defeating the entire anti-cheat design `award_xp()` was built for.
- **Attacker capability required:** one authenticated session (their own account). **Reachable:** yes, directly via `supabase-js` table client, bypassing the app's RPC layer entirely.
- **Corrective migration sketch:**
  ```sql
  -- 20260406000500_lock_gamification_profiles_direct_writes.sql
  REVOKE UPDATE, INSERT ON public.gamification_profiles FROM authenticated;
  -- Keep SELECT for the user's own row (existing SELECT policy is fine).
  -- All mutation must go through award_xp()/update_streak() (SECURITY DEFINER, already ownership-checked).
  DROP POLICY IF EXISTS "Users can insert their own gamification profile" ON public.gamification_profiles;
  DROP POLICY IF EXISTS "Users can update their own gamification profile" ON public.gamification_profiles;
  ```

#### P1-7. `schedule_members` — a schedule owner can reassign a membership row's `user_id`/`role`, including granting `'owner'`

- **File:line:** `supabase/migrations/20260220100000_realtime_offline.sql:79-83`
- **Effective policy today:**
  ```sql
  CREATE POLICY "Schedule owners can update members" ON public.schedule_members
    FOR UPDATE USING (schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid()));
  -- no WITH CHECK
  ```
- **Root cause:** the predicate only checks that the **schedule** being touched belongs to the caller; it says nothing about `user_id` or `role` on the row being written. Postgres's implicit USING-reuse for UPDATE re-validates only `schedule_id IN (...)` on the new row too — `user_id` and `role` are completely unconstrained by the policy.
- **Failure scenario:** a user who owns (or was made owner of) any `schedules` row can run `update schedule_members set user_id = '<arbitrary-uuid>', role = 'owner' where schedule_id = '<their-schedule>'` to reassign any existing membership row on that schedule to an arbitrary `user_id`, or promote any existing member to `'owner'` (co-owner) without the target's consent, or hijack another legitimate member's row to point at a different account.
- **Attacker capability required:** ownership of at least one `schedules` row (any authenticated user can create one for free via `"Users can create own schedules"`), plus knowledge of another user's UUID. **Reachable:** yes, directly via `supabase.from('schedule_members').update(...)`.
- **Corrective migration sketch:**
  ```sql
  -- 20260406000600_fix_schedule_members_update_check.sql
  DROP POLICY IF EXISTS "Schedule owners can update members" ON public.schedule_members;
  CREATE POLICY "Schedule owners can update members" ON public.schedule_members
    FOR UPDATE
    USING (schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid()))
    WITH CHECK (
      schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid())
      -- Disallow silently reassigning an existing row to a different user or
      -- self-granting 'owner' through a bare UPDATE; role changes to 'owner'
      -- should go through a dedicated transfer-ownership RPC with its own checks.
      AND role <> 'owner'
    );
  ```

#### P1-8. Double/duplicate XP award via `deadlines.completed` toggling (race condition the schema should prevent)

- **File:line:** trigger function `supabase/migrations/20260114014506_schema_cleanup_and_normalization.sql:294-329` (final definition; first introduced `20260109012243_add_gamification_system.sql:310-346`); missing guard: `xp_events` has only a non-unique index `idx_xp_events_user_event_ref` (`20260114011650_fix_schema_comprehensive.sql:183`), never a `UNIQUE` constraint.
- **Effective policy today:**
  ```sql
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
      PERFORM update_streak(NEW.user_id);
      ...
      PERFORM award_xp(NEW.user_id, 'deadline_completed', NEW.id, ...);   -- :316-317, no idempotency guard
      IF NEW.due_date > NOW() + INTERVAL '24 hours' THEN
          PERFORM award_xp(NEW.user_id, 'deadline_early', NEW.id, ...);   -- :321-323, no idempotency guard
      END IF;
  END IF;
  ```
  Only `first_deadline` is protected (`NOT EXISTS` check, `:305-313`); `deadline_completed` and `deadline_early` are not.
- **Root cause:** the trigger fires on every `false→true` transition of `completed`, and the standard `deadlines` UPDATE policy (`USING (auth.uid() = user_id)`) permits the owner to freely toggle `completed` back to `false` and then to `true` again via normal API calls — there is nothing in the schema (no `UNIQUE (user_id, event_type, reference_id)` on `xp_events`, no "already awarded for this deadline" check in the trigger) preventing the same deadline from re-triggering `deadline_completed`/`deadline_early` XP indefinitely.
- **Failure scenario:** a user calls `update deadlines set completed=false where id=X` then `update deadlines set completed=true where id=X` in a loop (trivially scriptable), earning `deadline_completed` (+ `deadline_early`, if still >24h before due) XP on every cycle, inflating both their `gamification_profiles.xp` (via the now-ownership-checked but still trust-the-trigger `award_xp`) and the leaderboard.
- **Attacker capability required:** one authenticated session, ownership of at least one deadline (created for free by any signed-up user). **Reachable:** yes, via the app's normal "mark deadline complete" toggle, called repeatedly.
- **Corrective migration sketch:**

  ```sql
  -- 20260406000700_prevent_duplicate_deadline_xp_awards.sql
  CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_events_user_event_ref
    ON public.xp_events (user_id, event_type, reference_id)
    WHERE reference_id IS NOT NULL;

  CREATE OR REPLACE FUNCTION public.award_xp(
    p_user_id uuid, p_event_type text, p_reference_id uuid DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb
  ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    -- (existing ownership check preserved)
    IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'Unauthorized XP award attempt for another user' USING ERRCODE = '42501';
    END IF;
    IF p_reference_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.xp_events
      WHERE user_id = p_user_id AND event_type = p_event_type AND reference_id = p_reference_id
    ) THEN
      RETURN jsonb_build_object('xp_awarded', 0, 'already_awarded', true);
    END IF;
    -- ... rest of existing body unchanged, relying on uq_xp_events_user_event_ref as a backstop ...
  END; $$;
  ```

#### P1-9. `xp_events` — direct client INSERT allows XP-audit-log forgery

- **File:line:** `supabase/migrations/20260124000000_complete_schema_initialization.sql:338` (policy), `:277` (grant, reiterating `20260109012243_add_gamification_system.sql:70`)
- **Effective policy today:**
  ```sql
  GRANT SELECT, INSERT ON public.xp_events TO authenticated;                                    -- :277
  CREATE POLICY "Users can insert their own XP events" ON public.xp_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);                                                -- :338
  ```
  bounded only by table CHECK constraints: `xp_amount > 0` and `event_type` in a fixed enum (`20260109012243_add_gamification_system.sql:33-45`).
- **Root cause:** this INSERT policy was added in a later "consolidated schema" migration with no equivalent in the earlier, more conservative migrations (which relied solely on the `award_xp()` SECURITY DEFINER function to write `xp_events`, per that file's own comment). It re-opens a direct write path the design had deliberately closed.
- **Failure scenario:** a user inserts arbitrary rows like `{ user_id: auth.uid(), event_type: 'level_up_bonus', xp_amount: 999999, reference_id: null }` directly. This does **not** move `gamification_profiles.xp` (that column is only updated by `award_xp()`/the direct-UPDATE path in P1-6), but it corrupts the `xp_events` audit/history table that the app and any admin tooling treat as a ground-truth log, and inflates any UI/analytics that aggregate `SUM(xp_amount)` from `xp_events` directly rather than from `gamification_profiles.xp`.
- **Attacker capability required:** one authenticated session. **Reachable:** yes, via `supabase.from('xp_events').insert(...)`.
- **Corrective migration sketch:**
  ```sql
  -- 20260406000800_remove_direct_xp_events_insert.sql
  DROP POLICY IF EXISTS "Users can insert their own XP events" ON public.xp_events;
  REVOKE INSERT ON public.xp_events FROM authenticated;
  -- xp_events must only ever be written by award_xp() (SECURITY DEFINER, already ownership-checked).
  ```

---

### P2 — Material defects with concrete reachability

#### P2-10. `DROP TABLE IF EXISTS public.users CASCADE` — destructive statement on an untracked object

- **File:line:** `supabase/migrations/20260113110000_schema_cleanup_and_fixes.sql:11`
- **Root cause:** `public.users` is never `CREATE TABLE`'d in any of the 64 tracked migrations, meaning it was created out-of-band (Supabase Studio, a manual `psql` session, or a template that predates this migration history). Dropping it with `CASCADE` inside a tracked migration means the blast radius (any FKs, views, or grants that referenced it) is invisible to code review and cannot be reconstructed from git history.
- **Failure scenario:** if any other object (a view, a manually-added FK, a Studio-created RLS policy) depended on `public.users`, it was silently destroyed with no record in version control of what it was.
- **Reachability:** not attacker-reachable (this is a one-time migration-authoring risk, already applied historically), but represents a live process gap: destructive DDL against objects not owned by the tracked migration history.
- **Corrective guidance (process, not a new migration):** before any future `DROP ... CASCADE`, require a preceding `SELECT` against `information_schema`/`pg_depend` captured in the migration's comments (or a `pg_dump --schema-only` diff in the PR), and prefer `DROP ... RESTRICT` with a follow-up `CASCADE` only after confirming the dependent-object list is expected.

#### P2-11. `20260124000000_complete_schema_initialization.sql` is not idempotent and would break a clean replay

- **File:line:** `supabase/migrations/20260124000000_complete_schema_initialization.sql:285-338` (≈25 `CREATE POLICY` statements)
- **Root cause:** unlike files `20260104000000`, `20260108131028`, `20260108150000`, `20260114013519`, `20260124001000`, this migration issues `CREATE POLICY` with **no preceding `DROP POLICY IF EXISTS`**. Most of the policy names (`"Users can view their own profile"`, `"...their own units"`, `"...their own deadlines"`, `"...their own notifications"`, `"...their own gamification profile"`, etc.) already exist from earlier migrations in the same chronological chain and were never dropped.
- **Failure scenario:** applying migrations sequentially and cumulatively (the standard `supabase db push` / `supabase migration up` model) on any environment that does **not** already have all of files 1-11's policies pre-existing under exactly those historical names would abort this migration with `ERROR: policy "..." for table "..." already exists`, since the CREATE POLICY calls collide with policies created by earlier, still-undropped migrations in the same chain. On the primary production database (which has presumably applied every migration once, in order, and therefore already carries those policy names from the earlier files), reapplying this file is a hard failure — it is not safely re-runnable, which matters for disaster-recovery rebuilds or any secondary environment bootstrapped from `supabase db reset`.
- **Reachable/triggerable by:** anyone running a fresh `supabase db reset` / staging rebuild from migration history — an operational, not attacker, risk, but a real availability risk for disaster recovery.
- **Corrective migration sketch:** cannot retroactively fix a past migration; going forward, add a lint/CI check (e.g., a small script scanning new migration files for `CREATE POLICY` not preceded within the same file or an idempotent guard) that fails the build if a bare `CREATE POLICY` appears without a matching `DROP POLICY IF EXISTS` for the same name+table in the same file.

#### P2-12. `xp_config → xp_events` FK is `ON DELETE CASCADE`, letting an admin action silently destroy audit history

- **File:line:** `supabase/migrations/20260113110000_schema_cleanup_and_fixes.sql:98-103`
- **Effective state today:** `ALTER TABLE public.xp_events ADD CONSTRAINT xp_events_event_type_fkey FOREIGN KEY (event_type) REFERENCES public.xp_config(event_type) ON DELETE CASCADE;` — never altered afterward.
- **Root cause/failure scenario:** `xp_config` is described elsewhere as a reference/lookup table for XP amounts per event type; `xp_events` is described (file `20260109012243`, header) as an anti-cheat **audit log**. `ON DELETE CASCADE` means removing or renaming an `xp_config` row (e.g. retiring an old event type) cascades to **permanently delete every historical `xp_events` row** of that type for every user — silently destroying audit history as a side effect of a config change, with no soft-delete or archive step.
- **Reachable by:** only `service_role`/an admin with direct DB or dashboard access (xp_config has no client-writable policy), so not attacker-reachable, but a real operational data-integrity risk.
- **Corrective migration sketch:**
  ```sql
  -- 20260406000900_fix_xp_config_fk_cascade.sql
  ALTER TABLE public.xp_events DROP CONSTRAINT IF EXISTS xp_events_event_type_fkey;
  ALTER TABLE public.xp_events ADD CONSTRAINT xp_events_event_type_fkey
    FOREIGN KEY (event_type) REFERENCES public.xp_config(event_type) ON DELETE RESTRICT;
  ```

#### P2-13. `award_xp()` / `update_streak()` use non-atomic read-then-write (lost-update race)

- **File:line:** `supabase/migrations/20260214000000_harden_gamification_rpc.sql:50-68` (final version — ownership-hardened but not atomicity-hardened)
- **Root cause:** `SELECT xp ... INTO v_old_xp ...` then `v_new_xp := v_old_xp + v_xp_amount;` then `UPDATE ... SET xp = v_new_xp` — three separate statements without `SELECT ... FOR UPDATE` or an atomic `xp = xp + v_xp_amount` expression. Two concurrent `award_xp` calls for the same user (e.g., completing two deadlines back-to-back, or `update_streak`'s two internal `PERFORM award_xp(...)` calls racing another request) can both read the same `v_old_xp`, and the second `UPDATE` overwrites the first's result — one of the two XP awards is silently lost (though the corresponding `xp_events` row is still inserted for both, causing the audit log and the balance to diverge).
- **Failure scenario:** not cross-tenant (a user can only race against their own concurrent requests), so this is a correctness/fairness bug (a user might occasionally receive _less_ XP than earned, or the reverse under different interleavings), not a security bypass on its own — but it compounds P1-8's exploitability window since a fast double-toggle could interact with an in-flight `award_xp` call from the trigger.
- **Reachable by:** any authenticated user firing two rapid, overlapping requests (e.g. double-click / retry logic in a flaky network) against their own account.
- **Corrective migration sketch:**
  ```sql
  -- 20260406001000_make_award_xp_atomic.sql
  CREATE OR REPLACE FUNCTION public.award_xp(...) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    ...
    SELECT xp, streak_days INTO v_old_xp, v_streak_days
    FROM public.gamification_profiles WHERE user_id = p_user_id FOR UPDATE;   -- row lock
    ...
    UPDATE public.gamification_profiles
    SET xp = xp + v_xp_amount, updated_at = NOW()                             -- atomic increment, not overwrite
    WHERE user_id = p_user_id
    RETURNING xp INTO v_new_xp;
    ...
  END; $$;
  ```

#### P2-14. Historical: `award_xp`/`update_streak` had an unrestricted-caller IDOR for ~5 weeks (Jan 9 → Feb 14), now fixed

- **File:line (original vulnerable version):** `supabase/migrations/20260109012243_add_gamification_system.sql:168-305` — `SECURITY DEFINER`, no `SET search_path`, **no `auth.uid() = p_user_id` check**, and no `REVOKE`/`GRANT` narrowing `EXECUTE` (default PUBLIC-executable). **Fixed by:** `supabase/migrations/20260214000000_harden_gamification_rpc.sql:34-37,110-113,151-157` (adds the ownership check, pins `search_path=public`, and explicitly `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO authenticated, service_role`).
- **Why it matters despite being fixed:** documents that for roughly five weeks of this application's migration history, any authenticated (and possibly `anon`, depending on default schema privileges) caller could award arbitrary XP/streaks to arbitrary `p_user_id` values via `award_xp('<victim>', 'weekly_goal')`. No current action needed on this specific function, but it is evidence that **write-scoping ownership checks were added reactively, migration-by-migration, rather than as a standing template** — the same class of bug recurs in P0-2 (`ensure_user_profile`, never fixed).

#### P2-15. Historical: `seed_demo_data_for_user()` IDOR window (Jan 14 → Feb 16), then the whole function family dropped

- **File:line (original):** `supabase/migrations/20260114013519_add_soft_deletes_constraints_seeds.sql:433-459`, granted to `authenticated` at `:463`, **no `p_user_id = auth.uid()` check** (unlike its sibling `clear_user_data`, `:466-494`, which does check). **Fixed with an ownership check:** `supabase/migrations/20260216090000_harden_security_functions.sql:168-198`. **Fully removed:** `supabase/migrations/20260405125806_remove_sample_user_seed.sql:43-51` (`DROP FUNCTION ... CASCADE` for the whole `seed_demo_*` family), whose own header comment explicitly acknowledges the residual risk it is closing ("still `GRANT`ed to `authenticated`... a signed-in user with DB access could still invoke it").
- **Current state:** fully resolved — functions no longer exist. Included here for completeness of the chronological review and because the same "granted before the ownership check exists" pattern is what produced P0-2.

---

### P3 — Low impact / hardening gaps

| #     | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | File:line                                                                                                          | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P3-16 | Missing `SET search_path` on numerous `SECURITY DEFINER` functions still live today: `protect_profile_fields()` (`20260304200000_fix_profile_protection_trigger.sql:6-19`), `on_deadline_completed()` (`20260114014506_schema_cleanup_and_normalization.sql:294-329`), `on_unit_created()` (`20260109012243_add_gamification_system.sql:356-368`), `cleanup_expired_webauthn_challenges()` (`20260207000000_add_webauthn_tables.sql:161-170`), `audit_trigger()` (`20260129000000_add_audit_logging.sql:200-240`) | multiple                                                                                                           | Bodies are mostly schema-qualified, limiting practical exploitability, but this deviates from the hardened pattern (`SET search_path = ''`/`= public`) used by `handle_new_user()`, `log_audit()`, `award_xp()` etc. elsewhere in the same repo.                                                                                                                                                                                                                         |
| P3-17 | `cleanup_old_audit_logs()` has no `REVOKE ... FROM PUBLIC` (contrast with `purge_deleted_records`/`refresh_analytics_views` in the same era, which do)                                                                                                                                                                                                                                                                                                                                                            | `20260129000000_add_audit_logging.sql:156-193`                                                                     | Exploitability depends on whether the Supabase project overrides Postgres's default PUBLIC-execute grant at the project level (standard Supabase template does, but not visible in tracked migrations) — verify live, then add explicit `REVOKE`/`GRANT service_role` regardless, for defense in depth.                                                                                                                                                                  |
| P3-18 | Pervasive `USING`-only UPDATE policies with no explicit `WITH CHECK` across most tables                                                                                                                                                                                                                                                                                                                                                                                                                           | many files                                                                                                         | Confirmed **not** independently exploitable for ownership transfer in the single-predicate cases (`auth.uid() = user_id`) because Postgres reuses `USING` as the implicit `WITH CHECK` for UPDATE — but this is fragile: it silently stops protecting as soon as the USING predicate covers more than the ownership column (see P1-6, P1-7, where exactly this happened). Recommend adding explicit `WITH CHECK` everywhere for auditability, even where currently safe. |
| P3-19 | `storage.objects` policy `avatars_update_own` has no explicit `WITH CHECK`                                                                                                                                                                                                                                                                                                                                                                                                                                        | `20260219000000_avatars_storage_bucket.sql:34-41`                                                                  | Same class as P3-18; not confirmed exploitable (Postgres reuses USING), but should be made explicit.                                                                                                                                                                                                                                                                                                                                                                     |
| P3-20 | `soft_delete()` trigger function defined but never attached via `CREATE TRIGGER` anywhere in 64 files; hard `DELETE` grants/policies remain fully active on `units`/`deadlines`/`events`/`notifications` throughout                                                                                                                                                                                                                                                                                               | `20260114013519_add_soft_deletes_constraints_seeds.sql:28-35`                                                      | The soft-delete/restore UX is entirely opt-in at the application layer; nothing in the DB prevents a real `DELETE`, so "restore" only works if the app always chooses `UPDATE deleted_at` over `DELETE`.                                                                                                                                                                                                                                                                 |
| P3-21 | No unique constraint on `webauthn_challenges.challenge`, `backup_codes.code`, `email_verifications.token_hash`, `password_resets.token_hash` — "only one active token" invariants are app-enforced only                                                                                                                                                                                                                                                                                                           | multiple                                                                                                           | Low likelihood of exploitation (values are meant to be cryptographically random/unique already), but the DB does not enforce the stated invariant ("only 1 active token per user", per `20260213000000_email_verifications.sql:5-6` comment).                                                                                                                                                                                                                            |
| P3-22 | Missing index on `webauthn_challenges.user_id` despite it being the primary RLS predicate column                                                                                                                                                                                                                                                                                                                                                                                                                  | `20260207000000_add_webauthn_tables.sql:22-47` (index list)                                                        | Table only indexes `challenge` and `expires_at`; every RLS-filtered query on this table does a sequential scan on `user_id`/`user_id IS NULL`. Performance-relevant given P0-5's fix will add real per-user scoping.                                                                                                                                                                                                                                                     |
| P3-23 | Duplicate/overlapping `AFTER INSERT ON auth.users` triggers coexist in the final state: `on_auth_user_created_safe` → `handle_new_user_safe()` (from `20260113000000`/`20260114011650`) **and** `on_auth_user_created` → `handle_new_user()` (from `20260314_auto_create_profile_trigger.sql`)                                                                                                                                                                                                                    | `20260114011650_fix_schema_comprehensive.sql:745-756`, `20260314_auto_create_profile_trigger.sql:21-26`            | Both fire on every signup; both use `ON CONFLICT DO NOTHING`/`DO UPDATE` so no hard failure results, but it's redundant work per signup and `handle_new_user_safe()`'s function-level `EXCEPTION WHEN OTHERS THEN RAISE WARNING` silently swallows any real failure in the `gamification_profiles` insert it also performs.                                                                                                                                              |
| P3-24 | `email_verifications`/`password_resets` have `user_id UUID NOT NULL` with **no FK to `auth.users`** (unlike almost every other user-scoped table in the schema)                                                                                                                                                                                                                                                                                                                                                   | `20260213000000_email_verifications.sql:11-18`, `20260216193000_password_resets.sql:11-18`                         | An orphaned/typo'd `user_id` would silently persist; low risk since these tables are service_role-only, but inconsistent with the FK-everywhere pattern elsewhere.                                                                                                                                                                                                                                                                                                       |
| P3-25 | `xp_config` SELECT policy and all four `edge_response_cache` policies use literal `USING (true)`                                                                                                                                                                                                                                                                                                                                                                                                                  | `20260226000000_fix_security_definer_and_rls.sql:56-60`; `20260326000000_enable_rls_edge_response_cache.sql:23-49` | `xp_config` is a static read-only reference table (low risk). `edge_response_cache` policies are scoped `TO service_role` only (which bypasses RLS anyway), so effectively inert; flagged per the audit's explicit "detect `USING(true)`" instruction, not because it is currently exploitable.                                                                                                                                                                          |

---

## 3. Chronological regression log (the "later migration silently weakens an earlier fix" pattern)

| Order | Migration                                                     | What it did                                                                                                            | Net effect                                                                         |
| ----- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1     | `20260104000000_initial_schema.sql`                           | Ships `USING (true)` SELECT/INSERT/UPDATE/DELETE policies on `profiles`, `units`, `class_times`, `deadlines`, `events` | Fully open baseline (expected for an initial scaffold)                             |
| 2     | `20260108131028` → `20260108150000`                           | Adds `user_id`, scopes all policies to `auth.uid() = user_id`, revokes `anon`                                          | Fixes the open baseline                                                            |
| 3     | `20260113000000_reenable_auth_trigger_with_user_view.sql:104` | `ALTER VIEW user_details SET (security_invoker = true)`                                                                | **Fixes** view-level RLS bypass                                                    |
| 4     | `20260114011650_fix_schema_comprehensive.sql:865-890`         | Drops/recreates `user_details` without `security_invoker`                                                              | **Regresses** (1 day later)                                                        |
| 5     | `20260114011650` (same file, different section)               | Adds short-named `USING(true)` policies removal (`DROP POLICY "profiles_select"` etc.)                                 | **Fixes** the migration-1 fully-open policies (confirmed never re-added)           |
| 6     | `20260124000000_complete_schema_initialization.sql:338`       | Adds a brand-new, unguarded `xp_events` INSERT policy                                                                  | **Regresses** the "writes only via `award_xp()`" design                            |
| 7     | `20260214000000_harden_gamification_rpc.sql`                  | Adds ownership checks + `search_path` to `award_xp`/`update_streak` functions                                          | **Fixes** the function-level IDOR (does not touch table grants — P1-6/P1-9 remain) |
| 8     | `20260216090000_harden_security_functions.sql`                | Adds ownership checks to `seed_demo_*`, allowlist to `restore_deleted`                                                 | **Fixes** those IDORs                                                              |
| 9     | `20260226000000_fix_security_definer_and_rls.sql:16-40`       | Recreates `user_details` **with** `security_invoker = true` again                                                      | **Fixes** the view (2nd time)                                                      |
| 10    | `20260304100000_add_faculty_to_views_and_functions.sql:6-31`  | Recreates `user_details` (adding a `faculty` column) **without** `security_invoker`                                    | **Regresses** the view a **2nd time — this is the final, currently-live state**    |
| 11    | `20260405125806_remove_sample_user_seed.sql`                  | Drops the entire `seed_demo_*` function family                                                                         | **Fixes** residual exposure from #8 by removing the attack surface entirely        |

---

## 4. Non-idempotency / migration-hygiene inventory (beyond P2-11)

- Non-guarded `CREATE TABLE` (would fail on replay): `gamification_profiles`, `xp_events` in `20260109012243_add_gamification_system.sql:13,30` (no `IF NOT EXISTS`).
- Non-guarded `CREATE TRIGGER` (would fail on replay): `deadline_completed_trigger`, `unit_created_trigger` (`20260109012243_add_gamification_system.sql:348,370`, no preceding `DROP TRIGGER IF EXISTS`).
- Non-guarded `ADD CONSTRAINT` (would fail on replay): three CHECK constraints in `20260313093000_add_web_push_infrastructure.sql:21-27`, contrasted with the correct `pg_constraint`-existence-guarded pattern used one file group later in `20260331000000_add_granular_reminder_preferences.sql:20-46`.
- `DROP TABLE IF EXISTS public.users CASCADE` targets a table never created in tracked history (P2-10).
- Column drops without archival: `events.date`/`events.time` (`20260108140000_add_event_date_columns.sql:28,53`), `events.event_date`/`events.event_time` (`20260114015445_clarify_views_simplify_events.sql:148-149`) — all guarded (`IF EXISTS`) and preceded by a data-copy `UPDATE`, so not data-losing, but irreversible.
- Trigger sprawl on `auth.users`: at least 8 distinct trigger names created/dropped across files `20260108140000`, `20260109012944`, `20260109013033`, `20260109013302`, `20260113000000`, `20260114011650`, `20260314` before settling into the current two-trigger final state (P3-23).

---

## 5. What's already good (worth preserving as the template)

- `user_sessions` (`20260214001000_align_code_db_objects.sql`) and `push_subscriptions` (`20260313093000_add_web_push_infrastructure.sql`) are the two best-guarded tables in the repo: explicit `TO authenticated`, matching `USING`/`WITH CHECK` on UPDATE, explicit `anon` revoke, and (for push) a `UNIQUE` constraint on the sensitive `endpoint` column.
- `rate_limits` (`20260217093000_rate_limits.sql`) is genuinely race-safe: PK on `key` + `ON CONFLICT ... DO UPDATE` atomic upsert, service_role-only via both RLS and an explicit table-level `REVOKE ALL FROM public`.
- `todos` (`20260124001000_create_todos_table.sql`) is the most consistently idempotent migration in the set (guarded `DROP POLICY IF EXISTS`, explicit roles, `WITH CHECK` on INSERT).
- `handle_new_user()` (`20260314_auto_create_profile_trigger.sql`) uses `SET search_path = ''` — the strictest, most defensible `SECURITY DEFINER` hardening pattern found anywhere in the migration history; it should be the template for P3-16.
- `restore_deleted()`'s final version (`20260216090000_harden_security_functions.sql:14-45`) correctly allowlists target table names before building dynamic SQL — a good pattern for any future dynamic-SQL SECURITY DEFINER function.

---

_End of Lane D report._
