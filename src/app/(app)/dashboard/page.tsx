import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/currentProject";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlobalSearch } from "@/components/search/GlobalSearch";

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  return date >= today && date <= weekFromNow;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getCurrentProject();

  const { data: phases } = project
    ? await supabase
        .from("phases")
        .select("id, title, phase_order")
        .eq("project_id", project.id)
        .order("phase_order", { ascending: true })
    : { data: null };

  const { data: sections } = project
    ? await supabase
        .from("phase_sections")
        .select("id, phase_id, section_order")
        .eq("project_id", project.id)
        .order("section_order", { ascending: true })
    : { data: null };

  const { data: items } = project
    ? await supabase
        .from("phase_items")
        .select("id, phase_id, section_id, item_order, title, is_completed")
        .eq("project_id", project.id)
    : { data: null };

  // Fetch tasks with priority for attention section
  const { data: tasks } = project
    ? await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, updated_at")
        .eq("project_id", project.id)
        .neq("status", "done")
        .order("priority", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false })
    : { data: null };

  // Fetch budget data
  const { data: budgetItems } = project
    ? await supabase
        .from("budget_items")
        .select("forecast_amount, actual_amount")
        .eq("project_id", project.id)
    : { data: null };

  // Fetch contractors
  const { data: contractors } = project
    ? await supabase
        .from("contractors")
        .select("id, name, role")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: null };

  // Recent activity (recently updated tasks)
  const { data: recentTasks } = project
    ? await supabase
        .from("tasks")
        .select("id, title, status, updated_at, assignee_user_id")
        .eq("project_id", project.id)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(5)
    : { data: null };

  // Fetch project members to get their profiles
  const { data: projectMembers } = project
    ? await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", project.id)
    : { data: null };

  const memberIds = projectMembers?.map((m) => m.user_id) ?? [];

  // Fetch profiles for project members
  const { data: taskProfiles } =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", memberIds)
      : { data: [] };

  const taskProfileMap = new Map(
    taskProfiles?.map((p) => [p.user_id, p.full_name ?? "Member"]) ?? []
  );

  const recentTasksWithAssignee = (recentTasks ?? []).map((t) => ({
    ...t,
    assignee_name: t.assignee_user_id ? taskProfileMap.get(t.assignee_user_id) ?? null : null,
  }));

  const budgetForecast = budgetItems?.reduce((sum, item) => sum + (item.forecast_amount ?? 0), 0) ?? 0;
  const budgetActual = budgetItems?.reduce((sum, item) => sum + (item.actual_amount ?? 0), 0) ?? 0;
  const budgetVariance = budgetForecast - budgetActual;

  const totalItems = items?.length ?? 0;
  const completedItems = items?.filter((i) => i.is_completed).length ?? 0;
  const remaining = totalItems - completedItems;
  const completionPct =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Find first incomplete item
  const sectionMap = new Map<string, number>();
  for (const s of sections ?? []) {
    sectionMap.set(s.id, s.section_order);
  }

  let currentPhase: { id: string; title: string } | null = null;
  let nextCriticalItem: string | null = null;
  
  if (phases && items) {
    for (const p of phases) {
      const phaseItems = items.filter((i) => i.phase_id === p.id);
      const completed = phaseItems.filter((i) => i.is_completed).length;
      const total = phaseItems.length;
      if (completed < total) {
        currentPhase = { id: p.id, title: p.title };
        const incomplete = phaseItems
          .filter((i) => !i.is_completed)
          .sort((a, b) => {
            const orderA = (sectionMap.get(a.section_id) ?? 0) * 1000 + a.item_order;
            const orderB = (sectionMap.get(b.section_id) ?? 0) * 1000 + b.item_order;
            return orderA - orderB;
          });
        nextCriticalItem = incomplete[0]?.title ?? null;
        break;
      }
    }
  }

  // Task attention stats
  const activeTasks = tasks ?? [];
  const highPriorityOverdue = activeTasks.filter((t) => t.priority === "high" && isOverdue(t.due_date));
  const tasksOverdue = activeTasks.filter((t) => isOverdue(t.due_date));
  const tasksToday = activeTasks.filter((t) => isToday(t.due_date));
  const tasksThisWeek = activeTasks.filter((t) => isThisWeek(t.due_date));

  // Compute phase completion percentages
  const phaseProgress = (phases ?? []).map((p) => {
    const phaseItems = (items ?? []).filter((i) => i.phase_id === p.id);
    const completed = phaseItems.filter((i) => i.is_completed).length;
    const total = phaseItems.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      id: p.id,
      title: p.title,
      completed,
      total,
      percentage: pct,
    };
  });

  const kpiData = [
    { title: "Total Items", value: String(totalItems) },
    { title: "Completed", value: String(completedItems) },
    { title: "Remaining", value: String(remaining) },
    { title: "Completion", value: `${completionPct}%` },
  ];

  function formatRelativeTime(ts: string | null | undefined): string {
    if (!ts) return "—";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      {/* Mobile: search only */}
      <div className="md:hidden">
        <GlobalSearch />
      </div>

      {/* Desktop page header */}
      <div className="hidden md:block md:mx-8">
        <PageHeader
          title="Dashboard"
          subtitle="Construction Command Center"
        />
        <div className="mb-4 max-w-md">
          <GlobalSearch />
        </div>
      </div>

      {/* Mobile: Hero Status Card */}
      <section className="mx-4 md:hidden">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-[#0F3D2E] to-[#0d3528] px-5 py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-white/80">
              Project Status
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {currentPhase?.title ?? "All Complete"}
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white to-[#C6A75E] transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="shrink-0 text-lg font-bold tabular-nums text-white">
                {completionPct}%
              </span>
            </div>
            {nextCriticalItem && (
              <p className="mt-3 text-sm text-white/90">
                <span className="font-medium">Next Critical Item:</span> {nextCriticalItem}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Desktop: Compact Horizontal Metric Strip */}
      <section className="mx-4 hidden md:mx-8 md:block">
        <div className="rounded-xl bg-white py-4 px-6 shadow-sm">
          <div className="grid grid-cols-4 gap-0">
            <div className="text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Items
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {totalItems}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-6 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Completed
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {completedItems}
              </p>
              <p className="text-xs text-slate-500">of {totalItems}</p>
            </div>
            <div className="border-l border-slate-200 pl-6 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Remaining
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {remaining}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-6 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Completion
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-600">
                {completionPct}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop: Progress by Phase - Increased Visual Weight */}
      <section className="mx-4 hidden md:mx-8 md:block">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Progress by Phase
            </h3>
            <Link href="/master-plan" className="text-xs font-medium text-[#0F3D2E] hover:underline">
              View all →
            </Link>
          </div>
          {phaseProgress.length > 0 ? (
            <div className="space-y-4">
              {phaseProgress.slice(0, 5).map((phase, idx) => {
                const isActivePhase = currentPhase && phase.id === currentPhase.id;
                return (
                  <div
                    key={phase.id}
                    className={`rounded-lg p-2 ${isActivePhase ? "bg-emerald-50/50" : ""}`}
                  >
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm ${isActivePhase ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                        {phase.title}
                      </p>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                        {phase.percentage}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0F3D2E] to-[#1a5c45] transition-all duration-300"
                        style={{ width: `${phase.percentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {phase.completed} of {phase.total} items
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No phases yet</p>
          )}
        </div>
      </section>

      {/* Mobile: Project Metrics (full width) */}
      <section className="mx-4 md:hidden">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Project Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Total Items
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {totalItems}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Completed
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {completedItems}
              </p>
              <p className="text-[10px] text-slate-500">of {totalItems}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Remaining
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {remaining}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Completion
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
                {completionPct}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: Progress by Phase */}
      <section className="mx-4 md:hidden">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Progress by Phase
            </h3>
            <Link href="/master-plan" className="text-xs font-medium text-[#0F3D2E] hover:underline">
              View all →
            </Link>
          </div>
          {phaseProgress.length > 0 ? (
            <div className="space-y-3">
              {phaseProgress.slice(0, 3).map((phase) => (
                <div key={phase.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {phase.title}
                    </p>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-900">
                      {phase.percentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0F3D2E] to-[#1a5c45] transition-all duration-300"
                      style={{ width: `${phase.percentage}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {phase.completed} of {phase.total} items
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No phases yet</p>
          )}
        </div>
      </section>

      {/* Mobile: Attention Required */}
      {(highPriorityOverdue.length > 0 || tasksOverdue.length > 0 || tasksToday.length > 0 || tasksThisWeek.length > 0) && (
        <section className="mx-4 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Attention Required
            </h3>
            <Link href="/tasks" className="text-xs font-medium text-[#0F3D2E] hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {/* High Priority Overdue */}
            {highPriorityOverdue.length > 0 && (
              <Link
                href="/tasks"
                className="block rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 transition-colors hover:bg-red-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        High Priority Overdue
                      </p>
                      <p className="text-xs text-red-700">
                        {highPriorityOverdue.length} {highPriorityOverdue.length === 1 ? "task" : "tasks"}
                      </p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}

            {/* Overdue Tasks */}
            {tasksOverdue.length > 0 && highPriorityOverdue.length === 0 && (
              <Link
                href="/tasks"
                className="block rounded-lg border border-red-200 bg-red-50/60 px-4 py-3 transition-colors hover:bg-red-50/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Overdue Tasks
                      </p>
                      <p className="text-xs text-red-700">
                        {tasksOverdue.length} {tasksOverdue.length === 1 ? "task" : "tasks"}
                      </p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}

            {/* Due Today */}
            {tasksToday.length > 0 && (
              <Link
                href="/tasks"
                className="block rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 transition-colors hover:bg-amber-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        Due Today
                      </p>
                      <p className="text-xs text-amber-700">
                        {tasksToday.length} {tasksToday.length === 1 ? "task" : "tasks"}
                      </p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}

            {/* Due This Week */}
            {tasksThisWeek.length > 0 && (
              <Link
                href="/tasks"
                className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Due This Week
                      </p>
                      <p className="text-xs text-slate-600">
                        {tasksThisWeek.length} {tasksThisWeek.length === 1 ? "task" : "tasks"}
                      </p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Mobile: Budget Snapshot */}
      <section className="mx-4 md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Budget Snapshot
          </h3>
          <Link href="/budget" className="text-xs font-medium text-[#0F3D2E] hover:underline">
            View all →
          </Link>
        </div>
        <div className="card p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500">Forecast</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                ${(budgetForecast / 1000).toFixed(0)}k
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Actual</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                ${(budgetActual / 1000).toFixed(0)}k
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Variance</p>
              <p className={`mt-1 text-lg font-semibold ${
                budgetVariance > 0 ? "text-emerald-600" : budgetVariance < 0 ? "text-red-600" : "text-slate-900"
              }`}>
                {budgetVariance > 0 ? "+" : ""}${(budgetVariance / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: Active Contractors */}
      <section className="mx-4 md:hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900">
            Active Contractors
          </h3>
          <Link href="/contractors" className="text-xs font-medium text-[#0F3D2E] hover:underline">
            View all
          </Link>
        </div>
        <div className="card p-5">
          {contractors && contractors.length > 0 ? (
            <div className="space-y-3">
              <p className="text-3xl font-bold text-slate-900">{contractors.length}</p>
              <div className="space-y-2">
                {contractors.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      {c.role && <p className="text-xs text-slate-500">{c.role}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No contractors yet</p>
          )}
        </div>
      </section>

      {/* Mobile: Recent Activity */}
      <section className="mx-4 md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Recent Activity
          </h3>
          <Link href="/tasks" className="text-xs font-medium text-[#0F3D2E] hover:underline">
            View all →
          </Link>
        </div>
        <div className="card p-5">
          {recentTasksWithAssignee && recentTasksWithAssignee.length > 0 ? (
            <div className="space-y-3">
              {recentTasksWithAssignee.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{formatRelativeTime(t.updated_at)}</span>
                      {t.assignee_name && (
                        <>
                          <span>•</span>
                          <span>{t.assignee_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      t.status === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : t.status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent updates</p>
          )}
        </div>
      </section>

      {/* Desktop Bento Grid Layout - Increased Density */}
      <div className="hidden md:block md:mx-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Budget Snapshot - Compact Horizontal Layout (span 3) */}
          <div className="lg:col-span-3">
            <div className="h-full rounded-xl bg-white py-4 px-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Budget Snapshot
                </h4>
                <Link href="/budget" className="text-xs font-medium text-[#0F3D2E] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Forecast</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    ${(budgetForecast / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="border-l border-slate-200 pl-4 text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Actual</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    ${(budgetActual / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="border-l border-slate-200 pl-4 text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Variance</p>
                  <p className={`mt-1 text-2xl font-bold ${
                    budgetVariance > 0 ? "text-emerald-600" : budgetVariance < 0 ? "text-red-600" : "text-slate-900"
                  }`}>
                    {budgetVariance > 0 ? "+" : ""}${(budgetVariance / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contractors - More Human (span 2) */}
          <div className="lg:col-span-2">
            <div className="h-full rounded-xl bg-white py-4 px-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Contractors
                </h4>
                <Link href="/contractors" className="text-xs font-medium text-[#0F3D2E] hover:underline">
                  View all →
                </Link>
              </div>
              {contractors && contractors.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-2xl font-bold text-slate-900">{contractors.length}</p>
                  <div className="space-y-2.5">
                    {contractors.slice(0, 3).map((c) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F3D2E]/10 text-xs font-semibold text-[#0F3D2E]">
                          {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                          {c.role && <p className="truncate text-xs text-slate-500">{c.role}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="mt-1 text-xs text-slate-500">None yet</p>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity - Structured Layout (span 5) */}
          <div className="lg:col-span-5">
            <div className="rounded-xl bg-white py-4 px-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Recent Activity
                </h4>
                <Link href="/tasks" className="text-xs font-medium text-[#0F3D2E] hover:underline">
                  View all →
                </Link>
              </div>
              {recentTasksWithAssignee && recentTasksWithAssignee.length > 0 ? (
                <div className="space-y-2">
                  {recentTasksWithAssignee.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/30 py-2 px-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          t.status === "done"
                            ? "bg-emerald-500"
                            : t.status === "in_progress"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`} />
                        <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                        {t.assignee_name && (
                          <>
                            <span>{t.assignee_name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatRelativeTime(t.updated_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8">
                  <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2 text-sm text-slate-500">No activity yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Attention Required - Compact (span 5) */}
          {(highPriorityOverdue.length > 0 || tasksOverdue.length > 0 || tasksToday.length > 0 || tasksThisWeek.length > 0) && (
            <div className="lg:col-span-5">
              <div className="rounded-xl bg-white py-4 px-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Attention Required
                  </h4>
                  <Link href="/tasks" className="text-xs font-medium text-[#0F3D2E] hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="space-y-2">
                  {highPriorityOverdue.length > 0 && (
                    <Link
                      href="/tasks"
                      className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/40 px-4 py-2.5 transition-colors hover:bg-red-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                          <svg className="h-3.5 w-3.5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-900">
                            High Priority Overdue
                          </p>
                          <p className="text-xs text-red-700">
                            {highPriorityOverdue.length} {highPriorityOverdue.length === 1 ? "task" : "tasks"}
                          </p>
                        </div>
                      </div>
                      <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}

                  {tasksOverdue.length > 0 && highPriorityOverdue.length === 0 && (
                    <Link
                      href="/tasks"
                      className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/30 px-4 py-2.5 transition-colors hover:bg-red-50/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                          <svg className="h-3.5 w-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-900">
                            Overdue Tasks
                          </p>
                          <p className="text-xs text-red-700">
                            {tasksOverdue.length} {tasksOverdue.length === 1 ? "task" : "tasks"}
                          </p>
                        </div>
                      </div>
                      <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}

                  {tasksToday.length > 0 && (
                    <Link
                      href="/tasks"
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/40 px-4 py-2.5 transition-colors hover:bg-amber-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
                          <svg className="h-3.5 w-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-900">
                            Due Today
                          </p>
                          <p className="text-xs text-amber-700">
                            {tasksToday.length} {tasksToday.length === 1 ? "task" : "tasks"}
                          </p>
                        </div>
                      </div>
                      <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}

                  {tasksThisWeek.length > 0 && (
                    <Link
                      href="/tasks"
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 transition-colors hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                          <svg className="h-3.5 w-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Due This Week
                          </p>
                          <p className="text-xs text-slate-600">
                            {tasksThisWeek.length} {tasksThisWeek.length === 1 ? "task" : "tasks"}
                          </p>
                        </div>
                      </div>
                      <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
