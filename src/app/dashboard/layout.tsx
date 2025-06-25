"use client";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();

  return (
    <>
      {/* Mobile sidebar - always render for mobile drawer functionality */}
      <div className="md:hidden">
        <Sidebar />
      </div>

      <div
        className={`h-screen grid ${
          open ? "grid-cols-1 md:grid-cols-[16rem_1fr]" : "grid-cols-1"
        }`}
      >
        {/* Desktop sidebar - only show when open on medium+ screens */}
        {open && (
          <div className="hidden md:block h-full overflow-hidden">
            <Sidebar />
          </div>
        )}

        {/* Main content: topbar + page content */}
        <div className="flex flex-col h-full overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto p-6 bg-white dark:bg-[#212123]">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
