/**
 * Role-Permission Mapping
 * Defines what permissions each role has with cascading inheritance
 * 
 * Role Hierarchy (lowest to highest):
 * NORMAL < COORDINATOR < MANAGER < DIRECTOR < ADMIN < SUPER_ADMIN
 */

import type { Permission } from './permissions';
import type { EmployeeRole } from '@/types/graphql';

// Role hierarchy levels (higher number = more privileges)
export const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  NORMAL: 0,
  COORDINATOR: 1,
  MANAGER: 2,
  DIRECTOR: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

// Role display labels
export const ROLE_LABELS: Record<EmployeeRole, string> = {
  NORMAL: 'Employee',
  COORDINATOR: 'Coordinator',
  MANAGER: 'Manager',
  DIRECTOR: 'Director',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<EmployeeRole, string> = {
  NORMAL: 'Regular employee with access to personal objectives and KPIs',
  COORDINATOR: 'Department coordinator with limited management capabilities',
  MANAGER: 'Department manager with full department-level access',
  DIRECTOR: 'Division director with division-wide access',
  ADMIN: 'Corporate administrator with organization-wide access',
  SUPER_ADMIN: 'System administrator with full system access',
};

/**
 * Base permissions for each role (before inheritance)
 * Each role inherits all permissions from roles below it
 */
const BASE_ROLE_PERMISSIONS: Record<EmployeeRole, Permission[]> = {
  // ==================== NORMAL (Employee) ====================
  // Can only manage their own data
  NORMAL: [
    // Profile
    'employees:read_own',
    'employees:update_own',

    // Objectives - own only
    'objectives:read_own',
    'objectives:create_personnel',
    'objectives:update_own',
    'objectives:submit',

    // KPIs - own only
    'kpis:read_own',
    'kpis:create_own',
    'kpis:update_own',
    'kpis:submit',
    'kpis:set_targets',

    // Submissions
    'submissions:read_own',
    'submissions:create',

    // Analytics & Reports
    'analytics:read_own',
    'reports:read_own',

    // Strategic periods (read only)
    'strategic_periods:read',

    // Navigation
    'nav:dashboard',
    'nav:objectives',
    'nav:reports',
    'nav:settings',
  ],

  // ==================== COORDINATOR ====================
  // Department-level coordinator with limited approval authority
  COORDINATOR: [
    // Employees - view department
    'employees:read_department',

    // Objectives - department level
    'objectives:read_department',
    'objectives:create_department',
    'objectives:update_department',
    'objectives:assign_personnel',

    // KPIs - department level
    'kpis:read_department',
    'kpis:create_department',
    'kpis:update_department',

    // Submissions - department view
    'submissions:read_department',

    // Analytics
    'analytics:read_department',
    'reports:read_department',

    // Departments - own only
    'departments:read_own',

    // Navigation
    'nav:approvals', // Can view but limited approval
  ],

  // ==================== MANAGER ====================
  // Full department management with approval authority
  MANAGER: [
    // Employees - department management
    'employees:update_department',

    // Objectives - full department control + personnel approval
    'objectives:delete_department',
    'objectives:approve_personnel',

    // KPIs - full department control + personnel approval
    'kpis:delete_department',
    'kpis:approve_personnel',

    // Submissions - approve personnel
    'submissions:approve_personnel',

    // Reports
    'reports:export',

    // Departments - manage employees
    'departments:add_employee',
    'departments:remove_employee',

    // Navigation
    'nav:employees',
    'nav:departments',
  ],

  // ==================== DIRECTOR ====================
  // Division-wide access with department approval authority
  DIRECTOR: [
    // Employees - division view
    'employees:read_division',
    'employees:assign_role_basic',

    // Objectives - division level
    'objectives:read_division',
    'objectives:create_division',
    'objectives:update_division',
    'objectives:delete_division',
    'objectives:approve_department',
    'objectives:assign_department',

    // KPIs - division level
    'kpis:read_division',
    'kpis:create_division',
    'kpis:update_division',
    'kpis:delete_division',
    'kpis:approve_department',

    // Divisions - own
    'divisions:read_own',
    'divisions:update_own',

    // Departments - division management
    'departments:read_division',
    'departments:create_in_division',
    'departments:update_division',
    'departments:assign_manager',

    // Submissions - approve department
    'submissions:read_division',
    'submissions:approve_department',

    // Analytics
    'analytics:read_division',
    'reports:read_division',

    // Navigation
    'nav:divisions',
    'nav:departments',
    'nav:employees',
  ],

  // ==================== ADMIN ====================
  // Corporate-level administration
  ADMIN: [
    // Employees - full management
    'employees:read_all',
    'employees:create',
    'employees:update_all',
    'employees:assign_role_advanced',

    // Objectives - corporate level
    'objectives:read_all',
    'objectives:create_corporate',
    'objectives:update_all',
    'objectives:delete_all',
    'objectives:approve_division',
    'objectives:approve_corporate',
    'objectives:assign_division',

    // KPIs - corporate level
    'kpis:read_all',
    'kpis:create_corporate',
    'kpis:update_all',
    'kpis:delete_all',
    'kpis:approve_division',
    'kpis:approve_corporate',

    // Divisions - full management
    'divisions:read_all',
    'divisions:create',
    'divisions:update_all',
    'divisions:assign_manager',

    // Departments - full management
    'departments:read_all',
    'departments:create',
    'departments:update_all',

    // Strategic periods
    'strategic_periods:create',
    'strategic_periods:update',

    // Submissions - all approvals
    'submissions:read_all',
    'submissions:approve_division',
    'submissions:approve_corporate',

    // Analytics - all
    'analytics:read_all',
    'reports:read_all',

    // Admin panel
    'admin:access_panel',
    'admin:view_audit_logs',

    // Navigation
    'nav:employees',
    'nav:admin',
    'nav:strategy_period',
  ],

  // ==================== SUPER_ADMIN ====================
  // Full system access - no restrictions
  SUPER_ADMIN: [
    // Employees - delete and any role assignment
    'employees:delete',
    'employees:assign_role_any',

    // Divisions - delete
    'divisions:delete',

    // Departments - delete
    'departments:delete',

    // Strategic periods - delete
    'strategic_periods:delete',

    // Full admin
    'admin:manage_admins',
    'admin:system_settings',
  ],
};

/**
 * Get all permissions for a role (including inherited permissions)
 * Uses cascading inheritance - each role gets all permissions from lower roles
 */
export function getRolePermissions(role: EmployeeRole): Permission[] {
  const roleLevel = ROLE_HIERARCHY[role];
  const allPermissions = new Set<Permission>();

  // Get permissions from this role and all lower roles
  const roles: EmployeeRole[] = ['NORMAL', 'COORDINATOR', 'MANAGER', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN'];

  for (const r of roles) {
    if (ROLE_HIERARCHY[r] <= roleLevel) {
      BASE_ROLE_PERMISSIONS[r].forEach(p => allPermissions.add(p));
    }
  }

  return Array.from(allPermissions);
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: EmployeeRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role has at least the minimum required level
 */
export function hasMinimumRole(
  userRole: EmployeeRole | string | undefined,
  minimumRole: EmployeeRole
): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole as EmployeeRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  return userLevel >= requiredLevel;
}

/**
 * Get roles that a user can assign based on their own role
 */
export function getAssignableRoles(assignerRole: EmployeeRole | string | undefined): EmployeeRole[] {
  switch (assignerRole) {
    case 'SUPER_ADMIN':
      return ['NORMAL', 'COORDINATOR', 'MANAGER', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN'];
    case 'ADMIN':
      return ['NORMAL', 'COORDINATOR', 'MANAGER', 'DIRECTOR'];
    case 'DIRECTOR':
      return ['NORMAL', 'COORDINATOR', 'MANAGER'];
    default:
      return [];
  }
}

/**
 * Check if user is a corporate-level administrator
 */
export function isCorporateAdmin(role: EmployeeRole | string | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if user is a super administrator
 */
export function isSuperAdmin(role: EmployeeRole | string | undefined): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Check if user is at management level (can manage a unit)
 */
export function isManagementLevel(role: EmployeeRole | string | undefined): boolean {
  return hasMinimumRole(role, 'COORDINATOR');
}

/**
 * Check if user is at approval level (can approve submissions)
 */
export function canApprove(role: EmployeeRole | string | undefined): boolean {
  return hasMinimumRole(role, 'MANAGER');
}

