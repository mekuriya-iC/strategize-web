"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DepartmentSelectionProvider } from "@/context/DepartmentSelectionContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DepartmentSelectionPrompt from "@/components/departments/DepartmentSelectionPrompt";
import ErrorBoundary, {
  SectionErrorBoundary,
} from "@/components/ErrorBoundary";
import { useUIStore, useAuthStore } from "@/stores";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { useAutoSelectStrategicPeriod } from "@/hooks/objectives/useAutoSelectStrategicPeriod";
import { useObjectiveSetupGuard } from "@/hooks/objectives/useObjectiveSetupGuard";

// Component to sync Apollo user data with Zustand store
function AuthSync() {
  const router = useRouter();
  const { data, loading } = useQuery(GET_ME);
  const { setUser, setLoading, setAuthenticated } = useAuthStore();

  useEffect(() => {
    setLoading(loading);
    if (data?.me) {
      console.log("🔍 User data:", {
        email: data.me.email,
        role: data.me.role,
        isFirstLogin: data.me.isFirstLogin,
        mustChangePassword: data.me.mustChangePassword,
      });

      setUser(data.me);
      setAuthenticated(true);

      // Redirect to onboarding if first login or must change password
      if (data.me.isFirstLogin || data.me.mustChangePassword) {
        console.log("🚀 Redirecting to onboarding...");
        router.push("/onboarding");
      } else {
        console.log("✅ User has completed onboarding");
      }
    }
  }, [data, loading, setUser, setLoading, setAuthenticated, router]);

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
      {/* Sync Apollo user data to Zustand */}
      <AuthSync />
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
