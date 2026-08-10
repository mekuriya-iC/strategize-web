import type {
  KpiQuarterPerformanceReport,
  KpiQuarterReportRollup,
} from "@/types/graphql";

interface DashboardContextInput {
  authLoading: boolean;
  hasUser: boolean;
  hasSelectedPeriod: boolean;
  hasAnnualTimeline: boolean;
  selectionValidated: boolean;
  requiresOrgUnit: boolean;
  hasOrgUnit: boolean;
}

export function isDashboardAnalyticsContextReady({
  authLoading,
  hasUser,
  hasSelectedPeriod,
  hasAnnualTimeline,
  selectionValidated,
  requiresOrgUnit,
  hasOrgUnit,
}: DashboardContextInput): boolean {
  return (
    !authLoading &&
    hasUser &&
    hasSelectedPeriod &&
    hasAnnualTimeline &&
    selectionValidated &&
    (!requiresOrgUnit || hasOrgUnit)
  );
}

export type PerformanceStatus = "On track" | "Close to target" | "Needs attention";

export interface OrganizationPerformanceItem {
  id: string;
  name: string;
  achievement: number;
  kpiCount: number;
  pendingCount: number;
  status: PerformanceStatus;
}

function toPercent(rate: number): number {
  return Number((Number(rate || 0) * 100).toFixed(1));
}

export function getPerformanceStatus(achievement: number): PerformanceStatus {
  if (achievement >= 100) return "On track";
  if (achievement >= 75) return "Close to target";
  return "Needs attention";
}

export function buildOrganizationPerformanceItems(
  rollups: KpiQuarterReportRollup[],
  level: "DIVISION" | "DEPARTMENT",
): OrganizationPerformanceItem[] {
  return rollups
    .filter((rollup) => rollup.level === level)
    .map((rollup) => {
      const achievement = toPercent(rollup.averageAchievementRate);

      return {
        id: rollup.entityId,
        name: rollup.entityName,
        achievement,
        kpiCount: rollup.kpiCount,
        pendingCount: rollup.pendingResultCount + rollup.provisionalCount,
        status: getPerformanceStatus(achievement),
      };
    })
    .sort((a, b) => b.achievement - a.achievement || a.name.localeCompare(b.name));
}

export interface OrganizationComparisonUnit extends OrganizationPerformanceItem {
  /** Percentage-point difference from the corporate achievement. */
  delta: number;
}

export interface DivisionComparisonGroup extends OrganizationComparisonUnit {
  departments: OrganizationComparisonUnit[];
}

export interface OrganizationComparison {
  corporateAchievement: number;
  divisions: DivisionComparisonGroup[];
  /** Departments whose parent division has no rollup of its own. */
  ungroupedDepartments: OrganizationComparisonUnit[];
}

/**
 * Builds a corporate → division → department comparison so every unit's
 * achievement can be read side by side against the corporate result.
 * Department-to-division mapping comes from the report's availableFilters.
 */
export function buildOrganizationComparison(
  report: Pick<
    KpiQuarterPerformanceReport,
    "summary" | "rollups" | "availableFilters"
  >,
): OrganizationComparison {
  const corporateAchievement = toPercent(report.summary.averageAchievementRate);

  const withDelta = (
    item: OrganizationPerformanceItem,
  ): OrganizationComparisonUnit => ({
    ...item,
    delta: Number((item.achievement - corporateAchievement).toFixed(1)),
  });

  const departmentParents = new Map<string, string | null>(
    (report.availableFilters?.departments ?? []).map((option) => [
      option.id,
      option.parentId ?? option.parentIds?.[0] ?? null,
    ]),
  );

  const departments = buildOrganizationPerformanceItems(
    report.rollups,
    "DEPARTMENT",
  ).map(withDelta);

  const divisions: DivisionComparisonGroup[] = buildOrganizationPerformanceItems(
    report.rollups,
    "DIVISION",
  ).map((division) => ({
    ...withDelta(division),
    departments: departments.filter(
      (department) => departmentParents.get(department.id) === division.id,
    ),
  }));

  const groupedDepartmentIds = new Set(
    divisions.flatMap((division) =>
      division.departments.map((department) => department.id),
    ),
  );

  return {
    corporateAchievement,
    divisions,
    ungroupedDepartments: departments.filter(
      (department) => !groupedDepartmentIds.has(department.id),
    ),
  };
}
