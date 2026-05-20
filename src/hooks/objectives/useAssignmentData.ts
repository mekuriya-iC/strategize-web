"use client";

import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS, GET_DEPARTMENT, GET_DEPARTMENT_SAFE } from "@/lib/graphql/queries/departments";
import { GET_DIVISION, GET_DIVISION_SAFE } from "@/lib/graphql/queries/divisions";
import { GET_EMPLOYEES, GET_DIRECT_REPORTS } from "@/lib/graphql/queries/employees";
import { useAssignmentContext, type AssigneeType } from "@/context/AssignmentContext";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import type { Division, Department, Employee } from "@/types/graphql";

export function useAssignmentData(assigneeTypeOverride?: AssigneeType) {
    const context = useAssignmentContext();
    const searchTerm = context.searchTerm;
    const sourceObjective = context.sourceObjective;
    const assigneeType = assigneeTypeOverride || context.assigneeType;
    const { guards } = usePermissions();
    const isAdmin = guards.isAdmin || guards.isSuperAdmin;

    // 1. Fetching Divisions (Corporate -> Division)
    // Logic: Always fetch all/search divisions as Corporate can assign to any.
    const shouldFetchDivisions = assigneeType === "DIVISION";
    const { data: divisionsData, loading: loadingDivisions } = useQuery(GET_DIVISIONS, {
        variables: { page: 1, limit: 50, search: searchTerm },
        skip: !shouldFetchDivisions,
        fetchPolicy: "cache-and-network",
    });

    // Determine effective source level:
    // For cascaded objectives, assigneeType reflects the actual level (e.g., a CORPORATE-type
    // objective assigned to DIVISION has assigneeType=DIVISION). Use assigneeType first.
    const sourceObjectiveType = sourceObjective?.type?.toUpperCase();
    const effectiveSourceType = sourceObjective?.assigneeType?.toUpperCase() || sourceObjectiveType;
    const isDivisionSource = effectiveSourceType === "DIVISION" && sourceObjective?.assigneeId;
    const isDepartmentSource = effectiveSourceType === "DEPARTMENT" && sourceObjective?.assigneeId;
    const shouldFetchDepartments = assigneeType === "DEPARTMENT";
    const shouldFetchPersonnel = assigneeType === "PERSONNEL";

    // Use full GET_DEPARTMENTS to get employees and division info safely for local filtering
    const { data: allDepartmentsData, loading: loadingAllDepartments } = useQuery(GET_DEPARTMENTS, {
        variables: { page: 1, limit: 1000 },
        skip: !shouldFetchDepartments && !shouldFetchPersonnel,
        fetchPolicy: "cache-and-network",
    });

    // 3. Fetching Personnel
    // Scenario: Department -> Personnel. Source is Department. Fetch ONLY employees in that department.

    // 4. Fetch Global Employees - SKIP for non-admins as backend restricts it
    const { data: globalEmployeesData, loading: loadingGlobalEmployees } = useQuery(GET_EMPLOYEES, {
        variables: {
            page: 1,
            limit: 1000,
            search: searchTerm || undefined
        },
        skip: !isAdmin || !shouldFetchPersonnel, // Skip if not admin or not fetching personnel
        fetchPolicy: "cache-first",
    });

    // B: Fetch scoped division/department data ONLY for listing names/basic info if needed
    // But we'll try to rely on allDepartmentsData for most filtering to stay stable.
    const { data: scopedDivisionData, loading: loadingScopedDivision } = useQuery(GET_DIVISION_SAFE, {
        variables: { divisionId: sourceObjective?.assigneeId },
        skip: !isDivisionSource,
        fetchPolicy: "cache-and-network",
    });

    const { data: scopedDepartmentData, loading: loadingScopedDepartment } = useQuery(GET_DEPARTMENT_SAFE, {
        variables: { departmentId: sourceObjective?.assigneeId },
        skip: !isDepartmentSource,
        fetchPolicy: "cache-and-network",
    });

    // C: Fetch direct reports of the division/department head
    // This is crucial for divisions that do not have departments, but only have direct employees
    const headUserId = scopedDivisionData?.division?.head?.employeeId || scopedDepartmentData?.department?.head?.employeeId;
    const { data: directReportsData, loading: loadingDirectReports } = useQuery(GET_DIRECT_REPORTS, {
        variables: { managerId: headUserId },
        skip: !shouldFetchPersonnel || !headUserId,
        fetchPolicy: "cache-and-network",
    });

    // Compute final lists
    const availableAssignees = useMemo(() => {
        if (assigneeType === "DIVISION") {
            return divisionsData?.divisions?.items || [];
        }

        if (assigneeType === "DEPARTMENT") {
            const allItems = allDepartmentsData?.departments?.items || [];

            if (isDivisionSource) {
                // Scenario: Division -> Department (Assign kpi to its child departments)
                const activeDivisionId = sourceObjective.assigneeId?.toString();
                // Filter departments where division matches or parent division is this one
                const filtered = allItems.filter((d: any) =>
                    d.division?.divisionId?.toString() === activeDivisionId
                );

                if (!searchTerm) return filtered;
                return filtered.filter((d: any) =>
                    d.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            } else {
                // Corporate Level: Show ALL departments for skip-level assignment
                // (Previously filtered only standalone, but user wants to see their division-linked ones too)
                const filtered = allItems;

                if (!searchTerm) return filtered;
                return filtered.filter((d: any) =>
                    d.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
        }

        if (assigneeType === "PERSONNEL") {
            let allEmployees: any[] = [];
            const allDepts = allDepartmentsData?.departments?.items || [];

            if (isDepartmentSource) {
                // Scenario: Department -> Personnel
                // Use GET_DEPARTMENT_SAFE as it matches the working employee dashboard 
                const dept = scopedDepartmentData?.department;
                if (dept?.employees && dept.employees.length > 0) {
                    allEmployees = dept.employees;
                } else if (!loadingScopedDepartment) {
                    // Fallback to finding it in the allDepts list if scoped fetch is done and empty
                    const sourceId = sourceObjective.assigneeId?.toString();
                    const deptMatch = allDepts.find((d: any) => d.departmentId?.toString() === sourceId);
                    allEmployees = deptMatch?.employees || [];
                }
            } else if (isDivisionSource) {
                // Scenario: Division -> Personnel (Aggregate from its departments)
                // Try scoped division data first for more accuracy
                const divisionDepts = scopedDivisionData?.division?.departments || [];
                const seenIds = new Set();

                if (divisionDepts.length > 0) {
                    divisionDepts.forEach((dept: any) => {
                        const employees = dept.employees || [];
                        employees.forEach((emp: any) => {
                            if (!seenIds.has(emp.employeeId)) {
                                seenIds.add(emp.employeeId);
                                allEmployees.push({
                                    ...emp,
                                    departments: emp.departments || [{ name: dept.name, departmentId: dept.departmentId }]
                                });
                            }
                        });
                    });
                } else if (!loadingScopedDivision) {
                    // Fallback to allDepartmentsData filtering if scoped is empty
                    const activeDivisionId = sourceObjective.assigneeId?.toString();
                    const divisionDeptsFallback = allDepts.filter((d: any) =>
                        d.division?.divisionId?.toString() === activeDivisionId
                    );

                    divisionDeptsFallback.forEach((dept: any) => {
                        const employees = dept.employees || [];
                        employees.forEach((emp: any) => {
                            if (!seenIds.has(emp.employeeId)) {
                                seenIds.add(emp.employeeId);
                                allEmployees.push({
                                    ...emp,
                                    departments: emp.departments || [{ name: dept.name, departmentId: dept.departmentId }]
                                });
                            }
                        });
                    });
                }
            } else if (isAdmin) {
                // Scenario: Corporate -> Personnel (Global)
                allEmployees = globalEmployeesData?.employees?.items || [];
            }

            // Merge in direct reports (to cover employees who report directly to the division head without a department)
            const directReports = directReportsData?.directReports || [];
            if (directReports.length > 0) {
                const existingIds = new Set(allEmployees.map(e => e.employeeId));
                directReports.forEach((emp: any) => {
                    if (!existingIds.has(emp.employeeId)) {
                        allEmployees.push(emp);
                    }
                });
            }

            // CLIENT-SIDE SEARCH
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                allEmployees = allEmployees.filter((emp: any) =>
                    emp.fullName?.toLowerCase().includes(term) ||
                    emp.email?.toLowerCase().includes(term)
                );
            }

            return allEmployees;
        }

        return [];
    }, [
        assigneeType,
        searchTerm,
        divisionsData,
        allDepartmentsData,
        scopedDivisionData,
        scopedDepartmentData,
        globalEmployeesData,
        directReportsData,
        isAdmin,
        isDivisionSource,
        isDepartmentSource,
        sourceObjective
    ]);

    const loading = loadingDivisions || loadingAllDepartments || loadingScopedDivision || loadingScopedDepartment || loadingGlobalEmployees || loadingDirectReports;
    // TODO: Consolidate errors properly. For now return generic error if any failed.
    const error = null;

    return {
        items: availableAssignees,
        loading,
        error
    };
}
