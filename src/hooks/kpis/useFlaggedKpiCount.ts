import { useQuery } from "@apollo/client";
import { GET_MY_FLAGGED_KPI_COUNT, GET_TEAM_FLAGGED_KPI_COUNT } from "@/lib/graphql/queries/kpi-performance";
import { useAuthStore } from "@/stores";

/**
 * Hook to fetch flagged KPI count for current user
 * 
 * Returns count of KPIs flagged for poor performance (5+ consecutive unmet weeks)
 * Combines both personal flagged KPIs and team flagged KPIs (for supervisors)
 * 
 * Used for:
 * - Sidebar badge
 * - Dashboard alerts
 * - Navigation indicators
 */
export function useFlaggedKpiCount() {
  const user = useAuthStore((state) => state.user);
  const canViewTeam = [
    "COORDINATOR",
    "MANAGER",
    "DIRECTOR",
    "CEO",
    "HR",
    "ADMIN",
    "SUPER_ADMIN",
  ].includes(user?.role || "");

  // Fetch personal flagged KPI count
  const { data: myData, loading: myLoading } = useQuery(GET_MY_FLAGGED_KPI_COUNT, {
    pollInterval: 60000, // Refresh every minute
    skip: !user,
  });

  // Fetch team flagged KPI count (for supervisors/managers)
  const { data: teamData, loading: teamLoading } = useQuery(GET_TEAM_FLAGGED_KPI_COUNT, {
    pollInterval: 60000,
    skip: !user || !canViewTeam,
  });

  const myCount = myData?.myFlaggedKpiCount || 0;
  const teamCount = teamData?.teamFlaggedKpiCount || 0;

  // Total count is personal + team (for supervisors)
  const totalCount = myCount + teamCount;

  return {
    count: totalCount,
    myCount,
    teamCount,
    loading: myLoading || (canViewTeam && teamLoading),
  };
}
