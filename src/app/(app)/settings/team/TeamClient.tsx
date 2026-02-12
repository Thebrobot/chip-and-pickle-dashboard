"use client";

import { generateInvite, removeMember, updateMemberRole, updateMemberName } from "./actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";

interface TeamMember {
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  email: string;
  role: string;
}

interface TeamClientProps {
  projectId: string;
  projectName: string;
  members: TeamMember[];
  currentUserId: string;
  isOwner: boolean;
}

export function TeamClient({
  projectId,
  projectName,
  members,
  currentUserId,
  isOwner,
}: TeamClientProps) {
  const [generating, setGenerating] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; name: string } | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<{ userId: string; member: TeamMember; isCurrentUser: boolean } | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const code = await generateInvite(projectId);
      if (typeof window !== "undefined") {
        const link = `${window.location.origin}/join?code=${code}`;
        setInviteLink(link);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  async function handleRemoveMember() {
    if (!confirmRemove) return;
    setRemovingId(confirmRemove.userId);
    setError(null);
    try {
      await removeMember(projectId, confirmRemove.userId);
      setConfirmRemove(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleChangeRole(userId: string, newRole: "owner" | "member") {
    setChangingRoleId(userId);
    setError(null);
    try {
      await updateMemberRole(projectId, userId, newRole);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setChangingRoleId(null);
    }
  }

  function handleEditMember(member: TeamMember, isCurrentUser: boolean) {
    setEditingMember({ userId: member.user_id, member, isCurrentUser });
    setEditFirstName(member.first_name);
    setEditLastName(member.last_name);
    setEditPhone(member.phone);
    setEditEmail(member.email);
    setEditPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleSaveEdit() {
    if (!editingMember) return;
    setSavingEdit(true);
    setError(null);

    try {
      // Validate inputs
      if (!editFirstName.trim()) {
        setError("First name is required");
        setSavingEdit(false);
        return;
      }

      if (editingMember.isCurrentUser && editPassword) {
        // For current user, allow password change
        if (editPassword.length < 6) {
          setError("Password must be at least 6 characters");
          setSavingEdit(false);
          return;
        }
        if (editPassword !== confirmPassword) {
          setError("Passwords do not match");
          setSavingEdit(false);
          return;
        }

        // Update password via client-side Supabase
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: pwdError } = await supabase.auth.updateUser({
          password: editPassword,
        });
        if (pwdError) throw pwdError;
      }

      // Update profile
      await updateMemberName(editingMember.userId, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone.trim(),
      });
      
      setEditingMember(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Team
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage project members for {projectName}
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">
            Members ({members.length})
          </h2>
          {isOwner && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary shrink-0 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Add Member"}
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Invite Link Display */}
        {inviteLink && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-2 text-sm font-medium text-emerald-900">
              Invite link generated! Share this with your team member:
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {inviteLink}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-emerald-700">
              Link expires in 7 days and is single-use
            </p>
          </div>
        )}

        <div className="card overflow-hidden">
          {members.length === 1 && isOwner && (
            <div className="border-b border-slate-200/60 bg-slate-50/50 px-6 py-4">
              <p className="text-sm text-slate-600">
                👋 You're the only member. Click <span className="font-medium text-slate-900">"Add Member"</span> above to invite your team.
              </p>
            </div>
          )}
          <ul className="divide-y divide-slate-200/60">
            {members.map((m) => {
              const isCurrentUser = m.user_id === currentUserId;
              return (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{m.display_name}</p>
                    <p className="text-sm text-slate-500">
                      {m.role === "owner" ? "Owner" : "Member"}
                      {isCurrentUser && " (you)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Edit button for everyone */}
                    <button
                      onClick={() => handleEditMember(m, isCurrentUser)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      Edit
                    </button>
                    
                    {/* Role/Remove buttons only for others if owner */}
                    {isOwner && !isCurrentUser && (
                      <>
                        {m.role === "member" ? (
                          <button
                            onClick={() => handleChangeRole(m.user_id, "owner")}
                            disabled={changingRoleId === m.user_id}
                            className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            {changingRoleId === m.user_id ? "Changing..." : "Make Owner"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleChangeRole(m.user_id, "member")}
                            disabled={changingRoleId === m.user_id}
                            className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            {changingRoleId === m.user_id ? "Changing..." : "Make Member"}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmRemove({ userId: m.user_id, name: m.display_name })}
                          disabled={removingId === m.user_id}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Edit Member Modal */}
      <Modal
        open={editingMember !== null}
        onClose={() => setEditingMember(null)}
        title={editingMember?.isCurrentUser ? "Edit Your Profile" : `Edit ${editingMember?.member.display_name}`}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="editFirstName"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              First Name
            </label>
            <input
              id="editFirstName"
              type="text"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              required
              placeholder="First name"
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="editLastName"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Last Name
            </label>
            <input
              id="editLastName"
              type="text"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              placeholder="Last name"
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="editPhone"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Phone Number
            </label>
            <input
              id="editPhone"
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="editEmail"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="editEmail"
              type="email"
              value={editEmail}
              disabled
              className="input-base bg-slate-50 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-slate-500">
              Email cannot be changed
            </p>
          </div>

          {editingMember?.isCurrentUser && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Change Password (optional)
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="editPassword"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      New Password
                    </label>
                    <input
                      id="editPassword"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      minLength={6}
                      placeholder="Leave blank to keep current"
                      className="input-base"
                    />
                  </div>

                  {editPassword && (
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        placeholder="Re-enter new password"
                        className="input-base"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingMember(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingEdit}
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        title="Remove Member"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to remove <span className="font-medium text-slate-900">{confirmRemove?.name}</span> from this project? They will lose access to all project data.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmRemove(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRemoveMember}
              disabled={removingId !== null}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {removingId ? "Removing..." : "Remove Member"}
            </button>
          </div>
        </div>
      </Modal>

      {isOwner && (
        <section>
          <h2 className="mb-4 text-lg font-medium text-slate-900">
            Invite
          </h2>
          <div className="card p-6">
            <p className="mb-4 text-sm text-slate-600">
              Generate an invite link to share with your partner. They must be
              logged in to join. Links expire in 7 days and are single-use.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary shrink-0 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Invite"}
              </button>
              {inviteLink && (
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <code className="min-w-0 truncate text-sm text-slate-700">
                    {inviteLink}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-medium text-slate-900">
          Join a project
        </h2>
        <div className="card p-6">
          <p className="mb-4 text-sm text-slate-600">
            Have an invite link? Open it while logged in, or go to{" "}
            <a href="/join" className="font-medium text-slate-900 underline hover:text-slate-700">
              /join
            </a>{" "}
            and enter the code.
          </p>
        </div>
      </section>
    </div>
  );
}
