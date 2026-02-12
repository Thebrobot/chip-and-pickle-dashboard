import { createClient } from "@/lib/supabase/server";
import { getUserProjects } from "@/lib/currentProject";
import { redirect } from "next/navigation";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const projects = await getUserProjects();

  return <ProjectsClient projects={projects} />;
}
