import { gql } from '@apollo/client';

/**
 * Permission Definition Mutations
 */
export const CREATE_PERMISSION_DEFINITION = gql`
  mutation CreatePermissionDefinition($createPermissionDefinitionInput: CreatePermissionDefinitionInput!) {
    createPermissionDefinition(createPermissionDefinitionInput: $createPermissionDefinitionInput) {
      permissionDefinitionId
      code
      label
      description
      action
      scope
      module
      isSystemDefault
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PERMISSION_DEFINITION = gql`
  mutation UpdatePermissionDefinition($updatePermissionDefinitionInput: UpdatePermissionDefinitionInput!) {
    updatePermissionDefinition(updatePermissionDefinitionInput: $updatePermissionDefinitionInput) {
      permissionDefinitionId
      code
      label
      description
      action
      scope
      module
      isSystemDefault
      createdAt
      updatedAt
    }
  }
`;

/**
 * Role Mutations
 */
export const CREATE_ROLE = gql`
  mutation CreateRole($createRoleInput: CreateRoleInput!) {
    createRole(createRoleInput: $createRoleInput) {
      roleId
      name
      code
      description
      isCustom
      isSystemRole
      createdAt
      updatedAt
      createdBy {
        employeeId
        fullName
        email
      }
      parentRole {
        roleId
        name
        code
      }
    }
  }
`;

export const UPDATE_ROLE = gql`
  mutation UpdateRole($updateRoleInput: UpdateRoleInput!) {
    updateRole(updateRoleInput: $updateRoleInput) {
      roleId
      name
      code
      description
      isCustom
      isSystemRole
      createdAt
      updatedAt
      createdBy {
        employeeId
        fullName
        email
      }
      parentRole {
        roleId
        name
        code
      }
    }
  }
`;

/**
 * Role Permission Mutations
 */
export const CREATE_ROLE_PERMISSION = gql`
  mutation CreateRolePermission($createRolePermissionInput: CreateRolePermissionInput!) {
    createRolePermission(createRolePermissionInput: $createRolePermissionInput) {
      rolePermissionId
      isActive
      grantedAt
      grantedBy {
        employeeId
        fullName
        email
      }
      permission {
        permissionDefinitionId
        code
        label
        description
        action
        scope
        module
      }
      role {
        roleId
        name
        code
      }
    }
  }
`;

export const UPDATE_ROLE_PERMISSION = gql`
  mutation UpdateRolePermission($updateRolePermissionInput: UpdateRolePermissionInput!) {
    updateRolePermission(updateRolePermissionInput: $updateRolePermissionInput) {
      rolePermissionId
      isActive
      grantedAt
      grantedBy {
        employeeId
        fullName
        email
      }
      permission {
        permissionDefinitionId
        code
        label
        description
        action
        scope
        module
      }
      role {
        roleId
        name
        code
      }
    }
  }
`;

/**
 * User Role Assignment Mutations
 */
export const CREATE_USER_ROLE_ASSIGNMENT = gql`
  mutation CreateUserRoleAssignment($createUserRoleAssignmentInput: CreateUserRoleAssignmentInput!) {
    createUserRoleAssignment(createUserRoleAssignmentInput: $createUserRoleAssignmentInput) {
      userRoleAssignmentId
      isPrimary
      isActive
      expiresAt
      assignedBy {
        employeeId
        fullName
        email
      }
      user {
        employeeId
        fullName
        email
        role
      }
      role {
        roleId
        name
        code
        description
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_ROLE_ASSIGNMENT = gql`
  mutation UpdateUserRoleAssignment($updateUserRoleAssignmentInput: UpdateUserRoleAssignmentInput!) {
    updateUserRoleAssignment(updateUserRoleAssignmentInput: $updateUserRoleAssignmentInput) {
      userRoleAssignmentId
      isPrimary
      isActive
      expiresAt
      revokedAt
      revokedBy {
        employeeId
        fullName
        email
      }
      revocationReason
      assignedBy {
        employeeId
        fullName
        email
      }
      user {
        employeeId
        fullName
        email
        role
      }
      role {
        roleId
        name
        code
        description
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * User Permission Override Mutations
 */
export const CREATE_USER_PERMISSION_OVERRIDE = gql`
  mutation CreateUserPermissionOverride($createUserPermissionOverrideInput: CreateUserPermissionOverrideInput!) {
    createUserPermissionOverride(createUserPermissionOverrideInput: $createUserPermissionOverrideInput) {
      userPermissionOverrideId
      isGranted
      isActive
      reason
      expiresAt
      createdAt
      updatedAt
      user {
        employeeId
        fullName
        email
      }
      permission {
        permissionDefinitionId
        code
        label
        description
        action
        scope
        module
      }
      grantedBy {
        employeeId
        fullName
        email
      }
    }
  }
`;

export const UPDATE_USER_PERMISSION_OVERRIDE = gql`
  mutation UpdateUserPermissionOverride($updateUserPermissionOverrideInput: UpdateUserPermissionOverrideInput!) {
    updateUserPermissionOverride(updateUserPermissionOverrideInput: $updateUserPermissionOverrideInput) {
      userPermissionOverrideId
      isGranted
      isActive
      reason
      expiresAt
      createdAt
      updatedAt
      user {
        employeeId
        fullName
        email
      }
      permission {
        permissionDefinitionId
        code
        label
        description
        action
        scope
        module
      }
    }
  }
`;