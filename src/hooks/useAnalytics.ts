import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import type {
  PaginatedDivisions,
  PaginatedDepartments,
  PaginatedEmployees,
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

export const useAnalytics = (): AnalyticsStats => {
  // Fetch real data from GraphQL
  const {
    data: divisionsData,
    loading: divisionsLoading,
    error: divisionsError,
  } = useQuery<{ divisions: PaginatedDivisions }>(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 }, // Get all divisions for accurate count
    fetchPolicy: "cache-and-network",
  });

  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
  } = useQuery<{ departments: PaginatedDepartments }>(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 }, // Get all departments for accurate count
    fetchPolicy: "cache-and-network",
  });

  const {
    data: employeesData,
    loading: employeesLoading,
    error: employeesError,
  } = useQuery<{ employees: PaginatedEmployees }>(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 }, // Get all employees for accurate count
    fetchPolicy: "cache-and-network",
  });

  const {
    data: objectivesData,
    loading: objectivesLoading,
    error: objectivesError,
  } = useQuery<{ objectives: PaginatedObjectives }>(GET_OBJECTIVES, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: kpisData,
    loading: kpisLoading,
    error: kpisError,
  } = useQuery<{ kpis: PaginatedKpis }>(GET_KPIS, {
    variables: { page: 1, limit: 1000 },
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

    // Basic counts
    const divisionsCount = divisionsData?.divisions?.meta?.totalItems || 0;
    const departmentsCount =
      departmentsData?.departments?.meta?.totalItems || 0;
    const employeesCount = employeesData?.employees?.meta?.totalItems || 0;
    const objectivesCount = objectivesData?.objectives?.meta?.totalItems || 0;
    const kpisCount = kpisData?.kpis?.meta?.totalItems || 0;

    // Calculate growth rates
    const divisionsGrowth = calculateRecentGrowth(
      divisionsData?.divisions?.items || []
    );
    const departmentsGrowth = calculateRecentGrowth(
      departmentsData?.departments?.items || []
    );
    const employeesGrowth = calculateRecentGrowth(
      employeesData?.employees?.items || []
    );
    const objectivesGrowth = calculateRecentGrowth(
      objectivesData?.objectives?.items || []
    );
    const kpisGrowth = calculateRecentGrowth(kpisData?.kpis?.items || []);

    // Additional insights
    const activeDivisionsCount =
      divisionsData?.divisions?.items?.filter(
        (division: Division) =>
          division.departments && division.departments.length > 0
      ).length || 0;

    const departmentsWithManagersCount =
      departmentsData?.departments?.items?.filter(
        (department: Department) => department.manager !== null
      ).length || 0;

    const activeEmployeesCount =
      employeesData?.employees?.items?.filter(
        (employee: Employee) => employee.status === "ACTIVE"
      ).length || 0;

    const managerCount =
      employeesData?.employees?.items?.filter(
        (employee: Employee) =>
          employee.role === "MANAGER" ||
          employee.role === "ADMIN" ||
          employee.role === "SUPER_ADMIN"
      ).length || 0;

    const adminCount =
      employeesData?.employees?.items?.filter(
        (employee: Employee) =>
          employee.role === "ADMIN" || employee.role === "SUPER_ADMIN"
      ).length || 0;

    const loading =
      divisionsLoading ||
      departmentsLoading ||
      employeesLoading ||
      objectivesLoading ||
      kpisLoading;
    const error =
      divisionsError?.message ||
      departmentsError?.message ||
      employeesError?.message ||
      objectivesError?.message ||
      kpisError?.message ||
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
    employeesData,
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
  ]);

  return analytics;
};
