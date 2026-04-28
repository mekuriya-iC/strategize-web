"use client";

import { useState } from "react";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Key, UserCheck, Settings } from "lucide-react";
import RolesManagement from "@/components/admin/permissions/RolesManagement";
import PermissionsManagement from "@/components/admin/permissions/PermissionsManagement";
import UserRoleAssignments from "@/components/admin/permissions/UserRoleAssignments";
import PermissionOverrides from "@/components/admin/permissions/PermissionOverrides";

export default function PermissionsPage() {
  const router = useRouter();
  const { admin, guards, isLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState("roles");

  // Show loading while checking permissions
  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
          <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if current user has permission to manage permissions
  if (!guards.isSuperAdmin) {
    return (
      <AccessDenied
        title="Access Denied"
        message="You do not have permission to manage permissions. This area is restricted to Super Administrators only."
        action={
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin")}
          >
            Go to Admin Panel
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl text-[#3F3F46] dark:text-gray-100 font-bold tracking-tight">
            Permission Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage roles, permissions, and user access across the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin")}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Admin Panel
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Permission System Overview
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              <p className="mb-2">
                <strong>Roles:</strong> Define collections of permissions that can be assigned to users
              </p>
              <p className="mb-2">
                <strong>Permissions:</strong> Granular access controls for specific features and actions
              </p>
              <p className="mb-2">
                <strong>User Assignments:</strong> Assign roles to users with optional expiration dates
              </p>
              <p>
                <strong>Permission Overrides:</strong> Grant or deny specific permissions to individual users
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">User Roles</span>
          </TabsTrigger>
          <TabsTrigger value="overrides" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Overrides</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          <RolesManagement />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsManagement />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <UserRoleAssignments />
        </TabsContent>

        <TabsContent value="overrides" className="mt-6">
          <PermissionOverrides />
        </TabsContent>
      </Tabs>
    </div>
  );
}