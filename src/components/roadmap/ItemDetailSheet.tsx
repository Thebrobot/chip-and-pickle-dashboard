"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updatePhaseItem } from "@/app/(app)/master-plan/actions";
import { deletePhaseItem } from "@/app/(app)/master-plan/crudActions";
import {
  getPhaseItemNotes,
  addPhaseItemNote,
  updatePhaseItemNote,
  deletePhaseItemNote,
  type PhaseItemNote,
} from "@/app/(app)/master-plan/noteActions";
import type { PhaseItem, ProjectMember } from "@/app/(app)/master-plan/types";

interface ItemDetailSheetProps {
  open: boolean;
  onClose: () => void;
  item: PhaseItem | null;
  projectId: string;
  projectMembers: ProjectMember[];
  currentUserId: string | null;
  onItemUpdated?: (item: Partial<PhaseItem>) => void;
  onItemDeleted?: () => void;
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ItemDetailSheet({
  open,
  onClose,
  item,
  projectId,
  projectMembers,
  currentUserId,
  onItemUpdated,
  onItemDeleted,
}: ItemDetailSheetProps) {
  const [isCompleted, setIsCompleted] = useState(item?.is_completed ?? false);
  const [newNoteText, setNewNoteText] = useState("");
  const [notes, setNotes] = useState<PhaseItemNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<string | null>(
    item?.assignee_user_id ?? null
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [createdAt, setCreatedAt] = useState(item?.created_at ?? null);
  const [updatedAt, setUpdatedAt] = useState(item?.updated_at ?? null);
  const [completedAt, setCompletedAt] = useState(item?.completed_at ?? null);

  const newNoteRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!item) return;
    setIsCompleted(item.is_completed);
    setNewNoteText("");
    setEditingNoteId(null);
    setAssigneeUserId(item.assignee_user_id ?? null);
    setCreatedAt(item.created_at ?? null);
    setUpdatedAt(item.updated_at ?? null);
    setCompletedAt(item.completed_at ?? null);

    // Fetch notes
    if (open) {
      setNotesLoading(true);
      getPhaseItemNotes(item.id)
        .then(setNotes)
        .catch(() => setNotes([]))
        .finally(() => setNotesLoading(false));
    }
  }, [item, open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const performSave = useCallback(
    async (updates: {
      notes?: string | null;
      assignee_user_id?: string | null;
      assignee_name?: string | null;
      is_completed?: boolean;
    }) => {
      if (!item?.id) return;
      setSaveStatus("saving");
      try {
        await updatePhaseItem(item.id, updates);
        setSaveStatus("saved");
        onItemUpdated?.({ ...item, ...updates });
        if (updates.is_completed !== undefined) {
          setIsCompleted(updates.is_completed);
          setCompletedAt(updates.is_completed ? new Date().toISOString() : null);
        }
        if (updates.assignee_user_id !== undefined) {
          setAssigneeUserId(updates.assignee_user_id);
        }
        setUpdatedAt(new Date().toISOString());
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
        router.refresh();
      } catch {
        setSaveStatus("idle");
      }
    },
    [item, onItemUpdated]
  );

  const handleAddNote = async () => {
    if (!item?.id || !newNoteText.trim()) return;
    setSaveStatus("saving");
    try {
      await addPhaseItemNote(item.id, projectId, newNoteText);
      setNewNoteText("");
      const updatedNotes = await getPhaseItemNotes(item.id);
      setNotes(updatedNotes);
      setSaveStatus("saved");
      router.refresh();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  };

  const handleEditNote = (note: PhaseItemNote) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.note_text);
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editNoteText.trim()) return;
    setSaveStatus("saving");
    try {
      await updatePhaseItemNote(editingNoteId, editNoteText);
      setEditingNoteId(null);
      if (item?.id) {
        const updatedNotes = await getPhaseItemNotes(item.id);
        setNotes(updatedNotes);
      }
      setSaveStatus("saved");
      router.refresh();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteText("");
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await deletePhaseItemNote(noteId);
      if (item?.id) {
        const updatedNotes = await getPhaseItemNotes(item.id);
        setNotes(updatedNotes);
      }
      router.refresh();
    } catch {
      // Error handled
    }
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    const member = projectMembers.find((m) => m.user_id === value);
    setAssigneeUserId(value);
    performSave({
      assignee_user_id: value,
      assignee_name: member?.display_name ?? null,
    });
  };

  const handleCompletionChange = () => {
    const next = !isCompleted;
    setIsCompleted(next);
    setCompletedAt(next ? new Date().toISOString() : null);
    performSave({ is_completed: next });
  };

  const handleDeleteItem = async () => {
    if (!item?.id) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;
    try {
      await deletePhaseItem(item.id);
      onClose();
      if (onItemDeleted) onItemDeleted();
      router.refresh();
    } catch {
      alert("Failed to delete item");
    }
  };

  function formatRelativeTime(ts: string): string {
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

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!open) return null;

  const content = (
    <>
      <div
        className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/60 bg-white px-4 py-3 md:px-6 md:py-4"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
      >
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 md:text-lg">
          {item?.title ?? "Item"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-6">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="item-complete"
              checked={isCompleted}
              onChange={handleCompletionChange}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
            />
            <label htmlFor="item-complete" className="text-sm font-medium text-slate-800">
              Mark as complete
            </label>
          </div>

          <div>
            <label htmlFor="item-assignee" className="mb-1.5 block text-xs font-medium text-slate-500">
              Assigned to
            </label>
            <select
              id="item-assignee"
              value={assigneeUserId ?? ""}
              onChange={handleAssigneeChange}
              className="input-base w-full py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-500">
                Notes
              </label>
              {saveStatus !== "idle" && (
                <span
                  className={`text-xs ${
                    saveStatus === "saving" ? "text-slate-500" : "text-emerald-600"
                  }`}
                >
                  {saveStatus === "saving" ? "Saving…" : "Saved"}
                </span>
              )}
            </div>

            {/* Add new note */}
            <div className="space-y-2">
              <textarea
                ref={newNoteRef}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="input-base resize-none text-sm"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
                }}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!newNoteText.trim() || saveStatus === "saving"}
                  className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Notes history */}
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Note History
              </h4>
              {notesLoading ? (
                <p className="text-xs text-slate-500">Loading...</p>
              ) : notes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-slate-200/60 bg-slate-50/50 px-3 py-2.5"
                    >
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            rows={2}
                            className="input-base resize-none text-sm"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={!editNoteText.trim()}
                              className="btn-primary px-2 py-1 text-xs disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="font-medium">{note.author_name}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">
                                {formatRelativeTime(note.created_at)}
                              </span>
                            </div>
                            {note.user_id === currentUserId && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditNote(note)}
                                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {note.note_text}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/60 bg-slate-50/50 px-4 py-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Timestamps
            </h4>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium text-slate-800">{formatTimestamp(createdAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Updated</dt>
                <dd className="font-medium text-slate-800">{formatTimestamp(updatedAt)}</dd>
              </div>
              {completedAt && (
                <div>
                  <dt className="text-slate-500">Completed</dt>
                  <dd className="font-medium text-emerald-700">{formatTimestamp(completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          <button
            type="button"
            onClick={handleDeleteItem}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 hover:border-red-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Item
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 transition-opacity duration-200 md:bg-slate-900/20"
        onClick={onClose}
        aria-hidden
      />
      {/* Mobile: bottom sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border-t border-slate-200/60 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:hidden"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
          animation: "slide-up 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
      {/* Desktop: right drawer */}
      <div
        className="hidden md:flex md:fixed md:right-0 md:top-0 md:bottom-0 md:z-50 md:w-[min(420px,90vw)] md:max-w-[520px] md:flex-col md:border-l md:border-slate-200/60 md:bg-white md:shadow-[-8px_0_30px_rgba(0,0,0,0.08)]"
        style={{ animation: "slide-in-right 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </>
  );
}
