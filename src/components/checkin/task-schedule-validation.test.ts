import { describe, expect, it } from "vitest";
import {
  getTaskOverlapFeedback,
  validateTaskTimeRange,
} from "./task-schedule-validation";

describe("task schedule validation", () => {
  it("turns the API overlap conflict into actionable feedback", () => {
    const feedback = getTaskOverlapFeedback({
      graphQLErrors: [
        {
          message:
            'Task time overlaps with existing task "Meet with investify". Adjust the start or end time.',
        },
      ],
    });

    expect(feedback?.conflictingTaskName).toBe("Meet with investify");
    expect(feedback?.inlineMessage).toContain("Back-to-back tasks are allowed");
    expect(feedback?.toastDescription).toContain("Your form has been kept");
  });

  it("ignores unrelated errors", () => {
    expect(getTaskOverlapFeedback(new Error("Network unavailable"))).toBeNull();
  });

  it("requires the end to be later while allowing adjacent task boundaries", () => {
    expect(
      validateTaskTimeRange(
        new Date("2026-08-24T10:00:00.000Z"),
        new Date("2026-08-24T10:00:00.000Z"),
      ),
    ).toBe("End date and time must be after the start date and time.");

    expect(
      validateTaskTimeRange(
        new Date("2026-08-24T10:00:00.000Z"),
        new Date("2026-08-24T11:00:00.000Z"),
      ),
    ).toBeNull();
  });
});
