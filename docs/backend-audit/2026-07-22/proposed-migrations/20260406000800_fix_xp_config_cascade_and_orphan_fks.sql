-- ============================================================================
-- INTEGRITY FIX (Lane D audit, P2-12 + P3-24)
-- ----------------------------------------------------------------------------
-- P2-12: xp_events.event_type -> xp_config.event_type is ON DELETE CASCADE
-- (set 20260113110000_schema_cleanup_and_fixes.sql:98-103). xp_config is a
-- small reference/lookup table; xp_events is described elsewhere in this
-- codebase as an anti-cheat AUDIT LOG. Deleting/renaming an xp_config row
-- therefore silently cascades into permanently destroying every historical
-- xp_events row of that type, for every user, with no archive step. Change
-- to RESTRICT so a config change cannot silently wipe audit history.
--
-- P3-24: email_verifications.user_id and password_resets.user_id are
-- `uuid NOT NULL` with NO foreign key to auth.users(id), unlike almost every
-- other user-scoped table in this schema. Add the missing FK (ON DELETE
-- CASCADE, consistent with the rest of the schema) so an orphaned/typo'd
-- user_id can no longer silently persist.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'xp_events_event_type_fkey' AND t.relname = 'xp_events'
  ) THEN
    ALTER TABLE public.xp_events DROP CONSTRAINT xp_events_event_type_fkey;
  END IF;

  ALTER TABLE public.xp_events
    ADD CONSTRAINT xp_events_event_type_fkey
    FOREIGN KEY (event_type) REFERENCES public.xp_config(event_type) ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_verifications')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'email_verifications' AND c.contype = 'f'
         AND c.conname = 'email_verifications_user_id_fkey'
     )
  THEN
    -- Guard: only add the FK if there are no existing orphaned rows that
    -- would make it fail; if orphans exist, skip and leave a NOTICE rather
    -- than blocking the whole migration on unrelated stale data.
    IF NOT EXISTS (
      SELECT 1 FROM public.email_verifications ev
      WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ev.user_id)
    ) THEN
      ALTER TABLE public.email_verifications
        ADD CONSTRAINT email_verifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    ELSE
      RAISE NOTICE 'Skipped adding email_verifications_user_id_fkey: orphaned user_id rows exist. Clean up then re-run manually.';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='password_resets')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'password_resets' AND c.contype = 'f'
         AND c.conname = 'password_resets_user_id_fkey'
     )
  THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.password_resets pr
      WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = pr.user_id)
    ) THEN
      ALTER TABLE public.password_resets
        ADD CONSTRAINT password_resets_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    ELSE
      RAISE NOTICE 'Skipped adding password_resets_user_id_fkey: orphaned user_id rows exist. Clean up then re-run manually.';
    END IF;
  END IF;
END $$;
