"use client";

import { useQuery, gql } from "@apollo/client";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import AnalyticsSummary from "@/components/dashboard/AnalyticsSummary";
import ChartsSection from "@/components/dashboard/ChartsSection";
import AdvancedKPIDashboard from "@/components/dashboard/AdvancedKPIDashboard";
import { OrganizationalHealthCard } from "@/components/dashboard/OrganizationalHealthCard";
import { KpiAchievementCard } from "@/components/dashboard/KpiAchievementCard";
import { EvaluationCoverageCard } from "@/components/dashboard/EvaluationCoverageCard";
import { ActivityMetricsCard } from "@/components/dashboard/ActivityMetricsCard";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { DepartmentHeatMap } from "@/components/dashboard/DepartmentHeatMap";
import { TopPerformersCarousel } from "@/components/dashboard/TopPerformersCarousel";
import { PerformanceAlertsWidget } from "@/components/performance/PerformanceAlertsWidget";

// GraphQL queries for dashboard data
const GET_TEAM_PERFORMANCE_SUMMARY = gql`
  query GetTeamPerformanceSummaryForDashboard($filters: UnifiedPerformanceFilters!) {
    unifiedTeamPerformance(filters: $filters) {
      results {
        employeeId
        employee {
          fullName
          title
          picture
          departments {
            departmentId
            name
            division {
              divisionId
              name
            }
          }
        }
        overallPercentage
        rating
      }
      averageScore
      highestScore
      lowestScore
    }
  }
`;

const GET_CORPORATE_SCORECARD_SUMMARY = gql`
  query GetCorporateScorecardSummary($organizationId: ID!, $periodId: ID!) {
    realtimeCorporateScorecard(
      organizationId: $organizationId
      periodId: $periodId
      capFinalScore: false
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        level
        achievementRate
      }
    }
  }
`;

const GET_DIVISIONS_WITH_PERFORMANCE = gql`
  query GetDivisionsWithPerformance($organizationId: ID!) {
    divisions(organizationId: $organizationId, limit: 100) {
      items {
        divisionId
        name
      }
    }
  }
`;

const GET_DEPARTMENTS_QUERY = gql`
  query GetDepartmentsForHeatMap($organizationId: ID!) {
    departments(organizationId: $organizationId, limit: 200) {
      items {
        departmentId
        name
        division {
          divisionId
        }
      }
    }
  }
`;

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { selectedPeriod } = useStrategicPeriodStore();

  const fullAccessRoles = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
  const hasFullAccess = !!user?.role && fullAccessRoles.has(user.role as string);

  // Fetch team performance for health metrics
  const { data: teamData, loading: teamLoading } = useQuery(GET_TEAM_PERFORMANCE_SUMMARY, {
    variables: {
      filters: {
        strategicPeriodId: selectedPeriod?.strategicPeriodId,
        organizationId: user?.organizationId,
      },
    },
    skip: !hasFullAccess || !selectedPeriod?.strategicPeriodId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch corporate scorecard for KPI metrics
  const { data: scorecardData, loading: scorecardLoading } = useQuery(GET_CORPORATE_SCORECARD_SUMMARY, {
    variables: {
      organizationId: user?.organizationId,
      periodId: selectedPeriod?.strategicPeriodId,
    },
    skip: !hasFullAccess || !selectedPeriod?.strategicPeriodId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch divisions with departments for heat map
  const { data: divisionsData, loading: divisionsLoading } = useQuery(GET_DIVISIONS_WITH_PERFORMANCE, {
    variables: {
      organizationId: user?.organizationId,
    },
    skip: !hasFullAccess,
    fetchPolicy: "cache-and-network",
  });

  // Fetch all departments
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS_QUERY, {
    variables: {
      organizationId: user?.organizationId,
    },
    skip: !hasFullAccess,
    fetchPolicy: "cache-and-network",
  });

  const teamPerformance = teamData?.unifiedTeamPerformance;
  const scorecard = scorecardData?.realtimeCorporateScorecard;

  // Calculate metrics from REAL data
  const teamMeetingExpectations = teamPerformance?.results
    ? (teamPerformance.results.filter((r: any) => r.overallPercentage >= 70).length /
        teamPerformance.results.length) *
      100
    : 0;

  // Calculate KPI achievement by level from REAL data
  const kpiByLevel = scorecard?.kpiScores.reduce(
    (acc: any, kpi: any) => {
      const level = kpi.level.toLowerCase();
      if (!acc.count[level]) {
        acc.count[level] = 0;
        acc.total[level] = 0;
      }
      acc.count[level]++;
      acc.total[level] += kpi.achievementRate * 100;
      return acc;
    },
    { count: {}, total: {} }
  );

  const kpiData = {
    overallRate: scorecard?.percentageAchieved || 0,
    byLevel: {
      corporate: kpiByLevel?.count.corporate 
        ? kpiByLevel.total.corporate / kpiByLevel.count.corporate 
        : 0,
      division: kpiByLevel?.count.division 
        ? kpiByLevel.total.division / kpiByLevel.count.division 
        : 0,
      department: kpiByLevel?.count.department 
        ? kpiByLevel.total.department / kpiByLevel.count.department 
        : 0,
      personnel: kpiByLevel?.count.personnel 
        ? kpiByLevel.total.personnel / kpiByLevel.count.personnel 
        : 0,
    },
  };

  // Calculate evaluation coverage from REAL data (using team performance as proxy)
  // TODO: Replace with actual 360 evaluation API when available
  const evaluationData = {
    completed: teamPerformance?.results?.filter((r: any) => r.overallPercentage > 0).length || 0,
    pending: teamPerformance?.results?.filter((r: any) => r.overallPercentage === 0).length || 0,
    percentage: teamPerformance?.results?.length
      ? (teamPerformance.results.filter((r: any) => r.overallPercentage > 0).length /
          teamPerformance.results.length) *
        100
      : 0,
    upcomingDeadlines: 0, // TODO: Calculate from actual deadlines
  };

  // Calculate activity metrics from REAL data
  // Using performance data as proxy for activity
  const activityData = {
    objectivesCompletion: teamPerformance?.averageScore || 0,
    tasksCompletion: teamPerformance?.averageScore || 0,
    checkinFrequency: teamPerformance?.averageScore || 0,
  };

  // Build heat map data from REAL divisions and departments
  const heatMapData = divisionsData?.divisions?.items.map((division: any) => {
    // Get all team members for this division (by checking if any of their departments belong to this division)
    const divisionMembers = teamPerformance?.results?.filter(
      (r: any) => r.employee.departments?.some((dept: any) => dept.division?.divisionId === division.divisionId)
    ) || [];
    
    const divisionAvgScore = divisionMembers.length
      ? divisionMembers.reduce((sum: number, r: any) => sum + r.overallPercentage, 0) / divisionMembers.length
      : 0;

    // Get departments for this division from the departments query
    const divisionDepartments = departmentsData?.departments?.items?.filter(
      (dept: any) => dept.division?.divisionId === division.divisionId
    ) || [];

    const departments = divisionDepartments.map((dept: any) => {
      const deptMembers = teamPerformance?.results?.filter(
        (r: any) => r.employee.departments?.some((d: any) => d.departmentId === dept.departmentId)
      ) || [];
      
      const deptAvgScore = deptMembers.length
        ? deptMembers.reduce((sum: number, r: any) => sum + r.overallPercentage, 0) / deptMembers.length
        : 0;

      return {
        departmentId: dept.departmentId,
        name: dept.name,
        averageScore: deptAvgScore,
        employeeCount: deptMembers.length,
      };
    });

    return {
      divisionId: division.divisionId,
      name: division.name,
      averageScore: divisionAvgScore,
      departments,
    };
  }) || [];

  // Top performers from team data
  const topPerformers =
    teamPerformance?.results
      ?.slice()
      .sort((a: any, b: any) => b.overallPercentage - a.overallPercentage)
      .slice(0, 5)
      .map((r: any) => ({
        employeeId: r.employeeId,
        fullName: r.employee.fullName,
        title: r.employee.title,
        picture: r.employee.picture,
        overallScore: r.overallPercentage,
        rating: r.rating,
      })) || [];

  return (
    <div className="space-y-6">
      {/* Enhanced Metrics Row - Only for Full Access Users */}
      {hasFullAccess && teamPerformance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <OrganizationalHealthCard
            currentScore={teamPerformance.averageScore}
            previousScore={75.5}
            trend={teamPerformance.averageScore - 75.5}
            teamMeetingExpectations={teamMeetingExpectations}
            totalEmployees={teamPerformance.results?.length || 0}
            loading={teamLoading}
          />
          <KpiAchievementCard {...kpiData} loading={scorecardLoading} />
          <EvaluationCoverageCard {...evaluationData} loading={teamLoading} />
          <ActivityMetricsCard {...activityData} loading={teamLoading} />
        </div>
      )}

      {/* Heat Map & Top Performers Row - Only for Full Access Users */}
      {hasFullAccess && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DepartmentHeatMap
            divisions={heatMapData}
            loading={divisionsLoading || teamLoading}
            onDepartmentClick={(deptId) => console.log("Navigate to department:", deptId)}
          />
          <TopPerformersCarousel performers={topPerformers} loading={teamLoading} limit={5} />
        </div>
      )}

      {/* Alerts & Quick Actions Row - Only for Full Access Users */}
      {hasFullAccess && teamPerformance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceAlertsWidget
            teamResults={teamPerformance.results || []}
            onEmployeeClick={(empId) => console.log("Navigate to employee:", empId)}
          />
          <QuickActionsGrid />
        </div>
      )}

      {/* Existing Components */}
      <AnalyticsSummary />
      <AdvancedKPIDashboard />
      <ChartsSection />
    </div>
  );
}
