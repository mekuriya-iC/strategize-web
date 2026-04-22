"use client";

import React, { useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useAuthStore, useOrgUnitStore } from "@/stores";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Division, Department } from "@/types/graphql";

type OrgUnitUnion =
  | (Division & { __typename: "Division" })
  | (Department & { __typename: "Department" });

export default function OrgUnitSelector() {
  const { user, isLoading: userLoading } = useAuthStore();
  const { selectedUnit, setSelectedUnit } = useOrgUnitStore();

  // Directors and Managers need to fetch their managed units
  const needsOrgUnitSelection = user?.role === "MANAGER" || user?.role === "DIRECTOR";
  
  const { data: divisionsData, loading: divisionsLoading } = useQuery(
    GET_DIVISIONS,
    {
      skip: !needsOrgUnitSelection,
      variables: { page: 1, limit: 1000 }, // Fetch all
    }
  );
  const { data: departmentsData, loading: departmentsLoading } = useQuery(
    GET_DEPARTMENTS,
    {
      skip: !needsOrgUnitSelection,
      variables: { page: 1, limit: 1000 }, // Fetch all
    }
  );

  const orgUnits: OrgUnitUnion[] = useMemo(() => {
    // Directors only see divisions they manage
    // Managers see both divisions and departments they manage
    const divisions =
      divisionsData?.divisions.items.filter(
        (d: Division) => d.manager?.employeeId === user?.employeeId
      ) || [];

    // Only include departments for Managers, not Directors
    const departments = user?.role === "MANAGER"
      ? departmentsData?.departments.items.filter(
        (d: Department) => d.manager?.employeeId === user?.employeeId
        ) || []
      : [];

    return [
      ...divisions.map((d: Division) => ({
        ...d,
        __typename: "Division" as const,
      })),
      ...departments.map((d: Department) => ({
        ...d,
        __typename: "Department" as const,
      })),
    ];
  }, [divisionsData, departmentsData, user?.employeeId, user?.role]);

  // Default selection: prefer first Division, otherwise first Department
  // This hook MUST always run, regardless of early returns
  // Auto-select when:
  // 1. No unit is selected AND units are available
  // 2. Selected unit is no longer in the available units (e.g., user switched accounts)
  useEffect(() => {
    if (orgUnits.length === 0) return;

    // Check if current selection is still valid
    const isCurrentSelectionValid = selectedUnit && orgUnits.some((u) => {
      if (u.__typename === "Division" && selectedUnit.type === "division") {
        return (u as Division).divisionId === selectedUnit.id;
      }
      if (u.__typename === "Department" && selectedUnit.type === "department") {
        return (u as Department).departmentId === selectedUnit.id;
      }
      return false;
    });

    // Auto-select if no selection or selection is invalid
    if (!selectedUnit || !isCurrentSelectionValid) {
      const firstDivision = orgUnits.find((u) => u.__typename === "Division");
      const firstDepartment = orgUnits.find(
        (u) => u.__typename === "Department"
      );
      if (firstDivision) {
        const div = firstDivision as Division & { __typename: "Division" };
        setSelectedUnit({
          id: div.divisionId,
          name: div.name,
          type: "division",
          data: div,
        });
      } else if (firstDepartment) {
        const dept = firstDepartment as Department & { __typename: "Department" };
        setSelectedUnit({
          id: dept.departmentId,
          name: dept.name,
          type: "department",
          data: dept,
        });
      }
    }
  }, [orgUnits, selectedUnit, setSelectedUnit]);

  // Early returns AFTER all hooks
  if (userLoading || divisionsLoading || departmentsLoading) {
    return <Skeleton className="h-10 w-48 ml-4" />;
  }

  if (user?.role !== "MANAGER" && user?.role !== "DIRECTOR") {
    return null;
  }

  if (orgUnits.length === 0) {
    return null;
  }

  const handleValueChange = (value: string) => {
    const [typename, id] = value.split(":");

    const unit = orgUnits.find((u) => {
      if (u.__typename === "Division" && typename === "Division") {
        return (u as Division).divisionId === id;
      }
      if (u.__typename === "Department" && typename === "Department") {
        return (u as Department).departmentId === id;
      }
      return false;
    });

    if (unit) {
      if (unit.__typename === "Division") {
        setSelectedUnit({
          id: (unit as Division).divisionId,
          name: unit.name,
          type: "division",
          data: unit,
        });
      } else {
        setSelectedUnit({
          id: (unit as Department).departmentId,
          name: unit.name,
          type: "department",
          data: unit,
        });
      }
    } else {
      setSelectedUnit(null);
    }
  };

  const selectedValue = selectedUnit
    ? `${selectedUnit.type === "division" ? "Division" : "Department"}:${selectedUnit.id}`
    : "";

  return (
    <div className="ml-4">
      <Select onValueChange={handleValueChange} value={selectedValue}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select Division/Dept..." />
        </SelectTrigger>
        <SelectContent>
          {orgUnits.map((unit) => {
            const id =
              unit.__typename === "Division"
                ? unit.divisionId
                : unit.departmentId;
            return (
              <SelectItem
                key={`${unit.__typename}:${id}`}
                value={`${unit.__typename}:${id}`}
              >
                {unit.name} ({unit.__typename})
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
