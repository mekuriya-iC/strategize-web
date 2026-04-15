"use client";

import { useEffect } from "react";
import { DepartmentSelectionProvider } from "@/context/DepartmentSelectionContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DepartmentSelectionPrompt from "@/components/departments/DepartmentSelectionPrompt";
import ErrorBoundary, {
  SectionErrorBoundary,
} from "@/components/ErrorBoundary";
import { useUIStore, useAuthStore } from "@/stores";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/lib/graphql/queries/employees";

// Component to sync Apollo user data with Zustand store
function AuthSync() {
  const { data, loading } = useQuery(GET_ME);
  const { setUser, setLoading, setAuthenticated } = useAuthStore();

  useEffect(() => {
    setLoading(loading);
    if (data?.me) {
      setUser(data.me);
      setAuthenticated(true);
    }
  }, [data, loading, setUser, setLoading, setAuthenticated]);

  return null;
}

// Component to initialize UI state
function UIInitializer() {
  const { initializeSidebar } = useUIStore();

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {/* Sync Apollo user data to Zustand */}
      <AuthSync />
      {/* Initialize UI state */}
      <UIInitializer />

      <DepartmentSelectionProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-[#09090b] overflow-hidden">
          {/* Sidebar with its own error boundary */}
          <SectionErrorBoundary sectionName="sidebar">
            <Sidebar />
          </SectionErrorBoundary>

          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            {/* Topbar with its own error boundary */}
            <SectionErrorBoundary sectionName="navigation">
              <Topbar />
            </SectionErrorBoundary>

            {/* Main content with error boundary */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
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
