import { describe, expect, it } from "vitest";
import { summarizeTaskTypes } from "./task-summary";

describe("summarizeTaskTypes", () => {
  it("classifies tasks only by KPI link type, regardless of checkout status", () => {
    const tasks: Array<{ taskType: string; checkoutStatus: string }> = [
      { taskType: "KPI_FULFILLED", checkoutStatus: "NOT DONE" },
      { taskType: "KPI_UNMET", checkoutStatus: "DONE" },
      { taskType: "INITIATIVE_UNMET", checkoutStatus: "DONE" },
      { taskType: "UNLINKED", checkoutStatus: "DONE" },
      { taskType: "SELF_DEVELOPMENT_FULFILLED", checkoutStatus: "DONE" },
    ];
    const summary = summarizeTaskTypes(tasks);

    expect(summary).toEqual({
      totalTasks: 5,
      totalKpiTasks: 2,
      nonKpiTasks: 3,
      kpiFulfilled: 1,
      kpiUnmet: 1,
      kpiFulfilledPercentage: 50,
      kpiUnmetPercentage: 50,
    });
  });

  it("matches the 40-task team example and uses KPI tasks as the percentage denominator", () => {
    const tasks = [
      ...Array.from({ length: 4 }, () => ({ taskType: "KPI_FULFILLED" })),
      ...Array.from({ length: 31 }, () => ({ taskType: "KPI_UNMET" })),
      ...Array.from({ length: 2 }, () => ({ taskType: "INITIATIVE_UNMET" })),
      ...Array.from({ length: 3 }, () => ({ taskType: "UNLINKED" })),
    ];

    expect(summarizeTaskTypes(tasks)).toEqual({
      totalTasks: 40,
      totalKpiTasks: 35,
      nonKpiTasks: 5,
      kpiFulfilled: 4,
      kpiUnmet: 31,
      kpiFulfilledPercentage: 11,
      kpiUnmetPercentage: 89,
    });
  });

  it("returns zero percentages when there are no KPI tasks", () => {
    expect(
      summarizeTaskTypes([
        { taskType: "INITIATIVE_FULFILLED" },
        { taskType: "UNLINKED" },
      ]),
    ).toEqual({
      totalTasks: 2,
      totalKpiTasks: 0,
      nonKpiTasks: 2,
      kpiFulfilled: 0,
      kpiUnmet: 0,
      kpiFulfilledPercentage: 0,
      kpiUnmetPercentage: 0,
    });
  });
});
