import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboardSummary";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContractorsClient } from "./ContractorsClient";

export const revalidate = 60;

export default async function ContractorsPage({
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
          title="Contractors"
          subtitle="Manage your contractor contacts and assignments"
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

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, name, company, role, email, phone, notes")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const items = (contractors ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    role: c.role,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
  }));

  return (
    <ContractorsClient
      projectId={project.id}
      projectName={project.name}
      contractors={items}
      openModal={open === "new"}
    />
  );
}
