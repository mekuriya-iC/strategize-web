import { describe, expect, it } from "vitest";
import type {
  KpiQuarterReportKpiRollup,
  KpiQuarterReportSummary,
} from "@/types/graphql";
import type {
  SupportPerformanceRow,
  SupportPerformanceSourceSummary,
} from "@/types/support-performance";
import {
  buildCorporateObjectives,
  buildSupportPerformance,
  calculateDashboardPace,
  performanceTrafficStatus,
  quarterProgressRate,
  summaryAchievement,
} from "./performanceDashboard";

const summary: KpiQuarterReportSummary = {
  rowCount: 2,
  kpiCount: 2,
  originalTarget: 50,
  carryIn: 0,
  effectiveTarget: 50,
  actual: 20,
  averageAchievementRate: 0.8,
  weightedAchievementRate: 0.4,
  plannedContributionWeight: 25,
  achievedContributionWeight: 10,
  resultCoverageRate: 0.5,
  annualContribution: 10,
  carryOut: 30,
  finalCount: 0,
  provisionalCount: 1,
  pendingResultCount: 1,
};

const corporateKpi: KpiQuarterReportKpiRollup = {
  kpiId: "kpi-1",
  kpiName: "Revenue",
  objectiveId: "objective-1",
  objectiveTitle: "Grow revenue",
  objectiveWeight: 40,
  cascadeType: "TARGET_ALLOCATION",
  parentKpiId: null,
  measurementUnit: "CURRENCY",
  unitType: "CURRENCY",
  customUnitLabel: null,
  quarterlyAggregationMethod: "SUM",
  calculationType: "MANUAL_VALUE",
  annualTarget: 100,
  weight: 25,
  target: 50,
  actual: 40,
  achievementRate: 0.8,
  plannedContributionWeight: 12.5,
  achievedContributionWeight: 10,
  resultCoverageRate: 1,
  planCount: 2,
  resultCount: 2,
};

describe("performance dashboard calculations", () => {
  it("uses planned scorecard weight so pending results remain in the denominator", () => {
    expect(summaryAchievement(summary)).toBe(40);
  });

  it("builds corporate objectives from unpaginated KPI rollups", () => {
    expect(buildCorporateObjectives([corporateKpi])).toEqual([
      expect.objectContaining({
        objectiveId: "objective-1",
        achievement: 80,
        plannedWeight: 12.5,
        achievedWeight: 10,
        kpis: [
          expect.objectContaining({
            name: "Revenue",
            target: 50,
            actual: 40,
            achievement: 80,
            resultCoverage: 100,
          }),
        ],
      }),
    ]);
  });

  it("keeps support attainment separate and uses the server summary", () => {
    const rows = [
      {
        objectiveSupportSourceId: "source-1",
        sourceCorporateKpiId: "corporate-kpi-1",
        sourceCorporateKpiName: "Revenue",
        sourceCorporateObjectiveId: "corporate-objective-1",
        sourceCorporateObjectiveTitle: "Grow revenue",
        unitType: "DEPARTMENT",
        unitId: "department-1",
        unitName: "Sales",
        supportObjectiveId: "support-objective-1",
        supportObjectiveTitle: "Support sales",
        localKpiId: "local-kpi-1",
        localKpiName: "Qualified leads",
        readinessStatus: "READY",
        quarters: [],
        annualContribution: 8,
        plannedContributionWeight: 10,
        annualAchievement: 0.8,
      },
    ] satisfies SupportPerformanceRow[];
    const summaries = [
      {
        sourceCorporateKpiId: "corporate-kpi-1",
        sourceCorporateKpiName: "Revenue",
        sourceCorporateObjectiveId: "corporate-objective-1",
        sourceCorporateObjectiveTitle: "Grow revenue",
        localKpiCount: 1,
        resultCount: 1,
        planCount: 1,
        plannedContributionWeight: 10,
        achievedContributionWeight: 8,
        achievementRate: 0.8,
        resultCoverageRate: 1,
      },
    ] satisfies SupportPerformanceSourceSummary[];

    expect(buildSupportPerformance(rows, summaries)).toEqual([
      expect.objectContaining({
        sourceKpiId: "corporate-kpi-1",
        achievement: 80,
        plannedWeight: 10,
        achievedWeight: 8,
      }),
    ]);
  });

  it("compares cumulative KPIs with elapsed-quarter pace", () => {
    expect(
      calculateDashboardPace(
        [
          {
            ...corporateKpi,
            plannedContributionWeight: 10,
            achievedContributionWeight: 4.5,
          },
        ],
        0.5,
      ),
    ).toMatchObject({ achievement: 45, pace: 90, status: "AMBER" });
  });

  it("does not time-prorate average and rate KPIs", () => {
    const pace = calculateDashboardPace(
      [
        {
          ...corporateKpi,
          quarterlyAggregationMethod: "AVERAGE",
          plannedContributionWeight: 10,
          achievedContributionWeight: 8,
        },
      ],
      0.5,
    );
    expect(pace).toMatchObject({ achievement: 80, pace: 80, status: "AMBER" });
  });

  it("does not time-prorate formula KPIs even when their annual rollup is additive", () => {
    const pace = calculateDashboardPace(
      [
        {
          ...corporateKpi,
          calculationType: "SCALAR_FORMULA",
          plannedContributionWeight: 10,
          achievedContributionWeight: 4.5,
        },
      ],
      0.5,
    );
    expect(pace).toMatchObject({ achievement: 45, pace: 45, status: "RED" });
  });

  it("uses a neutral state when no calculated result exists", () => {
    expect(
      calculateDashboardPace([
        {
          ...corporateKpi,
          resultCount: 0,
          achievedContributionWeight: 0,
        },
      ]).status,
    ).toBe("NO_DATA");
    expect(performanceTrafficStatus(79.99)).toBe("RED");
    expect(performanceTrafficStatus(100)).toBe("GREEN");
  });

  it("calculates deterministic quarter progress", () => {
    expect(
      quarterProgressRate(
        { startDate: "2026-07-01", endDate: "2026-09-30" },
        new Date("2026-07-01T00:00:00"),
      ),
    ).toBe(0);
    expect(
      quarterProgressRate(
        { startDate: "2026-07-01", endDate: "2026-09-30" },
        new Date("2026-10-01T00:00:00"),
      ),
    ).toBe(1);
  });
});
