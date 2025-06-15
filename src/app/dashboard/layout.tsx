import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { SidebarProvider } from "@/context/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-[#F8F9FB] dark:bg-[#212123]">
        {/* Sidebar */}
        <Sidebar />
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <Topbar />
        {/* Page content */}
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
