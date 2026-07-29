-- BA-0034 (P1) + BA-0035 (P1) + BA-0036 (P2): harden the public `avatars` bucket.
-- All three found by red-teaming the live deployment on 2026-07-29/30.
--
-- Idempotent: DROP POLICY IF EXISTS / CREATE POLICY after a drop / UPDATE.

-- ============================================================================
-- BA-0034: the bucket was anonymously listable.
--
-- `avatars_select_public` granted SELECT on storage.objects to the `public` role
-- for the entire bucket. A public bucket does not need that policy for its
-- `/object/public/...` URLs to resolve — that endpoint bypasses RLS — so the
-- policy's only effect was to enable enumeration. Proven against production
-- with only the publishable anon key: listing the bucket returned a folder named
-- with a user's auth.uid(), listing that prefix returned the exact filename, and
-- the public URL then returned the photo. That leaked the user-id list as well
-- as every profile photo.
--
-- Dropped outright rather than narrowed. `lib/store/profilesStore.ts` is the only
-- consumer and it calls exactly two things: `.upload()` (INSERT, unaffected) and
-- `.getPublicUrl()` (a pure client-side string builder that performs no request
-- and needs no policy). Nothing in the codebase calls `.list()` or `.download()`
-- on this bucket, so no authenticated replacement policy is required.
-- ============================================================================

DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;

-- ============================================================================
-- BA-0035: avatars_update_own had USING but no WITH CHECK.
--
-- USING decides which existing row may be updated. Without WITH CHECK, Postgres
-- places no constraint on the resulting row, and `storage.from('avatars').move()`
-- is an UPDATE of `storage.objects.name`. A user could therefore move their own
-- object into another user's auth.uid() folder and thereby control what serves
-- as that user's avatar.
--
-- Both halves now pin the first path segment to the caller: USING limits the
-- source, WITH CHECK limits the destination.
-- ============================================================================

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- ============================================================================
-- BA-0036: image/svg+xml was accepted into a public bucket.
--
-- SVG is active content. Verified against production: storage serves objects
-- with no X-Content-Type-Options, no Content-Disposition and no CSP, so script
-- inside a stored SVG executes on direct navigation to its public URL. Chained
-- with BA-0035 this became "plant a scripted SVG as another user's avatar".
--
-- The bucket holds exactly one object today (a .jpeg) and no SVG has ever been
-- uploaded, so narrowing the list breaks nothing. The raster types the uploader
-- actually produces are retained; image/gif is kept as it is inert here.
-- ============================================================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
WHERE id = 'avatars';

-- ============================================================================
-- Verification. Fails loudly rather than silently leaving any of the three live.
-- ============================================================================

DO $$
DECLARE
  v_offending text;
BEGIN
  -- BA-0034: no SELECT policy on storage.objects may be reachable by anon.
  SELECT string_agg(pol.policyname, ', ')
  INTO v_offending
  FROM pg_policies pol
  WHERE pol.schemaname = 'storage'
    AND pol.tablename = 'objects'
    AND pol.cmd = 'SELECT'
    AND ('public' = ANY(pol.roles) OR 'anon' = ANY(pol.roles));

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0034 verification failed: anon-reachable SELECT policies remain: %', v_offending;
  END IF;

  -- BA-0035: every write policy on the avatars bucket must carry WITH CHECK
  -- where the command can produce a new row (INSERT, UPDATE).
  SELECT string_agg(pol.policyname, ', ')
  INTO v_offending
  FROM pg_policies pol
  WHERE pol.schemaname = 'storage'
    AND pol.tablename = 'objects'
    AND pol.cmd IN ('INSERT', 'UPDATE')
    AND pol.policyname LIKE 'avatars%'
    AND (pol.with_check IS NULL OR pol.with_check !~* 'auth\.uid\(\)');

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0035 verification failed: write policies without an auth.uid() WITH CHECK: %', v_offending;
  END IF;

  -- BA-0036: no active content types on the public bucket.
  SELECT array_to_string(allowed_mime_types, ', ')
  INTO v_offending
  FROM storage.buckets
  WHERE id = 'avatars'
    AND allowed_mime_types && ARRAY['image/svg+xml', 'text/html', 'application/xhtml+xml'];

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0036 verification failed: avatars still accepts active content: %', v_offending;
  END IF;

  -- Guard against over-correction: the bucket must still accept real uploads.
  IF NOT (
    SELECT allowed_mime_types @> ARRAY['image/jpeg', 'image/png', 'image/webp']
    FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    RAISE EXCEPTION 'BA-0036 verification failed: avatars no longer accepts the raster types the app uploads';
  END IF;
END
$$;
