import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[#F3F4F6] px-4 transition-smooth">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Chip & Pickle
      </h1>
      <p className="max-w-md text-center text-base text-slate-500">
        Project dashboard for managing tasks, budget, and contractors.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="btn-primary transition-smooth"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="btn-secondary transition-smooth"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
