"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { createTask, updateTask, updateTaskStatus } from "./actions";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "high" | "medium" | "low";
  due_date: string | null;
  assignee_user_id: string | null;
  assignee_name: string | null;
  completed_at: string | null;
}

interface ProjectMember {
  user_id: string;
  display_name: string;
}

interface TasksClientProps {
  projectId: string;
  projectName: string;
  tasks: Task[];
  projectMembers: ProjectMember[];
  openModal?: boolean;
}

type FilterType = "overdue" | "today" | "week" | "all";

const statusLabels: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const statusStyles: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityColors: Record<string, { dot: string; bg: string; text: string }> = {
  high: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  medium: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  low: { dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-600" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays <= 7) return `In ${diffDays} days`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

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

export function TasksClient({
  projectId,
  projectName,
  tasks,
  projectMembers,
  openModal = false,
}: TasksClientProps) {
  const [modalOpen, setModalOpen] = useState(openModal);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (openModal) setModalOpen(true);
  }, [openModal]);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Filter tasks based on selected filter
  const filteredTasks = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== "done");
    
    switch (filter) {
      case "overdue":
        return activeTasks.filter((t) => isOverdue(t.due_date));
      case "today":
        return activeTasks.filter((t) => isToday(t.due_date));
      case "week":
        return activeTasks.filter((t) => isThisWeek(t.due_date) || isToday(t.due_date) || isOverdue(t.due_date));
      case "all":
      default:
        return activeTasks;
    }
  }, [tasks, filter]);

  // Summary stats
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== "done");
    return {
      overdue: activeTasks.filter((t) => isOverdue(t.due_date)).length,
      today: activeTasks.filter((t) => isToday(t.due_date)).length,
      highPriority: activeTasks.filter((t) => t.priority === "high").length,
    };
  }, [tasks]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setAssigneeUserId("");
    setError(null);
    setEditingTask(null);
  }

  function handleCloseModal() {
    setModalOpen(false);
    resetForm();
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.due_date || "");
    setAssigneeUserId(task.assignee_user_id || "");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_date: dueDate || null,
          assignee_user_id: assigneeUserId || null,
        });
      } else {
        // Create new task
        await createTask(projectId, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: dueDate || undefined,
          assignee_user_id: assigneeUserId || null,
        });
      }
      handleCloseModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingTask ? "update" : "create"} task`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleComplete(task: Task) {
    setTogglingId(task.id);
    try {
      const newStatus = task.status === "done" ? "todo" : "done";
      await updateTaskStatus(task.id, newStatus);
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  function getTaskRowStyle(task: Task): string {
    const overdueTask = isOverdue(task.due_date) && task.status !== "done";
    const highPriorityOverdue = overdueTask && task.priority === "high";
    
    if (highPriorityOverdue) {
      return "bg-red-50/80 hover:bg-red-50";
    }
    if (overdueTask) {
      return "bg-red-50/40 hover:bg-red-50/60";
    }
    return "hover:bg-slate-50/80";
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Tasks"
        subtitle={`Track and manage tasks for ${projectName}`}
        action={<Button onClick={() => { resetForm(); setModalOpen(true); }}>New Task</Button>}
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingTask ? "Edit Task" : "New Task"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="task-title"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Title
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Task title"
              className="input-base"
            />
          </div>
          <div>
            <label
              htmlFor="task-description"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="input-base resize-none"
            />
          </div>
          <div>
            <label
              htmlFor="task-due"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label
              htmlFor="task-assignee"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Assignee
            </label>
            <select
              id="task-assignee"
              value={assigneeUserId}
              onChange={(e) => setAssigneeUserId(e.target.value)}
              className="input-base"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create task"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto px-4 md:px-8">
        {([
          { value: "overdue", label: "Overdue" },
          { value: "today", label: "Today" },
          { value: "week", label: "This Week" },
          { value: "all", label: "All" },
        ] as const).map((filterOption) => (
          <button
            key={filterOption.value}
            type="button"
            onClick={() => setFilter(filterOption.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === filterOption.value
                ? "bg-[#0F3D2E] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="card mx-4 flex flex-col items-center justify-center px-8 py-16 text-center md:mx-8">
          <div className="rounded-full bg-slate-100 p-4">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No tasks yet
          </h3>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
            Create your first task to start tracking work.
          </p>
          <Button onClick={() => { resetForm(); setModalOpen(true); }} className="mt-6">
            New Task
          </Button>
        </div>
      ) : (
        <div className="flex gap-6 px-4 md:px-8 lg:gap-8">
          {/* Task List */}
          <div className="min-w-0 flex-1">
            {filteredTasks.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-slate-500">
                  No tasks match this filter.
                </p>
              </div>
            ) : (
              <div className="card divide-y divide-slate-200/60 overflow-hidden">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${getTaskRowStyle(task)}`}
                  >
                    {/* Priority dot */}
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${priorityColors[task.priority]?.dot ?? priorityColors.medium.dot}`}
                    />
                    
                    {/* Task info - tappable */}
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleEditTask(task)}>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span className={isOverdue(task.due_date) ? "text-red-600 font-medium" : ""}>
                          {formatDate(task.due_date)}
                        </span>
                        {task.assignee_name && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>{task.assignee_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      disabled={togglingId === task.id}
                      className="shrink-0"
                      aria-label={task.status === "done" ? "Mark incomplete" : "Mark complete"}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-colors ${
                          task.status === "done"
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }`}
                      >
                        {task.status === "done" && (
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Summary - Desktop only */}
          <aside className="hidden w-80 shrink-0 lg:block">
            <div className="card sticky top-8 p-6">
              <h3 className="text-lg font-medium text-slate-900">Upcoming</h3>
              <dl className="mt-6 space-y-4">
                <div>
                  <dt className="text-xs text-slate-500">Overdue</dt>
                  <dd className="mt-1 text-2xl font-semibold text-red-600">
                    {stats.overdue}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Due today</dt>
                  <dd className="mt-1 text-2xl font-semibold text-amber-600">
                    {stats.today}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">High priority</dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">
                    {stats.highPriority}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
