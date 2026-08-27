"use client";

import { Suspense, useEffect } from "react";
import { DepartmentSelectionProvider } from "@/context/DepartmentSelectionContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DepartmentSelectionPrompt from "@/components/departments/DepartmentSelectionPrompt";
import ErrorBoundary, {
  SectionErrorBoundary,
} from "@/components/ErrorBoundary";
import { useUIStore } from "@/stores";
import { useAutoSelectStrategicPeriod } from "@/hooks/objectives/useAutoSelectStrategicPeriod";
import { useObjectiveSetupGuard } from "@/hooks/objectives/useObjectiveSetupGuard";


// Component to initialize UI state
function UIInitializer() {
  const initializeSidebar = useUIStore((state) => state.initializeSidebar);

  useEffect(() => {
    initializeSidebar();

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      useUIStore.getState()[isMobile ? "closeSidebar" : "openSidebar"]();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initializeSidebar]);

  return null;
}

// Component to auto-select strategic period for non-admin users
function StrategicPeriodInitializer() {
  useAutoSelectStrategicPeriod();
  return null;
}

// Guard: redirect admins to objective setup if no objectives exist yet
function ObjectiveSetupGuard() {
  useObjectiveSetupGuard();
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {/* Initialize UI state */}
      <UIInitializer />
      {/* Auto-select strategic period */}
      <StrategicPeriodInitializer />
      {/* Redirect admins to objective setup if no objectives exist */}
      <ObjectiveSetupGuard />

      <DepartmentSelectionProvider>
        <div className="fixed inset-0 flex overflow-hidden bg-gray-50 dark:bg-[#09090b]">
          {/* Sidebar with its own error boundary */}
          <SectionErrorBoundary sectionName="sidebar">
            <Suspense fallback={<div className="w-16 md:w-72" />}>
              <Sidebar />
            </Suspense>
          </SectionErrorBoundary>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300">
            {/* Topbar with its own error boundary */}
            <SectionErrorBoundary sectionName="navigation">
              <Topbar />
            </SectionErrorBoundary>

            {/* Main content with error boundary */}
            <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>

            {/* Department selection prompt */}
            <DepartmentSelectionPrompt />
          </div>
        </div>
      </DepartmentSelectionProvider>
    </ErrorBoundary>
  );
}
