"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/currentProject";

export type SearchResult =
  | { type: "task"; id: string; title: string; href: string }
  | { type: "contractor"; id: string; title: string; subtitle?: string; href: string }
  | { type: "phase"; id: string; title: string; href: string }
  | { type: "phase_item"; id: string; title: string; phaseId: string; href: string }
  | { type: "budget_item"; id: string; title: string; subtitle?: string; href: string };

export async function searchGlobal(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const project = await getCurrentProject();
  if (!project) return [];

  // For .or() the value cannot contain commas (filter separator). Use space instead.
  const safeQ = `%${trimmed.replace(/[,"]/g, (c) => (c === "," ? " " : ""))}%`;
  const results: SearchResult[] = [];

  const [tasksRes, contractorsRes, phasesRes, itemsRes, budgetRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title")
      .eq("project_id", project.id)
      .or(`title.ilike.${safeQ},description.ilike.${safeQ}`)
      .limit(5),

    supabase
      .from("contractors")
      .select("id, name, company, role")
      .eq("project_id", project.id)
      .or(`name.ilike.${safeQ},company.ilike.${safeQ},role.ilike.${safeQ}`)
      .limit(5),

    supabase
      .from("phases")
      .select("id, title")
      .eq("project_id", project.id)
      .ilike("title", `%${trimmed}%`)
      .limit(5),

    supabase
      .from("phase_items")
      .select("id, title, phase_id")
      .eq("project_id", project.id)
      .or(`title.ilike.${safeQ},notes.ilike.${safeQ}`)
      .limit(5),

    supabase
      .from("budget_items")
      .select("id, item_name, category, vendor")
      .eq("project_id", project.id)
      .or(`item_name.ilike.${safeQ},category.ilike.${safeQ},vendor.ilike.${safeQ},notes.ilike.${safeQ}`)
      .limit(5),
  ]);

  for (const t of tasksRes.data ?? []) {
    results.push({ type: "task", id: t.id, title: t.title, href: "/tasks" });
  }
  for (const c of contractorsRes.data ?? []) {
    results.push({
      type: "contractor",
      id: c.id,
      title: c.name ?? "Contractor",
      subtitle: [c.company, c.role].filter(Boolean).join(" · ") || undefined,
      href: "/contractors",
    });
  }
  for (const p of phasesRes.data ?? []) {
    results.push({
      type: "phase",
      id: p.id,
      title: p.title,
      href: `/master-plan?phase=${p.id}`,
    });
  }
  for (const i of itemsRes.data ?? []) {
    results.push({
      type: "phase_item",
      id: i.id,
      title: i.title,
      phaseId: i.phase_id,
      href: `/master-plan?phase=${i.phase_id}`,
    });
  }
  for (const b of budgetRes.data ?? []) {
    results.push({
      type: "budget_item",
      id: b.id,
      title: b.item_name ?? "Budget item",
      subtitle: [b.category, b.vendor].filter(Boolean).join(" · ") || undefined,
      href: "/budget",
    });
  }

  return results;
}
