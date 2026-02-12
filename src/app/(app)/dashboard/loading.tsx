export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="hidden md:block md:mx-8">
        <div className="h-9 w-48 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
        <div className="mt-4 h-10 w-full max-w-md rounded-lg bg-slate-100" />
      </div>
      <div className="mx-4 md:mx-8">
        <div className="grid grid-cols-4 gap-0 rounded-xl bg-white py-4 px-6 shadow-sm">
          <div className="h-16 w-24 rounded bg-slate-100" />
          <div className="h-16 w-24 rounded bg-slate-100" />
          <div className="h-16 w-24 rounded bg-slate-100" />
          <div className="h-16 w-24 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mx-4 md:mx-8">
        <div className="h-64 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 h-4 w-32 rounded bg-slate-100" />
          <div className="space-y-4">
            <div className="h-12 rounded-lg bg-slate-50" />
            <div className="h-12 rounded-lg bg-slate-50" />
            <div className="h-12 rounded-lg bg-slate-50" />
            <div className="h-12 rounded-lg bg-slate-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
