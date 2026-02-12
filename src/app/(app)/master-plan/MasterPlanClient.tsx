"use client";

import { toggleItemComplete } from "./actions";
import {
  addPhase,
  addSection,
  addPhaseItem,
  deletePhaseItem,
} from "./crudActions";
import type { MasterPlanData, Phase, PhaseItem, ProjectMember } from "./types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ItemDetailSheet } from "@/components/roadmap/ItemDetailSheet";

interface MasterPlanClientProps {
  data: MasterPlanData;
  expandPhaseId?: string;
  currentUserId: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChecklistItem({
  item,
  projectMembers,
  onOpenSheet,
  onDelete,
}: {
  item: PhaseItem;
  projectMembers: ProjectMember[];
  onOpenSheet: (item: PhaseItem) => void;
  onDelete: (itemId: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  const router = useRouter();

  const displayCompleted = optimisticCompleted ?? item.is_completed;

  async function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();
    const next = !item.is_completed;
    setPending(true);
    setOptimisticCompleted(next);
    try {
      await toggleItemComplete(item.id, next);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle item complete:", error);
      setOptimisticCompleted(null);
      // Show user-friendly error
      alert("Failed to update item. Please check browser console for details.");
    } finally {
      setPending(false);
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(item.id);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenSheet(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenSheet(item);
        }
      }}
      className="group flex cursor-pointer items-start gap-3 rounded-lg py-2.5 pl-1 transition-smooth hover:bg-slate-50/80 active:bg-slate-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <input
          type="checkbox"
          checked={displayCompleted}
          onChange={handleCheckboxChange}
          disabled={pending}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
          aria-label={`Mark "${item.title}" as complete`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={`text-sm ${
            displayCompleted ? "text-slate-500 line-through" : "text-slate-800"
          }`}
        >
          {item.title}
        </span>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        aria-label="Delete item"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      <svg
        className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function PhaseAccordion({
  phase,
  defaultOpen,
  completedInPhase,
  totalInPhase,
  projectMembers,
  projectId,
  onOpenSheet,
  onDeleteItem,
}: {
  phase: Phase;
  defaultOpen: boolean;
  completedInPhase: number;
  totalInPhase: number;
  projectMembers: ProjectMember[];
  projectId: string;
  onOpenSheet: (item: PhaseItem) => void;
  onDeleteItem: (itemId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const router = useRouter();

  const phasePct = totalInPhase > 0 ? Math.round((completedInPhase / totalInPhase) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-smooth hover:bg-slate-50/50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ChevronIcon open={open} />
          <div>
            <h3 className="font-semibold text-slate-900">{phase.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {completedInPhase} of {totalInPhase} complete
            </p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-600">
          {phasePct}%
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-200/60 bg-slate-50/30 px-6 pb-6 pt-4">
          {phase.sections.map((section) => (
            <SectionWithItems
              key={section.id}
              section={section}
              phaseId={phase.id}
              projectId={projectId}
              projectMembers={projectMembers}
              onOpenSheet={onOpenSheet}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionWithItems({
  section,
  phaseId,
  projectId,
  projectMembers,
  onOpenSheet,
  onDeleteItem,
}: {
  section: { id: string; title: string; items: PhaseItem[] };
  phaseId: string;
  projectId: string;
  projectMembers: ProjectMember[];
  onOpenSheet: (item: PhaseItem) => void;
  onDeleteItem: (itemId: string) => void;
}) {
  const [addingItem, setAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAddItem() {
    if (!newItemTitle.trim()) return;
    setSaving(true);
    try {
      await addPhaseItem(section.id, phaseId, projectId, newItemTitle);
      setNewItemTitle("");
      setAddingItem(false);
      router.refresh();
    } catch {
      // Error handled
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 last:mb-0">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {section.title}
      </h4>
      <div className="space-y-0">
        {section.items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            projectMembers={projectMembers}
            onOpenSheet={onOpenSheet}
            onDelete={onDeleteItem}
          />
        ))}
      </div>
      {addingItem ? (
        <div className="mt-2 flex items-center gap-2 pl-1">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddItem();
              if (e.key === "Escape") {
                setAddingItem(false);
                setNewItemTitle("");
              }
            }}
            placeholder="Item title..."
            autoFocus
            disabled={saving}
            className="input-base flex-1 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleAddItem}
            disabled={saving || !newItemTitle.trim()}
            className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingItem(false);
              setNewItemTitle("");
            }}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingItem(true)}
          className="mt-2 flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add item
        </button>
      )}
    </div>
  );
}

export function MasterPlanClient({ data, expandPhaseId, currentUserId }: MasterPlanClientProps) {
  const { project, phases, totalItems, completedItems, projectMembers } = data;
  const [sheetItem, setSheetItem] = useState<PhaseItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();

  const openSheet = (item: PhaseItem) => {
    setSheetItem(item);
    setSheetOpen(true);
  };

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    try {
      await deletePhaseItem(itemId);
      if (sheetItem?.id === itemId) {
        setSheetOpen(false);
      }
      router.refresh();
    } catch {
      alert("Failed to delete item");
    }
  }
  const remaining = totalItems - completedItems;
  const progress =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  let currentPhase: Phase | null = null;
  for (const p of phases) {
    const completed = p.sections.reduce(
      (s, sec) => s + sec.items.filter((i) => i.is_completed).length,
      0
    );
    const total = p.sections.reduce(
      (s, sec) => s + sec.items.length,
      0
    );
    if (completed < total) {
      currentPhase = p;
      break;
    }
  }

  const targetDateFormatted = project.target_open_date
    ? new Date(project.target_open_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1">
        <header className="mb-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {project.name}
            </h1>
            <div className="flex items-center gap-4">
              {targetDateFormatted && (
                <span className="text-sm text-slate-500">
                  Target: {targetDateFormatted}
                </span>
              )}
              <span className="text-lg font-semibold text-slate-700">
                {progress}% complete
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Roadmap — command center
          </p>
        </header>

        <div className="mb-6 flex items-center gap-4">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background:
                  progress > 0
                    ? "linear-gradient(90deg, #0F3D2E 0%, #0F3D2E 92%, #C6A75E 100%)"
                    : "transparent",
              }}
            />
          </div>
          <span className="shrink-0 self-center text-sm font-semibold tabular-nums text-slate-600">
            {progress}%
          </span>
        </div>

        <div className="space-y-4">
          {phases.map((phase, idx) => {
            const completedInPhase = phase.sections.reduce(
              (s, sec) => s + sec.items.filter((i) => i.is_completed).length,
              0
            );
            const totalInPhase = phase.sections.reduce(
              (s, sec) => s + sec.items.length,
              0
            );
            const isFirstIncomplete = currentPhase?.id === phase.id;
            const isExpandedFromUrl = expandPhaseId === phase.id;

            return (
              <PhaseAccordion
                key={phase.id}
                phase={phase}
                defaultOpen={idx === 0 || isFirstIncomplete || isExpandedFromUrl}
                completedInPhase={completedInPhase}
                totalInPhase={totalInPhase}
                projectMembers={projectMembers}
                projectId={project.id}
                onOpenSheet={openSheet}
                onDeleteItem={handleDeleteItem}
              />
            );
          })}
          <AddPhaseButton projectId={project.id} />
        </div>
      </div>

      <ItemDetailSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        item={sheetItem}
        projectId={project.id}
        projectMembers={projectMembers}
        currentUserId={currentUserId}
        onItemUpdated={(updates) => {
          if (sheetItem && updates) {
            setSheetItem({ ...sheetItem, ...updates });
          }
        }}
        onItemDeleted={() => {
          setSheetOpen(false);
          setSheetItem(null);
        }}
      />

      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="card sticky top-8 p-6">
          <h3 className="text-lg font-medium text-slate-900">
            Summary
          </h3>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs text-slate-500">Total items</dt>
              <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                {totalItems}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Completed</dt>
              <dd className="mt-0.5 text-lg font-semibold text-emerald-600">
                {completedItems}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Remaining</dt>
              <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                {remaining}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Current phase</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">
                {currentPhase?.title ?? "All complete"}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function AddPhaseButton({ projectId }: { projectId: string }) {
  const [adding, setAdding] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAddPhase() {
    if (!newPhaseTitle.trim()) return;
    setSaving(true);
    try {
      await addPhase(projectId, newPhaseTitle);
      setNewPhaseTitle("");
      setAdding(false);
      router.refresh();
    } catch {
      alert("Failed to add phase");
    } finally {
      setSaving(false);
    }
  }

  if (adding) {
    return (
      <div className="card p-4">
        <input
          type="text"
          value={newPhaseTitle}
          onChange={(e) => setNewPhaseTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddPhase();
            if (e.key === "Escape") {
              setAdding(false);
              setNewPhaseTitle("");
            }
          }}
          placeholder="Phase name..."
          autoFocus
          disabled={saving}
          className="input-base w-full text-sm"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewPhaseTitle("");
            }}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddPhase}
            disabled={saving || !newPhaseTitle.trim()}
            className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Phase"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Phase
    </button>
  );
}
