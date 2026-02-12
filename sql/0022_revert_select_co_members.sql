-- Revert: Remove the co-members policy added in 0021
-- Run this if the app shows no data after 0021

DROP POLICY IF EXISTS "Select co-members of own projects" ON public.project_members;
