"use client";

import { joinProject } from "./actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface JoinClientProps {
  codeFromUrl: string | null;
}

export function JoinClient({ codeFromUrl }: JoinClientProps) {
  const [codeInput, setCodeInput] = useState(codeFromUrl ?? "");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoAttempted = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (codeFromUrl?.trim() && !autoAttempted.current) {
      autoAttempted.current = true;
      setCodeInput(codeFromUrl.trim().toUpperCase());
      setJoining(true);
      setError(null);
      joinProject(codeFromUrl.trim().toUpperCase())
        .then(() => {
          router.push("/dashboard");
          router.refresh();
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to join");
        })
        .finally(() => setJoining(false));
    }
  }, [codeFromUrl, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    setError(null);
    try {
      await joinProject(code);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="card px-8 py-10 sm:px-10">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Join project
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter the invite code to join a project
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-slate-700"
              >
                Invite code
              </label>
              <input
                id="code"
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. ABC12XYZ"
                className="input-base font-mono uppercase tracking-wider"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={joining || !codeInput.trim()}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join project"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            <Link
              href="/dashboard"
              className="font-medium text-slate-900 transition-smooth hover:text-slate-700 hover:underline"
            >
              Back to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
