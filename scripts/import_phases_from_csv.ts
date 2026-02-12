/**
 * Import phase/section/item checklist from CSV into Supabase.
 *
 * Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, USER_EMAIL
 * Usage: npm run import:phases [path/to/file.csv]
 */
// @ts-nocheck - script uses Supabase client without generated types
import { config } from "dotenv";

config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

const DEFAULT_CSV_PATH = "./CandPphases  - Sheet1.csv";
const PROJECT_NAME = "Chip & Pickle Dashboard";

function isTruthy(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "x" || s === "✓" || s === "✔" || s.length > 0;
}

interface CsvRow {
  Completed: string;
  Phase: string;
  Section: string;
  Item: string;
}

function main() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userEmail = process.env.USER_EMAIL;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing env vars. Add to .env.local:\n" +
        "  SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)\n" +
        "  USER_EMAIL (your registered user email)\n" +
        "SUPABASE_URL is optional if NEXT_PUBLIC_SUPABASE_URL is set."
    );
    process.exit(1);
  }
  if (!userEmail) {
    console.error("Missing USER_EMAIL. Set to the email of the user to import data for.");
    process.exit(1);
  }

  const csvPath = process.argv[2] ?? DEFAULT_CSV_PATH;
  const resolvedPath = path.resolve(process.cwd(), csvPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`CSV file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(resolvedPath, "utf-8");
  let rows: CsvRow[];

  try {
    rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err) {
    console.error("Failed to parse CSV:", err);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  run(supabase, userEmail, rows).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

async function run(
  supabase: ReturnType<typeof createClient>,
  userEmail: string,
  rows: CsvRow[]
) {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email === userEmail);
  if (!user?.id) {
    throw new Error(`User not found with email: ${userEmail}`);
  }
  const userId = user.id;
  console.log(`Importing for user: ${userEmail} (${userId})`);

  let projectId: string;
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("name", PROJECT_NAME)
    .single();

  if (existing?.id) {
    projectId = existing.id;
    console.log(`Using existing project: ${PROJECT_NAME}`);
  } else {
    const { data: inserted, error } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: PROJECT_NAME })
      .select("id")
      .single();
    if (error) throw error;
    projectId = inserted!.id;
    console.log(`Created project: ${PROJECT_NAME}`);
  }

  // Ensure user is in project_members (in case trigger didn't run)
  const { error: upsertError } = await supabase.from("project_members").upsert(
    { project_id: projectId, user_id: userId, role: "owner" },
    { onConflict: "project_id,user_id" }
  );
  if (upsertError) {
    console.error("project_members upsert failed:", upsertError);
    throw upsertError;
  }
  console.log("Ensured user is project owner in project_members");

  const phaseMap = new Map<string, string>();
  const sectionMap = new Map<string, string>();
  const sectionOrderByPhase = new Map<string, number>();
  const itemOrderBySection = new Map<string, number>();

  const { data: existingPhases } = await supabase
    .from("phases")
    .select("id, title, phase_order")
    .eq("project_id", projectId)
    .order("phase_order", { ascending: true });
  for (const p of existingPhases ?? []) {
    phaseMap.set(p.title, p.id);
  }
  let nextPhaseOrder = existingPhases?.length ?? 0;

  const { data: existingSections } = await supabase
    .from("phase_sections")
    .select("id, phase_id, title, section_order")
    .eq("project_id", projectId);
  const phaseTitleById = new Map<string, string>();
  for (const p of existingPhases ?? []) phaseTitleById.set(p.id, p.title);
  for (const pt of phaseTitleById.values()) {
    if (!sectionOrderByPhase.has(pt)) sectionOrderByPhase.set(pt, 0);
  }
  for (const s of existingSections ?? []) {
    const pt = phaseTitleById.get(s.phase_id) ?? "";
    sectionMap.set(`${pt}::${s.title}`, s.id);
    const next = Math.max((sectionOrderByPhase.get(pt) ?? 0), s.section_order + 1);
    sectionOrderByPhase.set(pt, next);
  }

  const { data: existingItems } = await supabase
    .from("phase_items")
    .select("section_id, title, item_order")
    .eq("project_id", projectId);
  const sectionIdToKey = new Map<string, string>();
  for (const [k, id] of sectionMap) sectionIdToKey.set(id, k);
  for (const it of existingItems ?? []) {
    const sk = sectionIdToKey.get(it.section_id);
    if (sk) {
      const next = Math.max((itemOrderBySection.get(sk) ?? 0), it.item_order + 1);
      itemOrderBySection.set(sk, next);
    }
  }
  for (const sk of sectionMap.keys()) {
    if (!itemOrderBySection.has(sk)) itemOrderBySection.set(sk, 0);
  }

  for (const row of rows) {
    const phaseTitle = (row.Phase ?? "").trim();
    const sectionTitle = (row.Section ?? "").trim();
    const itemTitle = (row.Item ?? "").trim();
    if (!phaseTitle || !sectionTitle || !itemTitle) continue;

    const phaseKey = phaseTitle;
    const sectionKey = `${phaseTitle}::${sectionTitle}`;

    let phaseId: string;
    if (phaseMap.has(phaseKey)) {
      phaseId = phaseMap.get(phaseKey)!;
    } else {
      const { data: p, error } = await supabase
        .from("phases")
        .insert({ user_id: userId, project_id: projectId, phase_order: nextPhaseOrder, title: phaseTitle })
        .select("id")
        .single();
      if (error) throw error;
      phaseId = p!.id;
      phaseMap.set(phaseKey, phaseId);
      sectionOrderByPhase.set(phaseKey, 0);
      nextPhaseOrder++;
    }

    let sectionId: string;
    if (sectionMap.has(sectionKey)) {
      sectionId = sectionMap.get(sectionKey)!;
    } else {
      const so = sectionOrderByPhase.get(phaseKey)!;
      const { data: s, error } = await supabase
        .from("phase_sections")
        .insert({ user_id: userId, project_id: projectId, phase_id: phaseId, section_order: so, title: sectionTitle })
        .select("id")
        .single();
      if (error) throw error;
      sectionId = s!.id;
      sectionMap.set(sectionKey, sectionId);
      sectionOrderByPhase.set(phaseKey, so + 1);
      itemOrderBySection.set(sectionKey, 0);
    }

    const completed = isTruthy(row.Completed);

    const { data: existingItem } = await supabase
      .from("phase_items")
      .select("id, is_completed")
      .eq("section_id", sectionId)
      .eq("title", itemTitle)
      .maybeSingle();

    if (existingItem) {
      if (existingItem.is_completed !== completed) {
        await supabase
          .from("phase_items")
          .update({
            is_completed: completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq("id", existingItem.id);
      }
      continue;
    }

    const io = itemOrderBySection.get(sectionKey)!;
    const { error } = await supabase.from("phase_items").insert({
      user_id: userId,
      project_id: projectId,
      phase_id: phaseId,
      section_id: sectionId,
      item_order: io,
      title: itemTitle,
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
    if (error) throw error;
    itemOrderBySection.set(sectionKey, io + 1);
  }

  console.log(`Imported ${rows.length} rows. Phases: ${phaseMap.size}, Sections: ${sectionMap.size}`);
}

main();
