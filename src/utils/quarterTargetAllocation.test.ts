import { buildAssignedQuarterTargets } from "./quarterTargetAllocation";

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

  it("repeats the annual target in every quarter for percentage KPIs", () => {
    const result = buildAssignedQuarterTargets(
      { unitType: "PERCENT", targets },
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
