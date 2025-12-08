/**
 * Permission Utilities
 * 
 * @deprecated This file is kept for backward compatibility.
 * Please use the new RBAC system from '@/lib/rbac' instead.
 * 
 * New usage:
 * ```typescript
 * import { hasPermission, canCreateObjective, guards } from '@/lib/rbac';
 * import { usePermissions } from '@/hooks/usePermissions';
 * ```
 */

// Re-export everything from the new RBAC system
export {
  ROLE_HIERARCHY,
  ROLE_LABELS,
  hasMinimumRole,
  isCorporateAdmin,
  isSuperAdmin,
  isManagementLevel,
  canApprove,
  getAssignableRoles,
  getApprovalLevel,
} from './rbac';

export type { ApprovalLevel } from './rbac';

// Legacy function mappings for backward compatibility
import type { EmployeeRole } from "@/types/graphql";
import { hasMinimumRole, isCorporateAdmin } from './rbac';

/**
 * @deprecated Use hasPermission(role, 'objectives:create_department') instead
 */
export const canManageObjectives = (
  role: EmployeeRole | string | undefined
): boolean => {
  return hasMinimumRole(role, "MANAGER");
};

/**
 * @deprecated Use hasPermission(role, 'employees:create') instead
 */
export const canManageEmployees = (
  role: EmployeeRole | string | undefined
): boolean => {
  return isCorporateAdmin(role);
};

/**
 * @deprecated Use hasPermission(role, 'divisions:create') instead
 */
export const canManageOrgStructure = (
  role: EmployeeRole | string | undefined
): boolean => {
  return isCorporateAdmin(role);
};

/**
 * @deprecated Use hasPermission(role, 'submissions:approve_department') instead
 */
export const canApproveSubmissions = (
  role: EmployeeRole | string | undefined
): boolean => {
  return hasMinimumRole(role, "MANAGER");
};

/**
 * @deprecated Use hasPermission(role, 'analytics:read_department') instead
 */
export const canViewAnalytics = (
  role: EmployeeRole | string | undefined
): boolean => {
  return hasMinimumRole(role, "COORDINATOR");
};
