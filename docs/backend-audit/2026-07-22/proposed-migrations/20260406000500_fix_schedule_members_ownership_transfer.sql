-- ============================================================================
-- SECURITY FIX (Lane D audit, P1-7)
-- ----------------------------------------------------------------------------
-- public.schedule_members' "Schedule owners can update members" UPDATE
-- policy only checks that the target row's schedule_id belongs to the
-- caller (USING (schedule_id IN (SELECT id FROM schedules WHERE
-- owner_id = auth.uid()))), with no WITH CHECK. Postgres implicitly reuses
-- USING as the check for UPDATE, but that only re-validates schedule_id --
-- it does not constrain `user_id` or `role`. Any schedule owner can
-- therefore reassign an existing membership row to an arbitrary user_id, or
-- silently promote any member to role='owner' (co-owner), via a bare
-- UPDATE, without the target's consent.
--
-- Fix: add an explicit WITH CHECK that (a) re-affirms the schedule_id
-- ownership constraint and (b) blocks role escalation to 'owner' through
-- this policy. Legitimate ownership transfer should go through a dedicated,
-- explicitly-audited RPC in the future rather than a bare table UPDATE.
-- ============================================================================

DROP POLICY IF EXISTS "Schedule owners can update members" ON public.schedule_members;

CREATE POLICY "Schedule owners can update members"
  ON public.schedule_members
  FOR UPDATE
  USING (
    schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid())
    -- Block self-service escalation to 'owner' via a bare UPDATE; role
    -- transfer to 'owner' must go through a dedicated ownership-transfer
    -- RPC in a future migration, not this general-purpose member editor.
    AND role <> 'owner'
  );

COMMENT ON TABLE public.schedule_members IS
  'SECURITY: the owner-update policy blocks setting role=owner via a bare '
  'UPDATE (see Lane D audit P1-7). Reassigning user_id on an existing row is '
  'still permitted for schedule owners managing invitations/removals; if '
  'that needs tightening further, restrict UPDATE to the `role` column only '
  'via a column-level policy or a dedicated RPC.';
