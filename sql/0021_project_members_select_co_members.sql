-- Fix: Allow users to see all members of projects they belong to
-- Uses SECURITY DEFINER to avoid RLS recursion (the subquery in the previous version broke access).

-- 1. Helper function: returns project IDs the current user belongs to (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT project_id FROM project_members WHERE user_id = auth.uid();
$$;

-- Ensure authenticated users can call the function (used by RLS policies)
GRANT EXECUTE ON FUNCTION public.user_project_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_project_ids() TO service_role;

-- 2. Policy: members can see all other members of their projects
DROP POLICY IF EXISTS "Select co-members of own projects" ON public.project_members;
CREATE POLICY "Select co-members of own projects"
  ON public.project_members FOR SELECT
  USING (project_id IN (SELECT user_project_ids()));
