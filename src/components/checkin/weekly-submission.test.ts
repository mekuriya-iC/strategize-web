import { describe, expect, it } from "vitest";
import {
  canSubmitWeeklyTasks,
  getLatestPlanningRejection,
  isOfficialTaskStatus,
} from "./weekly-submission";

describe("canSubmitWeeklyTasks", () => {
  it("requires both the configured count and at least one KPI fulfilled task", () => {
    expect(canSubmitWeeklyTasks(6, 1)).toBe(true);
    expect(canSubmitWeeklyTasks(10, 2)).toBe(true);
    expect(canSubmitWeeklyTasks(6, 0)).toBe(false);
    expect(canSubmitWeeklyTasks(5, 1)).toBe(false);
    expect(canSubmitWeeklyTasks(11, 1)).toBe(false);
  });

  it("treats only approved and legacy submitted tasks as official", () => {
    expect(isOfficialTaskStatus("APPROVED")).toBe(true);
    expect(isOfficialTaskStatus("SUBMITTED")).toBe(true);
    expect(isOfficialTaskStatus("PENDING_APPROVAL")).toBe(false);
    expect(isOfficialTaskStatus("DRAFT")).toBe(false);
  });

  it("returns the latest rejected planning revision", () => {
    expect(
      getLatestPlanningRejection([
        { revision: 1, decision: "REJECTED", rejectionReason: "Clarify scope" },
        { revision: 2, decision: "APPROVED" },
        { revision: 3, decision: "REJECTED", rejectionReason: "Adjust timing" },
      ]),
    ).toMatchObject({ revision: 3, rejectionReason: "Adjust timing" });
  });
});
