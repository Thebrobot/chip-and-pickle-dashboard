"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function joinProject(code: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to join a project");

  const { data, error } = await supabase.rpc("join_project_invite", {
    p_code: code.trim().toUpperCase(),
  });

  if (error) throw error;

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    throw new Error(result.error ?? "Invalid or expired code");
  }
}
