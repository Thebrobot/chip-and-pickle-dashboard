import { createClient } from "@/lib/supabase/server";
import { getCurrentProjectId } from "@/lib/currentProject";

export type ActivityEvent = {
  id: string;
  project_id: string;
  actor_user_id: string;
  type: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ActivityEventType =
  | "task_created"
  | "task_completed"
  | "task_assigned"
  | "budget_item_added"
  | "budget_item_updated"
  | "contractor_added"
  | "phase_item_completed"
  | "note_added"
  | string;

/**
 * Fetch recent activity events for the current project.
 */
export async function fetchRecentActivity(options?: {
  limit?: number;
  projectId?: string;
}): Promise<ActivityEvent[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const projectId = options?.projectId ?? (await getCurrentProjectId());
  if (!projectId) return [];

  const { data, error } = await supabase
    .from("activity_events")
    .select("id, project_id, actor_user_id, type, summary, metadata, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 20);

  if (error) {
    console.error("fetchRecentActivity error:", error);
    return [];
  }

  return (data ?? []) as ActivityEvent[];
}

/**
 * Create an activity event. Call from server actions when something happens.
 * Requires actor_user_id = auth.uid() and project membership.
 */
export async function createActivityEvent(
  projectId: string,
  type: ActivityEventType,
  summary: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("activity_events").insert({
    project_id: projectId,
    actor_user_id: user.id,
    type,
    summary,
    metadata: metadata ?? null,
  });

  if (error) {
    console.error("createActivityEvent error:", error);
    return false;
  }

  return true;
}
