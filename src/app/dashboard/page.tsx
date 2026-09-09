"use client";

import { gql, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { ChevronDown, Users } from "lucide-react";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import AnalyticsSummary from "@/components/dashboard/AnalyticsSummary";

import { OrganizationalHealthCard } from "@/components/dashboard/OrganizationalHealthCard";
import { DepartmentHeatMap } from "@/components/dashboard/DepartmentHeatMap";
import QuarterlyPerformanceOverview from "@/components/dashboard/QuarterlyPerformanceOverview";

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



const GET_DIVISIONS_WITH_PERFORMANCE = gql`
  query GetDivisionsWithPerformance($organizationId: ID!) {
    divisions(organizationId: $organizationId, page: 1, limit: 100) {
      items {
        divisionId
        name
      }
    }
  }
`;

const GET_DEPARTMENTS_QUERY = gql`
  query GetDepartmentsForHeatMap($organizationId: ID!) {
    departments(organizationId: $organizationId, page: 1, limit: 200) {
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
  const { selectedPeriod, selectionValidated } = useStrategicPeriodStore();

  const primaryDept = user?.departments?.[0];
  const userDepartmentId = primaryDept?.departmentId;
  const userDivisionId = (primaryDept as any)?.division?.divisionId;

  const fullAccessRoles = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
  const hasFullAccess =
    !!user?.role && fullAccessRoles.has(user.role as string);
  const isDirector = user?.role === "DIRECTOR";
  const isManager = user?.role === "MANAGER" || user?.role === "COORDINATOR";
  const isLeadershipRole = hasFullAccess || isDirector || isManager;
  const organizationId = user?.organizationId;
  const canLoadOrganizationHeatMap =
    Boolean(organizationId) && (hasFullAccess || isDirector);

  // Fetch team performance for health metrics
  let teamFilters: any = {
    strategicPeriodId: selectionValidated
      ? selectedPeriod?.strategicPeriodId
      : undefined,
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
      skip:
        !isLeadershipRole ||
        !selectionValidated ||
        !selectedPeriod?.strategicPeriodId,
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
    },
  );




  const teamPerformance = teamData?.unifiedTeamPerformance;


  // Calculate metrics from REAL data
  const teamMeetingExpectations = teamPerformance?.results
    ? (teamPerformance.results.filter((r: any) => r.overallPercentage >= 70)
        .length /
        teamPerformance.results.length) *
      100
    : 0;




  const performanceScopeTitle = hasFullAccess
    ? "Organization performance"
    : isDirector
      ? "Division performance"
      : "Department performance";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AnalyticsSummary />

      {/* Approved, server-scoped quarterly performance is the dashboard authority. */}
      <QuarterlyPerformanceOverview />

      {isLeadershipRole && teamPerformance && (
        <details className="group/people overflow-hidden rounded-2xl border bg-card [--muted-foreground:#526175] dark:[--muted-foreground:#a8b4c5]">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 focus-visible:outline-2 focus-visible:outline-ring sm:p-5 [&::-webkit-details-marker]:hidden">
            <Users className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <h2 id="team-performance-heading" className="text-lg font-semibold tracking-tight">
                People performance
              </h2>
              <p className="text-sm text-muted-foreground">
                Current unified performance within your authorized scope.
              </p>
            </div>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/people:rotate-180" />
          </summary>
          <div className="border-t bg-muted/20 p-4 sm:p-5">
            <div className="max-w-md">
              <OrganizationalHealthCard
                title={performanceScopeTitle}
                currentScore={teamPerformance.averageScore}
                teamMeetingExpectations={teamMeetingExpectations}
                totalEmployees={teamPerformance.results?.length || 0}
                loading={teamLoading}
              />
            </div>
          </div>
        </details>
      )}

      {canLoadOrganizationHeatMap && organizationId && (
        <details className="group/comparison overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm [--muted-foreground:#526175] dark:[--muted-foreground:#a8b4c5]">
          <summary className="flex cursor-pointer list-none items-center gap-3 bg-gradient-to-r from-primary/10 via-violet-500/5 to-card p-4 focus-visible:outline-2 focus-visible:outline-ring sm:p-5 [&::-webkit-details-marker]:hidden">
            <span className="rounded-xl bg-primary/10 p-2.5"><Users className="size-5 shrink-0 text-primary" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight">People performance by department</h2>
              <p className="text-sm text-muted-foreground">Explore the organization’s team performance comparison.</p>
            </div>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/comparison:rotate-180" />
          </summary>
          <div className="border-t bg-muted/20 p-3 sm:p-5">
            <OrganizationDepartmentComparison
              organizationId={organizationId}
              teamPerformance={teamPerformance}
              teamLoading={teamLoading}
              divisionId={isDirector ? userDivisionId : undefined}
            />
          </div>
        </details>
      )}
    </div>
  );
}

function OrganizationDepartmentComparison({
  organizationId,
  teamPerformance,
  teamLoading,
  divisionId,
}: {
  organizationId: string;
  teamPerformance: any;
  teamLoading: boolean;
  divisionId?: string;
}) {
  const router = useRouter();
  const { data: divisionsData, loading: divisionsLoading } = useQuery(
    GET_DIVISIONS_WITH_PERFORMANCE,
    {
      variables: { organizationId },
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
    },
  );
  const { data: departmentsData, loading: departmentsLoading } = useQuery(
    GET_DEPARTMENTS_QUERY,
    {
      variables: { organizationId },
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
    },
  );

  const rawHeatMapData =
    divisionsData?.divisions?.items.map((division: any) => {
      const divisionMembers =
        teamPerformance?.results?.filter((result: any) =>
          result.employee.departments?.some(
            (department: any) =>
              department.division?.divisionId === division.divisionId,
          ),
        ) || [];
      const divisionAverageScore = divisionMembers.length
        ? divisionMembers.reduce(
            (sum: number, result: any) => sum + result.overallPercentage,
            0,
          ) / divisionMembers.length
        : 0;
      const divisionDepartments =
        departmentsData?.departments?.items?.filter(
          (department: any) =>
            department.division?.divisionId === division.divisionId,
        ) || [];

      return {
        divisionId: division.divisionId,
        name: division.name,
        averageScore: divisionAverageScore,
        departments: divisionDepartments.map((department: any) => {
          const departmentMembers =
            teamPerformance?.results?.filter((result: any) =>
              result.employee.departments?.some(
                (candidate: any) =>
                  candidate.departmentId === department.departmentId,
              ),
            ) || [];
          const averageScore = departmentMembers.length
            ? departmentMembers.reduce(
                (sum: number, result: any) => sum + result.overallPercentage,
                0,
              ) / departmentMembers.length
            : 0;

          return {
            departmentId: department.departmentId,
            name: department.name,
            averageScore,
            employeeCount: departmentMembers.length,
          };
        }),
      };
    }) || [];
  const heatMapData = divisionId
    ? rawHeatMapData.filter(
        (division: any) => division.divisionId === divisionId,
      )
    : rawHeatMapData;

  return (
        <DepartmentHeatMap
          divisions={heatMapData}
          loading={divisionsLoading || departmentsLoading || teamLoading}
          onDepartmentClick={(departmentId) =>
            router.push(`/dashboard/departments/${departmentId}`)
          }
        />
  );
}
