import { createClient } from "@/lib/supabase/server";

export type CurrentProject = {
  id: string;
  name: string;
  target_open_date?: string | null;
};

/**
 * Returns the current project for the logged-in user.
 * - If only 1 project exists, use it.
 * - If multiple exist, choose the most recently created as default.
 * Returns null if user is not authenticated or has no projects.
 */
export async function getCurrentProject(): Promise<CurrentProject | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = memberships?.map((m) => m.project_id) ?? [];
  if (projectIds.length === 0) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, target_open_date")
    .in("id", projectIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
