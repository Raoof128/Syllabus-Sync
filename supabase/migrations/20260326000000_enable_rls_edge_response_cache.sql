-- Migration: Enable RLS on edge_response_cache
-- Purpose: Fix critical security issue — table public.edge_response_cache
--          is publicly accessible without Row Level Security enabled.
-- Date: 2026-03-26

-- ============================================================================
-- 1. Enable RLS on edge_response_cache
-- ============================================================================
-- edge_response_cache is an internal cache table. Even though it only stores
-- cached responses, RLS must be enabled for security compliance since the
-- table is in the public schema which is exposed to PostgREST.

ALTER TABLE IF EXISTS public.edge_response_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS Policies
-- ============================================================================
-- This is an internal cache table managed by backend/edge functions.
-- Only the service_role should have full access. Authenticated users and
-- anonymous users should not be able to read or modify cache entries directly.

-- BA-0053: line 13 is guarded with ALTER TABLE IF EXISTS, but these CREATE
-- POLICY statements are not, so the migration aborts with `relation
-- "public.edge_response_cache" does not exist` on any database where the table
-- is absent -- which is every clean replay, because NO migration creates this
-- table. It exists in production as unmanaged schema. Guarded here so the
-- migration is runnable; bringing the table itself under migration control is
-- tracked separately as BA-0054.
DO $$
BEGIN
  IF to_regclass('public.edge_response_cache') IS NULL THEN
    RAISE NOTICE 'edge_response_cache absent; skipping policy creation (BA-0053)';
    RETURN;
  END IF;

  -- Allow service_role full read access
  CREATE POLICY "Service role can read cache"
    ON public.edge_response_cache
    FOR SELECT
    TO service_role
    USING (true);

  -- Allow service_role to insert cache entries
  CREATE POLICY "Service role can insert cache"
    ON public.edge_response_cache
    FOR INSERT
    TO service_role
    WITH CHECK (true);

  -- Allow service_role to update cache entries
  CREATE POLICY "Service role can update cache"
    ON public.edge_response_cache
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

  -- Allow service_role to delete cache entries
  CREATE POLICY "Service role can delete cache"
    ON public.edge_response_cache
    FOR DELETE
    TO service_role
    USING (true);
END
$$;
