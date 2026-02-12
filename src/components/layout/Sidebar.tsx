"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/master-plan", label: "Roadmap", icon: MasterPlanIcon },
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/budget", label: "Budget", icon: BudgetIcon },
  { href: "/contractors", label: "Contractors", icon: ContractorsIcon },
];

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function MasterPlanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ProjectsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function TasksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function BudgetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ContractorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function NavIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export function Sidebar({ summary }: { summary: DashboardSummary }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  async function handleLogout() {
    setMobileOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5 lg:justify-normal">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <span className="text-sm font-bold text-[#E5E7EB]">C</span>
          </div>
          <span className="font-semibold tracking-tight text-[#E5E7EB]">
            Chip & Pickle
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-[#E5E7EB]/80 transition-colors duration-200 hover:bg-white/10 hover:text-[#E5E7EB] md:hidden"
          aria-label="Close menu"
        >
          <NavIcon open />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        {/* Core section - no label */}
        <div className="space-y-1">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors duration-200 ${
              pathname === "/dashboard"
                ? "border-l-[#C6A75E] bg-white/[0.08] font-semibold text-[#E5E7EB]"
                : "border-l-transparent font-medium text-[#E5E7EB]/80 hover:bg-white/[0.05] hover:text-[#E5E7EB]"
            }`}
          >
            <DashboardIcon className="h-5 w-5 shrink-0" />
            Dashboard
          </Link>
          <Link
            href="/master-plan"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors duration-200 ${
              pathname === "/master-plan"
                ? "border-l-[#C6A75E] bg-white/[0.08] font-semibold text-[#E5E7EB]"
                : "border-l-transparent font-medium text-[#E5E7EB]/80 hover:bg-white/[0.05] hover:text-[#E5E7EB]"
            }`}
          >
            <MasterPlanIcon className="h-5 w-5 shrink-0" />
            Roadmap
          </Link>
        </div>

        {/* Execution section */}
        <p className="mb-2 mt-6 px-3 text-xs uppercase tracking-wider text-slate-400">
          Execution
        </p>
        <div className="space-y-1">
          <Link
            href="/tasks"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors duration-200 ${
              pathname === "/tasks"
                ? "border-l-[#C6A75E] bg-white/[0.08] font-semibold text-[#E5E7EB]"
                : "border-l-transparent font-medium text-[#E5E7EB]/80 hover:bg-white/[0.05] hover:text-[#E5E7EB]"
            }`}
          >
            <TasksIcon className="h-5 w-5 shrink-0" />
            Tasks
          </Link>
          <Link
            href="/contractors"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors duration-200 ${
              pathname === "/contractors"
                ? "border-l-[#C6A75E] bg-white/[0.08] font-semibold text-[#E5E7EB]"
                : "border-l-transparent font-medium text-[#E5E7EB]/80 hover:bg-white/[0.05] hover:text-[#E5E7EB]"
            }`}
          >
            <ContractorsIcon className="h-5 w-5 shrink-0" />
            Contractors
          </Link>
        </div>

        {/* Financial section */}
        <p className="mb-2 mt-6 px-3 text-xs uppercase tracking-wider text-slate-400">
          Financial
        </p>
        <div className="space-y-1">
          <Link
            href="/budget"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors duration-200 ${
              pathname === "/budget"
                ? "border-l-[#C6A75E] bg-white/[0.08] font-semibold text-[#E5E7EB]"
                : "border-l-transparent font-medium text-[#E5E7EB]/80 hover:bg-white/[0.05] hover:text-[#E5E7EB]"
            }`}
          >
            <BudgetIcon className="h-5 w-5 shrink-0" />
            Budget
          </Link>
        </div>

        {/* System section */}
        <p className="mb-2 mt-6 px-3 text-xs uppercase tracking-wider text-slate-400">
          System
        </p>
        <div className="space-y-1">
          <Link
            href="/projects"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors duration-200 ${
              pathname === "/projects"
                ? "border-l-[#C6A75E] bg-white/[0.08] font-semibold text-[#E5E7EB]"
                : "border-l-transparent font-medium text-[#E5E7EB]/80 hover:bg-white/[0.05] hover:text-[#E5E7EB]"
            }`}
          >
            <ProjectsIcon className="h-5 w-5 shrink-0" />
            Projects
          </Link>
          <Link
            href="/settings/team"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors duration-200 ${
              pathname === "/settings/team"
                ? "border-l-[#C6A75E] bg-white/[0.08] font-semibold text-[#E5E7EB]"
                : "border-l-transparent font-medium text-[#E5E7EB]/80 hover:bg-white/[0.05] hover:text-[#E5E7EB]"
            }`}
          >
            <SettingsIcon className="h-5 w-5 shrink-0" />
            Team
          </Link>
        </div>
      </nav>

      {/* Log out */}
      <div className="shrink-0 border-t border-white/10 px-4 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#E5E7EB]/80 transition-colors duration-200 hover:bg-white/[0.05] hover:text-[#E5E7EB]"
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center border-b border-slate-200/60 bg-white px-4 shadow-sm md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Open menu"
        >
          <NavIcon open={false} />
        </button>
      </header>

      {/* Mobile overlay - tap outside to close */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar - overlay drawer on mobile, fixed on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0F3D2E] to-[#0C3226] shadow-xl transition-transform duration-200 ease-out md:static md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
