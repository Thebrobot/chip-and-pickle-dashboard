import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboardSummary";

export type { CurrentProject } from "@/lib/dashboardSummary";

/**
 * Returns the current project for the logged-in user.
 * Uses cached getDashboardSummary for request deduplication.
 */
export async function getCurrentProject() {
  const { project } = await getDashboardSummary();
  return project;
}

export async function getCurrentProjectId(): Promise<string | null> {
  const project = await getCurrentProject();
  return project?.id ?? null;
}

export type UserProject = {
  id: string;
  name: string;
  description: string | null;
  target_open_date: string | null;
  created_at: string;
};

/**
 * Returns all projects the logged-in user is a member of.
 */
export async function getUserProjects(): Promise<UserProject[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = memberships?.map((m) => m.project_id) ?? [];
  if (projectIds.length === 0) return [];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, target_open_date, created_at")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  return projects ?? [];
}
