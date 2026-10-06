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
    <div className="mx-auto max-w-[1600px] space-y-7 pb-8">
      <AnalyticsSummary />

      {/* Approved, server-scoped quarterly performance is the dashboard authority. */}
      <QuarterlyPerformanceOverview />

      {isLeadershipRole && teamPerformance && (
        <details className="group/people overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-slate-300 dark:border-white/[0.08] dark:bg-zinc-900/90">
          <summary className="flex cursor-pointer list-none items-center gap-3.5 p-5 transition-colors hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-zinc-800/40 sm:p-6 [&::-webkit-details-marker]:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="team-performance-heading" className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                People performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
                Current unified performance within your authorized scope.
              </p>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open/people:rotate-180" />
          </summary>
          <div className="border-t border-slate-100 bg-slate-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-950/40 sm:p-6">
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
        <details className="group/comparison overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-slate-300 dark:border-white/[0.08] dark:bg-zinc-900/90">
          <summary className="flex cursor-pointer list-none items-center gap-3.5 p-5 transition-colors hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-zinc-800/40 sm:p-6 [&::-webkit-details-marker]:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                People performance by department
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
                Explore the organization’s team performance comparison.
              </p>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open/comparison:rotate-180" />
          </summary>
          <div className="border-t border-slate-100 bg-slate-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 sm:p-6">
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
