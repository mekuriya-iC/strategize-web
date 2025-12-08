/**
 * usePermissions Hook
 * React hook for checking permissions in components
 *
 * Usage:
 * ```typescript
 * const { can, canAny, canAll, role, scope, isLoading } = usePermissions();
 *
 * // Check single permission
 * if (can('employees:create')) { ... }
 *
 * // Check any of multiple permissions
 * if (canAny(['objectives:approve_department', 'objectives:approve_corporate'])) { ... }
 *
 * // Check all permissions
 * if (canAll(['employees:read_all', 'employees:update_all'])) { ... }
 *
 * // Use guards
 * const { guards } = usePermissions();
 * if (guards.isAdmin) { ... }
 * ```
 */

"use client";

import { useMemo, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { useAuthStore } from "@/stores";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import type { Permission } from "@/lib/rbac/permissions";
import type { UserScope } from "@/lib/rbac/scopes";
import type {
  EmployeeRole,
  Division,
  Department,
  ObjectiveType,
} from "@/types/graphql";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  buildUserScope,
  canAccessRoute,
  getAccessibleNavItems,
  canViewEmployees,
  canCreateEmployee,
  canEditEmployee,
  canDeleteEmployee,
  canCreateObjective,
  canApproveObjective,
  canAssignObjective,
  canManageDivisions,
  canManageDepartments,
  canViewDivision,
  canViewDepartment,
  canManageStrategicPeriods,
  canAccessAdminPanel,
  canManageAdmins,
  isCorporateAdmin,
  isSuperAdmin,
  isManagementLevel,
  hasMinimumRole,
  getCreatableObjectiveTypes,
} from "@/lib/rbac";

export interface UsePermissionsResult {
  // Core permission checks
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;

  // Role info
  role: EmployeeRole | undefined;
  permissions: Permission[];

  // Scope info
  scope: UserScope | null;

  // Loading state
  isLoading: boolean;

  // Quick guards
  guards: {
    isEmployee: boolean;
    isCoordinator: boolean;
    isManager: boolean;
    isDirector: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isCorporateAdmin: boolean;
    isManagement: boolean;
    canApprove: boolean;
  };

  // Navigation
  canAccessRoute: (route: string) => boolean;
  accessibleNavItems: string[];

  // Entity-specific checks
  employees: {
    canView: () => boolean;
    canCreate: () => boolean;
    canEdit: (employeeId: string, departmentId?: string | null) => boolean;
    canDelete: () => boolean;
  };

  objectives: {
    canCreate: (type: ObjectiveType) => boolean;
    canApprove: (
      type: ObjectiveType,
      divisionId?: string | null,
      departmentId?: string | null
    ) => boolean;
    canAssign: (
      assigneeType: "DIVISION" | "DEPARTMENT" | "PERSONNEL"
    ) => boolean;
    creatableTypes: Array<
      "CORPORATE" | "DIVISION" | "DEPARTMENT" | "PERSONNEL"
    >;
  };

  divisions: {
    canManage: () => boolean;
    canView: (divisionId: string) => boolean;
  };

  departments: {
    canManage: () => boolean;
    canView: (departmentId: string, divisionId?: string | null) => boolean;
  };

  strategicPeriods: {
    canManage: () => boolean;
  };

  admin: {
    canAccess: () => boolean;
    canManageAdmins: () => boolean;
  };
}

export function usePermissions(): UsePermissionsResult {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  const role = user?.role as EmployeeRole | undefined;

  // Fetch divisions and departments for scope building
  const { data: divisionsData, loading: divisionsLoading } = useQuery(
    GET_DIVISIONS,
    {
      variables: { page: 1, limit: 1000 },
      skip: !user || !isManagementLevel(role),
      fetchPolicy: "cache-first",
    }
  );

  const { data: departmentsData, loading: departmentsLoading } = useQuery(
    GET_DEPARTMENTS,
    {
      variables: { page: 1, limit: 1000 },
      skip: !user || !isManagementLevel(role),
      fetchPolicy: "cache-first",
    }
  );

  // Build user scope
  const scope = useMemo(() => {
    if (!user) return null;

    const divisions: Division[] = divisionsData?.divisions?.items || [];
    const departments: Department[] = departmentsData?.departments?.items || [];

    return buildUserScope(user, divisions, departments);
  }, [user, divisionsData, departmentsData]);

  // Get all permissions for the role
  const permissions = useMemo(() => {
    if (!role) return [];
    return getRolePermissions(role);
  }, [role]);

  // Permission check functions
  const can = useCallback(
    (permission: Permission): boolean => {
      return hasPermission(role, permission);
    },
    [role]
  );

  const canAny = useCallback(
    (perms: Permission[]): boolean => {
      return hasAnyPermission(role, perms);
    },
    [role]
  );

  const canAll = useCallback(
    (perms: Permission[]): boolean => {
      return hasAllPermissions(role, perms);
    },
    [role]
  );

  // Quick guards
  const guards = useMemo(
    () => ({
      isEmployee: role === "NORMAL",
      isCoordinator: role === "COORDINATOR",
      isManager: role === "MANAGER",
      isDirector: role === "DIRECTOR",
      isAdmin: role === "ADMIN",
      isSuperAdmin: isSuperAdmin(role),
      isCorporateAdmin: isCorporateAdmin(role),
      isManagement: hasMinimumRole(role, "MANAGER"),
      canApprove: hasMinimumRole(role, "MANAGER"),
    }),
    [role]
  );

  // Navigation checks
  const checkCanAccessRoute = useCallback(
    (route: string): boolean => {
      return canAccessRoute(role, route);
    },
    [role]
  );

  const accessibleNavItems = useMemo(() => {
    return getAccessibleNavItems(role);
  }, [role]);

  // Employee checks
  const employees = useMemo(
    () => ({
      canView: () => canViewEmployees(role, scope).allowed,
      canCreate: () => canCreateEmployee(role).allowed,
      canEdit: (employeeId: string, departmentId?: string | null) =>
        canEditEmployee(role, scope, employeeId, departmentId).allowed,
      canDelete: () => canDeleteEmployee(role).allowed,
    }),
    [role, scope]
  );

  // Objective checks
  const objectives = useMemo(
    () => ({
      canCreate: (type: ObjectiveType) =>
        canCreateObjective(role, type).allowed,
      canApprove: (
        type: ObjectiveType,
        divisionId?: string | null,
        departmentId?: string | null
      ) =>
        canApproveObjective(role, scope, type, divisionId, departmentId)
          .allowed,
      canAssign: (assigneeType: "DIVISION" | "DEPARTMENT" | "PERSONNEL") =>
        canAssignObjective(role, assigneeType).allowed,
      creatableTypes: getCreatableObjectiveTypes(role),
    }),
    [role, scope]
  );

  // Division checks
  const divisions = useMemo(
    () => ({
      canManage: () => canManageDivisions(role).allowed,
      canView: (divisionId: string) =>
        canViewDivision(role, scope, divisionId).allowed,
    }),
    [role, scope]
  );

  // Department checks
  const departments = useMemo(
    () => ({
      canManage: () => canManageDepartments(role, scope).allowed,
      canView: (departmentId: string, divisionId?: string | null) =>
        canViewDepartment(role, scope, departmentId, divisionId).allowed,
    }),
    [role, scope]
  );

  // Strategic period checks
  const strategicPeriods = useMemo(
    () => ({
      canManage: () => canManageStrategicPeriods(role).allowed,
    }),
    [role]
  );

  // Admin checks
  const admin = useMemo(
    () => ({
      canAccess: () => canAccessAdminPanel(role).allowed,
      canManageAdmins: () => canManageAdmins(role).allowed,
    }),
    [role]
  );

  return {
    // Core permission checks
    can,
    canAny,
    canAll,

    // Role info
    role,
    permissions,

    // Scope info
    scope,

    // Loading state
    isLoading: isLoading || divisionsLoading || departmentsLoading,

    // Quick guards
    guards,

    // Navigation
    canAccessRoute: checkCanAccessRoute,
    accessibleNavItems,

    // Entity-specific checks
    employees,
    objectives,
    divisions,
    departments,
    strategicPeriods,
    admin,
  };
}

// Default export
export default usePermissions;
