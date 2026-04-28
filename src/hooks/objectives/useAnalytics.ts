import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS, GET_DEPARTMENTS_ANALYTICS } from "@/lib/graphql/queries/departments";
import { GET_EMPLOYEES_COUNT } from "@/lib/graphql/queries/employees";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import { GET_DIVISION, GET_DIVISION_SAFE } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENT, GET_DEPARTMENT_SAFE } from "@/lib/graphql/queries/departments";
import type {
  PaginatedDivisions,
  PaginatedDepartments,
  PaginatedObjectives,
  PaginatedKpis,
  Division,
  Department,
  Employee,
} from "@/types/graphql";

export interface AnalyticsStats {
  // Core counts
  divisionsCount: number;
  departmentsCount: number;
  employeesCount: number;
  objectivesCount: number;
  kpisCount: number;
  initiativesCount: number; // TODO: Update when backend is ready

  // Growth percentages
  divisionsGrowth: string;
  departmentsGrowth: string;
  employeesGrowth: string;
  objectivesGrowth: string;
  kpisGrowth: string;
  initiativesGrowth: string; // TODO: Update when backend is ready

  // Additional insights
  activeDivisionsCount: number;
  departmentsWithManagersCount: number;
  activeEmployeesCount: number;
  managerCount: number;
  adminCount: number;

  // Loading states
  loading: boolean;
  divisionsLoading: boolean;
  departmentsLoading: boolean;
  employeesLoading: boolean;
  objectivesLoading: boolean;
  kpisLoading: boolean;

  // Error states
  error: string | null;
}

interface ItemWithDateFields {
  createdAt?: string;
  updatedAt?: string;
}

interface UseAnalyticsOptions {
  selectedUnit?: { id: string; type: "division" | "department" } | null;
  userRole?: string;
  annualTimeline?: string | null;
}

export const useAnalytics = (
  options: UseAnalyticsOptions = {}
): AnalyticsStats => {
  const { selectedUnit, userRole, annualTimeline } = options;

  // Check if user has permission for global data queries
  const canAccessGlobalData =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  // Fetch real data from GraphQL - conditionally skip for managers
  const {
    data: divisionsData,
    loading: divisionsLoading,
    error: divisionsError,
  } = useQuery<{ divisions: PaginatedDivisions }>(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 }, // Get all divisions for accurate count
    fetchPolicy: "cache-and-network",
    skip: !canAccessGlobalData, // Skip for managers
  });

  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
  } = useQuery<{ departments: PaginatedDepartments }>(GET_DEPARTMENTS_ANALYTICS, {
    variables: { page: 1, limit: 1000 }, // Get all departments for accurate count
    fetchPolicy: "cache-and-network",
    skip: !canAccessGlobalData, // Skip for managers
  });

  // For analytics at corporate level, use a lightweight employees count query to
  // avoid resolver errors from nullable departments fields in some rows.
  const {
    data: employeesCountData,
    loading: employeesLoading,
    error: employeesError,
  } = useQuery(GET_EMPLOYEES_COUNT, {
    variables: { page: 1, limit: 1 },
    fetchPolicy: "cache-and-network",
    skip: !canAccessGlobalData, // Skip for managers
  });

  // For objectives, pass assigneeId if a unit is selected
  const {
    data: objectivesData,
    loading: objectivesLoading,
    error: objectivesError,
  } = useQuery<{ objectives: PaginatedObjectives }>(GET_OBJECTIVES, {
    variables: {
      page: 1,
      limit: 1000,
      assigneeId: selectedUnit?.id || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  // Only fetch global KPIs when no unit is selected (for admin analytics)
  // When a unit is selected, we count KPIs from the objectives data
  const {
    data: kpisData,
    loading: kpisLoading,
    error: kpisError,
  } = useQuery<{ kpis: PaginatedKpis }>(GET_KPIS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
    skip: !!selectedUnit, // Skip when a specific unit is selected
  });

  // Scoped queries for Directors/Managers who can't access global data
  const {
    data: scopedDivisionData,
    loading: scopedDivisionLoading,
    error: scopedDivisionError,
  } = useQuery<{ division: Division }>(GET_DIVISION_SAFE, {
    variables: { divisionId: selectedUnit?.id },
    skip: !selectedUnit || selectedUnit.type !== "division",
    fetchPolicy: "cache-and-network",
  });

  const {
    data: scopedDepartmentData,
    loading: scopedDepartmentLoading,
    error: scopedDepartmentError,
  } = useQuery<{ department: Department }>(GET_DEPARTMENT_SAFE, {
    variables: { departmentId: selectedUnit?.id },
    skip: !selectedUnit || selectedUnit.type !== "department",
    fetchPolicy: "cache-and-network",
  });

  // Calculate statistics
  const analytics = useMemo(() => {
    // Helper function to calculate recent growth
    const calculateRecentGrowth = (
      items: Array<ItemWithDateFields>,
      dateField: keyof ItemWithDateFields = "createdAt"
    ): string => {
      if (!items || items.length === 0) return "0%";

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentItems = items.filter((item) => {
        const dateValue = item[dateField];
        if (!dateValue) return false;
        const itemDate = new Date(dateValue);
        return itemDate > weekAgo;
      });

      const growthRate =
        items.length > 0 ? (recentItems.length / items.length) * 100 : 0;
      return growthRate > 0 ? `+${growthRate.toFixed(1)}%` : "0%";
    };

    // Filter data based on selected unit - only if we have access to the data
    let filteredDivisions = divisionsData?.divisions?.items || [];
    let filteredDepartments = departmentsData?.departments?.items || [];
    // We no longer fetch full employee rows for corporate analytics to avoid
    // non-null departments errors. For admin context we use counts from meta.
    let filteredEmployees: Employee[] = [];

    // For managers, we'll get limited data - they won't have access to all divisions/departments/employees
    // So we'll rely on objectives data and show placeholder values for unavailable data
    if (selectedUnit && canAccessGlobalData) {
      if (selectedUnit.type === "division") {
        // Filter to show only the selected division
        filteredDivisions = filteredDivisions.filter(
          (d) => d.divisionId === selectedUnit.id
        );
        // Filter departments belonging to this division
        filteredDepartments = filteredDepartments.filter(
          (d) => d.division?.divisionId === selectedUnit.id
        );
        // Get employees from departments in this division
        filteredEmployees = [];
        filteredDepartments.forEach((dept) => {
          if (dept.employees) {
            filteredEmployees.push(...dept.employees);
          }
        });
      } else if (selectedUnit.type === "department") {
        // Filter to show only the selected department
        filteredDepartments = filteredDepartments.filter(
          (d) => d.departmentId === selectedUnit.id
        );
        // Get employees from this department
        filteredEmployees = [];
        const selectedDept = filteredDepartments[0];
        if (selectedDept?.employees) {
          filteredEmployees = selectedDept.employees;
        }
        // Show parent division if exists
        if (selectedDept?.division) {
          filteredDivisions = [selectedDept.division];
        } else {
          filteredDivisions = [];
        }
      }
    }

    // Basic counts - handle both admin and manager cases
    const divisionsCount = canAccessGlobalData
      ? selectedUnit
        ? filteredDivisions.length
        : divisionsData?.divisions?.meta?.totalItems || 0
      : 0; // Managers don't see division counts
    const departmentsCount = canAccessGlobalData
      ? selectedUnit
        ? filteredDepartments.length
        : departmentsData?.departments?.meta?.totalItems || 0
      : selectedUnit?.type === "division"
        ? scopedDivisionData?.division?.departments?.length || 0
        : 0;

    const employeesCount = canAccessGlobalData
      ? selectedUnit
        ? (filteredEmployees?.length || 0)
        : (employeesCountData?.employees?.meta?.totalItems || 0)
      : selectedUnit?.type === "department"
        ? (scopedDepartmentData?.department?.employees?.length || 0)
        : selectedUnit?.type === "division"
          ? (scopedDivisionData?.division?.departments?.reduce((acc: number, dept: any) => acc + (dept.employees?.length || 0), 0) || 0)
          : 0;
    // 4. Filtering Objectives & KPIs based on Role (Corporate filter) and Timeline
    const allObjectivesRaw = objectivesData?.objectives?.items || [];

    // Admin/Super Admin should only see CORPORATE objectives and their KPIs at the landing dashboard
    // unless they have a specific unit selected (which we assume happens in other views or via selectedUnit)
    const filteredObjectivesByRole = (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && !selectedUnit
      ? allObjectivesRaw.filter(obj => obj.type === 'CORPORATE')
      : allObjectivesRaw;

    // Filter by Annual Timeline
    const filteredObjectivesByTimeline = annualTimeline
      ? filteredObjectivesByRole.filter(obj =>
        obj.kpis?.some((kpi: any) =>
          kpi.targets?.some((t: any) => t.timeline === annualTimeline || t.timeline.startsWith(`${annualTimeline}-`))
        )
      )
      : filteredObjectivesByRole;

    const objectivesCount = filteredObjectivesByTimeline.length;

    // Calculate KPIs count from the filtered objectives
    let kpisCount = 0;
    filteredObjectivesByTimeline.forEach(obj => {
      if (obj.kpis) {
        // Count all KPIs in the filtered objectives
        kpisCount += obj.kpis.length;
      }
    });

    // Calculate growth rates (use filtered data if available)
    const divisionsGrowth = canAccessGlobalData
      ? calculateRecentGrowth(filteredDivisions)
      : "0%";
    const departmentsGrowth = canAccessGlobalData
      ? calculateRecentGrowth(filteredDepartments)
      : "0%";
    const employeesGrowth = canAccessGlobalData
      ? calculateRecentGrowth(filteredEmployees)
      : "0%";
    const objectivesGrowth = calculateRecentGrowth(
      objectivesData?.objectives?.items || []
    );

    // Calculate KPIs growth - use KPIs from objectives when unit is selected
    let kpisForGrowth: ItemWithDateFields[] = [];
    if (selectedUnit) {
      const objectives = objectivesData?.objectives?.items || [];
      objectives.forEach((obj) => {
        if (obj.kpis) {
          // KPIs from objectives may not have date fields, treat as current items
          kpisForGrowth.push(...obj.kpis.map(() => ({ createdAt: undefined, updatedAt: undefined })));
        }
      });
    } else {
      kpisForGrowth = kpisData?.kpis?.items || [];
    }
    const kpisGrowth = calculateRecentGrowth(kpisForGrowth);

    // Additional insights (use filtered data if available)
    const activeDivisionsCount = canAccessGlobalData
      ? filteredDivisions.filter(
        (division: Division) =>
          division.departments && division.departments.length > 0
      ).length
      : 0;

    const departmentsWithManagersCount = canAccessGlobalData
      ? filteredDepartments.filter(
        (department: any) => department.head && department.head !== null
      ).length
      : 0;

    const activeEmployeesCount = 0; // Skipped in lightweight mode

    const managerCount = 0; // Skipped in lightweight mode

    const adminCount = 0; // Skipped in lightweight mode

    const loading =
      divisionsLoading ||
      departmentsLoading ||
      employeesLoading ||
      objectivesLoading ||
      kpisLoading ||
      scopedDivisionLoading ||
      scopedDepartmentLoading;
    const error =
      divisionsError?.message ||
      departmentsError?.message ||
      employeesError?.message ||
      objectivesError?.message ||
      kpisError?.message ||
      scopedDivisionError?.message ||
      scopedDepartmentError?.message ||
      null;

    return {
      // Core counts
      divisionsCount,
      departmentsCount,
      employeesCount,
      objectivesCount,
      kpisCount,
      initiativesCount: 67, // TODO: Replace with real query

      // Growth percentages
      divisionsGrowth,
      departmentsGrowth,
      employeesGrowth,
      objectivesGrowth,
      kpisGrowth,
      initiativesGrowth: "-2.1%", // TODO: Replace with real calculation

      // Additional insights
      activeDivisionsCount,
      departmentsWithManagersCount,
      activeEmployeesCount,
      managerCount,
      adminCount,

      // Loading states
      loading,
      divisionsLoading,
      departmentsLoading,
      employeesLoading,
      objectivesLoading,
      kpisLoading,

      // Error states
      error,
    };
  }, [
    divisionsData,
    departmentsData,
    employeesCountData,
    objectivesData,
    kpisData,
    divisionsLoading,
    departmentsLoading,
    employeesLoading,
    objectivesLoading,
    kpisLoading,
    divisionsError,
    departmentsError,
    employeesError,
    objectivesError,
    kpisError,
    selectedUnit,
    canAccessGlobalData,
    annualTimeline,
  ]);

  return analytics;
};
