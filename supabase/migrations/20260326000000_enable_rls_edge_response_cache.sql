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

