"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTask(
  projectId: string,
  data: {
    title: string;
    description?: string;
    priority: "high" | "medium" | "low";
    due_date?: string;
    assignee_user_id?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    priority: data.priority,
    due_date: data.due_date || null,
    assignee_user_id: data.assignee_user_id || null,
    status: "todo",
  });

  if (error) throw error;

  revalidatePath("/tasks");
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    priority?: "high" | "medium" | "low";
    due_date?: string | null;
    assignee_user_id?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: Record<string, any> = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.due_date !== undefined) updateData.due_date = data.due_date || null;
  if (data.assignee_user_id !== undefined) updateData.assignee_user_id = data.assignee_user_id || null;

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) throw error;

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(
  taskId: string,
  status: "todo" | "in_progress" | "done"
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) throw error;

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
