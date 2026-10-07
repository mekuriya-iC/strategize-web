"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Search, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_EVIDENCE_APPROVER_AUTHORIZATIONS } from "@/lib/graphql/queries/logbook";
import { CONFIGURE_EVIDENCE_APPROVER } from "@/lib/graphql/mutations/logbook";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EmployeeRow {
  employeeId: string;
  fullName: string;
  email: string;
  title?: string | null;
  role: string;
  status: string;
}

export default function EvidenceApproversAdminPage() {
  const [search, setSearch] = useState("");
  const { data: employeeData, loading: employeesLoading } = useQuery(
    GET_EMPLOYEES,
    { variables: { page: 1, limit: 1000, search: "" } },
  );
  const { data: authorizationData, loading: authorizationsLoading, refetch } =
    useQuery(GET_EVIDENCE_APPROVER_AUTHORIZATIONS, {
      fetchPolicy: "cache-and-network",
    });
  const [configure, { loading: saving }] = useMutation(
    CONFIGURE_EVIDENCE_APPROVER,
  );

  const activeByEmployee = useMemo(
    () =>
      new Map<string, boolean>(
        (authorizationData?.evidenceApproverAuthorizations || []).map(
          (authorization: { employee: { employeeId: string }; isActive: boolean }) => [
            authorization.employee.employeeId,
            authorization.isActive,
          ],
        ),
      ),
    [authorizationData],
  );
  const employees = ((employeeData?.employees?.items || []) as EmployeeRow[]).filter(
    (employee) =>
      employee.status === "ACTIVE" &&
      `${employee.fullName} ${employee.email} ${employee.title || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const updateAuthorization = async (employee: EmployeeRow, isActive: boolean) => {
    try {
      await configure({ variables: { employeeId: employee.employeeId, isActive } });
      toast.success(
        isActive
          ? `${employee.fullName} can now approve evidence.`
          : `${employee.fullName}'s evidence approval access was revoked.`,
      );
      await refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update evidence approval access.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evidence approvers</h1>
            <p className="text-sm text-gray-600">
              Authorize trusted users who may verify logbook evidence before final approval.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees by name, email, or title"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {(employeesLoading || authorizationsLoading) && !employeeData ? (
          <p className="p-8 text-center text-gray-500">Loading employees…</p>
        ) : employees.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No matching active employees.</p>
        ) : (
          <div className="divide-y">
            {employees.map((employee) => {
              const isActive = activeByEmployee.get(employee.employeeId) === true;
              return (
                <div
                  key={employee.employeeId}
                  className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gray-100 p-2 text-gray-500">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{employee.fullName}</p>
                        <Badge variant="outline">{employee.role}</Badge>
                        {isActive && <Badge className="bg-green-100 text-green-700">Authorized</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">
                        {employee.title || "Employee"} · {employee.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isActive ? "outline" : "default"}
                    disabled={saving}
                    onClick={() => void updateAuthorization(employee, !isActive)}
                    className={isActive ? "text-red-700" : ""}
                  >
                    {isActive ? "Revoke access" : "Authorize"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
