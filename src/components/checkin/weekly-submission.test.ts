import { describe, expect, it } from "vitest";
import {
  canSubmitWeeklyTasks,
  getBulkDraftTaskIds,
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

  it("selects only initial-week draft tasks", () => {
    expect(
      getBulkDraftTaskIds([
        { id: "draft", submissionStatus: "DRAFT" },
        { id: "midweek", submissionStatus: "DRAFT", isMidWeekTask: true },
        { id: "approved", submissionStatus: "APPROVED" },
      ]),
    ).toEqual(["draft"]);
  });

  it("caps bulk selection and keeps a KPI fulfilled task in the batch", () => {
    const ordinaryDrafts = Array.from({ length: 10 }, (_, index) => ({
      id: `task-${index + 1}`,
      submissionStatus: "DRAFT",
      taskType: "MAJOR",
    }));

    expect(
      getBulkDraftTaskIds([
        ...ordinaryDrafts,
        {
          id: "fulfilled",
          submissionStatus: "DRAFT",
          taskType: "KPI_FULFILLED",
        },
      ]),
    ).toEqual([
      "task-1",
      "task-2",
      "task-3",
      "task-4",
      "task-5",
      "task-6",
      "task-7",
      "task-8",
      "task-9",
      "fulfilled",
    ]);
  });

  it("reserves submission capacity for required carryover drafts", () => {
    const ordinaryDrafts = Array.from({ length: 10 }, (_, index) => ({
      id: `task-${index + 1}`,
      submissionStatus: "DRAFT",
      taskType: index === 0 ? "KPI_FULFILLED" : "MAJOR",
    }));

    expect(
      getBulkDraftTaskIds([
        ...ordinaryDrafts,
        {
          id: "carryover",
          submissionStatus: "DRAFT",
          taskType: "KPI_UNMET",
          carryoverGeneration: 1,
        },
      ]),
    ).toEqual([
      "carryover",
      "task-1",
      "task-2",
      "task-3",
      "task-4",
      "task-5",
      "task-6",
      "task-7",
      "task-8",
      "task-9",
    ]);
  });
});
