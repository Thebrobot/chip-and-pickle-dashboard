"use server";

import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications";
import type { AppNotification } from "@/lib/notifications.types";

export async function getNotificationsAction(): Promise<AppNotification[]> {
  return fetchNotifications({ limit: 10 });
}

export async function markReadAction(notificationId: string): Promise<boolean> {
  return markNotificationRead(notificationId);
}

export async function markAllReadAction(): Promise<boolean> {
  return markAllNotificationsRead();
}
