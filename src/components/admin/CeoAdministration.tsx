"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_SYSTEM_CONFIGURATION_BY_ORG } from "@/lib/graphql/queries/systemConfiguration";
import {
  GET_ROLES,
  GET_PERMISSION_DEFINITIONS,
  GET_USER_ROLE_ASSIGNMENTS,
  GET_USER_PERMISSION_OVERRIDES,
  GET_ROLE_PERMISSIONS,
} from "@/lib/graphql/queries/permissions";
import { getRolePermissions, ROLE_LABELS } from "@/lib/rbac/roles";
import type { EmployeeRole } from "@/types/graphql";

const sections = {
  employees: {
    label: "Account roles",
    query: GET_EMPLOYEES,
    result: "employees",
    columns: ["fullName", "email", "role", "status"],
  },
  roles: {
    label: "Role definitions",
    query: GET_ROLES,
    result: "roles",
    columns: ["name", "code", "description", "isSystemRole"],
  },
  permissions: {
    label: "Permission definitions",
    query: GET_PERMISSION_DEFINITIONS,
    result: "permissionDefinitions",
    columns: ["label", "code", "action", "scope"],
  },
  assignments: {
    label: "Role assignments",
    query: GET_USER_ROLE_ASSIGNMENTS,
    result: "userRoleAssignments",
    columns: [
      "user.fullName",
      "role.name",
      "isPrimary",
      "isActive",
      "expiresAt",
    ],
  },
  overrides: {
    label: "Permission assignments",
    query: GET_USER_PERMISSION_OVERRIDES,
    result: "userPermissionOverrides",
    columns: [
      "user.fullName",
      "permission.label",
      "isGranted",
      "isActive",
      "expiresAt",
    ],
  },
};
type Section = keyof typeof sections;
type Row = Record<string, unknown>;
const title = (key: string) =>
  key
    .replace(/.*\./, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());
function value(row: Row, key: string): string {
  let result: unknown = row;
  for (const part of key.split("."))
    result =
      result && typeof result === "object" ? (result as Row)[part] : null;
  return result == null
    ? "—"
    : typeof result === "boolean"
      ? result
        ? "Yes"
        : "No"
      : String(result);
}

export default function CeoAdministration({
  initial = "employees",
}: {
  initial?: Section | "configuration";
}) {
  const [section, setSection] = useState<Section | "configuration">(initial);
  const [page, setPage] = useState(1);
  const [builtInRole, setBuiltInRole] = useState<EmployeeRole>("CEO");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const user = useAuthStore((state) => state.user);
  const definition =
    sections[section === "configuration" ? "employees" : section];
  const { data, loading, error } = useQuery(definition.query, {
    variables: { page, limit: 50 },
    skip: section === "configuration" || user?.role !== "CEO",
    fetchPolicy: "cache-and-network",
  });
  const configuration = useQuery(GET_SYSTEM_CONFIGURATION_BY_ORG, {
    variables: { organizationId: user?.organizationId },
    skip:
      section !== "configuration" ||
      !user?.organizationId ||
      user.role !== "CEO",
  });
  const grants = useQuery(GET_ROLE_PERMISSIONS, {
    variables: { roleId: selectedRole, page: 1, limit: 1000 },
    skip: !selectedRole || section !== "roles" || user?.role !== "CEO",
  });
  const rows: Row[] = data?.[definition.result]?.items || [];
  const meta = data?.[definition.result]?.meta;
  const config: Row | undefined = configuration.data?.systemConfigurationByOrg;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <p className="text-sm font-semibold text-primary">
          Executive oversight · Read only
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Administration
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inspect configuration and access assignments. Only administrators can
          change these records.
        </p>
        <Link
          className="mt-3 inline-block text-sm font-medium text-primary underline"
          href="/dashboard/admin/logs"
        >
          View activity and audit logs
        </Link>
      </header>
      <nav
        aria-label="Administration sections"
        className="flex flex-wrap gap-2"
      >
        {(
          [...Object.keys(sections), "configuration"] as Array<
            Section | "configuration"
          >
        ).map((key) => (
          <Button
            key={key}
            variant={section === key ? "default" : "outline"}
            onClick={() => {
              setSection(key);
              setPage(1);
              setSelectedRole("");
            }}
          >
            {key === "configuration" ? "Configuration" : sections[key].label}
          </Button>
        ))}
      </nav>
      {section === "configuration" ? (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Organization configuration
          </h2>
          {configuration.loading && <p role="status">Loading configuration…</p>}
          {configuration.error && (
            <p role="alert">
              Could not load configuration: {configuration.error.message}
            </p>
          )}
          {!configuration.loading && !configuration.error && !config && (
            <p>No configuration has been saved for this organization.</p>
          )}
          {config && (
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.keys(config)
                .filter(
                  (key) =>
                    ![
                      "__typename",
                      "systemConfigurationId",
                      "updatedBy",
                    ].includes(key),
                )
                .map((key) => (
                  <div key={key}>
                    <dt className="text-sm text-muted-foreground">
                      {title(key)}
                    </dt>
                    <dd className="mt-1 break-words font-medium">
                      {value(config, key)}
                    </dd>
                  </div>
                ))}
              <div>
                <dt className="text-sm text-muted-foreground">
                  Last updated by
                </dt>
                <dd>{value(config, "updatedBy.fullName")}</dd>
              </div>
            </dl>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border bg-card">
          <h2 className="p-5 text-lg font-semibold">{definition.label}</h2>
          {loading && (
            <p className="px-5 pb-4" role="status">
              Loading…
            </p>
          )}
          {error && (
            <p className="px-5 pb-4 text-destructive" role="alert">
              Could not load records: {error.message}
            </p>
          )}
          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    {definition.columns.map((key) => (
                      <th className="px-5 py-3 font-medium" key={key}>
                        {title(key)}
                      </th>
                    ))}
                    {section === "roles" && (
                      <th className="px-5 py-3">Permissions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t">
                      {definition.columns.map((key) => (
                        <td className="px-5 py-3" key={key}>
                          {value(row, key)}
                        </td>
                      ))}
                      {section === "roles" && (
                        <td className="px-5 py-3">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedRole(String(row.roleId))}
                          >
                            Inspect
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && rows.length === 0 && (
                <p className="p-5 text-muted-foreground">No records found.</p>
              )}
            </div>
          )}
          <footer className="flex items-center justify-between border-t p-4 text-sm">
            <span>
              Page {page} · {meta?.totalItems ?? "—"} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={loading || !meta || page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </footer>
        </section>
      )}
      {section === "roles" && selectedRole && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Stored role permission grants</h2>
          {grants.loading && <p>Loading…</p>}
          {grants.error && <p role="alert">{grants.error.message}</p>}
          {(grants.data?.rolePermissions?.items || []).map(
            (grant: Row, index: number) => (
              <p className="mt-2 text-sm" key={index}>
                {value(grant, "permission.label")} · Active:{" "}
                {value(grant, "isActive")}
              </p>
            ),
          )}
          {!grants.loading &&
            !grants.error &&
            !grants.data?.rolePermissions?.items?.length && (
              <p className="mt-2 text-sm text-muted-foreground">
                No stored grants. Built-in account-role access is shown below.
              </p>
            )}
        </section>
      )}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Built-in account-role capabilities</h2>
        <p className="my-2 text-sm text-muted-foreground">
          Account roles determine built-in access. Reporting relationships and
          API authorization further restrict actions. CEO grants never include
          administrator write access.
        </p>
        <select
          aria-label="Inspect built-in role"
          className="my-2 rounded-md border bg-background p-2"
          value={builtInRole}
          onChange={(event) =>
            setBuiltInRole(event.target.value as EmployeeRole)
          }
        >
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <option key={role} value={role}>
              {label}
            </option>
          ))}
        </select>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {getRolePermissions(builtInRole).map((permission) => (
            <li
              className="break-words rounded bg-muted px-3 py-2"
              key={permission}
            >
              {permission}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
