"use client";

import { Suspense, useEffect, useState } from "react";
import { DepartmentSelectionProvider } from "@/context/DepartmentSelectionContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DepartmentSelectionPrompt from "@/components/departments/DepartmentSelectionPrompt";
import ErrorBoundary, {
  SectionErrorBoundary,
} from "@/components/ErrorBoundary";
import { PendingApprovalsProvider } from "@/providers/PendingApprovalsProvider";
import { useUIStore } from "@/stores";
import { useAutoSelectStrategicPeriod } from "@/hooks/objectives/useAutoSelectStrategicPeriod";
import { useObjectiveSetupGuard } from "@/hooks/objectives/useObjectiveSetupGuard";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

// Component to initialize UI state
function UIInitializer() {
  const initializeSidebar = useUIStore((state) => state.initializeSidebar);

  useEffect(() => {
    initializeSidebar();

    const handleResize = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
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

function MobileSidebarDrawer() {
  const isMobile = useIsMobile();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const openSidebar = useUIStore((state) => state.openSidebar);
  const closeSidebar = useUIStore((state) => state.closeSidebar);

  return (
    <Sheet
      open={isMobile && sidebarOpen}
      onOpenChange={(open) => {
        if (!isMobile) return;
        if (open) openSidebar();
        else closeSidebar();
      }}
    >
      <SheetContent
        side="left"
        className="w-72 max-w-[85vw] p-0 gap-0 [&>button]:right-3 [&>button]:top-3"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Suspense fallback={<div className="h-full w-full" />}>
          <Sidebar forceExpanded onLinkClick={closeSidebar} />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
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
        <PendingApprovalsProvider>
          <div className="fixed inset-0 flex overflow-hidden bg-gray-50 dark:bg-[#09090b]">
            {/* Desktop sidebar — hidden on mobile; drawer handles nav there */}
            <SectionErrorBoundary sectionName="sidebar">
              <div className="hidden h-full md:flex">
                <Suspense fallback={<div className="w-16 md:w-72" />}>
                  <Sidebar />
                </Suspense>
              </div>
            </SectionErrorBoundary>

            <MobileSidebarDrawer />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300">
              {/* Topbar with its own error boundary */}
              <SectionErrorBoundary sectionName="navigation">
                <Topbar />
              </SectionErrorBoundary>

              {/* Main content with error boundary */}
              <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>

              {/* Department selection prompt */}
              <DepartmentSelectionPrompt />
            </div>
          </div>
        </PendingApprovalsProvider>
      </DepartmentSelectionProvider>
    </ErrorBoundary>
  );
}
