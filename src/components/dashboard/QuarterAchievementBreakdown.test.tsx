import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { KpiQuarterPerformanceReport, StrategicPeriod } from "@/types/graphql";
import QuarterAchievementBreakdown from "./QuarterAchievementBreakdown";

const summary = {
  rowCount: 1,
  kpiCount: 1,
  originalTarget: 25,
  carryIn: 0,
  effectiveTarget: 25,
  actual: 20,
  averageAchievementRate: 0.8,
  weightedAchievementRate: 0.8,
  plannedContributionWeight: 5,
  achievedContributionWeight: 4,
  resultCoverageRate: 1,
  annualContribution: 4,
  carryOut: 5,
  finalCount: 0,
  provisionalCount: 1,
  pendingResultCount: 0,
};

const kpi = {
  kpiId: "corporate-kpi",
  kpiName: "Revenue growth",
  objectiveId: "corporate-objective",
  objectiveTitle: "Grow the business",
  objectiveWeight: 40,
  cascadeType: "TARGET_ALLOCATION" as const,
  parentKpiId: null,
  measurementUnit: "NUMBER" as const,
  unitType: "NUMBER" as const,
  customUnitLabel: null,
  quarterlyAggregationMethod: "SUM" as const,
  calculationType: "MANUAL_VALUE" as const,
  annualTarget: 100,
  weight: 20,
  target: 25,
  actual: 20,
  achievementRate: 0.8,
  plannedContributionWeight: 5,
  achievedContributionWeight: 4,
  resultCoverageRate: 1,
  planCount: 1,
  resultCount: 1,
};

function report(): KpiQuarterPerformanceReport {
  return {
    annualStrategicPeriodId: "annual",
    annualStrategicPeriodName: "2026/27",
    scope: "ORGANIZATION",
    availableFilters: {
      divisions: [{ id: "division", name: "Investments", parentIds: [] }],
      departments: [
        {
          id: "nested-department",
          name: "Portfolio",
          parentId: "division",
          parentIds: ["division"],
        },
        {
          id: "ceo-department",
          name: "Strategy Office",
          parentId: null,
          parentIds: [],
        },
      ],
      employees: [],
    },
    summary,
    quarterSummaries: [1, 2, 3, 4].map((quarterNumber) => ({
      ...summary,
      quarterNumber,
      ...(quarterNumber === 1
        ? {}
        : {
            rowCount: 0,
            kpiCount: 0,
            finalCount: 0,
            provisionalCount: 0,
            pendingResultCount: 0,
            resultCoverageRate: 0,
            plannedContributionWeight: 0,
            achievedContributionWeight: 0,
          }),
    })),
    rollups: [],
    kpiRollups: [kpi],
    entityQuarterRollups: [
      { ...summary, quarterNumber: 1, level: "DIVISION", entityId: "division", entityName: "Investments" },
      { ...summary, quarterNumber: 1, level: "DEPARTMENT", entityId: "nested-department", entityName: "Portfolio" },
      { ...summary, quarterNumber: 1, level: "DEPARTMENT", entityId: "ceo-department", entityName: "Strategy Office" },
    ],
    kpiQuarterRollups: [{ ...kpi, quarterNumber: 1 }],
    entityKpiRollups: [
      {
        ...kpi,
        quarterNumber: 1,
        kpiId: "division-kpi",
        kpiName: "Division revenue",
        parentKpiId: "corporate-kpi",
        level: "DIVISION",
        entityId: "division",
        entityName: "Investments",
        divisionId: "division",
        divisionName: "Investments",
        departmentId: null,
        departmentName: null,
      },
      {
        ...kpi,
        quarterNumber: 1,
        kpiId: "department-kpi",
        kpiName: "Department revenue",
        parentKpiId: "division-kpi",
        level: "DEPARTMENT",
        entityId: "nested-department",
        entityName: "Portfolio",
        divisionId: "division",
        divisionName: "Investments",
        departmentId: "nested-department",
        departmentName: "Portfolio",
      },
      {
        ...kpi,
        quarterNumber: 1,
        kpiId: "ceo-department-kpi",
        kpiName: "Strategic partnerships",
        parentKpiId: "corporate-kpi",
        level: "DEPARTMENT",
        entityId: "ceo-department",
        entityName: "Strategy Office",
        divisionId: null,
        divisionName: null,
        departmentId: "ceo-department",
        departmentName: "Strategy Office",
      },
    ],
    rows: [],
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 1,
    totalPages: 0,
  };
}

const quarterPeriod = {
  strategicPeriodId: "q1",
  name: "Q1",
  periodType: "QUARTERLY",
  startDate: "2026-07-01",
  endDate: "2026-09-30",
  createdBy: null,
  createdAt: "2026-07-01",
  updatedAt: "2026-07-01",
} as StrategicPeriod;

afterEach(cleanup);

describe("QuarterAchievementBreakdown", () => {
  it("renders all quarters, nested departments, and CEO-direct departments", () => {
    const primary = report();
    const hierarchy = report();
    primary.entityKpiRollups = primary.entityKpiRollups.map((item) => ({
      ...item,
      kpiId: "corporate-kpi",
      parentKpiId: null,
    }));

    render(
      <QuarterAchievementBreakdown
        primaryReport={primary}
        hierarchyReport={hierarchy}
        selectedQuarter={1}
        selectedQuarterPeriod={quarterPeriod}
      />,
    );

    expect(screen.getByText("Quarter achievement")).toBeTruthy();
    expect(screen.getAllByText("Investments").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Portfolio").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Strategy Office").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reports to CEO").length).toBeGreaterThan(0);
    expect(screen.getByText("Corporate KPI contributors")).toBeTruthy();
  });
});
