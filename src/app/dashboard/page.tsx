"use client";

import { useMemo } from "react";
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
import { useAnalytics } from "@/hooks/objectives/useAnalytics";
import {
  GET_EVALUATION_CYCLES,
  GET_COMPETENCY_ASSESSMENTS,
} from "@/lib/graphql/queries/evaluations";
import {
  GET_CHECKINOUT_SESSIONS,
  GET_CHECKINOUT_TASKS,
} from "@/lib/graphql/queries/checkins";

// GraphQL queries for dashboard data
const GET_TEAM_PERFORMANCE_SUMMARY = gql`
  query GetTeamPerformanceSummaryForDashboard(
    $filters: UnifiedPerformanceFilters!
  ) {
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

const GET_DIVISION_SCORECARD_SUMMARY = gql`
  query GetDivisionScorecardSummary($divisionId: ID!, $periodId: ID!) {
    realtimeDivisionScorecard(
      divisionId: $divisionId
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

const GET_DEPARTMENT_SCORECARD_SUMMARY = gql`
  query GetDepartmentScorecardSummary($departmentId: ID!, $periodId: ID!) {
    realtimeDepartmentScorecard(
      departmentId: $departmentId
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

const GET_INDIVIDUAL_SCORECARD_SUMMARY = gql`
  query GetIndividualScorecardSummary($employeeId: ID!, $periodId: ID!) {
    realtimeIndividualScorecard(
      employeeId: $employeeId
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

  const primaryDept = user?.departments?.[0];
  const userDepartmentId = primaryDept?.departmentId;
  const userDivisionId = (primaryDept as any)?.division?.divisionId;

  const fullAccessRoles = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
  const hasFullAccess =
    !!user?.role && fullAccessRoles.has(user.role as string);
  const isDirector = user?.role === "DIRECTOR";
  const isManager = user?.role === "MANAGER" || user?.role === "COORDINATOR";
  const isLeadershipRole = hasFullAccess || isDirector || isManager;

  // Fetch team performance for health metrics
  let teamFilters: any = {
    strategicPeriodId: selectedPeriod?.strategicPeriodId,
    organizationId: user?.organizationId,
  };
  if (isDirector && userDivisionId) {
    teamFilters.divisionId = userDivisionId;
  } else if (isManager && userDepartmentId) {
    teamFilters.departmentId = userDepartmentId;
  }

  const { data: teamData, loading: teamLoading } = useQuery(
    GET_TEAM_PERFORMANCE_SUMMARY,
    {
      variables: {
        filters: teamFilters,
      },
      skip: !isLeadershipRole || !selectedPeriod?.strategicPeriodId,
      fetchPolicy: "cache-and-network",
    },
  );

  // Fetch scorecard for KPI metrics based on role
  let scorecardQuery = GET_CORPORATE_SCORECARD_SUMMARY;
  let scorecardVariables: any = {
    periodId: selectedPeriod?.strategicPeriodId,
  };

  if (hasFullAccess) {
    scorecardQuery = GET_CORPORATE_SCORECARD_SUMMARY;
    scorecardVariables.organizationId = user?.organizationId;
  } else if (isDirector && userDivisionId) {
    scorecardQuery = GET_DIVISION_SCORECARD_SUMMARY;
    scorecardVariables.divisionId = userDivisionId;
  } else if (isManager && userDepartmentId) {
    scorecardQuery = GET_DEPARTMENT_SCORECARD_SUMMARY;
    scorecardVariables.departmentId = userDepartmentId;
  } else {
    scorecardQuery = GET_INDIVIDUAL_SCORECARD_SUMMARY;
    scorecardVariables.employeeId = user?.employeeId;
  }

  const { data: scorecardData, loading: scorecardLoading } = useQuery(
    scorecardQuery,
    {
      variables: scorecardVariables,
      skip:
        !selectedPeriod?.strategicPeriodId ||
        (hasFullAccess
          ? !user?.organizationId
          : isDirector
            ? !userDivisionId
            : isManager
              ? !userDepartmentId
              : !user?.employeeId),
      fetchPolicy: "cache-and-network",
    },
  );

  // Fetch divisions with departments for heat map
  const { data: divisionsData, loading: divisionsLoading } = useQuery(
    GET_DIVISIONS_WITH_PERFORMANCE,
    {
      variables: {
        organizationId: user?.organizationId,
      },
      skip: !hasFullAccess && !isDirector,
      fetchPolicy: "cache-and-network",
    },
  );

  // Fetch all departments
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS_QUERY, {
    variables: {
      organizationId: user?.organizationId,
    },
    skip: !hasFullAccess && !isDirector,
    fetchPolicy: "cache-and-network",
  });

  // Fetch analytics for objectivesCompletion
  const analytics = useAnalytics({
    userRole: user?.role,
    userId: user?.employeeId,
    selectedPeriodId: selectedPeriod?.strategicPeriodId,
  });

  // Fetch active evaluation cycle
  const { data: activeCycleData } = useQuery(GET_EVALUATION_CYCLES, {
    variables: { page: 1, limit: 1, status: "ACTIVE" },
    fetchPolicy: "cache-and-network",
  });
  const activeCycle = activeCycleData?.evaluationCycles?.items?.[0];

  // Fetch competency assessments for this cycle
  const { data: assessmentsData } = useQuery(GET_COMPETENCY_ASSESSMENTS, {
    variables: {
      page: 1,
      limit: 1000,
      evaluationCycleId: activeCycle?.evaluationCycleId,
    },
    skip: !activeCycle?.evaluationCycleId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch check-in sessions. Backend only allows unscoped session listing for
  // ADMIN/HR/SUPER_ADMIN; managers/directors must be scoped to themselves.
  const { data: checkinsData } = useQuery(GET_CHECKINOUT_SESSIONS, {
    variables: {
      page: 1,
      limit: 1000,
      strategicPeriodId: selectedPeriod?.strategicPeriodId,
      employeeUserId: !isLeadershipRole ? user?.employeeId : undefined,
      supervisorUserId:
        !hasFullAccess && isLeadershipRole ? user?.employeeId : undefined,
    },
    skip:
      !selectedPeriod?.strategicPeriodId ||
      (!hasFullAccess && !user?.employeeId),
    fetchPolicy: "cache-and-network",
  });

  // Fetch check-in tasks
  const { data: tasksData } = useQuery(GET_CHECKINOUT_TASKS, {
    variables: {
      page: 1,
      limit: 1000,
    },
    fetchPolicy: "cache-and-network",
  });

  const teamPerformance = teamData?.unifiedTeamPerformance;
  const scorecard =
    scorecardData?.realtimeCorporateScorecard ||
    scorecardData?.realtimeDivisionScorecard ||
    scorecardData?.realtimeDepartmentScorecard ||
    scorecardData?.realtimeIndividualScorecard;

  // Calculate metrics from REAL data
  const teamMeetingExpectations = teamPerformance?.results
    ? (teamPerformance.results.filter((r: any) => r.overallPercentage >= 70)
        .length /
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
    { count: {}, total: {} },
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

  // Calculate real evaluation coverage from activeCycle and competencyAssessments
  const assessments = assessmentsData?.competencyAssessments?.items || [];
  const filteredAssessments = useMemo(() => {
    if (!assessments.length) return [];
    if (hasFullAccess) return assessments;

    return assessments.filter((a: any) => {
      const evaluateeDepts = a.evaluatee?.departments || [];
      const evaluatorDepts = a.evaluator?.departments || [];

      if (isDirector && userDivisionId) {
        return (
          evaluateeDepts.some(
            (d: any) => d.division?.divisionId === userDivisionId,
          ) ||
          evaluatorDepts.some(
            (d: any) => d.division?.divisionId === userDivisionId,
          )
        );
      }
      if (isManager && userDepartmentId) {
        return (
          evaluateeDepts.some(
            (d: any) => d.departmentId === userDepartmentId,
          ) ||
          evaluatorDepts.some((d: any) => d.departmentId === userDepartmentId)
        );
      }
      return (
        a.evaluatee?.employeeId === user?.employeeId ||
        a.evaluator?.employeeId === user?.employeeId
      );
    });
  }, [
    assessments,
    hasFullAccess,
    isDirector,
    isManager,
    userDivisionId,
    userDepartmentId,
    user?.employeeId,
  ]);

  const completedAssessmentsCount = filteredAssessments.filter(
    (a: any) => a.status === "COMPLETED" || a.status === "SUBMITTED",
  ).length;
  const pendingAssessmentsCount =
    filteredAssessments.length - completedAssessmentsCount;
  const evaluationPercentage = filteredAssessments.length
    ? (completedAssessmentsCount / filteredAssessments.length) * 100
    : 0;

  const upcomingDeadlines = activeCycle?.endDate
    ? new Date(activeCycle.endDate) > new Date()
      ? Math.ceil(
          (new Date(activeCycle.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0
    : 0;

  const evaluationData = {
    completed: completedAssessmentsCount,
    pending: pendingAssessmentsCount,
    percentage: evaluationPercentage,
    upcomingDeadlines,
  };

  // Calculate real activity metrics from objectives, tasks, and checkins
  const objectives = analytics.filteredObjectives || [];
  const completedObjectivesCount = objectives.filter(
    (obj: any) => obj.status === "completed" || obj.status === "APPROVED",
  ).length;
  const objectivesCompletion = objectives.length
    ? (completedObjectivesCount / objectives.length) * 100
    : 0;

  const tasks = tasksData?.checkinoutTasks?.items || [];
  const filteredTasks = useMemo(() => {
    if (!tasks.length) return [];
    if (hasFullAccess) return tasks;

    return tasks.filter((t: any) => {
      const ownerDepts = t.relatedTo?.departments || [];
      if (isDirector && userDivisionId) {
        return ownerDepts.some(
          (d: any) => d.division?.divisionId === userDivisionId,
        );
      }
      if (isManager && userDepartmentId) {
        return ownerDepts.some((d: any) => d.departmentId === userDepartmentId);
      }
      return t.relatedTo?.employeeId === user?.employeeId;
    });
  }, [
    tasks,
    hasFullAccess,
    isDirector,
    isManager,
    userDivisionId,
    userDepartmentId,
    user?.employeeId,
  ]);

  const completedTasksCount = filteredTasks.filter(
    (t: any) => t.taskStatus === "done" || t.taskStatus === "DONE",
  ).length;
  const tasksCompletion = filteredTasks.length
    ? (completedTasksCount / filteredTasks.length) * 100
    : 0;

  const checkins = checkinsData?.checkinoutSessions?.items || [];
  const filteredCheckins = useMemo(() => {
    if (!checkins.length) return [];
    if (hasFullAccess) return checkins;

    return checkins.filter((c: any) => {
      const empDepts = c.employee?.departments || [];
      if (isDirector && userDivisionId) {
        return empDepts.some(
          (d: any) => d.division?.divisionId === userDivisionId,
        );
      }
      if (isManager && userDepartmentId) {
        return empDepts.some((d: any) => d.departmentId === userDepartmentId);
      }
      return c.employee?.employeeId === user?.employeeId;
    });
  }, [
    checkins,
    hasFullAccess,
    isDirector,
    isManager,
    userDivisionId,
    userDepartmentId,
    user?.employeeId,
  ]);

  const submittedCheckins = filteredCheckins.filter(
    (c: any) =>
      c.overallStatus === "submitted" ||
      c.overallStatus === "reviewed" ||
      c.overallStatus === "approved" ||
      c.overallStatus === "SUBMITTED" ||
      c.overallStatus === "REVIEWED" ||
      c.overallStatus === "APPROVED",
  ).length;
  const checkinFrequency = filteredCheckins.length
    ? (submittedCheckins / filteredCheckins.length) * 100
    : 0;

  const activityData = {
    objectivesCompletion,
    tasksCompletion,
    checkinFrequency,
  };

  // Build heat map data from REAL divisions and departments
  const rawHeatMapData =
    divisionsData?.divisions?.items.map((division: any) => {
      // Get all team members for this division (by checking if any of their departments belong to this division)
      const divisionMembers =
        teamPerformance?.results?.filter((r: any) =>
          r.employee.departments?.some(
            (dept: any) => dept.division?.divisionId === division.divisionId,
          ),
        ) || [];

      const divisionAvgScore = divisionMembers.length
        ? divisionMembers.reduce(
            (sum: number, r: any) => sum + r.overallPercentage,
            0,
          ) / divisionMembers.length
        : 0;

      // Get departments for this division from the departments query
      const divisionDepartments =
        departmentsData?.departments?.items?.filter(
          (dept: any) => dept.division?.divisionId === division.divisionId,
        ) || [];

      const departments = divisionDepartments.map((dept: any) => {
        const deptMembers =
          teamPerformance?.results?.filter((r: any) =>
            r.employee.departments?.some(
              (d: any) => d.departmentId === dept.departmentId,
            ),
          ) || [];

        const deptAvgScore = deptMembers.length
          ? deptMembers.reduce(
              (sum: number, r: any) => sum + r.overallPercentage,
              0,
            ) / deptMembers.length
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

  const heatMapData =
    isDirector && userDivisionId
      ? rawHeatMapData.filter((d: any) => d.divisionId === userDivisionId)
      : rawHeatMapData;

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
      {/* Enhanced Metrics Row - For Leadership Roles (Admin, HR, CEO, Director, Manager) */}
      {isLeadershipRole && teamPerformance && (
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

      {/* Heat Map & Top Performers Row - For Full Access and Directors */}
      {(hasFullAccess || isDirector) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DepartmentHeatMap
            divisions={heatMapData}
            loading={divisionsLoading || teamLoading}
            onDepartmentClick={(deptId) =>
              console.log("Navigate to department:", deptId)
            }
          />
          <TopPerformersCarousel
            performers={topPerformers}
            loading={teamLoading}
            limit={5}
          />
        </div>
      )}

      {/* Alerts & Quick Actions Row - For Leadership */}
      {isLeadershipRole && teamPerformance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceAlertsWidget
            teamResults={teamPerformance.results || []}
            onEmployeeClick={(empId) =>
              console.log("Navigate to employee:", empId)
            }
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
