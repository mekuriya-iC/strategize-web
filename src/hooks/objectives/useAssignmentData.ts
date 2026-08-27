"use client";

import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS, GET_DEPARTMENT_SAFE } from "@/lib/graphql/queries/departments";
import { GET_DIVISION_SAFE } from "@/lib/graphql/queries/divisions";
import { GET_EMPLOYEES, GET_DIRECT_REPORTS } from "@/lib/graphql/queries/employees";
import { useAssignmentContext, type AssigneeType } from "@/context/AssignmentContext";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useUser } from "@/stores";
import type { Division, Department, Employee } from "@/types/graphql";

export function useAssignmentData(assigneeTypeOverride?: AssigneeType) {
    const context = useAssignmentContext();
    const searchTerm = context.searchTerm;
    const sourceObjective = context.sourceObjective;
    const assigneeType = assigneeTypeOverride || context.assigneeType;
    const { guards } = usePermissions();
    const currentUser = useUser();
    const organizationId = currentUser?.organizationId;
    const isAdmin = guards.isAdmin || guards.isSuperAdmin;

    // 1. Fetching Divisions (Corporate -> Division)
    // Logic: Always fetch all/search divisions as Corporate can assign to any.
    const shouldFetchDivisions = assigneeType === "DIVISION";
    const { data: divisionsData, loading: loadingDivisions } = useQuery(GET_DIVISIONS, {
        variables: {
            page: 1,
            limit: 50,
            search: searchTerm,
            organizationId,
        },
        skip: !shouldFetchDivisions || !organizationId,
        fetchPolicy: "cache-first",
        nextFetchPolicy: "cache-first",
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
        variables: {
            page: 1,
            limit: 1000,
            organizationId,
            divisionId: isDivisionSource ? sourceObjective?.assigneeId : undefined,
        },
        skip:
            (!shouldFetchDepartments && !shouldFetchPersonnel) ||
            !organizationId,
        fetchPolicy: "cache-first",
        nextFetchPolicy: "cache-first",
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
        fetchPolicy: "cache-first",
        nextFetchPolicy: "cache-first",
    });

    const { data: scopedDepartmentData, loading: loadingScopedDepartment } = useQuery(GET_DEPARTMENT_SAFE, {
        variables: { departmentId: sourceObjective?.assigneeId },
        skip: !isDepartmentSource,
        fetchPolicy: "cache-first",
        nextFetchPolicy: "cache-first",
    });

    // C: Fetch direct reports of the division/department head
    // This is crucial for divisions that do not have departments, but only have direct employees
    const headUserId = scopedDivisionData?.division?.head?.employeeId || scopedDepartmentData?.department?.head?.employeeId;
    const { data: directReportsData, loading: loadingDirectReports } = useQuery(GET_DIRECT_REPORTS, {
        variables: { managerId: headUserId },
        skip: !shouldFetchPersonnel || !headUserId,
        fetchPolicy: "cache-first",
        nextFetchPolicy: "cache-first",
    });

    // Compute final lists
    const availableAssignees = useMemo(() => {
        if (assigneeType === "DIVISION") {
            return (divisionsData?.divisions?.items || []) as Division[];
        }

        if (assigneeType === "DEPARTMENT") {
            const allItems = (allDepartmentsData?.departments?.items || []) as Department[];

            if (isDivisionSource) {
                // Scenario: Division -> Department (Assign kpi to its child departments)
                const activeDivisionId = sourceObjective.assigneeId?.toString();
                // Filter departments where division matches or parent division is this one
                const filtered = allItems.filter(
                    (department) =>
                        department.division?.divisionId?.toString() === activeDivisionId,
                );

                if (!searchTerm) return filtered;
                return filtered.filter((department) =>
                    department.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            } else {
                // Corporate Level: Show ALL departments for skip-level assignment
                // (Previously filtered only standalone, but user wants to see their division-linked ones too)
                const filtered = allItems;

                if (!searchTerm) return filtered;
                return filtered.filter((department) =>
                    department.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
        }

        if (assigneeType === "PERSONNEL") {
            let allEmployees: Employee[] = [];
            const allDepts = (allDepartmentsData?.departments?.items || []) as Department[];

            if (isDepartmentSource) {
                // Scenario: Department -> Personnel
                // Use GET_DEPARTMENT_SAFE as it matches the working employee dashboard 
                const dept = scopedDepartmentData?.department;
                if (dept?.employees && dept.employees.length > 0) {
                    allEmployees = dept.employees;
                } else if (!loadingScopedDepartment) {
                    // Fallback to finding it in the allDepts list if scoped fetch is done and empty
                    const sourceId = sourceObjective.assigneeId?.toString();
                    const deptMatch = allDepts.find(
                        (department) => department.departmentId?.toString() === sourceId,
                    );
                    allEmployees = deptMatch?.employees || [];
                }
            } else if (isDivisionSource) {
                // Scenario: Division -> Personnel (Aggregate from its departments)
                // Try scoped division data first for more accuracy
                const divisionDepts = (scopedDivisionData?.division?.departments || []) as Department[];
                const seenIds = new Set<string>();

                if (divisionDepts.length > 0) {
                    divisionDepts.forEach((department) => {
                        const employees = department.employees || [];
                        employees.forEach((employee) => {
                            if (!seenIds.has(employee.employeeId)) {
                                seenIds.add(employee.employeeId);
                                allEmployees.push({
                                    ...employee,
                                    departments: employee.departments || [{
                                        name: department.name,
                                        departmentId: department.departmentId,
                                    }],
                                });
                            }
                        });
                    });
                } else if (!loadingScopedDivision) {
                    // Fallback to allDepartmentsData filtering if scoped is empty
                    const activeDivisionId = sourceObjective.assigneeId?.toString();
                    const divisionDeptsFallback = allDepts.filter(
                        (department) =>
                            department.division?.divisionId?.toString() === activeDivisionId,
                    );

                    divisionDeptsFallback.forEach((department) => {
                        const employees = department.employees || [];
                        employees.forEach((employee) => {
                            if (!seenIds.has(employee.employeeId)) {
                                seenIds.add(employee.employeeId);
                                allEmployees.push({
                                    ...employee,
                                    departments: employee.departments || [{
                                        name: department.name,
                                        departmentId: department.departmentId,
                                    }],
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
            const directReports = (directReportsData?.directReports || []) as Employee[];
            if (directReports.length > 0) {
                const existingIds = new Set(
                    allEmployees.map((employee) => employee.employeeId),
                );
                directReports.forEach((employee) => {
                    if (!existingIds.has(employee.employeeId)) {
                        allEmployees.push(employee);
                    }
                });
            }

            // CLIENT-SIDE SEARCH
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                allEmployees = allEmployees.filter(
                    (employee) =>
                        employee.fullName?.toLowerCase().includes(term) ||
                        employee.email?.toLowerCase().includes(term),
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
        sourceObjective,
        loadingScopedDepartment,
        loadingScopedDivision,
    ]);

    const loading = loadingDivisions || loadingAllDepartments || loadingScopedDivision || loadingScopedDepartment || loadingGlobalEmployees || loadingDirectReports;
    const error = null;

    return {
        items: availableAssignees,
        loading,
        error
    };
}
