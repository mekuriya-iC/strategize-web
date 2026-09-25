"use client";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/types/graphql";

export function ReportingManagerSelect({
  employee,
  value,
  onChange,
}: {
  employee: Employee;
  value: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const { data, loading, error } = useQuery(GET_EMPLOYEES, {
    variables: { search, page: 1, limit: 50 },
  });
  const candidates: Employee[] = (data?.employees?.items || []).filter(
    (candidate: Employee) =>
      candidate.employeeId !== employee.employeeId &&
      candidate.status === "ACTIVE" &&
      candidate.organizationId === employee.organizationId,
  );
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="reporting-manager">
        Reports directly to
      </label>
      <Input
        aria-label="Search reporting managers"
        placeholder="Search manager by name or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <select
        id="reporting-manager"
        className="w-full rounded-md border bg-background p-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">No reporting manager</option>
        {value &&
          !candidates.some((candidate) => candidate.employeeId === value) && (
            <option value={value}>{employee.manager?.fullName || value}</option>
          )}
        {candidates.map((candidate) => (
          <option key={candidate.employeeId} value={candidate.employeeId}>
            {candidate.fullName} · {candidate.role}
          </option>
        ))}
      </select>
      {loading && (
        <p className="text-sm text-muted-foreground">Loading managers…</p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          Could not load managers. {error.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        For CEO logbook approval, assign the CEO as the director or department
        head’s direct reporting manager. This does not change department
        membership.
      </p>
    </div>
  );
}
