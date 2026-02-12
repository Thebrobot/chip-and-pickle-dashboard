"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ActionSheet } from "@/components/ui/ActionSheet";

const tabs = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/master-plan", label: "Roadmap", icon: MasterPlanIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/contractors", label: "Contractors", icon: ContractorsIcon },
];

const moreItems = [
  { href: "/budget", label: "Budget", icon: BudgetIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
  { href: "/settings/team", label: "Team", icon: SettingsIcon },
];

const fabActions = [
  { label: "New Task", href: "/tasks?open=new" },
  { label: "Add Contractor", href: "/contractors?open=new" },
  { label: "Add Budget Item", href: "/budget?open=new" },
];

function HomeIcon({ className }: { className?: string }) {
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

function ContractorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [fabOpen, setFabOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* FAB action sheet */}
      <ActionSheet open={fabOpen} onClose={() => setFabOpen(false)}>
        <div className="space-y-1">
          {fabActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setFabOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-slate-700 transition-colors active:bg-slate-50 hover:bg-slate-50 hover:text-[#0F3D2E]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </ActionSheet>

      {/* More sheet */}
      <ActionSheet open={moreOpen} onClose={() => setMoreOpen(false)}>
        <div className="space-y-1">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-slate-700 transition-colors active:bg-slate-50 hover:bg-slate-50 hover:text-[#0F3D2E]"
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </ActionSheet>

      {/* Floating FAB - above nav bar, right side */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setFabOpen(!fabOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F3D2E] text-white shadow-lg ring-2 ring-[#C6A75E]/40 transition-transform active:scale-95"
          aria-label="Add new"
          style={{ marginBottom: "max(0rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <PlusIcon className="h-7 w-7" />
        </button>
      </div>

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around gap-1 rounded-t-2xl border-t border-slate-200/60 bg-white px-2 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 transition-colors ${
                isActive ? "text-[#0F3D2E]" : "text-slate-400"
              }`}
            >
              <Icon className={`h-6 w-6 shrink-0 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-1 flex-col items-center gap-0.5 transition-colors ${
            moreItems.some((item) => pathname === item.href || pathname.startsWith(item.href))
              ? "text-[#0F3D2E]"
              : "text-slate-400"
          }`}
        >
          <MoreIcon className="h-6 w-6 shrink-0" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
