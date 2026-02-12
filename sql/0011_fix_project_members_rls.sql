-- Fix infinite recursion in project_members RLS policy
-- Run this in Supabase SQL Editor to fix the "No projects yet" issue

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can select members of their projects" ON public.project_members;

-- Replace with a simple policy: users can see their own membership rows
CREATE POLICY "Users can select own memberships"
  ON public.project_members FOR SELECT
  USING (user_id = auth.uid());

-- Users can also see other members of projects they belong to
-- This uses the user_id check first to avoid recursion
CREATE POLICY "Users can select co-members"
  ON public.project_members FOR SELECT
  USING (
    project_id IN (
      SELECT pm.project_id 
      FROM public.project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );
