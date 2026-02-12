"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { createContractor } from "./actions";

const ROLES = [
  "GC",
  "Architect",
  "Electrician",
  "Plumber",
  "HVAC",
  "Carpenter",
  "Painter",
  "Landscaper",
  "Other",
];

interface Contractor {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

interface ContractorsClientProps {
  projectId: string;
  projectName: string;
  contractors: Contractor[];
  openModal?: boolean;
}

function searchMatches(query: string, item: Contractor): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  const name = (item.name ?? "").toLowerCase();
  const company = (item.company ?? "").toLowerCase();
  const role = (item.role ?? "").toLowerCase();
  return name.includes(q) || company.includes(q) || role.includes(q);
}

export function ContractorsClient({
  projectId,
  projectName,
  contractors,
  openModal = false,
}: ContractorsClientProps) {
  const [modalOpen, setModalOpen] = useState(openModal);

  useEffect(() => {
    if (openModal) setModalOpen(true);
  }, [openModal]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filteredContractors = useMemo(
    () => contractors.filter((c) => searchMatches(search, c)),
    [contractors, search]
  );

  function resetForm() {
    setName("");
    setCompany("");
    setRole(ROLES[0]);
    setEmail("");
    setPhone("");
    setNotes("");
    setError(null);
  }

  function handleCloseModal() {
    setModalOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createContractor(projectId, {
        name: name.trim(),
        company: company.trim() || null,
        role: role.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
      handleCloseModal();
      router.refresh();
    } catch (err) {
      console.error("Create contractor error:", err);
      // Parse Supabase error
      if (err && typeof err === 'object' && 'message' in err) {
        setError(String((err as any).message));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create contractor");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contractors"
        subtitle={`Manage contacts for ${projectName}`}
        action={<Button onClick={() => setModalOpen(true)}>New Contractor</Button>}
      />

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="New Contractor"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}
          <div>
            <label
              htmlFor="contractor-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Name
            </label>
            <input
              id="contractor-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Smith"
              className="input-base"
            />
          </div>
          <div>
            <label
              htmlFor="contractor-company"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Company
            </label>
            <input
              id="contractor-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Optional"
              className="input-base"
            />
          </div>
          <div>
            <label
              htmlFor="contractor-role"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Role
            </label>
            <select
              id="contractor-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-base"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="contractor-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="contractor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional"
                className="input-base"
              />
            </div>
            <div>
              <label
                htmlFor="contractor-phone"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Phone
              </label>
              <input
                id="contractor-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="contractor-notes"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Notes
            </label>
            <textarea
              id="contractor-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              rows={2}
              className="input-base resize-none"
            />
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
              {submitting ? "Adding..." : "Add contractor"}
            </Button>
          </div>
        </form>
      </Modal>

      <section>
        {contractors.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-8 py-16 text-center">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              No contractors yet
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
              Add your first contractor to build your contact directory.
            </p>
            <Button onClick={() => setModalOpen(true)} className="mt-6">
              New Contractor
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, or role..."
                className="input-base max-w-md"
                aria-label="Search contractors"
              />
            </div>

            {/* Card Layout for All Screen Sizes */}
            {filteredContractors.length === 0 ? (
              <div className="card px-6 py-12 text-center">
                <p className="text-sm text-slate-500">
                  {search ? `No contractors match "${search}"` : "No contractors"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredContractors.map((c) => (
                  <div key={c.id} className="card overflow-hidden">
                    <div className="bg-gradient-to-br from-[#0F3D2E] to-[#0d3528] px-5 py-4">
                      <h3 className="text-lg font-semibold text-white">{c.name}</h3>
                      {c.company && (
                        <p className="mt-0.5 text-sm text-white/80">{c.company}</p>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      {c.role && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Role:</span>
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {c.role}
                          </span>
                        </div>
                      )}
                      
                      {(c.email || c.phone) && (
                        <div className="space-y-2">
                          {c.email && (
                            <div className="flex items-start gap-2">
                              <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <a
                                href={`mailto:${c.email}`}
                                className="text-sm text-slate-700 hover:text-[#0F3D2E] hover:underline"
                              >
                                {c.email}
                              </a>
                            </div>
                          )}
                          {c.phone && (
                            <div className="flex items-start gap-2">
                              <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <a
                                href={`tel:${c.phone}`}
                                className="text-sm text-slate-700 hover:text-[#0F3D2E] hover:underline"
                              >
                                {c.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {c.notes && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Notes</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{c.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
