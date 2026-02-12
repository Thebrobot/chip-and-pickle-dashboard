"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createActivityEvent } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

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

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority,
      due_date: data.due_date || null,
      assignee_user_id: data.assignee_user_id || null,
      status: "todo",
    })
    .select("id, title")
    .single();

  if (error) throw error;

  await createActivityEvent(projectId, "task_created", `Created task: ${data.title.trim()}`, {
    task_id: task.id,
  });

  const assigneeId = data.assignee_user_id || null;
  if (assigneeId && assigneeId !== user.id) {
    await createNotification(
      projectId,
      assigneeId,
      "task_assigned",
      `Task assigned: ${data.title.trim()}`,
      {
        body: "You were assigned to a new task.",
        link: "/tasks",
        metadata: { task_id: task.id },
      }
    );
  }

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

  let previousTask: { assignee_user_id: string | null; project_id: string; title: string } | null = null;
  if (data.assignee_user_id !== undefined) {
    const { data: existing } = await supabase
      .from("tasks")
      .select("assignee_user_id, project_id, title")
      .eq("id", taskId)
      .single();
    previousTask = existing;
  }

  const updateData: Record<string, unknown> = {};
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

  const newAssigneeId = data.assignee_user_id !== undefined ? data.assignee_user_id || null : null;
  const oldAssigneeId = previousTask?.assignee_user_id ?? null;
  const projectId = previousTask?.project_id;
  const taskTitle = data.title?.trim() ?? previousTask?.title ?? "Task";

  if (
    projectId &&
    newAssigneeId &&
    newAssigneeId !== oldAssigneeId &&
    newAssigneeId !== user.id
  ) {
    await createActivityEvent(projectId, "task_assigned", `Assigned task: ${taskTitle}`, {
      task_id: taskId,
      assignee_user_id: newAssigneeId,
    });
    await createNotification(projectId, newAssigneeId, "task_assigned", `Task assigned: ${taskTitle}`, {
      body: "You were assigned to a task.",
      link: "/tasks",
      metadata: { task_id: taskId },
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("title, project_id")
    .eq("id", taskId)
    .single();

  if (fetchError || !task) throw new Error("Task not found");

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) throw error;

  await createActivityEvent(task.project_id, "task_deleted", `Deleted task: ${task.title}`, {
    task_id: taskId,
  });

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

  let taskTitle: string | null = null;
  let projectId: string | null = null;
  if (status === "done") {
    const { data: task } = await supabase
      .from("tasks")
      .select("title, project_id")
      .eq("id", taskId)
      .single();
    taskTitle = task?.title ?? null;
    projectId = task?.project_id ?? null;
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) throw error;

  if (status === "done" && projectId) {
    await createActivityEvent(projectId, "task_completed", `Completed task: ${taskTitle ?? "Task"}`, {
      task_id: taskId,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
