import { useQuery } from '@apollo/client';
import {
  GET_CORPORATE_KPI_WITH_DIVISION_CONTRIBUTIONS,
  GET_DIVISION_KPI_WITH_DEPARTMENT_CONTRIBUTIONS,
  GET_DEPARTMENT_KPI_WITH_EMPLOYEE_CONTRIBUTIONS,
} from '@/lib/graphql/queries/kpiWeightAchievement';

export interface KpiContributor {
  contributorId: string;
  contributorName: string;
  contributorType: string;
  parentWeightAllocation: number;
  targetValue: number;
  achievedValue: number;
  achievementPercentage: number;
  weightContribution: number;
}

export interface KpiWithContributors {
  kpiId: string;
  kpiName: string;
  kpiLevel: string;
  totalWeight: number;
  targetValue: number;
  achievedValue: number;
  achievementPercentage: number;
  hasContributors: boolean;
  contributors: KpiContributor[];
}

export interface HierarchicalKpiBreakdown {
  level: string;
  entityId: string;
  entityName: string;
  totalWeightPossible: number;
  totalWeightAchieved: number;
  achievementPercentage: number;
  kpis: KpiWithContributors[];
}

// Hook for Corporate level (Super Admin / Admin)
export function useCorporateKpiContributions(organizationId: string, periodId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery<{
    corporateKpiWithDivisionContributions: HierarchicalKpiBreakdown;
  }>(GET_CORPORATE_KPI_WITH_DIVISION_CONTRIBUTIONS, {
    variables: { organizationId, periodId },
    skip: skip || !organizationId || !periodId,
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.corporateKpiWithDivisionContributions,
    loading,
    error,
    refetch,
  };
}

// Hook for Division level (Director)
export function useDivisionKpiContributions(divisionId: string, periodId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery<{
    divisionKpiWithDepartmentContributions: HierarchicalKpiBreakdown;
  }>(GET_DIVISION_KPI_WITH_DEPARTMENT_CONTRIBUTIONS, {
    variables: { divisionId, periodId },
    skip: skip || !divisionId || !periodId,
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.divisionKpiWithDepartmentContributions,
    loading,
    error,
    refetch,
  };
}

// Hook for Department level (Manager)
export function useDepartmentKpiContributions(departmentId: string, periodId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery<{
    departmentKpiWithEmployeeContributions: HierarchicalKpiBreakdown;
  }>(GET_DEPARTMENT_KPI_WITH_EMPLOYEE_CONTRIBUTIONS, {
    variables: { departmentId, periodId },
    skip: skip || !departmentId || !periodId,
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.departmentKpiWithEmployeeContributions,
    loading,
    error,
    refetch,
  };
}
