"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNotificationsAction,
  markReadAction,
  markAllReadAction,
} from "@/app/(app)/notifications/actions";
import type { AppNotification } from "@/lib/notifications.types";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function formatTimestamp(ts: string): string {
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

function truncateBody(body: string | null, maxLen = 60): string {
  if (!body) return "";
  const trimmed = body.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).trim() + "…";
}

interface NotificationsDropdownProps {
  /** Optional placement for mobile vs desktop styling */
  variant?: "mobile" | "desktop";
}

export function NotificationsDropdown({ variant = "desktop" }: NotificationsDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getNotificationsAction()
      .then((data) => {
        if (!cancelled) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.read_at).length);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Initial load for badge count
  useEffect(() => {
    getNotificationsAction().then((data) => {
      setUnreadCount(data.filter((n) => !n.read_at).length);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    const n = notifications.find((x) => x.id === id);
    if (n?.read_at) return;
    setUnreadCount((c) => Math.max(0, c - 1));
    setNotifications((prev) =>
      prev.map((x) => (x.id === id ? { ...x, read_at: new Date().toISOString() } : x))
    );
    await markReadAction(id);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() }))
    );
    setOpen(false);
    await markAllReadAction();
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (n.link) {
      await handleMarkRead(n.id);
      setOpen(false);
      router.push(n.link);
    } else {
      await handleMarkRead(n.id);
    }
  };

  const isMobile = variant === "mobile";

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative flex items-center justify-center rounded-lg p-2 transition-colors ${
          isMobile
            ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0F3D2E] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className={`absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg ${
            isMobile ? "top-full" : "top-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[#0F3D2E] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse space-y-2 rounded-lg bg-slate-50 p-3">
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        !n.read_at ? "bg-[#0F3D2E]/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read_at && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C6A75E]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          {n.body && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {truncateBody(n.body)}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatTimestamp(n.created_at)}
                          </p>
                        </div>
                        {n.link && (
                          <svg
                            className="mt-1.5 h-4 w-4 shrink-0 text-slate-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
