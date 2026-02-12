"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleItemComplete(itemId: string, completed: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("toggleItemComplete: No user found");
    throw new Error("Unauthorized");
  }

  console.log("Attempting to toggle item:", itemId, "to completed:", completed);

  const { data, error } = await supabase
    .from("phase_items")
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select();

  if (error) {
    console.error("toggleItemComplete error:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error("toggleItemComplete: No rows updated. Item may not exist or user lacks permission.");
    throw new Error("Failed to update item - no rows affected");
  }

  console.log("Successfully toggled item:", data);
  revalidatePath("/master-plan");
}

export async function updateItemNotes(itemId: string, notes: string | null) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("phase_items")
    .update({ notes: notes?.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) throw error;

  revalidatePath("/master-plan");
}

export async function updateItemAssignee(
  itemId: string,
  assigneeUserId: string | null,
  assigneeName: string | null // display cache; prefer assignee_user_id for lookup
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("phase_items")
    .update({
      assignee_user_id: assigneeUserId,
      assignee_name: assigneeName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) throw error;

  revalidatePath("/master-plan");
}

export async function updatePhaseItem(
  itemId: string,
  updates: {
    notes?: string | null;
    assignee_user_id?: string | null;
    assignee_name?: string | null;
    is_completed?: boolean;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.notes !== undefined) {
    payload.notes = updates.notes?.trim() || null;
  }
  if (updates.assignee_user_id !== undefined) {
    payload.assignee_user_id = updates.assignee_user_id;
  }
  if (updates.assignee_name !== undefined) {
    payload.assignee_name = updates.assignee_name;
  }
  if (updates.is_completed !== undefined) {
    payload.is_completed = updates.is_completed;
    payload.completed_at = updates.is_completed ? new Date().toISOString() : null;
  }

  const { error } = await supabase
    .from("phase_items")
    .update(payload)
    .eq("id", itemId);

  if (error) throw error;

  revalidatePath("/master-plan");
}
