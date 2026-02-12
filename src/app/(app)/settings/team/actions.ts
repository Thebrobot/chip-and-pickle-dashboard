"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const CODE_LENGTH = 8;
const CODE_EXPIRY_HOURS = 168; // 7 days

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export async function generateInvite(projectId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: owner } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .single();

  if (!owner) throw new Error("Only project owners can generate invites");

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CODE_EXPIRY_HOURS);

  const { error } = await supabase.from("project_invites").insert({
    project_id: projectId,
    created_by: user.id,
    code,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;

  revalidatePath("/settings/team");
  return code;
}

export async function removeMember(projectId: string, userId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if current user is owner
  const { data: currentMember } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!currentMember || currentMember.role !== "owner") {
    throw new Error("Only project owners can remove members");
  }

  // Check if target user is owner
  const { data: targetMember } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (targetMember?.role === "owner") {
    throw new Error("Cannot remove project owner");
  }

  // Remove the member
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath("/settings/team");
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  newRole: "owner" | "member"
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if current user is owner
  const { data: currentMember } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!currentMember || currentMember.role !== "owner") {
    throw new Error("Only project owners can change roles");
  }

  // Prevent changing own role
  if (user.id === userId) {
    throw new Error("Cannot change your own role");
  }

  const { error } = await supabase
    .from("project_members")
    .update({ role: newRole })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath("/settings/team");
}

export async function updateMemberName(
  userId: string,
  data: {
    first_name: string;
    last_name: string;
    phone: string;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Users can update their own profile, or owners can update any member's profile
  if (user.id !== userId) {
    const { data: currentMember } = await supabase
      .from("project_members")
      .select("role, project_id")
      .eq("user_id", user.id)
      .single();

    if (!currentMember || currentMember.role !== "owner") {
      throw new Error("Only project owners can edit other members");
    }
  }

  // Build full_name from first_name + last_name
  const fullName = `${data.first_name} ${data.last_name}`.trim();

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      full_name: fullName,
    })
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath("/settings/team");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
