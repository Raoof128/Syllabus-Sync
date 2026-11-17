-- ============================================================================
-- HARDENING FIX (Lane D audit, P3-18 + P3-19)
-- ----------------------------------------------------------------------------
-- Most UPDATE policies in this schema only specify USING, relying on
-- Postgres's implicit behavior of reusing USING as WITH CHECK for UPDATE
-- when no explicit WITH CHECK is given. That implicit reuse is real and
-- currently not bypassable for these single-predicate ownership checks, but
-- it is fragile: it silently stops protecting anything the USING predicate
-- doesn't happen to cover (exactly what went wrong for gamification_profiles
-- and schedule_members, fixed separately in this batch). This migration adds
-- explicit, matching WITH CHECK clauses everywhere it is safe to do so
-- (i.e. the predicate is a straightforward ownership check), for
-- auditability and defense in depth. No behavioral change is intended.
-- ============================================================================

-- profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- units
DROP POLICY IF EXISTS "Users can update their own units" ON public.units;
CREATE POLICY "Users can update their own units"
  ON public.units FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- class_times (both historically-created name variants)
DROP POLICY IF EXISTS "Users can update class_times for their units" ON public.class_times;
DROP POLICY IF EXISTS "Users can update class times for their units" ON public.class_times;
CREATE POLICY "Users can update class_times for their units"
  ON public.class_times FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.units WHERE units.id = class_times.unit_id AND units.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE units.id = class_times.unit_id AND units.user_id = auth.uid()));

-- deadlines
DROP POLICY IF EXISTS "Users can update their own deadlines" ON public.deadlines;
CREATE POLICY "Users can update their own deadlines"
  ON public.deadlines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- events
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_preferences
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- todos
DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
CREATE POLICY "Users can update their own todos"
  ON public.todos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- webauthn_credentials
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='webauthn_credentials') THEN
    DROP POLICY IF EXISTS "Users can update own credentials" ON public.webauthn_credentials;
    CREATE POLICY "Users can update own credentials"
      ON public.webauthn_credentials FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- backup_codes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='backup_codes') THEN
    DROP POLICY IF EXISTS "Users can update own backup codes" ON public.backup_codes;
    CREATE POLICY "Users can update own backup codes"
      ON public.backup_codes FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- schedules (owner_id ownership only; membership role escalation for
-- schedule_members is handled separately in 20260406000500)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='schedules') THEN
    DROP POLICY IF EXISTS "Owners can update own schedules" ON public.schedules;
    CREATE POLICY "Owners can update own schedules"
      ON public.schedules FOR UPDATE
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

-- storage.objects: avatars_update_own (P3-19)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='avatars_update_own') THEN
    DROP POLICY "avatars_update_own" ON storage.objects;
    CREATE POLICY "avatars_update_own"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
