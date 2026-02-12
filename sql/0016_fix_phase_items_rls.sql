-- Fix phase_items RLS policies for shared projects
-- Run this in Supabase SQL Editor if roadmap checkboxes aren't working

-- Drop old policies
DROP POLICY IF EXISTS "Users can select own phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Users can insert own phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Users can update own phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Users can delete own phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Members can select phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Members can insert phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Members can update phase_items" ON public.phase_items;
DROP POLICY IF EXISTS "Members can delete phase_items" ON public.phase_items;

-- Create new policies that check project_members table
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
