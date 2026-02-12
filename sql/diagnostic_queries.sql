-- Diagnostic queries to identify roadmap checkbox issues
-- Run these one by one in Supabase SQL Editor

-- 1. Check your user ID
SELECT auth.uid() AS my_user_id;

-- 2. Check if you're in project_members
SELECT 
  pm.project_id,
  pm.role,
  pm.full_name,
  p.name AS project_name
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE pm.user_id = auth.uid();

-- 3. Check your projects
SELECT 
  id AS project_id,
  name,
  user_id AS creator_id,
  created_at
FROM projects
WHERE user_id = auth.uid();

-- 4. Check phase_items you should be able to see
SELECT 
  pi.id,
  pi.title,
  pi.is_completed,
  pi.project_id,
  p.name AS project_name,
  pm.user_id AS my_membership
FROM phase_items pi
JOIN projects p ON p.id = pi.project_id
LEFT JOIN project_members pm ON pm.project_id = pi.project_id AND pm.user_id = auth.uid()
WHERE pi.project_id IN (
  SELECT project_id FROM project_members WHERE user_id = auth.uid()
)
LIMIT 10;

-- 5. Check current RLS policies on phase_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'phase_items';

-- 6. Test if you can update a specific item (replace the UUID with an actual item ID)
-- UPDATE phase_items 
-- SET is_completed = NOT is_completed 
-- WHERE id = 'REPLACE_WITH_ACTUAL_ITEM_ID';
