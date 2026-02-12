"use client";

import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

export function AppHeader() {
  return (
    <div className="hidden border-b border-slate-200/60 bg-white px-4 py-2 md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-end">
        <NotificationsDropdown variant="desktop" />
      </div>
    </div>
  );
}
