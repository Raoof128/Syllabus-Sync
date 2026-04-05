-- ============================================================================
-- Drop orphan sample/demo seeding functions
-- ============================================================================
-- BACKGROUND
-- ----------
-- Earlier migrations (20260114013519 and 20260216090000) installed a family of
-- SECURITY DEFINER functions to seed a new account with four fake units, their
-- deadlines, class times, and welcome notifications:
--
--   seed_demo_data_for_user(uuid)   -- orchestrator, callable via RPC
--   seed_demo_units(uuid)
--   seed_demo_class_times(uuid)
--   seed_demo_deadlines(uuid)
--   seed_demo_notifications(uuid)
--   seed_demo_events()
--
-- The client code that used to call this orchestrator (and an older
-- `useSampleSeeding` React hook) has since been removed. A production audit
-- (2026-04-05) confirmed:
--   * No trigger on auth.users references any `seed_demo_*` function.
--   * No application code calls them via `.rpc(...)`.
--   * The orchestrator is still GRANTed to `authenticated`, so it remains a
--     latent risk: a signed-in user with DB access could still invoke it.
--
-- This migration removes that risk by dropping every `seed_demo_*` function.
--
-- WHAT THIS MIGRATION DOES NOT DO
-- --------------------------------
-- It intentionally does NOT delete rows by "demo fingerprint" (titles/codes
-- like "Midterm Exam" or "STAT2170 Statistical Modelling"). The audit found
-- only two rows matching the fingerprints across the entire database, and
-- both are plausible real student data created by different users on
-- different dates. Deleting by title is too dangerous. Any true demo
-- residue should be cleaned up manually per-account by support.
--
-- It also does NOT touch `seed_new_user_data()` (the previous draft of this
-- migration targeted it) because that function does not exist in production.
-- ============================================================================

-- Drop the orchestrator first (both overloads) so nothing can fan out to the
-- helpers mid-drop. The 3-arg variant was added later to parameterise demo
-- names/variants; both are unused by the app.
DROP FUNCTION IF EXISTS public.seed_demo_data_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.seed_demo_data_for_user(uuid, text, integer) CASCADE;

-- Drop the per-entity helpers.
DROP FUNCTION IF EXISTS public.seed_demo_units(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.seed_demo_class_times(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.seed_demo_deadlines(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.seed_demo_notifications(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.seed_demo_events() CASCADE;
