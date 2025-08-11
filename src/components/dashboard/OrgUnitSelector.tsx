"use client";

import React, { useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useUser } from "@/context/UserContext";
import { useOrgUnit } from "@/context/OrgUnitContext";
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
  const { user, loading: userLoading } = useUser();
  const { selectedUnit, setSelectedUnit } = useOrgUnit();

  // Debug logging - remove in production
  // console.log("OrgUnitSelector Debug:", {
  //   user: user,
  //   userRole: user?.role,
  //   userEmployeeId: user?.employeeId,
  //   userLoading,
  // });

  const { data: divisionsData, loading: divisionsLoading } = useQuery(
    GET_DIVISIONS,
    {
      skip: user?.role !== "MANAGER",
      variables: { page: 1, limit: 1000 }, // Fetch all
    }
  );
  const { data: departmentsData, loading: departmentsLoading } = useQuery(
    GET_DEPARTMENTS,
    {
      skip: user?.role !== "MANAGER",
      variables: { page: 1, limit: 1000 }, // Fetch all
    }
  );

  const orgUnits: OrgUnitUnion[] = useMemo(() => {
    const divisions =
      divisionsData?.divisions.items.filter(
        (d: Division) => d.manager?.employeeId === user?.employeeId
      ) || [];

    const departments =
      departmentsData?.departments.items.filter(
        (d: Department) => d.manager?.employeeId === user?.employeeId
      ) || [];

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
  }, [divisionsData, departmentsData, user?.employeeId]);

  // Debug logging for data - remove in production
  // console.log("OrgUnitSelector Data Debug:", {
  //   divisionsData: divisionsData?.divisions?.items,
  //   departmentsData: departmentsData?.departments?.items,
  //   managedDivisions,
  //   managedDepartments,
  //   orgUnits,
  //   currentUserEmployeeId: user?.employeeId,
  // });

  // Default selection: prefer first Division, otherwise first Department
  // This hook MUST always run, regardless of early returns
  useEffect(() => {
    if (!selectedUnit && orgUnits.length > 0) {
      const firstDivision = orgUnits.find((u) => u.__typename === "Division");
      const firstDepartment = orgUnits.find(
        (u) => u.__typename === "Department"
      );
      if (firstDivision) {
        setSelectedUnit(firstDivision as OrgUnitUnion);
      } else if (firstDepartment) {
        setSelectedUnit(firstDepartment as OrgUnitUnion);
      }
    }
  }, [orgUnits, selectedUnit, setSelectedUnit]);

  // Early returns AFTER all hooks
  if (userLoading || divisionsLoading || departmentsLoading) {
    return <Skeleton className="h-10 w-48 ml-4" />;
  }

  if (user?.role !== "MANAGER") {
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

    setSelectedUnit(unit || null);
  };

  const selectedValue = selectedUnit
    ? `${selectedUnit.__typename}:${
        selectedUnit.__typename === "Division"
          ? (selectedUnit as Division).divisionId
          : (selectedUnit as Department).departmentId
      }`
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
