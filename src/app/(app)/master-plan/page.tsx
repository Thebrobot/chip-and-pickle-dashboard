import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboardSummary";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { MasterPlanClient } from "./MasterPlanClient";
import type { MasterPlanData, Phase, PhaseSection } from "./types";

export default async function MasterPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const { phase: phaseId } = await searchParams;
  const supabase = await createClient();
  const { project } = await getDashboardSummary();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!project) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Roadmap"
          subtitle="Project command center"
        />
        <div className="card p-8 text-center">
          <p className="text-slate-600">No project found.</p>
          <p className="mt-2 text-sm text-slate-500">
            Run the phase import script to create project data.
          </p>
        </div>
      </div>
    );
  }

  const [phasesRes, sectionsRes, itemsRes, membersRes] = await Promise.all([
    supabase
      .from("phases")
      .select("id, title, phase_order")
      .eq("project_id", project.id)
      .order("phase_order", { ascending: true }),
    supabase
      .from("phase_sections")
      .select("id, phase_id, title, section_order")
      .eq("project_id", project.id)
      .order("section_order", { ascending: true }),
    supabase
      .from("phase_items")
      .select("id, section_id, title, is_completed, notes, item_order, assignee_user_id, assignee_name, created_at, completed_at")
      .eq("project_id", project.id)
      .order("item_order", { ascending: true }),
    supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", project.id),
  ]);

  const { data: phases } = phasesRes;
  const { data: sections } = sectionsRes;
  const { data: items } = itemsRes;
  const { data: members } = membersRes;

  const memberIds = members?.map((m) => m.user_id) ?? [];
  const { data: profiles } =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", memberIds)
      : { data: [] };

  const profileMap = new Map(
    profiles?.map((p) => [p.user_id, p.full_name ?? "Member"]) ?? []
  );
  const memberSet = new Set(memberIds);
  const projectMembers: { user_id: string; display_name: string }[] =
    memberIds.map((user_id) => ({
      user_id,
      display_name: profileMap.get(user_id) ?? "Member",
    }));

  // Include assignees who may have left the project so dropdown shows correct selection
  const assignedUserIds = new Set(
    items?.flatMap((i) => (i.assignee_user_id ? [i.assignee_user_id] : [])) ?? []
  );
  for (const uid of assignedUserIds) {
    if (!memberSet.has(uid)) {
      projectMembers.push({
        user_id: uid,
        display_name: profileMap.get(uid) ?? "Member",
      });
    }
  }

  const sectionMap = new Map<string, PhaseSection>();
  for (const s of sections ?? []) {
    sectionMap.set(s.id, {
      id: s.id,
      title: s.title,
      section_order: s.section_order,
      items: [],
    });
  }

  for (const it of items ?? []) {
    const sec = sectionMap.get(it.section_id);
    if (sec) {
      sec.items.push({
        id: it.id,
        title: it.title,
        is_completed: it.is_completed,
        notes: it.notes,
        item_order: it.item_order,
        assignee_user_id: it.assignee_user_id ?? null,
        assignee_name: it.assignee_name ?? null,
        created_at: it.created_at ?? null,
        updated_at: null,
        completed_at: it.completed_at ?? null,
      });
    }
  }

  const phaseList: Phase[] = (phases ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    phase_order: p.phase_order,
    sections: (sections ?? [])
      .filter((s) => s.phase_id === p.id)
      .sort((a, b) => a.section_order - b.section_order)
      .map((s) => sectionMap.get(s.id)!)
      .filter(Boolean),
  }));

  const totalItems = items?.length ?? 0;
  const completedItems = items?.filter((i) => i.is_completed).length ?? 0;

  const data: MasterPlanData = {
    project: {
      id: project.id,
      name: project.name,
      target_open_date: project.target_open_date ?? null,
    },
    phases: phaseList,
    totalItems,
    completedItems,
    projectMembers,
  };

  return <MasterPlanClient data={data} expandPhaseId={phaseId} currentUserId={user.id} />;
}
