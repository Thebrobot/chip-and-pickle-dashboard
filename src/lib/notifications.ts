import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { AppNotification } from "@/lib/notifications.types";

export type NotificationType =
  | "task_assigned"
  | "task_due_soon"
  | "note_added"
  | "budget_updated"
  | string;

/**
 * Fetch notifications for the current user, optionally filtered by unread.
 */
export async function fetchNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<AppNotification[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("notifications")
    .select("id, project_id, user_id, type, title, body, link, metadata, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchNotifications error:", error);
    return [];
  }

  return (data ?? []) as AppNotification[];
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("markNotificationRead error:", error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications for the current user as read.
 */
export async function markAllNotificationsRead(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("markAllNotificationsRead error:", error);
    return false;
  }

  return true;
}

/**
 * Create a notification for a user. Call from server actions.
 * Uses RPC for other users; direct insert for self (when RLS allows).
 */
export async function createNotification(
  projectId: string,
  userId: string,
  type: NotificationType,
  title: string,
  options?: {
    body?: string | null;
    link?: string | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  if (userId === user.id) {
    // Self: direct insert (RLS allows)
    const { error } = await supabase.from("notifications").insert({
      project_id: projectId,
      user_id: userId,
      type,
      title,
      body: options?.body ?? null,
      link: options?.link ?? null,
      metadata: options?.metadata ?? null,
    });
    if (error) {
      console.error("createNotification error:", error);
      return false;
    }
    return true;
  }

  // Other user: use service role to insert (bypasses RLS; more reliable than RPC)
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from("notifications")
      .insert({
        project_id: projectId,
        user_id: userId,
        type,
        title,
        body: options?.body ?? null,
        link: options?.link ?? null,
        metadata: options?.metadata ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("createNotification insert error:", error);
      return false;
    }
    return data != null;
  } catch (err) {
    console.error("[createNotification] EXCEPTION:", err);
    return false;
  }
}
