"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(userId: string, fullName: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("user_id", userId);

  if (error) throw error;

  // Revalidate pages that display the user's name
  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
