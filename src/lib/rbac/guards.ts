/**
 * Guard Functions
 * Core access control checks for the application
 * 
 * These functions combine role permissions and scope to determine access
 */

import type { EmployeeRole, ObjectiveType } from '@/types/graphql';
import type { Permission } from './permissions';
import type { UserScope } from './scopes';
import { roleHasPermission, hasMinimumRole, isCorporateAdmin, isSuperAdmin } from './roles';
import { canAccessDivision, canAccessDepartment } from './scopes';

/**
 * Access check result with optional reason
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: EmployeeRole | string | undefined,
  permission: Permission
): boolean {
  if (!userRole) return false;
  return roleHasPermission(userRole as EmployeeRole, permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: EmployeeRole | string | undefined,
  permissions: Permission[]
): boolean {
  if (!userRole) return false;
  return permissions.some(p => roleHasPermission(userRole as EmployeeRole, p));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: EmployeeRole | string | undefined,
  permissions: Permission[]
): boolean {
  if (!userRole) return false;
  return permissions.every(p => roleHasPermission(userRole as EmployeeRole, p));
}

// ==================== NAVIGATION GUARDS ====================

/**
 * Check if user can access a navigation route
 */
export function canAccessRoute(
  userRole: EmployeeRole | string | undefined,
  route: string
): boolean {
  const routePermissions: Record<string, Permission> = {
    '/dashboard': 'nav:dashboard',
    '/dashboard/objectives': 'nav:objectives',
    '/dashboard/divisions': 'nav:divisions',
    '/dashboard/departments': 'nav:departments',
    '/dashboard/employees': 'nav:employees',
    '/dashboard/reports': 'nav:reports',
    '/dashboard/approvals': 'nav:approvals',
    '/dashboard/admin': 'nav:admin',
    '/dashboard/settings': 'nav:settings',
    '/dashboard/checkin': 'nav:checkin',
    '/strategy-period': 'nav:strategy_period',
  };

  // Find matching route (handle dynamic routes)
  let permission: Permission | undefined;

  // Exact match first
  if (routePermissions[route]) {
    permission = routePermissions[route];
  } else {
    // Check prefix matches for nested routes
    for (const [routePath, perm] of Object.entries(routePermissions)) {
      if (route.startsWith(routePath + '/') || route === routePath) {
        permission = perm;
        break;
      }
    }
  }

  if (!permission) {
    // Unknown route - allow by default (could be public)
    return true;
  }

  return hasPermission(userRole, permission);
}

/**
 * Get navigation items a user can access
 */
export function getAccessibleNavItems(
  userRole: EmployeeRole | string | undefined
): string[] {
  const allNavItems = [
    'Dashboard',
    'Objectives',
    'Divisions',
    'Departments',
    'Employees',
    'Reports',
    'Approvals',
    'Admin Panel',
    'Settings',
    'Check-In/Out',
  ];

  const navPermissions: Record<string, Permission> = {
    'Dashboard': 'nav:dashboard',
    'Objectives': 'nav:objectives',
    'Divisions': 'nav:divisions',
    'Departments': 'nav:departments',
    'Employees': 'nav:employees',
    'Reports': 'nav:reports',
    'Approvals': 'nav:approvals',
    'Admin Panel': 'nav:admin',
    'Settings': 'nav:settings',
    'Check-In/Out': 'nav:checkin',
  };

  return allNavItems.filter(item => {
    const permission = navPermissions[item];
    return permission ? hasPermission(userRole, permission) : true;
  });
}

// ==================== EMPLOYEE GUARDS ====================

/**
 * Check if user can view employees list
 */
export function canViewEmployees(
  userRole: EmployeeRole | string | undefined,
  scope: UserScope | null
): AccessCheckResult {
  if (hasPermission(userRole, 'employees:read_all')) {
    return { allowed: true };
  }

  if (hasPermission(userRole, 'employees:read_division') && scope?.managedDivisionIds.length) {
    return { allowed: true, reason: 'Can view employees in managed divisions' };
  }

  if (hasPermission(userRole, 'employees:read_department') && scope?.departmentIds.length) {
    return { allowed: true, reason: 'Can view employees in own department(s)' };
  }

  return { allowed: false, reason: 'No permission to view employees' };
}

/**
 * Check if user can create employees
 */
export function canCreateEmployee(
  userRole: EmployeeRole | string | undefined
): AccessCheckResult {
  if (hasPermission(userRole, 'employees:create')) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Only administrators can create employees' };
}

/**
 * Check if user can edit a specific employee
 */
export function canEditEmployee(
  userRole: EmployeeRole | string | undefined,
  scope: UserScope | null,
  targetEmployeeId: string,
  targetDepartmentId?: string | null
): AccessCheckResult {
  // Can always edit self
  if (scope?.employeeId === targetEmployeeId) {
    return { allowed: true };
  }

  // Full access
  if (hasPermission(userRole, 'employees:update_all')) {
    return { allowed: true };
  }

  // Department-level access
  if (hasPermission(userRole, 'employees:update_department') && targetDepartmentId) {
    if (scope?.managedDepartmentIds.includes(targetDepartmentId)) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: 'No permission to edit this employee' };
}

/**
 * Check if user can delete an employee
 */
export function canDeleteEmployee(
  userRole: EmployeeRole | string | undefined
): AccessCheckResult {
  if (hasPermission(userRole, 'employees:delete')) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Only super administrators can delete employees' };
}

// ==================== OBJECTIVE GUARDS ====================

/**
 * Check if user can create an objective of a specific type
 */
export function canCreateObjective(
  userRole: EmployeeRole | string | undefined,
  objectiveType: ObjectiveType
): AccessCheckResult {
  const permissionMap: Record<ObjectiveType, Permission> = {
    'CORPORATE': 'objectives:create_corporate',
    'DIVISION': 'objectives:create_division',
    'DEPARTMENT': 'objectives:create_department',
    'PERSONNEL': 'objectives:create_personnel',
  };

  const permission = permissionMap[objectiveType];
  if (hasPermission(userRole, permission)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Cannot create ${objectiveType.toLowerCase()}-level objectives`
  };
}

/**
 * Check if user can approve an objective of a specific type
 */
export function canApproveObjective(
  userRole: EmployeeRole | string | undefined,
  scope: UserScope | null,
  objectiveType: ObjectiveType,
  objectiveDivisionId?: string | null,
  objectiveDepartmentId?: string | null
): AccessCheckResult {
  // Corporate objectives - only admin+
  if (objectiveType === 'CORPORATE') {
    if (hasPermission(userRole, 'objectives:approve_corporate')) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only administrators can approve corporate objectives' };
  }

  // Division objectives - only admin+
  if (objectiveType === 'DIVISION') {
    if (hasPermission(userRole, 'objectives:approve_division')) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only administrators can approve division objectives' };
  }

  // Department objectives - follow hierarchy
  if (objectiveType === 'DEPARTMENT') {
    // Ultimate authority: Corporate Admin
    if (hasPermission(userRole, 'objectives:approve_corporate')) {
      return { allowed: true };
    }

    // Role-based hierarchy: Division Director approves their departments
    if (hasPermission(userRole, 'objectives:approve_department') && objectiveDivisionId && scope) {
      if (scope.managedDivisionIds.includes(objectiveDivisionId)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Division Directors can only approve objectives for their own divisions' };
    }

    if (!objectiveDivisionId) {
      return { allowed: false, reason: 'Stand-alone departments must be approved by Corporate Admin' };
    }

    return { allowed: false, reason: 'No permission to approve this department objective' };
  }

  // Personnel objectives - manager of the department
  if (objectiveType === 'PERSONNEL') {
    if (hasPermission(userRole, 'objectives:approve_corporate')) {
      return { allowed: true };
    }
    if (hasPermission(userRole, 'objectives:approve_personnel') && objectiveDepartmentId && scope) {
      if (scope.managedDepartmentIds.includes(objectiveDepartmentId)) {
        return { allowed: true };
      }
    }
    return { allowed: false, reason: 'Cannot approve this personnel objective' };
  }

  return { allowed: false, reason: 'Unknown objective type' };
}

/**
 * Check if user can assign objectives to a specific level
 */
export function canAssignObjective(
  userRole: EmployeeRole | string | undefined,
  assigneeType: 'DIVISION' | 'DEPARTMENT' | 'PERSONNEL'
): AccessCheckResult {
  const permissionMap: Record<string, Permission> = {
    'DIVISION': 'objectives:assign_division',
    'DEPARTMENT': 'objectives:assign_department',
    'PERSONNEL': 'objectives:assign_personnel',
  };

  const permission = permissionMap[assigneeType];
  if (hasPermission(userRole, permission)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Cannot assign objectives to ${assigneeType.toLowerCase()} level`
  };
}

// ==================== ORGANIZATIONAL STRUCTURE GUARDS ====================

/**
 * Check if user can manage divisions
 */
export function canManageDivisions(
  userRole: EmployeeRole | string | undefined
): AccessCheckResult {
  if (hasPermission(userRole, 'divisions:create')) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Only administrators can manage divisions' };
}

/**
 * Check if user can manage departments
 */
export function canManageDepartments(
  userRole: EmployeeRole | string | undefined,
  scope: UserScope | null
): AccessCheckResult {
  if (hasPermission(userRole, 'departments:create')) {
    return { allowed: true };
  }

  if (hasPermission(userRole, 'departments:create_in_division') && scope?.managedDivisionIds.length) {
    return { allowed: true, reason: 'Can create departments in managed divisions' };
  }

  return { allowed: false, reason: 'No permission to manage departments' };
}

/**
 * Check if user can view a specific division
 */
export function canViewDivision(
  userRole: EmployeeRole | string | undefined,
  scope: UserScope | null,
  divisionId: string
): AccessCheckResult {
  if (hasPermission(userRole, 'divisions:read_all')) {
    return { allowed: true };
  }

  if (hasPermission(userRole, 'divisions:read_own') && scope) {
    if (canAccessDivision(scope, divisionId)) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: 'No access to this division' };
}

/**
 * Check if user can view a specific department
 */
export function canViewDepartment(
  userRole: EmployeeRole | string | undefined,
  scope: UserScope | null,
  departmentId: string,
  departmentDivisionId?: string | null
): AccessCheckResult {
  if (hasPermission(userRole, 'departments:read_all')) {
    return { allowed: true };
  }

  if (hasPermission(userRole, 'departments:read_division') && scope && departmentDivisionId) {
    if (scope.managedDivisionIds.includes(departmentDivisionId)) {
      return { allowed: true };
    }
  }

  if (hasPermission(userRole, 'departments:read_own') && scope) {
    if (canAccessDepartment(scope, departmentId, departmentDivisionId)) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: 'No access to this department' };
}

// ==================== STRATEGIC PERIOD GUARDS ====================

/**
 * Check if user can manage strategic periods
 */
export function canManageStrategicPeriods(
  userRole: EmployeeRole | string | undefined
): AccessCheckResult {
  if (hasPermission(userRole, 'strategic_periods:create')) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Only administrators can manage strategic periods' };
}

// ==================== ADMIN GUARDS ====================

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(
  userRole: EmployeeRole | string | undefined
): AccessCheckResult {
  if (hasPermission(userRole, 'admin:access_panel')) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'No access to admin panel' };
}

/**
 * Check if user can manage other admins
 */
export function canManageAdmins(
  userRole: EmployeeRole | string | undefined
): AccessCheckResult {
  if (hasPermission(userRole, 'admin:manage_admins')) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Only super administrators can manage admins' };
}

// ==================== UTILITY GUARDS ====================

/**
 * Quick check for common access patterns
 */
export const guards = {
  isEmployee: (role: EmployeeRole | string | undefined) => role === 'NORMAL',
  isCoordinator: (role: EmployeeRole | string | undefined) => role === 'COORDINATOR',
  isManager: (role: EmployeeRole | string | undefined) => role === 'MANAGER',
  isDirector: (role: EmployeeRole | string | undefined) => role === 'DIRECTOR',
  isAdmin: (role: EmployeeRole | string | undefined) => role === 'ADMIN',
  isSuperAdmin: (role: EmployeeRole | string | undefined) => isSuperAdmin(role),
  isCorporateAdmin: (role: EmployeeRole | string | undefined) => isCorporateAdmin(role),
  isManagement: (role: EmployeeRole | string | undefined) => hasMinimumRole(role, 'MANAGER'),
  isCoordinatorOrAbove: (role: EmployeeRole | string | undefined) => hasMinimumRole(role, 'COORDINATOR'),
  canApprove: (role: EmployeeRole | string | undefined) => hasMinimumRole(role, 'MANAGER'),
};

