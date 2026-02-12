"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteTask } from "@/app/(app)/tasks/actions";

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
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

interface Task {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  assignee_name: string | null;
}

interface RecentActivityTasksProps {
  tasks: Task[];
  variant?: "mobile" | "desktop";
}

export function RecentActivityTasks({ tasks, variant = "desktop" }: RecentActivityTasksProps) {
  const router = useRouter();

  async function handleDelete(taskId: string, taskTitle: string) {
    if (!confirm(`Delete "${taskTitle}"?`)) return;
    try {
      await deleteTask(taskId);
      router.refresh();
    } catch {
      alert("Failed to delete task");
    }
  }

  if (tasks.length === 0) {
    return variant === "mobile" ? (
      <p className="text-sm text-slate-500">No recent updates</p>
    ) : (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8">
        <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="mt-2 text-sm text-slate-500">No activity yet</p>
      </div>
    );
  }

  const displayTasks = variant === "desktop" ? tasks.slice(0, 5) : tasks;

  if (variant === "mobile") {
    return (
      <div className="space-y-3">
        {displayTasks.map((t) => (
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
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  t.status === "done"
                    ? "bg-emerald-100 text-emerald-700"
                    : t.status === "in_progress"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {t.status}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(t.id, t.title)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${t.title}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayTasks.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/30 py-2 px-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                t.status === "done"
                  ? "bg-emerald-500"
                  : t.status === "in_progress"
                    ? "bg-amber-500"
                    : "bg-slate-400"
              }`}
            />
            <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {t.assignee_name && (
                <>
                  <span>{t.assignee_name}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatRelativeTime(t.updated_at)}</span>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(t.id, t.title)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${t.title}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
