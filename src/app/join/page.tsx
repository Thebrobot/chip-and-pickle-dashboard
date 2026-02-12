import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JoinClient } from "./JoinClient";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectPath = `/join${code ? `?code=${code}` : ""}`;
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return <JoinClient codeFromUrl={code ?? null} />;
}
