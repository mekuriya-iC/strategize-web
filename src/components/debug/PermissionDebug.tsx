"use client";

import { useQuery } from "@apollo/client";
import { GET_PERMISSION_DEFINITIONS, GET_ROLES } from "@/lib/graphql/queries/permissions";
import { usePermissions } from "@/hooks/permissions/usePermissions";

export default function PermissionDebug() {
  const { guards, role, isLoading: permissionsLoading } = usePermissions();
  
  const { data: permissionsData, loading: permissionsQueryLoading, error: permissionsError } = useQuery(
    GET_PERMISSION_DEFINITIONS,
    {
      variables: { page: 1, limit: 10, search: "" },
      errorPolicy: "all"
    }
  );

  const { data: rolesData, loading: rolesQueryLoading, error: rolesError } = useQuery(
    GET_ROLES,
    {
      variables: { page: 1, limit: 10, search: "" },
      errorPolicy: "all"
    }
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Permission System Debug</h3>
      
      {/* User Info */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded">
        <h4 className="font-medium mb-2">Current User</h4>
        <p><strong>Role:</strong> {role || "Not loaded"}</p>
        <p><strong>Is Super Admin:</strong> {guards.isSuperAdmin ? "Yes" : "No"}</p>
        <p><strong>Is Admin:</strong> {guards.isAdmin ? "Yes" : "No"}</p>
        <p><strong>Permissions Loading:</strong> {permissionsLoading ? "Yes" : "No"}</p>
      </div>

      {/* Permission Definitions Query */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded">
        <h4 className="font-medium mb-2">Permission Definitions Query</h4>
        <p><strong>Loading:</strong> {permissionsQueryLoading ? "Yes" : "No"}</p>
        {permissionsError && (
          <div className="text-red-600">
            <p><strong>Error:</strong> {permissionsError.message}</p>
            {permissionsError.graphQLErrors?.map((err, i) => (
              <p key={i}><strong>GraphQL Error {i + 1}:</strong> {err.message}</p>
            ))}
            {permissionsError.networkError && (
              <p><strong>Network Error:</strong> {permissionsError.networkError.message}</p>
            )}
          </div>
        )}
        {permissionsData && (
          <div className="text-green-600">
            <p><strong>Success:</strong> Found {permissionsData.permissionDefinitions?.items?.length || 0} permissions</p>
            {permissionsData.permissionDefinitions?.items?.slice(0, 3).map((perm: any) => (
              <p key={perm.permissionDefinitionId} className="text-sm">
                - {perm.label} ({perm.code})
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Roles Query */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded">
        <h4 className="font-medium mb-2">Roles Query</h4>
        <p><strong>Loading:</strong> {rolesQueryLoading ? "Yes" : "No"}</p>
        {rolesError && (
          <div className="text-red-600">
            <p><strong>Error:</strong> {rolesError.message}</p>
            {rolesError.graphQLErrors?.map((err, i) => (
              <p key={i}><strong>GraphQL Error {i + 1}:</strong> {err.message}</p>
            ))}
            {rolesError.networkError && (
              <p><strong>Network Error:</strong> {rolesError.networkError.message}</p>
            )}
          </div>
        )}
        {rolesData && (
          <div className="text-green-600">
            <p><strong>Success:</strong> Found {rolesData.roles?.items?.length || 0} roles</p>
            {rolesData.roles?.items?.slice(0, 3).map((role: any) => (
              <p key={role.roleId} className="text-sm">
                - {role.name} ({role.code})
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}