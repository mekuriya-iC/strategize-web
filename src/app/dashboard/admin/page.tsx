"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { AdminAnalyticsCards, AdminTable } from "@/components/admin";
import { Employee } from "@/types/graphql";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";

export default function AdminPanelPage() {
  const router = useRouter();
  const { admin, guards, isLoading: permissionsLoading } = usePermissions();

  // Fetch all employees to filter admins
  const { data, loading, refetch } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
    skip: !admin.canAccess(), // Don't fetch if user doesn't have access
  });

  // Filter only admin users (ADMIN and SUPER_ADMIN roles)
  const admins = useMemo(() => {
    if (!data?.employees?.items) return [];
    return data.employees.items.filter(
      (emp: Employee) => emp.role === "ADMIN" || emp.role === "SUPER_ADMIN"
    );
  }, [data]);

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if current user has permission to view this page
  if (!admin.canAccess()) {
    return (
      <AccessDenied
        title="Access Denied"
        message="You do not have permission to access the Admin Panel. This area is restricted to administrators only."
        action={
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </Button>
        }
      />
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage administrators and view system analytics
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>All Time</DropdownMenuItem>
            <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
            <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
            <DropdownMenuItem>Last 90 Days</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Analytics Cards */}
      <AdminAnalyticsCards admins={admins} loading={loading} />

      {/* Admin Table - Only super admins can manage other admins */}
      <AdminTable
        admins={admins}
        loading={loading}
        onRefetch={() => refetch()}
        canManageAdmins={guards.isSuperAdmin}
      />
    </div>
  );
}
