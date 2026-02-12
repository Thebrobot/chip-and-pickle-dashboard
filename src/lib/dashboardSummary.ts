import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentProject = {
  id: string;
  name: string;
  target_open_date?: string | null;
};

export type DashboardSummary = {
  project: CurrentProject | null;
  counts: {
    tasks: number;
    contractors: number;
    budgetItems: number;
  };
};

/**
 * Lightweight fetch for layout/sidebar: project + entity counts.
 * Cached per request so layout and pages share the same result.
 */
export const getDashboardSummary = cache(async (): Promise<DashboardSummary> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { project: null, counts: { tasks: 0, contractors: 0, budgetItems: 0 } };
  }

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = memberships?.map((m) => m.project_id) ?? [];
  if (projectIds.length === 0) {
    return { project: null, counts: { tasks: 0, contractors: 0, budgetItems: 0 } };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, target_open_date")
    .in("id", projectIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) {
    return { project: null, counts: { tasks: 0, contractors: 0, budgetItems: 0 } };
  }

  const [tasksRes, contractorsRes, budgetRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id),
    supabase
      .from("contractors")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id),
    supabase
      .from("budget_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id),
  ]);

  return {
    project: {
      id: project.id,
      name: project.name,
      target_open_date: project.target_open_date,
    },
    counts: {
      tasks: tasksRes.count ?? 0,
      contractors: contractorsRes.count ?? 0,
      budgetItems: budgetRes.count ?? 0,
    },
  };
});
