import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import type {
  PaginatedDivisions,
  PaginatedDepartments,
  PaginatedEmployees,
  Division,
  Department,
  Employee,
} from "@/types/graphql";

export interface AnalyticsStats {
  // Core counts
  divisionsCount: number;
  departmentsCount: number;
  employeesCount: number;
  objectivesCount: number; // TODO: Update when backend is ready
  kpisCount: number; // TODO: Update when backend is ready
  initiativesCount: number; // TODO: Update when backend is ready

  // Growth percentages
  divisionsGrowth: string;
  departmentsGrowth: string;
  employeesGrowth: string;
  objectivesGrowth: string; // TODO: Update when backend is ready
  kpisGrowth: string; // TODO: Update when backend is ready
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

  // Error states
  error: string | null;
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

  // Calculate statistics
  const analytics = useMemo(() => {
    // Helper function to calculate recent growth
    const calculateRecentGrowth = (
      items: any[],
      dateField: string = "createdAt"
    ): string => {
      if (!items || items.length === 0) return "0%";

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentItems = items.filter((item) => {
        const itemDate = new Date(item[dateField]);
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
        (employee: Employee) => employee.role !== "INACTIVE"
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

    const loading = divisionsLoading || departmentsLoading || employeesLoading;
    const error =
      divisionsError?.message ||
      departmentsError?.message ||
      employeesError?.message ||
      null;

    return {
      // Core counts
      divisionsCount,
      departmentsCount,
      employeesCount,
      objectivesCount: 67, // TODO: Replace with real query
      kpisCount: 209, // TODO: Replace with real query
      initiativesCount: 67, // TODO: Replace with real query

      // Growth percentages
      divisionsGrowth,
      departmentsGrowth,
      employeesGrowth,
      objectivesGrowth: "-2.1%", // TODO: Replace with real calculation
      kpisGrowth: "+2.3%", // TODO: Replace with real calculation
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

      // Error states
      error,
    };
  }, [
    divisionsData,
    departmentsData,
    employeesData,
    divisionsLoading,
    departmentsLoading,
    employeesLoading,
    divisionsError,
    departmentsError,
    employeesError,
  ]);

  return analytics;
};
