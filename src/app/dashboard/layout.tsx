"use client";

import { SidebarProvider } from "@/context/SidebarContext";
import { StrategicPeriodProvider } from "@/context/StrategicPeriodContext";
import { UserProvider } from "@/context/UserContext";
import { OrgUnitProvider } from "@/context/OrgUnitContext";
import { DepartmentSelectionProvider } from "@/context/DepartmentSelectionContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DepartmentSelectionPrompt from "@/components/departments/DepartmentSelectionPrompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DepartmentSelectionProvider>
        <OrgUnitProvider>
          <StrategicPeriodProvider>
            <SidebarProvider>
              <div className="flex h-screen bg-gray-50 overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                  <Topbar />
                  <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {children}
                  </main>
                  {/* Department selection prompt for employees with multiple departments */}
                  <DepartmentSelectionPrompt />
                </div>
              </div>
            </SidebarProvider>
          </StrategicPeriodProvider>
        </OrgUnitProvider>
      </DepartmentSelectionProvider>
    </UserProvider>
  );
}
