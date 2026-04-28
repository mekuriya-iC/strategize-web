"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { AdminAnalyticsCards, AdminTable } from "@/components/admin";
import { Employee } from "@/types/graphql";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, Shield, Users, Settings, Database } from "lucide-react";

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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

      {/* Admin Features Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          onClick={() => router.push("/dashboard/admin/permissions")}
          disabled={!guards.isSuperAdmin}
        >
          <Shield className="w-6 h-6 text-blue-600" />
          <div className="text-center">
            <div className="font-medium">Permissions</div>
            <div className="text-xs text-gray-500">Manage roles & permissions</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-green-950/30"
          onClick={() => router.push("/dashboard/admin")}
        >
          <Users className="w-6 h-6 text-green-600" />
          <div className="text-center">
            <div className="font-medium">User Management</div>
            <div className="text-xs text-gray-500">Manage admin users</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/30"
          onClick={() => router.push("/dashboard/admin")}
        >
          <Settings className="w-6 h-6 text-purple-600" />
          <div className="text-center">
            <div className="font-medium">System Settings</div>
            <div className="text-xs text-gray-500">Configure system</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-950/30"
          onClick={() => router.push("/dashboard/admin")}
        >
          <Database className="w-6 h-6 text-orange-600" />
          <div className="text-center">
            <div className="font-medium">Data Management</div>
            <div className="text-xs text-gray-500">Backup & cleanup</div>
          </div>
        </Button>
      </div>

      {/* Permission Notice */}
      {!guards.isSuperAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Limited Access
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Some admin features require Super Administrator privileges. Contact your system administrator for access.
              </p>
            </div>
          </div>
        </div>
      )}

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
