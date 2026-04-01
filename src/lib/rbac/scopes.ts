/**
 * Scope Resolver
 * Determines what organizational units and data a user can access
 * based on their role and organizational position
 * 
 * Scope Hierarchy:
 * SYSTEM > CORPORATE > DIVISION > DEPARTMENT > SELF
 */

import type { EmployeeRole, Employee, Division, Department } from '@/types/graphql';
import { isCorporateAdmin, isSuperAdmin } from './roles';

// Scope types
export type ScopeLevel = 'SYSTEM' | 'CORPORATE' | 'DIVISION' | 'DEPARTMENT' | 'SELF';

// Scope context for a user
export interface UserScope {
  level: ScopeLevel;
  divisionIds: string[];      // Divisions the user can access
  departmentIds: string[];    // Departments the user can access
  employeeId: string;         // The user's own ID
  managedDivisionIds: string[];   // Divisions where user is manager
  managedDepartmentIds: string[]; // Departments where user is manager
}

// Approval level type
export type ApprovalLevel = 'CORPORATE' | 'DIVISION' | 'DEPARTMENT' | null;

/**
 * Determine the scope level for a user based on their role
 */
export function getScopeLevel(role: EmployeeRole | string | undefined): ScopeLevel {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'SYSTEM';
    case 'ADMIN':
      return 'CORPORATE';
    case 'DIRECTOR':
      return 'DIVISION';
    case 'MANAGER':
    case 'COORDINATOR':
      return 'DEPARTMENT';
    case 'NORMAL':
    default:
      return 'SELF';
  }
}

/**
 * Build full scope context for a user
 * This should be called with the user's managed divisions/departments from the API
 */
export function buildUserScope(
  user: Employee | null,
  managedDivisions: Division[] = [],
  managedDepartments: Department[] = []
): UserScope | null {
  if (!user) return null;

  const role = user.role;
  const level = getScopeLevel(role);

  // Get IDs of managed units
  const managedDivisionIds = managedDivisions
    .filter(d => d.manager?.employeeId === user.employeeId)
    .map(d => d.divisionId);

  const managedDepartmentIds = managedDepartments
    .filter(d => d.manager?.employeeId === user.employeeId)
    .map(d => d.departmentId);

  // Build accessible IDs based on role
  let divisionIds: string[] = [];
  let departmentIds: string[] = [];

  switch (level) {
    case 'SYSTEM':
    case 'CORPORATE':
      // Can access everything - will use empty arrays to indicate "all"
      divisionIds = [];
      departmentIds = [];
      break;

    case 'DIVISION':
      // Can access managed divisions and their departments
      divisionIds = managedDivisionIds;
      // Get departments under managed divisions
      departmentIds = managedDepartments
        .filter(d => d.division && managedDivisionIds.includes(d.division.divisionId))
        .map(d => d.departmentId);
      // Also include directly managed departments (if any)
      departmentIds = [...new Set([...departmentIds, ...managedDepartmentIds])];
      break;

    case 'DEPARTMENT':
      // Can only access managed departments
      divisionIds = [];
      departmentIds = managedDepartmentIds;
      // Also include user's own departments
      if (user.departments) {
        departmentIds = [...new Set([...departmentIds, ...user.departments.map(d => d.departmentId)])];
      }
      break;

    case 'SELF':
    default:
      // Can only access own data
      divisionIds = [];
      departmentIds = user.departments?.map(d => d.departmentId) || [];
      break;
  }

  return {
    level,
    divisionIds,
    departmentIds,
    employeeId: user.employeeId,
    managedDivisionIds,
    managedDepartmentIds,
  };
}

/**
 * Check if a user can access a specific division
 */
export function canAccessDivision(
  scope: UserScope | null,
  divisionId: string
): boolean {
  if (!scope) return false;

  // System/Corporate level can access all
  if (scope.level === 'SYSTEM' || scope.level === 'CORPORATE') {
    return true;
  }

  // Division level can access their managed divisions
  if (scope.level === 'DIVISION') {
    return scope.managedDivisionIds.includes(divisionId);
  }

  // Department and below cannot access divisions directly
  return false;
}

/**
 * Check if a user can access a specific department
 */
export function canAccessDepartment(
  scope: UserScope | null,
  departmentId: string,
  departmentDivisionId?: string | null
): boolean {
  if (!scope) return false;

  // System/Corporate level can access all
  if (scope.level === 'SYSTEM' || scope.level === 'CORPORATE') {
    return true;
  }

  // Division level can access departments in their division
  if (scope.level === 'DIVISION') {
    // If department has a division, check if user manages that division
    if (departmentDivisionId) {
      return scope.managedDivisionIds.includes(departmentDivisionId);
    }
    // Also check if department is in user's accessible list
    return scope.departmentIds.includes(departmentId);
  }

  // Department/Coordinator level can access their departments
  if (scope.level === 'DEPARTMENT') {
    return scope.departmentIds.includes(departmentId);
  }

  // Self level - only if user belongs to that department
  return scope.departmentIds.includes(departmentId);
}

/**
 * Check if a user can access a specific employee
 */
export function canAccessEmployee(
  scope: UserScope | null,
  employeeId: string,
  employeeDepartmentId?: string | null,
  employeeDivisionId?: string | null
): boolean {
  if (!scope) return false;

  // Can always access self
  if (scope.employeeId === employeeId) {
    return true;
  }

  // System/Corporate level can access all
  if (scope.level === 'SYSTEM' || scope.level === 'CORPORATE') {
    return true;
  }

  // Division level can access employees in their division
  if (scope.level === 'DIVISION' && employeeDivisionId) {
    return scope.managedDivisionIds.includes(employeeDivisionId);
  }

  // Department level can access employees in their department
  if ((scope.level === 'DEPARTMENT' || scope.level === 'DIVISION') && employeeDepartmentId) {
    return scope.departmentIds.includes(employeeDepartmentId);
  }

  return false;
}

/**
 * Determine the approval level for a user based on role and context
 */
export function getApprovalLevel(
  role: EmployeeRole | string | undefined,
  selectedUnitType: 'division' | 'department' | null
): ApprovalLevel {
  if (isCorporateAdmin(role)) {
    return 'CORPORATE';
  }

  if (role === 'DIRECTOR') {
    return 'DIVISION';
  }

  if (role === 'MANAGER' && selectedUnitType) {
    return selectedUnitType === 'division' ? 'DIVISION' : 'DEPARTMENT';
  }

  return null;
}

/**
 * Determine who should approve a submission based on organizational structure
 */
export function resolveApprovalAuthority(
  submissionLevel: 'CORPORATE' | 'DIVISION' | 'DEPARTMENT' | 'PERSONNEL',
  departmentDivisionId: string | null // null means department reports to corporate
): { requiredRole: EmployeeRole; scope: 'CORPORATE' | 'DIVISION' | 'DEPARTMENT' } {
  switch (submissionLevel) {
    case 'CORPORATE':
      return { requiredRole: 'ADMIN', scope: 'CORPORATE' };

    case 'DIVISION':
      return { requiredRole: 'ADMIN', scope: 'CORPORATE' };

    case 'DEPARTMENT':
      if (departmentDivisionId) {
        // Department under a division → Director can approve
        return { requiredRole: 'DIRECTOR', scope: 'DIVISION' };
      } else {
        // Department reports directly to corporate → Admin approves
        return { requiredRole: 'ADMIN', scope: 'CORPORATE' };
      }

    case 'PERSONNEL':
      // Manager of the department approves
      return { requiredRole: 'MANAGER', scope: 'DEPARTMENT' };

    default:
      return { requiredRole: 'ADMIN', scope: 'CORPORATE' };
  }
}

/**
 * Check if a user can approve a specific submission
 */
export function canApproveSubmission(
  userRole: EmployeeRole | string | undefined,
  userScope: UserScope | null,
  submissionLevel: 'CORPORATE' | 'DIVISION' | 'DEPARTMENT' | 'PERSONNEL',
  submissionDepartmentId: string | null,
  submissionDivisionId: string | null,
  departmentReportsToCorpDirectly: boolean
): boolean {
  if (!userRole || !userScope) return false;

  // Super admin can approve anything
  if (isSuperAdmin(userRole)) return true;

  // Admin can approve corporate, division, and direct-to-corp department submissions
  if (userRole === 'ADMIN') {
    if (submissionLevel === 'CORPORATE' || submissionLevel === 'DIVISION') {
      return true;
    }
    if (submissionLevel === 'DEPARTMENT' && departmentReportsToCorpDirectly) {
      return true;
    }
    // Admin can also approve any department submission
    return true;
  }

  // Director can approve department submissions in their division
  if (userRole === 'DIRECTOR') {
    if (submissionLevel === 'DEPARTMENT' && submissionDivisionId) {
      return userScope.managedDivisionIds.includes(submissionDivisionId);
    }
    if (submissionLevel === 'PERSONNEL' && submissionDepartmentId) {
      // Check if personnel's department is in director's division
      return userScope.departmentIds.includes(submissionDepartmentId);
    }
    return false;
  }

  // Manager can approve personnel submissions in their department
  if (userRole === 'MANAGER') {
    if (submissionLevel === 'PERSONNEL' && submissionDepartmentId) {
      return userScope.managedDepartmentIds.includes(submissionDepartmentId);
    }
    return false;
  }

  // Coordinator cannot approve (they just coordinate)
  return false;
}

/**
 * Get the objective types a user can create based on their role
 */
export function getCreatableObjectiveTypes(
  role: EmployeeRole | string | undefined
): Array<'CORPORATE' | 'DIVISION' | 'DEPARTMENT' | 'PERSONNEL'> {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return ['CORPORATE', 'DIVISION', 'DEPARTMENT', 'PERSONNEL'];
    case 'DIRECTOR':
      return ['DIVISION', 'DEPARTMENT', 'PERSONNEL'];
    case 'MANAGER':
    case 'COORDINATOR':
      return ['DEPARTMENT', 'PERSONNEL'];
    case 'NORMAL':
      return ['PERSONNEL'];
    default:
      return [];
  }
}

