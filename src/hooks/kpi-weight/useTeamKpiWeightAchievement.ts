import { useQuery } from '@apollo/client';
import { GET_TEAM_KPI_WEIGHT_ACHIEVEMENT } from '@/lib/graphql/queries/kpiWeightAchievement';

export interface TeamMemberKpiItem {
  kpiId: string;
  kpiName: string;
  parentWeightAllocation: number;
  targetValue: number;
  achievedValue: number;
  achievementPercentage: number;
  parentWeightContribution: number;
}

export interface TeamMemberSummary {
  employeeId: string;
  employeeName: string;
  totalWeightPossible: number;
  totalWeightAchieved: number;
  achievementPercentage: number;
  kpis: TeamMemberKpiItem[];
}

export interface TeamKpiWeightAchievement {
  totalWeightPossible: number;
  totalWeightAchieved: number;
  achievementPercentage: number;
  teamMembers: TeamMemberSummary[];
}

interface UseTeamKpiWeightAchievementProps {
  departmentId: string;
  periodId: string;
  skip?: boolean;
}

export function useTeamKpiWeightAchievement({
  departmentId,
  periodId,
  skip = false,
}: UseTeamKpiWeightAchievementProps) {
  const { data, loading, error, refetch } = useQuery<{
    teamKpiWeightAchievement: TeamKpiWeightAchievement;
  }>(GET_TEAM_KPI_WEIGHT_ACHIEVEMENT, {
    variables: { departmentId, periodId },
    skip: skip || !departmentId || !periodId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first', // Always fetch fresh data
  });

  return {
    data: data?.teamKpiWeightAchievement,
    loading,
    error,
    refetch,
  };
}
