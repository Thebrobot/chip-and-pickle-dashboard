"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import type { UserProject } from "@/lib/currentProject";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EmptyState({ onNewProject }: { onNewProject: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center sm:px-8 sm:py-16">
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
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium text-slate-900">No projects yet</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
        Create your first project to start tracking tasks, budget, and
        contractors.
      </p>
      <Button
        onClick={onNewProject}
        className="mt-6 min-h-[44px] w-full max-w-xs px-5 py-3 sm:min-h-0 sm:w-auto sm:py-2.5"
      >
        New Project
      </Button>
    </div>
  );
}

interface ProjectsClientProps {
  projects: UserProject[];
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasProjects = projects.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        subtitle="Manage your construction and renovation projects"
        action={
          <Button
            onClick={() => setModalOpen(true)}
            className="min-h-[44px] w-full px-5 py-3 sm:min-h-0 sm:w-auto sm:py-2.5"
          >
            New Project
          </Button>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Project"
      >
        <p className="text-sm text-slate-600">
          Add project form coming soon. This modal confirms the pattern works.
        </p>
      </Modal>

      <section>
        {hasProjects ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href="/dashboard"
                className="card transition-smooth block p-5 hover:shadow-md sm:p-6"
              >
                <h3 className="min-w-0 flex-1 text-base font-medium text-slate-900 sm:text-lg">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {project.description}
                  </p>
                )}
                <p className="mt-3 text-sm text-slate-500">
                  Created {formatDate(project.created_at)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState onNewProject={() => setModalOpen(true)} />
        )}
      </section>
    </div>
  );
}
