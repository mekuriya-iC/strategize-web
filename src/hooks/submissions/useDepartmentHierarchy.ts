/**
 * Department Hierarchy Hook
 * Checks which departments report directly to corporate (no division above)
 * Also provides department-to-division mapping for filtering
 */

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import type { Department } from "@/types/graphql";

interface UseDepartmentHierarchyOptions {
  shouldFetch: boolean;
}

interface DepartmentHierarchyResult {
  /** Set of department IDs that don't have a division above them */
  departmentsWithoutDivision: Set<string>;
  /** Map of department ID to division ID */
  departmentToDivision: Map<string, string>;
  /** Set of department IDs that belong to a specific division */
  getDepartmentsForDivision: (divisionId: string) => Set<string>;
  /** Whether the query is still loading */
  loading: boolean;
}

/**
 * Hook to identify departments that report directly to corporate
 * These are departments without a parent division
 * Also provides mapping of departments to their parent divisions
 */
export const useDepartmentHierarchy = ({
  shouldFetch,
}: UseDepartmentHierarchyOptions): DepartmentHierarchyResult => {
  const { data, loading } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-first", // Use cache to avoid redundant fetches
    skip: !shouldFetch,
  });

  const { departmentsWithoutDivision, departmentToDivision } = useMemo(() => {
    const departments = (data?.departments?.items || []) as Department[];
    
    const withoutDivision = new Set<string>(
      departments
        .filter((dept) => !dept.division)
        .map((dept) => dept.departmentId)
    );

    const deptToDivMap = new Map<string, string>();
    departments.forEach((dept) => {
      if (dept.division?.divisionId) {
        deptToDivMap.set(dept.departmentId, dept.division.divisionId);
      }
    });

    return {
      departmentsWithoutDivision: withoutDivision,
      departmentToDivision: deptToDivMap,
    };
  }, [data]);

  const getDepartmentsForDivision = useMemo(() => {
    return (divisionId: string): Set<string> => {
      const depts = new Set<string>();
      departmentToDivision.forEach((divId, deptId) => {
        if (divId === divisionId) {
          depts.add(deptId);
        }
      });
      return depts;
    };
  }, [departmentToDivision]);

  return {
    departmentsWithoutDivision,
    departmentToDivision,
    getDepartmentsForDivision,
    loading,
  };
};

