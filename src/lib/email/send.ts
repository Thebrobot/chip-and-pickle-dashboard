import { Resend } from "resend";
import { taskAssignedEmail, taskDueDigestEmail } from "./templates";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const fromEmail = process.env.FROM_EMAIL ?? "Chip & Pickle <notifications@resend.dev>";

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function sendTaskAssignedEmail(
  to: string,
  recipientName: string,
  taskTitle: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping task assigned email");
    return false;
  }

  const { error } = await getResend().emails.send({
    from: fromEmail,
    to: [to],
    subject: `Task assigned: ${taskTitle}`,
    html: taskAssignedEmail({
      taskTitle,
      recipientName: recipientName || "there",
      appUrl: getAppUrl(),
    }),
  });

  if (error) {
    console.error("sendTaskAssignedEmail error:", error);
    return false;
  }
  return true;
}

export async function sendTaskDueDigestEmail(
  to: string,
  recipientName: string,
  overdueTasks: { title: string; due_date: string }[],
  dueSoonTasks: { title: string; due_date: string }[]
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping digest email");
    return false;
  }

  if (overdueTasks.length === 0 && dueSoonTasks.length === 0) {
    return true;
  }

  const { error } = await getResend().emails.send({
    from: fromEmail,
    to: [to],
    subject: `Task digest: ${overdueTasks.length} overdue, ${dueSoonTasks.length} due soon`,
    html: taskDueDigestEmail({
      recipientName: recipientName || "there",
      overdueTasks,
      dueSoonTasks,
      appUrl: getAppUrl(),
    }),
  });

  if (error) {
    console.error("sendTaskDueDigestEmail error:", error);
    return false;
  }
  return true;
}
