import { describe, expect, it } from "vitest";
import { getQuarterTargetRollup, getYearlyTotals } from "./kpi-math";

describe("KPI quarterly aggregation semantics", () => {
  const targets = [
    { timeline: "2026-Q1", target: 2 },
    { timeline: "2026-Q2", target: 3 },
    { timeline: "2026-Q3", target: 4 },
    { timeline: "2026-Q4", target: 3 },
  ];

  it("averages varying quarterly rates when configured as AVERAGE", () => {
    const rateTargets = [80, 85, 82, 83].map((target, index) => ({
      timeline: `2026-Q${index + 1}`,
      target,
    }));

    expect(
      getYearlyTotals(rateTargets, {
        unitType: "PERCENT",
        quarterlyAggregationMethod: "AVERAGE",
      }).totals,
    ).toEqual({ "2026": 82.5 });
  });

  it("sums additive quarterly percentage points when configured as SUM", () => {
    expect(
      getYearlyTotals(targets, {
        unitType: "PERCENT",
        quarterlyAggregationMethod: "SUM",
      }).totals,
    ).toEqual({ "2026": 12 });
  });

  it("keeps legacy percentage KPIs average-based when configuration is absent", () => {
    expect(getYearlyTotals(targets, { unitType: "PERCENT" }).totals).toEqual({
      "2026": 3,
    });
  });

  it("uses the configured operation in pending approval rollups", () => {
    const quarters = { q1: 2, q2: 3, q3: 4, q4: 3 };

    expect(
      getQuarterTargetRollup(quarters, {
        unitType: "PERCENT",
        quarterlyAggregationMethod: "SUM",
      }),
    ).toEqual({ label: "Sum", value: 12 });
    expect(
      getQuarterTargetRollup(quarters, {
        unitType: "PERCENT",
        quarterlyAggregationMethod: "AVERAGE",
      }),
    ).toEqual({ label: "Average", value: 3 });
  });

  it("preserves an explicit zero annual target", () => {
    expect(
      getYearlyTotals(
        [
          { timeline: "2026", target: 0 },
          ...targets,
        ],
        { unitType: "PERCENT", quarterlyAggregationMethod: "SUM" },
      ).totals,
    ).toEqual({ "2026": 0 });
  });
});
