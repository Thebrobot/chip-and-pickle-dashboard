"use client";

import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white px-4 shadow-sm md:hidden">
      <h1 className="flex-1 text-center text-lg font-semibold tracking-tight text-slate-900">
        Chip & Pickle
      </h1>
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <NotificationsDropdown variant="mobile" />
      </div>
    </header>
  );
}
