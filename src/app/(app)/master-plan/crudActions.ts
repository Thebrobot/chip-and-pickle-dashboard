"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ===== PHASES =====

export async function addPhase(projectId: string, title: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = title.trim();
  if (!trimmed) throw new Error("Phase title cannot be empty");

  // Get max phase_order
  const { data: phases } = await supabase
    .from("phases")
    .select("phase_order")
    .eq("project_id", projectId)
    .order("phase_order", { ascending: false })
    .limit(1);

  const nextOrder = phases && phases.length > 0 ? phases[0].phase_order + 1 : 1;

  const { error } = await supabase.from("phases").insert({
    project_id: projectId,
    user_id: user.id,
    title: trimmed,
    phase_order: nextOrder,
  });

  if (error) throw error;

  revalidatePath("/master-plan");
}

export async function deletePhase(phaseId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("phases")
    .delete()
    .eq("id", phaseId);

  if (error) throw error;

  revalidatePath("/master-plan");
}

// ===== SECTIONS =====

export async function addSection(
  phaseId: string,
  projectId: string,
  title: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = title.trim();
  if (!trimmed) throw new Error("Section title cannot be empty");

  // Get max section_order for this phase
  const { data: sections } = await supabase
    .from("phase_sections")
    .select("section_order")
    .eq("phase_id", phaseId)
    .order("section_order", { ascending: false })
    .limit(1);

  const nextOrder = sections && sections.length > 0 ? sections[0].section_order + 1 : 1;

  const { error } = await supabase.from("phase_sections").insert({
    phase_id: phaseId,
    project_id: projectId,
    user_id: user.id,
    title: trimmed,
    section_order: nextOrder,
  });

  if (error) throw error;

  revalidatePath("/master-plan");
}

export async function deleteSection(sectionId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("phase_sections")
    .delete()
    .eq("id", sectionId);

  if (error) throw error;

  revalidatePath("/master-plan");
}

// ===== ITEMS =====

export async function addPhaseItem(
  sectionId: string,
  phaseId: string,
  projectId: string,
  title: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = title.trim();
  if (!trimmed) throw new Error("Item title cannot be empty");

  // Get max item_order for this section
  const { data: items } = await supabase
    .from("phase_items")
    .select("item_order")
    .eq("section_id", sectionId)
    .order("item_order", { ascending: false })
    .limit(1);

  const nextOrder = items && items.length > 0 ? items[0].item_order + 1 : 1;

  const { error } = await supabase.from("phase_items").insert({
    section_id: sectionId,
    phase_id: phaseId,
    project_id: projectId,
    user_id: user.id,
    title: trimmed,
    item_order: nextOrder,
    is_completed: false,
  });

  if (error) throw error;

  revalidatePath("/master-plan");
}

export async function deletePhaseItem(itemId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("phase_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;

  revalidatePath("/master-plan");
}
