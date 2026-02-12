/** Shared notification types. Separate from notifications.ts to avoid server deps in client. */
export type AppNotification = {
  id: string;
  project_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};
