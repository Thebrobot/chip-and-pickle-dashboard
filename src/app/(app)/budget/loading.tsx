export default function BudgetLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="hidden md:block md:mx-8">
        <div className="h-9 w-28 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-48 rounded bg-slate-100" />
      </div>
      <div className="mx-4 md:mx-8">
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-white/80" />
          <div className="h-14 rounded-xl bg-white/80" />
          <div className="h-14 rounded-xl bg-white/80" />
        </div>
      </div>
    </div>
  );
}
