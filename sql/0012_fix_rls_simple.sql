-- Complete fix for project_members RLS
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies on project_members
DROP POLICY IF EXISTS "Users can select members of their projects" ON public.project_members;
DROP POLICY IF EXISTS "Users can select own memberships" ON public.project_members;
DROP POLICY IF EXISTS "Users can select co-members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can insert project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can delete project members" ON public.project_members;

-- Create simple, non-recursive policies

-- 1. Users can see their own membership records
CREATE POLICY "Select own memberships"
  ON public.project_members FOR SELECT
  USING (user_id = auth.uid());

-- 2. Users can insert members if they're already an owner (service role bypasses RLS)
CREATE POLICY "Owners insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

-- 3. Owners can delete members
CREATE POLICY "Owners delete members"
  ON public.project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );
