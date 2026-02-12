import { getDashboardSummary } from "@/lib/dashboardSummary";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const summary = await getDashboardSummary();

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden shrink-0 md:block">
        <Sidebar summary={summary} />
      </div>
      {/* Content area */}
      <div className="min-w-0 flex-1 flex flex-col">
        <MobileHeader />
        <main className="min-w-0 flex-1 overflow-auto pb-24 md:pb-0">
          <div className="mx-auto max-w-7xl px-4 pt-4 pb-10 md:py-10 md:px-8">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
