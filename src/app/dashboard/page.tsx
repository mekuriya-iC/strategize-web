"use client";

import { useQuery, gql } from "@apollo/client";
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
  const router = useRouter();
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
      skip: !user?.organizationId || (!hasFullAccess && !isDirector),
      fetchPolicy: "cache-and-network",
    },
  );

  // Fetch all departments
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS_QUERY, {
    variables: {
      organizationId: user?.organizationId,
    },
    skip: !user?.organizationId || (!hasFullAccess && !isDirector),
    fetchPolicy: "cache-and-network",
  });



  const teamPerformance = teamData?.unifiedTeamPerformance;


  // Calculate metrics from REAL data
  const teamMeetingExpectations = teamPerformance?.results
    ? (teamPerformance.results.filter((r: any) => r.overallPercentage >= 70)
        .length /
        teamPerformance.results.length) *
      100
    : 0;



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

      {(hasFullAccess || isDirector) && (
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
              loading={divisionsLoading || teamLoading}
              onDepartmentClick={(departmentId) =>
                router.push(`/dashboard/departments/${departmentId}`)
              }
            />
          </div>
        </details>
      )}
    </div>
  );
}
