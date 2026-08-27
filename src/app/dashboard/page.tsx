"use client";

import { gql, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import AnalyticsSummary from "@/components/dashboard/AnalyticsSummary";

import { OrganizationalHealthCard } from "@/components/dashboard/OrganizationalHealthCard";
import { DepartmentHeatMap } from "@/components/dashboard/DepartmentHeatMap";
import QuarterlyPerformanceOverview from "@/components/dashboard/QuarterlyPerformanceOverview";
import SupportReadinessCard from "@/components/dashboard/SupportReadinessCard";

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

      {isLeadershipRole && <SupportReadinessCard />}

      {isLeadershipRole && teamPerformance && (
        <section className="space-y-3" aria-labelledby="team-performance-heading">
          <div>
            <h2 id="team-performance-heading" className="text-lg font-semibold tracking-tight">
              People performance
            </h2>
            <p className="text-sm text-muted-foreground">
              Current unified performance within your authorized scope.
            </p>
          </div>
          <div className="max-w-md">
            <OrganizationalHealthCard
              title={performanceScopeTitle}
              currentScore={teamPerformance.averageScore}
              teamMeetingExpectations={teamMeetingExpectations}
              totalEmployees={teamPerformance.results?.length || 0}
              loading={teamLoading}
            />
          </div>
        </section>
      )}

      {canLoadOrganizationHeatMap && organizationId && (
        <OrganizationDepartmentComparison
          organizationId={organizationId}
          teamPerformance={teamPerformance}
          teamLoading={teamLoading}
          divisionId={isDirector ? userDivisionId : undefined}
        />
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
    <details className="group rounded-xl border bg-card shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        <div>
          <p>Department comparison</p>
          <p className="mt-0.5 text-sm font-normal text-muted-foreground">
            Compare unified performance across departments in your authorized scope.
          </p>
        </div>
        <span className="text-sm text-muted-foreground transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="border-t p-5">
        <DepartmentHeatMap
          divisions={heatMapData}
          loading={divisionsLoading || departmentsLoading || teamLoading}
          onDepartmentClick={(departmentId) =>
            router.push(`/dashboard/departments/${departmentId}`)
          }
        />
      </div>
    </details>
  );
}
