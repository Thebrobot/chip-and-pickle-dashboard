const BRAND_COLOR = "#0F3D2E";
const ACCENT_COLOR = "#C6A75E";

function wrapHtml(body: string, title: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:${BRAND_COLOR};color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
      <strong style="font-size:18px;">Chip & Pickle</strong>
    </div>
    <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
      ${body}
    </div>
    <p style="margin-top:16px;font-size:12px;color:#6b7280;">
      You received this because you're a member of Chip & Pickle.
    </p>
  </div>
</body>
</html>`;
}

export function taskAssignedEmail(params: {
  taskTitle: string;
  recipientName: string;
  appUrl: string;
}) {
  const { taskTitle, recipientName, appUrl } = params;
  const body = `
    <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px;font-size:16px;color:#374151;">
      You've been assigned to a task:
    </p>
    <p style="margin:0 0 24px;font-size:18px;font-weight:600;color:${BRAND_COLOR};">
      ${taskTitle}
    </p>
    <a href="${appUrl}/tasks" style="display:inline-block;background:${BRAND_COLOR};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      View Tasks
    </a>
  `;
  return wrapHtml(body, `Task assigned: ${taskTitle}`);
}

export function taskDueDigestEmail(params: {
  recipientName: string;
  overdueTasks: { title: string; due_date: string }[];
  dueSoonTasks: { title: string; due_date: string }[];
  appUrl: string;
}) {
  const { recipientName, overdueTasks, dueSoonTasks, appUrl } = params;

  const overdueSection =
    overdueTasks.length > 0
      ? `
    <h3 style="margin:24px 0 12px;font-size:14px;color:#dc2626;font-weight:600;">Overdue</h3>
    <ul style="margin:0;padding:0;list-style:none;">
      ${overdueTasks
        .map(
          (t) =>
            `<li style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
        <strong>${t.title}</strong>
        <span style="color:#6b7280;font-size:14px;"> — Due ${new Date(t.due_date).toLocaleDateString()}</span>
      </li>`
        )
        .join("")}
    </ul>`
      : "";

  const dueSoonSection =
    dueSoonTasks.length > 0
      ? `
    <h3 style="margin:24px 0 12px;font-size:14px;color:${ACCENT_COLOR};font-weight:600;">Due soon (next 48 hours)</h3>
    <ul style="margin:0;padding:0;list-style:none;">
      ${dueSoonTasks
        .map(
          (t) =>
            `<li style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
        <strong>${t.title}</strong>
        <span style="color:#6b7280;font-size:14px;"> — Due ${new Date(t.due_date).toLocaleDateString()}</span>
      </li>`
        )
        .join("")}
    </ul>`
      : "";

  const body = `
    <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px;font-size:16px;color:#374151;">
      Here's your daily task digest:
    </p>
    ${overdueSection}
    ${dueSoonSection}
    <a href="${appUrl}/tasks" style="display:inline-block;margin-top:24px;background:${BRAND_COLOR};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      View Tasks
    </a>
  `;
  return wrapHtml(body, "Your task digest");
}
