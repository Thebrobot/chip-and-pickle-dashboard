import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboardSummary";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TasksClient } from "./TasksClient";

export const revalidate = 60;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
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
          title="Tasks"
          subtitle="Track and manage your project tasks"
        />
        <div className="card p-8 text-center">
          <p className="text-slate-600">No project found.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Create or join a project first.
          </p>
        </div>
      </div>
    );
  }

  const [tasksRes, membersRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, status, priority, due_date, assignee_user_id, completed_at, created_at")
      .eq("project_id", project.id)
      .order("priority", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", project.id),
  ]);

  const { data: tasks } = tasksRes;
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

  const assignedUserIds = new Set(
    tasks?.flatMap((t) => (t.assignee_user_id ? [t.assignee_user_id] : [])) ?? []
  );
  for (const uid of assignedUserIds) {
    if (!memberSet.has(uid)) {
      projectMembers.push({
        user_id: uid,
        display_name: profileMap.get(uid) ?? "Member",
      });
    }
  }

  // Sort tasks by priority, then due_date, then created_at
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const sortedTasks = (tasks ?? []).sort((a, b) => {
    // 1. Priority (high first)
    const priorityDiff =
      priorityOrder[a.priority as keyof typeof priorityOrder] -
      priorityOrder[b.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;

    // 2. Due date (earliest first, nulls last)
    if (a.due_date && b.due_date) {
      const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (dateDiff !== 0) return dateDiff;
    } else if (a.due_date) {
      return -1; // a has due date, b doesn't - a comes first
    } else if (b.due_date) {
      return 1; // b has due date, a doesn't - b comes first
    }

    // 3. Created at (oldest first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const tasksWithAssignee = sortedTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as "todo" | "in_progress" | "done",
    priority: t.priority as "high" | "medium" | "low",
    due_date: t.due_date,
    assignee_user_id: t.assignee_user_id,
    assignee_name: t.assignee_user_id
      ? profileMap.get(t.assignee_user_id) ?? "Member"
      : null,
    completed_at: t.completed_at,
  }));

  return (
    <TasksClient
      projectId={project.id}
      projectName={project.name}
      tasks={tasksWithAssignee}
      projectMembers={projectMembers}
      openModal={open === "new"}
    />
  );
}
