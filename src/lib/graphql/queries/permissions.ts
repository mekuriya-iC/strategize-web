import { gql } from '@apollo/client';

/**
 * Permission Definitions Queries
 */
export const GET_PERMISSION_DEFINITIONS = gql`
  query GetPermissionDefinitions($page: Int!, $limit: Int!, $search: String) {
    permissionDefinitions(page: $page, limit: $limit, search: $search) {
      items {
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
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

/**
 * Roles Queries
 */
export const GET_ROLES = gql`
  query GetRoles($page: Int!, $limit: Int!, $search: String) {
    roles(page: $page, limit: $limit, search: $search) {
      items {
        roleId
        name
        code
        description
        isCustom
        isSystemRole
        isDeleted
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
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

export const GET_ROLE = gql`
  query GetRole($roleId: ID!) {
    role(roleId: $roleId) {
      roleId
      name
      code
      description
      isCustom
      isSystemRole
      isDeleted
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
 * Role Permissions Queries
 */
export const GET_ROLE_PERMISSIONS = gql`
  query GetRolePermissions($roleId: ID!, $page: Int!, $limit: Int!) {
    rolePermissions(roleId: $roleId, page: $page, limit: $limit) {
      items {
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
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

/**
 * User Role Assignments Queries
 */
export const GET_USER_ROLE_ASSIGNMENTS = gql`
  query GetUserRoleAssignments($userId: ID, $roleId: ID, $page: Int!, $limit: Int!) {
    userRoleAssignments(userId: $userId, roleId: $roleId, page: $page, limit: $limit) {
      items {
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
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

/**
 * User Permission Overrides Queries
 */
export const GET_USER_PERMISSION_OVERRIDES = gql`
  query GetUserPermissionOverrides($userId: ID, $page: Int!, $limit: Int!) {
    userPermissionOverrides(userId: $userId, page: $page, limit: $limit) {
      items {
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
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;