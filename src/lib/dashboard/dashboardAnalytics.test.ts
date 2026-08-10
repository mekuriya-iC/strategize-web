import { describe, expect, it } from "vitest";
import {
  buildOrganizationComparison,
  buildOrganizationPerformanceItems,
  isDashboardAnalyticsContextReady,
} from "./dashboardAnalytics";
import type { KpiQuarterReportRollup } from "@/types/graphql";

const makeRollup = (
  overrides: Partial<KpiQuarterReportRollup>,
): KpiQuarterReportRollup => ({
  level: "DIVISION",
  entityId: "unit-1",
  entityName: "Unit",
  rowCount: 4,
  kpiCount: 2,
  originalTarget: 100,
  carryIn: 0,
  effectiveTarget: 100,
  actual: 80,
  averageAchievementRate: 0.8,
  annualContribution: 20,
  carryOut: 0,
  finalCount: 2,
  provisionalCount: 0,
  pendingResultCount: 0,
  ...overrides,
});

describe("isDashboardAnalyticsContextReady", () => {
  const readyContext = {
    authLoading: false,
    hasUser: true,
    hasSelectedPeriod: true,
    hasAnnualTimeline: true,
    selectionValidated: true,
    requiresOrgUnit: false,
    hasOrgUnit: false,
  };

  it("waits for authentication and planning-period context", () => {
    expect(
      isDashboardAnalyticsContextReady({
        ...readyContext,
        authLoading: true,
      }),
    ).toBe(false);
    expect(
      isDashboardAnalyticsContextReady({
        ...readyContext,
        hasSelectedPeriod: false,
      }),
    ).toBe(false);
    expect(
      isDashboardAnalyticsContextReady({
        ...readyContext,
        selectionValidated: false,
      }),
    ).toBe(false);
    expect(isDashboardAnalyticsContextReady(readyContext)).toBe(true);
  });

  it("waits for a role-scoped unit only when one is required", () => {
    expect(
      isDashboardAnalyticsContextReady({
        ...readyContext,
        requiresOrgUnit: true,
      }),
    ).toBe(false);
    expect(
      isDashboardAnalyticsContextReady({
        ...readyContext,
        requiresOrgUnit: true,
        hasOrgUnit: true,
      }),
    ).toBe(true);
  });
});

describe("buildOrganizationPerformanceItems", () => {
  it("filters, formats, classifies, and sorts rollups", () => {
    const rollups = [
      makeRollup({
        entityId: "division-b",
        entityName: "Division B",
        averageAchievementRate: 0.72,
        pendingResultCount: 1,
      }),
      makeRollup({
        entityId: "division-a",
        entityName: "Division A",
        averageAchievementRate: 1.04,
      }),
      makeRollup({
        level: "DEPARTMENT",
        entityId: "department-a",
        entityName: "Department A",
        averageAchievementRate: 0.88,
      }),
    ];

    expect(buildOrganizationPerformanceItems(rollups, "DIVISION")).toEqual([
      expect.objectContaining({
        id: "division-a",
        achievement: 104,
        status: "On track",
      }),
      expect.objectContaining({
        id: "division-b",
        achievement: 72,
        pendingCount: 1,
        status: "Needs attention",
      }),
    ]);
    expect(buildOrganizationPerformanceItems(rollups, "DEPARTMENT")).toEqual([
      expect.objectContaining({
        id: "department-a",
        achievement: 88,
        status: "Close to target",
      }),
    ]);
  });
});

describe("buildOrganizationComparison", () => {
  it("nests departments under divisions and computes deltas vs corporate", () => {
    const comparison = buildOrganizationComparison({
      summary: {
        rowCount: 10,
        kpiCount: 6,
        originalTarget: 100,
        carryIn: 0,
        effectiveTarget: 100,
        actual: 85,
        averageAchievementRate: 0.85,
        annualContribution: 85,
        carryOut: 0,
        finalCount: 4,
        provisionalCount: 1,
        pendingResultCount: 1,
      },
      rollups: [
        makeRollup({
          entityId: "division-a",
          entityName: "Division A",
          averageAchievementRate: 0.95,
        }),
        makeRollup({
          level: "DEPARTMENT",
          entityId: "department-a1",
          entityName: "Department A1",
          averageAchievementRate: 0.7,
        }),
        makeRollup({
          level: "DEPARTMENT",
          entityId: "department-orphan",
          entityName: "Orphan Department",
          averageAchievementRate: 0.9,
        }),
      ],
      availableFilters: {
        divisions: [
          { id: "division-a", name: "Division A", parentId: null, parentIds: [] },
        ],
        departments: [
          {
            id: "department-a1",
            name: "Department A1",
            parentId: "division-a",
            parentIds: ["division-a"],
          },
          {
            id: "department-orphan",
            name: "Orphan Department",
            parentId: "division-missing",
            parentIds: ["division-missing"],
          },
        ],
        employees: [],
      },
    });

    expect(comparison.corporateAchievement).toBe(85);
    expect(comparison.divisions).toEqual([
      expect.objectContaining({
        id: "division-a",
        achievement: 95,
        delta: 10,
        departments: [
          expect.objectContaining({
            id: "department-a1",
            achievement: 70,
            delta: -15,
            status: "Needs attention",
          }),
        ],
      }),
    ]);
    expect(comparison.ungroupedDepartments).toEqual([
      expect.objectContaining({ id: "department-orphan", delta: 5 }),
    ]);
  });
});
