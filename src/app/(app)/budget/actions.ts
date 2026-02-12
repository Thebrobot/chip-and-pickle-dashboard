"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createActivityEvent } from "@/lib/activity";

export async function createBudgetItem(
  projectId: string,
  data: {
    category: string;
    item_name: string;
    forecast_amount?: number | null;
    actual_amount?: number | null;
    vendor?: string | null;
    notes?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("budget_items").insert({
    project_id: projectId,
    category: data.category.trim(),
    item_name: data.item_name.trim(),
    forecast_amount: data.forecast_amount ?? null,
    actual_amount: data.actual_amount ?? null,
    vendor: data.vendor?.trim() || null,
    notes: data.notes?.trim() || null,
  });

  if (error) throw error;

  await createActivityEvent(projectId, "budget_updated", `Added budget item: ${data.item_name.trim()}`, {
    category: data.category,
  });

  revalidatePath("/budget");
}

export async function updateBudgetItem(
  itemId: string,
  data: {
    category: string;
    item_name: string;
    forecast_amount?: number | null;
    actual_amount?: number | null;
    vendor?: string | null;
    notes?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: item, error } = await supabase
    .from("budget_items")
    .update({
      category: data.category.trim(),
      item_name: data.item_name.trim(),
      forecast_amount: data.forecast_amount ?? null,
      actual_amount: data.actual_amount ?? null,
      vendor: data.vendor?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .eq("id", itemId)
    .select("project_id")
    .single();

  if (error) throw error;

  if (item?.project_id) {
    await createActivityEvent(item.project_id, "budget_updated", `Updated budget item: ${data.item_name.trim()}`, {
      item_id: itemId,
      category: data.category,
    });
  }

  revalidatePath("/budget");
}

export async function deleteBudgetItem(itemId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error} = await supabase
    .from("budget_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;

  revalidatePath("/budget");
}

export async function togglePaidStatus(itemId: string, paid: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("budget_items")
    .update({
      paid,
      paid_date: paid ? new Date().toISOString() : null,
    })
    .eq("id", itemId);

  if (error) throw error;

  revalidatePath("/budget");
}
