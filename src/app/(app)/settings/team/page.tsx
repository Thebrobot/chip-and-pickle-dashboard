import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/currentProject";
import { redirect } from "next/navigation";
import { TeamClient } from "./TeamClient";

export default async function TeamSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getCurrentProject();

  if (!project) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Team
          </h1>
        </div>
        <div className="card p-8 text-center">
          <p className="text-slate-600">No project found.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Create or join a project first.
          </p>
        </div>
      </div>
    );
  }

  const { data: projectMembers } = await supabase
    .from("project_members")
    .select("user_id, role")
    .eq("project_id", project.id);

  const userIds = projectMembers?.map((m) => m.user_id) ?? [];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, full_name, phone, email")
          .in("user_id", userIds)
      : { data: [] };

  const profileMap = new Map(
    profiles?.map((p) => [
      p.user_id,
      {
        first_name: p.first_name ?? "",
        last_name: p.last_name ?? "",
        full_name: p.full_name ?? "Unknown",
        phone: p.phone ?? "",
        email: p.email ?? "",
      },
    ]) ?? []
  );

  const members = (projectMembers ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      user_id: m.user_id,
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      display_name: profile?.full_name ?? "Unknown",
      phone: profile?.phone ?? "",
      email: profile?.email ?? (m.user_id === user.id ? user.email ?? "" : ""),
      role: m.role,
    };
  });

  const { data: currentMembership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", project.id)
    .eq("user_id", user.id)
    .single();
  const isOwner = currentMembership?.role === "owner";

  return (
    <TeamClient
      projectId={project.id}
      projectName={project.name}
      members={members}
      currentUserId={user.id}
      isOwner={isOwner}
    />
  );
}
