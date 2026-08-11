import { describe, expect, it } from "vitest";
import {
  buildAssignedQuarterTargets,
  resolveAnnualKpiTarget,
} from "./quarterTargetAllocation";

describe("resolveAnnualKpiTarget", () => {
  it("preserves the full precision of a ratio target", () => {
    expect(
      resolveAnnualKpiTarget({
        unitType: "RATIO",
        targetValue: 0.3333333333333333,
        targets: [{ timeline: "2026", target: 0.3333333333333333 }],
      }),
    ).toBe(0.3333333333333333);
  });

  it("sums quarterly percentage points when explicitly configured", () => {
    expect(
      resolveAnnualKpiTarget({
        unitType: "PERCENT",
        quarterlyAggregationMethod: "SUM",
        targets: [2, 3, 4, 3].map((target, index) => ({
          timeline: `2026-Q${index + 1}`,
          target,
        })),
      }),
    ).toBe(12);
  });

  it("averages quarterly ratio targets without rounding to two decimals", () => {
    expect(
      resolveAnnualKpiTarget({
        unitType: "RATIO",
        targets: [1, 2, 3, 4].map((quarter) => ({
          timeline: `2026-Q${quarter}`,
          target: 0.3333333333333333,
        })),
      }),
    ).toBe(0.3333333333333333);
  });
});

describe("buildAssignedQuarterTargets", () => {
  const targets = [
    { timeline: "2026-Q1", target: 10 },
    { timeline: "2026-Q2", target: 20 },
    { timeline: "2026-Q3", target: 30 },
    { timeline: "2026-Q4", target: 40 },
  ];

  it("proportionally allocates an additive annual target across four quarters", () => {
    const result = buildAssignedQuarterTargets(
      { unitType: "NUMBER", targets },
      50,
    );

    expect(result.map((target) => target.target)).toEqual([5, 10, 15, 20]);
    expect(result.reduce((sum, target) => sum + target.target, 0)).toBe(50);
  });

  it("proportionally allocates additive percentage points across quarters", () => {
    const result = buildAssignedQuarterTargets(
      {
        unitType: "PERCENT",
        quarterlyAggregationMethod: "SUM",
        targets,
      },
      12,
    );

    expect(result.map((target) => target.target)).toEqual([1.2, 2.4, 3.6, 4.8]);
    expect(result.reduce((sum, target) => sum + target.target, 0)).toBe(12);
  });

  it("repeats the annual target in every quarter for average percentage KPIs", () => {
    const result = buildAssignedQuarterTargets(
      {
        unitType: "PERCENT",
        quarterlyAggregationMethod: "AVERAGE",
        targets,
      },
      50,
    );

    expect(result.map((target) => target.target)).toEqual([50, 50, 50, 50]);
  });

  it("repeats the annual target in every quarter for ratio KPIs", () => {
    const result = buildAssignedQuarterTargets(
      { unitType: "RATIO", targets },
      3,
    );

    expect(result.map((target) => target.target)).toEqual([3, 3, 3, 3]);
  });

  it("generates four valid quarters from an annual-only corporate KPI", () => {
    const result = buildAssignedQuarterTargets(
      {
        unitType: "NUMBER",
        targets: [{ timeline: "2026", target: 100 }],
      },
      80,
      "2026",
    );

    expect(result).toEqual([
      { timeline: "2026-Q1", target: 20 },
      { timeline: "2026-Q2", target: 20 },
      { timeline: "2026-Q3", target: 20 },
      { timeline: "2026-Q4", target: 20 },
    ]);
  });

  it("keeps decimal additive allocations exactly reconciled", () => {
    const result = buildAssignedQuarterTargets(
      {
        unitType: "NUMBER",
        targets: [
          { timeline: "2026-Q1", target: 1 },
          { timeline: "2026-Q2", target: 1 },
          { timeline: "2026-Q3", target: 1 },
          { timeline: "2026-Q4", target: 1 },
        ],
      },
      10,
    );

    expect(result.reduce((sum, target) => sum + target.target, 0)).toBe(10);
  });
});
