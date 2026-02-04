/**
 * Permission Guard Components
 * React components for conditional rendering based on permissions
 * 
 * Usage:
 * ```tsx
 * // Require specific permission
 * <RequirePermission permission="employees:create">
 *   <Button>Add Employee</Button>
 * </RequirePermission>
 * 
 * // Require any of multiple permissions
 * <RequirePermission permissions={['objectives:approve_department', 'objectives:approve_corporate']} mode="any">
 *   <ApprovalPanel />
 * </RequirePermission>
 * 
 * // Require minimum role
 * <RequireRole minimum="MANAGER">
 *   <ManagerDashboard />
 * </RequireRole>
 * 
 * // With fallback
 * <RequirePermission permission="admin:access_panel" fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </RequirePermission>
 * ```
 */

'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '@/hooks/permissions/usePermissions';
import { hasMinimumRole } from '@/lib/rbac';
import type { Permission } from '@/lib/rbac/permissions';
import type { EmployeeRole } from '@/types/graphql';

// ==================== RequirePermission ====================

interface RequirePermissionProps {
  /** Single permission to check */
  permission?: Permission;
  /** Multiple permissions to check */
  permissions?: Permission[];
  /** Mode for multiple permissions: 'any' = at least one, 'all' = all required */
  mode?: 'any' | 'all';
  /** Content to render if permission check passes */
  children: ReactNode;
  /** Content to render if permission check fails */
  fallback?: ReactNode;
  /** Whether to show loading state while checking */
  showLoading?: boolean;
}

export function RequirePermission({
  permission,
  permissions,
  mode = 'any',
  children,
  fallback = null,
  showLoading = false,
}: RequirePermissionProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  if (isLoading && showLoading) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-24" />;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = mode === 'all' ? canAll(permissions) : canAny(permissions);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ==================== RequireRole ====================

interface RequireRoleProps {
  /** Exact role required */
  role?: EmployeeRole;
  /** Minimum role level required */
  minimum?: EmployeeRole;
  /** Any of these roles */
  roles?: EmployeeRole[];
  /** Content to render if role check passes */
  children: ReactNode;
  /** Content to render if role check fails */
  fallback?: ReactNode;
  /** Whether to show loading state while checking */
  showLoading?: boolean;
}

export function RequireRole({
  role,
  minimum,
  roles,
  children,
  fallback = null,
  showLoading = false,
}: RequireRoleProps) {
  const { role: userRole, isLoading } = usePermissions();

  if (isLoading && showLoading) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-24" />;
  }

  let hasAccess = false;

  if (role) {
    hasAccess = userRole === role;
  } else if (minimum) {
    hasAccess = hasMinimumRole(userRole, minimum);
  } else if (roles && roles.length > 0) {
    hasAccess = userRole ? roles.includes(userRole) : false;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ==================== RequireAdmin ====================

interface RequireAdminProps {
  /** Content to render for admins */
  children: ReactNode;
  /** Content to render for non-admins */
  fallback?: ReactNode;
  /** Require super admin specifically */
  superOnly?: boolean;
}

export function RequireAdmin({
  children,
  fallback = null,
  superOnly = false,
}: RequireAdminProps) {
  const { guards } = usePermissions();

  const hasAccess = superOnly ? guards.isSuperAdmin : guards.isCorporateAdmin;

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ==================== RequireManagement ====================

interface RequireManagementProps {
  /** Content to render for management */
  children: ReactNode;
  /** Content to render for non-management */
  fallback?: ReactNode;
}

export function RequireManagement({
  children,
  fallback = null,
}: RequireManagementProps) {
  const { guards } = usePermissions();

  if (guards.isManagement) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ==================== CanApprove ====================

interface CanApproveProps {
  /** Content to render if user can approve */
  children: ReactNode;
  /** Content to render if user cannot approve */
  fallback?: ReactNode;
}

export function CanApprove({
  children,
  fallback = null,
}: CanApproveProps) {
  const { guards } = usePermissions();

  if (guards.canApprove) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ==================== AccessDenied Component ====================

interface AccessDeniedProps {
  /** Title to display */
  title?: string;
  /** Message to display */
  message?: string;
  /** Action button */
  action?: ReactNode;
}

export function AccessDenied({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  action,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-red-800 mb-2">{title}</h2>
        <p className="text-red-600 text-sm">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

// ==================== withPermission HOC ====================

/**
 * Higher-Order Component for permission checking
 * 
 * Usage:
 * ```tsx
 * const ProtectedComponent = withPermission(MyComponent, 'employees:create');
 * // or
 * const ProtectedComponent = withPermission(MyComponent, ['admin:access_panel'], 'all');
 * ```
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permissions: Permission | Permission[],
  mode: 'any' | 'all' = 'any',
  FallbackComponent?: React.ComponentType
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithPermissionComponent: React.FC<P> = (props) => {
    const perms = Array.isArray(permissions) ? permissions : [permissions];

    return (
      <RequirePermission
        permissions={perms}
        mode={mode}
        fallback={FallbackComponent ? <FallbackComponent /> : <AccessDenied />}
      >
        <WrappedComponent {...props} />
      </RequirePermission>
    );
  };

  WithPermissionComponent.displayName = `withPermission(${displayName})`;

  return WithPermissionComponent;
}

/**
 * Higher-Order Component for role checking
 * 
 * Usage:
 * ```tsx
 * const AdminOnlyComponent = withRole(MyComponent, { minimum: 'ADMIN' });
 * ```
 */
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { role?: EmployeeRole; minimum?: EmployeeRole; roles?: EmployeeRole[] },
  FallbackComponent?: React.ComponentType
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithRoleComponent: React.FC<P> = (props) => {
    return (
      <RequireRole
        {...options}
        fallback={FallbackComponent ? <FallbackComponent /> : <AccessDenied />}
      >
        <WrappedComponent {...props} />
      </RequireRole>
    );
  };

  WithRoleComponent.displayName = `withRole(${displayName})`;

  return WithRoleComponent;
}

// Default exports
export default RequirePermission;

