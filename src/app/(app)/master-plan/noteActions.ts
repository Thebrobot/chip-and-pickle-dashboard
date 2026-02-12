"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PhaseItemNote {
  id: string;
  phase_item_id: string;
  user_id: string;
  note_text: string;
  created_at: string;
  updated_at: string | null;
  author_name: string | null;
}

export async function getPhaseItemNotes(
  phaseItemId: string
): Promise<PhaseItemNote[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: notes, error } = await supabase
    .from("phase_item_notes")
    .select("id, phase_item_id, user_id, note_text, created_at, updated_at")
    .eq("phase_item_id", phaseItemId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch author names
  const userIds = [...new Set(notes?.map((n) => n.user_id) ?? [])];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds)
      : { data: [] };

  const profileMap = new Map(
    profiles?.map((p) => [p.user_id, p.full_name ?? "Member"]) ?? []
  );

  return (notes ?? []).map((n) => ({
    ...n,
    author_name: profileMap.get(n.user_id) ?? "Member",
  }));
}

export async function addPhaseItemNote(
  phaseItemId: string,
  projectId: string,
  noteText: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = noteText.trim();
  if (!trimmed) throw new Error("Note cannot be empty");

  const { error } = await supabase.from("phase_item_notes").insert({
    phase_item_id: phaseItemId,
    project_id: projectId,
    user_id: user.id,
    note_text: trimmed,
  });

  if (error) throw error;

  revalidatePath("/master-plan");
}

export async function updatePhaseItemNote(noteId: string, noteText: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = noteText.trim();
  if (!trimmed) throw new Error("Note cannot be empty");

  const { error } = await supabase
    .from("phase_item_notes")
    .update({ note_text: trimmed })
    .eq("id", noteId)
    .eq("user_id", user.id); // Only author can update

  if (error) throw error;

  revalidatePath("/master-plan");
}

export async function deletePhaseItemNote(noteId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("phase_item_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id); // Only author can delete

  if (error) throw error;

  revalidatePath("/master-plan");
}
