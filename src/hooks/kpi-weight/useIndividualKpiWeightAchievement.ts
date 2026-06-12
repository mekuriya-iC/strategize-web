import { useQuery } from '@apollo/client';
import { GET_INDIVIDUAL_KPI_WEIGHT_ACHIEVEMENT } from '@/lib/graphql/queries/kpiWeightAchievement';

export interface IndividualKpiWeightItem {
  kpiId: string;
  kpiName: string;
  localWeight: number;
  parentWeightAllocation: number;
  targetValue: number;
  achievedValue: number;
  achievementPercentage: number;
  localWeightAchieved: number;
  parentWeightContribution: number;
}

export interface IndividualKpiWeightAchievement {
  totalWeightPossible: number;
  totalWeightAchieved: number;
  totalParentContribution: number;
  achievementPercentage: number;
  kpis: IndividualKpiWeightItem[];
}

interface UseIndividualKpiWeightAchievementProps {
  employeeId: string;
  periodId: string;
  skip?: boolean;
}

export function useIndividualKpiWeightAchievement({
  employeeId,
  periodId,
  skip = false,
}: UseIndividualKpiWeightAchievementProps) {
  const { data, loading, error, refetch } = useQuery<{
    individualKpiWeightAchievement: IndividualKpiWeightAchievement;
  }>(GET_INDIVIDUAL_KPI_WEIGHT_ACHIEVEMENT, {
    variables: { employeeId, periodId },
    skip: skip || !employeeId || !periodId,
    fetchPolicy: 'network-only', // Always fetch fresh data
  });

  return {
    data: data?.individualKpiWeightAchievement,
    loading,
    error,
    refetch,
  };
}
