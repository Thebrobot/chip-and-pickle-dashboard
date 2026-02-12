import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboardSummary";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetClient } from "./BudgetClient";

export const revalidate = 60;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const supabase = await createClient();
  const { project } = await getDashboardSummary();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!project) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Budget"
          subtitle="Monitor spending and budget allocation"
        />
        <div className="card p-8 text-center">
          <p className="text-slate-600">No project found.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Create or join a project first.
          </p>
        </div>
      </div>
    );
  }

  const { data: budgetItems } = await supabase
    .from("budget_items")
    .select("id, category, item_name, forecast_amount, actual_amount, vendor, notes, paid, paid_date")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const items = (budgetItems ?? []).map((i) => ({
    id: i.id,
    category: i.category,
    item_name: i.item_name,
    forecast_amount: i.forecast_amount != null ? Number(i.forecast_amount) : null,
    actual_amount: i.actual_amount != null ? Number(i.actual_amount) : null,
    vendor: i.vendor,
    notes: i.notes,
    paid: i.paid ?? false,
    paid_date: i.paid_date,
  }));

  return (
    <BudgetClient
      projectId={project.id}
      projectName={project.name}
      budgetItems={items}
      openModal={open === "new"}
    />
  );
}
