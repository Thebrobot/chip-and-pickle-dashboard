import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTaskDueDigestEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, due_date, assignee_user_id, project_id")
    .neq("status", "done")
    .not("assignee_user_id", "is", null)
    .not("due_date", "is", null);

  if (tasksError) {
    console.error("Cron due-soon: fetch tasks error", tasksError);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }

  const assigneeIds = [...new Set((tasks ?? []).map((t) => t.assignee_user_id).filter(Boolean))] as string[];

  if (assigneeIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, email")
    .in("user_id", assigneeIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      { email: p.email ?? null, full_name: p.full_name ?? "there" },
    ])
  );

  const authEmailMap = new Map<string, string>();
  for (const userId of assigneeIds) {
    const profile = profileMap.get(userId);
    if (profile?.email) continue;
    const { data } = await supabase.auth.admin.getUserById(userId);
    if (data?.user?.email) authEmailMap.set(userId, data.user.email);
  }

  const getEmail = (userId: string): string | null => {
    const profile = profileMap.get(userId);
    if (profile?.email) return profile.email;
    return authEmailMap.get(userId) ?? null;
  };

  let sent = 0;

  for (const userId of assigneeIds) {
    const userTasks = (tasks ?? []).filter((t) => t.assignee_user_id === userId);
    const overdue = userTasks.filter((t) => t.due_date && new Date(t.due_date) < now);
    const dueSoon = userTasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) >= now &&
        new Date(t.due_date) <= in48h
    );

    if (overdue.length === 0 && dueSoon.length === 0) continue;

    const email = getEmail(userId);
    if (!email) continue;

    const profile = profileMap.get(userId);
    const name = profile?.full_name ?? "there";

    const overdueList = overdue
      .map((t) => ({ title: t.title, due_date: t.due_date! }))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    const dueSoonList = dueSoon
      .map((t) => ({ title: t.title, due_date: t.due_date! }))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    const ok = await sendTaskDueDigestEmail(email, name, overdueList, dueSoonList);
    if (ok) {
      sent++;
      const projectId = userTasks[0]?.project_id;
      if (projectId) {
        await supabase.from("activity_events").insert({
          project_id: projectId,
          actor_user_id: userId,
          type: "reminder_sent",
          summary: `Sent task digest: ${overdue.length} overdue, ${dueSoon.length} due soon`,
          metadata: {
            overdue_count: overdue.length,
            due_soon_count: dueSoon.length,
            recipient_user_id: userId,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
