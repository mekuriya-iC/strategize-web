import { describe, expect, it } from "vitest";
import {
  projectDelivery,
  projectScoreGap,
  weeklyBaseline,
} from "./projections";
import type { TaskCompletionPeriodRow } from "./types";

const row = (
  periodStart: string,
  periodEnd: string,
  totalTasks: number,
  completedTasks: number,
): TaskCompletionPeriodRow => ({
  periodStart,
  periodEnd,
  totalTasks,
  completedTasks,
  notDoneTasks: totalTasks - completedTasks,
  postponedTasks: 0,
  cancelledTasks: 0,
  completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
  status: totalTasks ? "GOOD" : "NO_DATA",
});

describe("weekly task baseline", () => {
  it("weights by tasks rather than averaging rates", () => {
    const baseline = weeklyBaseline(
      [
        row("2026-08-03", "2026-08-09", 1, 1),
        row("2026-08-10", "2026-08-16", 9, 1),
      ],
      "2026-08-17",
    );
    expect(baseline?.completionRate).toBe(20);
    expect(baseline?.weeklyVolume).toBe(5);
    expect(baseline?.change).toBeCloseTo(100 / 9 - 100);
  });
  it("excludes current, future and partial weeks", () => {
    expect(
      weeklyBaseline(
        [
          row("2026-08-04", "2026-08-09", 10, 10),
          row("2026-08-10", "2026-08-16", 10, 10),
          row("2026-08-17", "2026-08-23", 10, 10),
          row("2026-08-24", "2026-08-30", 10, 10),
        ],
        "2026-08-19",
      ),
    ).toBeNull();
  });
  it("includes zero-volume weeks in throughput but not rate averaging", () => {
    const baseline = weeklyBaseline(
      [
        row("2026-08-03", "2026-08-09", 0, 0),
        row("2026-08-10", "2026-08-16", 10, 5),
      ],
      "2026-08-17",
    );
    expect(baseline?.weeklyVolume).toBe(5);
    expect(baseline?.completionRate).toBe(50);
    expect(baseline?.change).toBeNull();
  });
  it("does not project a no-data baseline", () => {
    expect(
      weeklyBaseline(
        [
          row("2026-08-03", "2026-08-09", 0, 0),
          row("2026-08-10", "2026-08-16", 0, 0),
        ],
        "2026-08-17",
      ),
    ).toBeNull();
  });
});

describe("scenario calculations", () => {
  it("projects expected tasks with fractional values preserved", () => {
    expect(projectDelivery(2.5, 75, 3)).toEqual({
      total: 7.5,
      completed: 5.625,
      unfinished: 1.875,
    });
  });
  it.each([
    [10, 101, 4],
    [-1, 80, 4],
    [10, 80, 0],
    [10, 80, 53],
    [10, 80, 1.5],
    [NaN, 80, 4],
  ])("rejects invalid assumptions %s %s %s", (volume, rate, weeks) => {
    expect(projectDelivery(volume, rate, weeks)).toBeNull();
  });
  it("models only the explicit corporate score gap", () => {
    expect(projectScoreGap(80, 50)).toEqual({
      score: 90,
      improvement: 10,
      remaining: 10,
    });
    expect(projectScoreGap(110, 50)).toEqual({
      score: 110,
      improvement: 0,
      remaining: 0,
    });
    expect(projectScoreGap(0, 100)).toEqual({
      score: 100,
      improvement: 100,
      remaining: 0,
    });
    expect(projectScoreGap(NaN, 50)).toBeNull();
  });
});
