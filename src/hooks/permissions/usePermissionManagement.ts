import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import {
  GET_PERMISSION_DEFINITIONS,
  GET_ROLES,
  GET_ROLE,
  GET_ROLE_PERMISSIONS,
  GET_USER_ROLE_ASSIGNMENTS,
  GET_USER_PERMISSION_OVERRIDES,
} from '@/lib/graphql/queries/permissions';
import {
  CREATE_ROLE,
  UPDATE_ROLE,
  CREATE_ROLE_PERMISSION,
  UPDATE_ROLE_PERMISSION,
  CREATE_USER_ROLE_ASSIGNMENT,
  UPDATE_USER_ROLE_ASSIGNMENT,
  CREATE_USER_PERMISSION_OVERRIDE,
  UPDATE_USER_PERMISSION_OVERRIDE,
} from '@/lib/graphql/mutations/permissions';

// Permission Definitions Hook
export const usePermissionDefinitions = (page = 1, limit = 50, search = '') => {
  const { data, loading, error, refetch } = useQuery(GET_PERMISSION_DEFINITIONS, {
    variables: { page, limit, search },
    fetchPolicy: 'cache-and-network',
  });

  return {
    permissions: data?.permissionDefinitions?.items || [],
    meta: data?.permissionDefinitions?.meta,
    loading,
    error,
    refetch,
  };
};

// Roles Hook
export const useRoles = (page = 1, limit = 50, search = '') => {
  const { data, loading, error, refetch } = useQuery(GET_ROLES, {
    variables: { page, limit, search: search || undefined },
    fetchPolicy: 'cache-and-network',
  });

  console.log('🔐 [useRoles] Query result:', {
    data,
    loading,
    error: error?.message,
    variables: { page, limit, search: search || undefined }
  });

  return {
    roles: data?.roles?.items || [],
    meta: data?.roles?.meta,
    loading,
    error,
    refetch,
  };
};

// Single Role Hook
export const useRole = (roleId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_ROLE, {
    variables: { roleId },
    skip: !roleId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    role: data?.role,
    loading,
    error,
    refetch,
  };
};

// Role Permissions Hook
export const useRolePermissions = (roleId: string, page = 1, limit = 100) => {
  const { data, loading, error, refetch } = useQuery(GET_ROLE_PERMISSIONS, {
    variables: { roleId, page, limit },
    skip: !roleId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    rolePermissions: data?.rolePermissions?.items || [],
    meta: data?.rolePermissions?.meta,
    loading,
    error,
    refetch,
  };
};

// User Role Assignments Hook
export const useUserRoleAssignments = (userId?: string, roleId?: string, page = 1, limit = 50) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_ROLE_ASSIGNMENTS, {
    variables: { userId, roleId, page, limit },
    fetchPolicy: 'cache-and-network',
  });

  return {
    assignments: data?.userRoleAssignments?.items || [],
    meta: data?.userRoleAssignments?.meta,
    loading,
    error,
    refetch,
  };
};

// User Permission Overrides Hook
export const useUserPermissionOverrides = (userId: string, page = 1, limit = 50) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_PERMISSION_OVERRIDES, {
    variables: { userId, page, limit },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    overrides: data?.userPermissionOverrides?.items || [],
    meta: data?.userPermissionOverrides?.meta,
    loading,
    error,
    refetch,
  };
};

// Permission Management Mutations Hook
export const usePermissionMutations = () => {
  const organizationId = useOrganizationId();
  const [createRole] = useMutation(CREATE_ROLE, {
    onCompleted: () => {
      toast.success('Role created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });

  const [updateRole] = useMutation(UPDATE_ROLE, {
    onCompleted: () => {
      toast.success('Role updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const [createRolePermission] = useMutation(CREATE_ROLE_PERMISSION, {
    onCompleted: () => {
      toast.success('Permission granted to role');
    },
    onError: (error) => {
      toast.error(`Failed to grant permission: ${error.message}`);
    },
  });

  const [updateRolePermission] = useMutation(UPDATE_ROLE_PERMISSION, {
    onCompleted: () => {
      toast.success('Role permission updated');
    },
    onError: (error) => {
      toast.error(`Failed to update permission: ${error.message}`);
    },
  });

  const [createUserRoleAssignment] = useMutation(CREATE_USER_ROLE_ASSIGNMENT, {
    onCompleted: () => {
      toast.success('Role assigned to user');
    },
    onError: (error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  const [updateUserRoleAssignment] = useMutation(UPDATE_USER_ROLE_ASSIGNMENT, {
    onCompleted: () => {
      toast.success('User role assignment updated');
    },
    onError: (error) => {
      toast.error(`Failed to update assignment: ${error.message}`);
    },
  });

  const [createUserPermissionOverride] = useMutation(CREATE_USER_PERMISSION_OVERRIDE, {
    onCompleted: () => {
      toast.success('Permission override created');
    },
    onError: (error) => {
      toast.error(`Failed to create override: ${error.message}`);
    },
  });

  const [updateUserPermissionOverride] = useMutation(UPDATE_USER_PERMISSION_OVERRIDE, {
    onCompleted: () => {
      toast.success('Permission override updated');
    },
    onError: (error) => {
      toast.error(`Failed to update override: ${error.message}`);
    },
  });

  return {
    createRole: async (input: any) => {
      const result = await createRole({ variables: { createRoleInput: input } });
      return result.data?.createRole;
    },
    updateRole: async (input: any) => {
      const result = await updateRole({ variables: { updateRoleInput: input } });
      return result.data?.updateRole;
    },
    grantPermissionToRole: async (roleId: string, permissionId: string) => {
      const result = await createRolePermission({
        variables: {
          createRolePermissionInput: {
            roleId,
            permissionId,
          },
        },
      });
      return result.data?.createRolePermission;
    },
    revokePermissionFromRole: async (rolePermissionId: string) => {
      const result = await updateRolePermission({
        variables: {
          updateRolePermissionInput: {
            rolePermissionId,
            isActive: false,
          },
        },
      });
      return result.data?.updateRolePermission;
    },
    assignRoleToUser: async (userId: string, roleId: string, isPrimary = false, expiresAt?: string) => {
      const result = await createUserRoleAssignment({
        variables: {
          createUserRoleAssignmentInput: {
            userId,
            roleId,
            isPrimary,
            expiresAt,
            organizationId,
          },
        },
      });
      return result.data?.createUserRoleAssignment;
    },
    revokeRoleFromUser: async (userRoleAssignmentId: string, reason?: string) => {
      const result = await updateUserRoleAssignment({
        variables: {
          updateUserRoleAssignmentInput: {
            userRoleAssignmentId,
            isActive: false,
            revocationReason: reason,
            revokedAt: new Date().toISOString(),
          },
        },
      });
      return result.data?.updateUserRoleAssignment;
    },
    createPermissionOverride: async (userId: string, permissionId: string, isGranted: boolean, reason: string, expiresAt?: string) => {
      const result = await createUserPermissionOverride({
        variables: {
          createUserPermissionOverrideInput: {
            userId,
            permissionId,
            isGranted,
            reason,
            expiresAt,
            organizationId,
          },
        },
      });
      return result.data?.createUserPermissionOverride;
    },
    updatePermissionOverride: async (userPermissionOverrideId: string, isActive: boolean, reason?: string) => {
      const result = await updateUserPermissionOverride({
        variables: {
          updateUserPermissionOverrideInput: {
            userPermissionOverrideId,
            isActive,
            reason,
          },
        },
      });
      return result.data?.updateUserPermissionOverride;
    },
  };
};