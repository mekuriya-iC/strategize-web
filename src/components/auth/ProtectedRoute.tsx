"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/providers/AuthProvider";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  fallbackPath = "/dashboard",
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // Not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check role-based access
      if (requiredRoles && user) {
        const hasRequiredRole = requiredRoles.includes(user.role);
        if (!hasRequiredRole) {
          router.push(fallbackPath);
        }
      }
    }
  }, [isAuthenticated, user, loading, requiredRoles, router, pathname, fallbackPath]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3838EC] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access
  if (requiredRoles && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}
