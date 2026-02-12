"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createContractor(
  projectId: string,
  data: {
    name: string;
    company?: string | null;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("contractors").insert({
    project_id: projectId,
    name: data.name.trim(),
    company: data.company?.trim() || null,
    role: data.role?.trim() || null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    notes: data.notes?.trim() || null,
  });

  if (error) throw error;

  revalidatePath("/contractors");
}
