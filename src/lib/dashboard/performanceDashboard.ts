import type {
  KpiQuarterPerformanceReport,
  KpiQuarterReportKpiRollup,
  KpiQuarterReportSummary,
} from "@/types/graphql";
import type {
  SupportPerformanceRow,
  SupportPerformanceSourceSummary,
  SupportQuarterOutcome,
} from "@/types/support-performance";

export interface DashboardKpiPerformance {
  kpiId: string;
  name: string;
  weight: number;
  target: number;
  actual: number | null;
  achievement: number;
  measurementUnit: string;
  customUnitLabel?: string | null;
  resultCount: number;
  resultCoverage: number;
}

export interface DashboardObjectivePerformance {
  objectiveId: string;
  title: string;
  weight: number | null;
  achievement: number;
  achievedWeight: number;
  plannedWeight: number;
  kpis: DashboardKpiPerformance[];
}

export interface DashboardSupportPerformance {
  sourceKpiId: string;
  sourceKpiName: string;
  sourceObjectiveId: string;
  sourceObjectiveTitle: string;
  achievement: number;
  achievedWeight: number;
  plannedWeight: number;
  rows: Array<{
    id: string;
    unitName: string;
    localKpiName: string;
    achievement: number | null;
    expectedImpact?: string | null;
  }>;
}

const number = (value: number | null | undefined) => Number(value ?? 0);

export function summaryAchievement(
  summary: KpiQuarterReportSummary | undefined,
): number {
  if (!summary) return 0;
  const planned = number(summary.plannedContributionWeight);
  if (planned > 0) {
    return (number(summary.achievedContributionWeight) / planned) * 100;
  }
  return number(summary.weightedAchievementRate) * 100;
}

export function buildCorporateObjectives(
  rollups: KpiQuarterReportKpiRollup[],
): DashboardObjectivePerformance[] {
  const objectiveRows = new Map<string, KpiQuarterReportKpiRollup[]>();
  for (const rollup of rollups) {
    const key = rollup.objectiveId ?? `unassigned:${rollup.kpiId}`;
    objectiveRows.set(key, [...(objectiveRows.get(key) ?? []), rollup]);
  }

  return [...objectiveRows.entries()]
    .map(([objectiveId, members]) => {
      const kpis = members.map((item) => ({
        kpiId: item.kpiId,
        name: item.kpiName,
        weight: number(item.weight),
        target: number(item.target),
        actual: item.actual == null ? null : number(item.actual),
        achievement: number(item.achievementRate) * 100,
        measurementUnit: item.measurementUnit,
        customUnitLabel: item.customUnitLabel,
        resultCount: item.resultCount,
        resultCoverage: number(item.resultCoverageRate) * 100,
      }));
      const plannedWeight = members.reduce(
        (sum, item) => sum + number(item.plannedContributionWeight),
        0,
      );
      const achievedWeight = members.reduce(
        (sum, item) => sum + number(item.achievedContributionWeight),
        0,
      );
      return {
        objectiveId,
        title: members[0]?.objectiveTitle || "Corporate objective",
        weight:
          members[0]?.objectiveWeight == null
            ? null
            : number(members[0].objectiveWeight),
        achievement:
          plannedWeight > 0 ? (achievedWeight / plannedWeight) * 100 : 0,
        achievedWeight,
        plannedWeight,
        kpis: kpis.sort((left, right) => right.weight - left.weight),
      };
    })
    .sort((left, right) => {
      const weightDifference = number(right.weight) - number(left.weight);
      return weightDifference || left.title.localeCompare(right.title);
    });
}

function selectedSupportOutcomes(
  row: SupportPerformanceRow,
  quarterNumber?: number,
): SupportQuarterOutcome[] {
  return quarterNumber
    ? row.quarters.filter((quarter) => quarter.quarterNumber === quarterNumber)
    : row.quarters;
}

export function buildSupportPerformance(
  rows: SupportPerformanceRow[],
  summaries: SupportPerformanceSourceSummary[] = [],
  quarterNumber?: number,
): DashboardSupportPerformance[] {
  const groups = new Map<string, SupportPerformanceRow[]>();
  for (const row of rows.filter((item) => item.localKpiId)) {
    groups.set(row.sourceCorporateKpiId, [
      ...(groups.get(row.sourceCorporateKpiId) ?? []),
      row,
    ]);
  }

  const fallbackSummaries: SupportPerformanceSourceSummary[] = [
    ...groups.values(),
  ].map((members) => {
      const selected = members.flatMap((row) =>
        selectedSupportOutcomes(row, quarterNumber),
      );
      const plannedWeight = selected.reduce(
        (sum, outcome) => sum + number(outcome.plannedContributionWeight),
        0,
      );
      const achievedWeight = selected.reduce(
        (sum, outcome) => sum + number(outcome.contribution),
        0,
      );
      const first = members[0];
      const planCount = selected.filter(
        (outcome) => outcome.planStatus != null,
      ).length;
      const resultCount = selected.filter(
        (outcome) => outcome.achievement != null,
      ).length;
      return {
        sourceCorporateKpiId: first.sourceCorporateKpiId,
        sourceCorporateKpiName: first.sourceCorporateKpiName,
        sourceCorporateObjectiveId: first.sourceCorporateObjectiveId,
        sourceCorporateObjectiveTitle: first.sourceCorporateObjectiveTitle,
        localKpiCount: members.length,
        resultCount,
        planCount,
        plannedContributionWeight: plannedWeight,
        achievedContributionWeight: achievedWeight,
        achievementRate:
          plannedWeight > 0 ? achievedWeight / plannedWeight : 0,
        resultCoverageRate: planCount > 0 ? resultCount / planCount : 0,
      };
    });

  return (summaries.length > 0 ? summaries : fallbackSummaries)
    .map((summary) => {
      const members = groups.get(summary.sourceCorporateKpiId) ?? [];
      return {
        sourceKpiId: summary.sourceCorporateKpiId,
        sourceKpiName: summary.sourceCorporateKpiName,
        sourceObjectiveId: summary.sourceCorporateObjectiveId,
        sourceObjectiveTitle: summary.sourceCorporateObjectiveTitle,
        achievement: number(summary.achievementRate) * 100,
        achievedWeight: number(summary.achievedContributionWeight),
        plannedWeight: number(summary.plannedContributionWeight),
        rows: members.map((row) => {
          const outcomes = selectedSupportOutcomes(row, quarterNumber);
          const rowPlanned = outcomes.reduce(
            (sum, outcome) =>
              sum + number(outcome.plannedContributionWeight),
            0,
          );
          const rowAchieved = outcomes.reduce(
            (sum, outcome) => sum + number(outcome.contribution),
            0,
          );
          return {
            id: `${row.objectiveSupportSourceId}:${row.localKpiId}`,
            unitName: row.unitName,
            localKpiName: row.localKpiName || "Local support KPI",
            achievement:
              rowPlanned > 0 ? (rowAchieved / rowPlanned) * 100 : null,
            expectedImpact: row.expectedImpact,
          };
        }),
      };
    })
    .sort((left, right) => right.achievement - left.achievement);
}

export function reportQuarterAchievement(
  report: KpiQuarterPerformanceReport | undefined,
  quarterNumber: number,
): number {
  return summaryAchievement(
    report?.quarterSummaries.find(
      (quarter) => quarter.quarterNumber === quarterNumber,
    ),
  );
}
