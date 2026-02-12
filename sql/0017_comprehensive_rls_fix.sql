-- Comprehensive fix for roadmap checkbox RLS issues
-- Run this in Supabase SQL Editor

-- First, let's check if you're in the project_members table
-- (Run this separately to verify - should return rows)
-- SELECT * FROM project_members WHERE user_id = auth.uid();

-- Fix 1: Ensure phase_items RLS policies use project_members
DROP POLICY IF EXISTS "Users can select own phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Users can insert own phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Users can update own phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Users can delete own phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Members can select phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Members can insert phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Members can update phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Members can delete phase_items" ON public.phase_items;

CREATE POLICY "Members can select phase_items"
  ON public.phase_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = phase_items.project_id 
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert phase_items"
  ON public.phase_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = phase_items.project_id 
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update phase_items"
  ON public.phase_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = phase_items.project_id 
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete phase_items"
  ON public.phase_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = phase_items.project_id 
        AND pm.user_id = auth.uid()
    )
  );

-- Fix 2: Ensure phases, phase_sections also use project_members
DROP POLICY IF EXISTS "Users can update own phases" ON public.phases;
DROP POLICY IF EXISTS "Members can update phases" ON public.phases;

CREATE POLICY "Members can update phases"
  ON public.phases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = phases.project_id 
        AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own phase_sections" ON public.phase_sections;
DROP POLICY IF EXISTS "Members can update phase_sections" ON public.phase_sections;

CREATE POLICY "Members can update phase_sections"
  ON public.phase_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = phase_sections.project_id 
        AND pm.user_id = auth.uid()
    )
  );

-- Fix 3: Verify you have a project_members record
-- If the query below returns 0 rows, you need to add yourself to project_members
-- Run this to check:
-- SELECT COUNT(*) FROM project_members WHERE user_id = auth.uid();

-- If the count is 0, you need to add yourself. Find your user_id first:
-- SELECT auth.uid();

-- Then find your project_id:
-- SELECT id, name FROM projects WHERE user_id = auth.uid();

-- Then insert yourself into project_members (replace the UUIDs):
-- INSERT INTO project_members (project_id, user_id, role, full_name)
-- VALUES (
--   'YOUR_PROJECT_ID',
--   auth.uid(),
--   'owner',
--   'Your Name'
-- );
