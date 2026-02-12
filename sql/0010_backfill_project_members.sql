-- Backfill project_members: add project creators as owners if not already a member
-- Run this in Supabase SQL Editor if projects exist but don't show in the app
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING)

INSERT INTO public.project_members (project_id, user_id, role)
SELECT id, user_id, 'owner'
FROM public.projects
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_members pm
  WHERE pm.project_id = projects.id AND pm.user_id = projects.user_id
)
ON CONFLICT (project_id, user_id) DO NOTHING;
