/**
 * RBAC (Role-Based Access Control) Module
 * 
 * Enterprise-level access control system for the application.
 * 
 * Usage:
 * ```typescript
 * import { hasPermission, canCreateObjective, guards } from '@/lib/rbac';
 * 
 * // Check specific permission
 * if (hasPermission(user.role, 'employees:create')) { ... }
 * 
 * // Check objective creation
 * const result = canCreateObjective(user.role, 'CORPORATE');
 * if (result.allowed) { ... }
 * 
 * // Quick role checks
 * if (guards.isAdmin(user.role)) { ... }
 * ```
 */

// Export permissions
export { PERMISSIONS, PERMISSION_GROUPS } from './permissions';
export type { Permission } from './permissions';

// Export role utilities
export {
  ROLE_HIERARCHY,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  getRolePermissions,
  roleHasPermission,
  hasMinimumRole,
  getAssignableRoles,
  isCorporateAdmin,
  isSuperAdmin,
  isManagementLevel,
  canApprove,
} from './roles';

// Export scope utilities
export {
  getScopeLevel,
  buildUserScope,
  canAccessDivision,
  canAccessDepartment,
  canAccessEmployee,
  getApprovalLevel,
  resolveApprovalAuthority,
  canApproveSubmission,
  getCreatableObjectiveTypes,
} from './scopes';
export type { ScopeLevel, UserScope, ApprovalLevel } from './scopes';

// Export guard functions
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
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
  guards,
} from './guards';
export type { AccessCheckResult } from './guards';

