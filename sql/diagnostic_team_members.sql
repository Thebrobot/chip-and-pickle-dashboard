-- Run this in Supabase SQL Editor to diagnose team visibility
-- Uses service role / postgres, so it bypasses RLS and shows raw data

-- 1. All project_members (run as postgres/service role)
SELECT pm.project_id, pm.user_id, pm.role, p.name as project_name
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
ORDER BY pm.project_id, pm.role;

-- 2. If you see only 1 row per project, the other users were never added to project_members.
--    They need to join via invite link/code to get added.
