"use client";

import { useEffect } from "react";

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function ActionSheet({ open, onClose, title, children }: ActionSheetProps) {
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/20 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-200 rounded-t-2xl border-t border-slate-200/60 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-12 rounded-full bg-slate-200" />
        </div>
        {title && (
          <h3 className="px-4 pb-3 text-sm font-semibold text-slate-500">
            {title}
          </h3>
        )}
        <div className="px-2 pb-4">{children}</div>
      </div>
    </>
  );
}
