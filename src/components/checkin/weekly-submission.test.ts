import { describe, expect, it } from "vitest";
import { canSubmitWeeklyTasks } from "./weekly-submission";

describe("canSubmitWeeklyTasks", () => {
  it("requires both the configured count and at least one KPI fulfilled task", () => {
    expect(canSubmitWeeklyTasks(6, 1)).toBe(true);
    expect(canSubmitWeeklyTasks(10, 2)).toBe(true);
    expect(canSubmitWeeklyTasks(6, 0)).toBe(false);
    expect(canSubmitWeeklyTasks(5, 1)).toBe(false);
    expect(canSubmitWeeklyTasks(11, 1)).toBe(false);
  });
});
