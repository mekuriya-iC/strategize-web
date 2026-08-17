import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeeklySubmissionPanel } from "./WeeklySubmissionPanel";
import {
  canSubmitWeeklyTasks,
  getSubmissionStatusMeta,
} from "./weekly-submission";

const summary = {
  sessionId: "session-1",
  draftCount: 7,
  submittedCount: 0,
  personalTodoCount: 2,
  activeCount: 9,
  remainingCapacity: 6,
  minimumSubmissionCount: 6,
  maximumSubmissionCount: 10,
  maximumActiveTaskCount: 15,
};

afterEach(cleanup);

describe("weekly task submission", () => {
  it.each([
    [5, false],
    [6, true],
    [10, true],
    [11, false],
  ])("validates a selection of %i tasks", (count, expected) => {
    expect(canSubmitWeeklyTasks(count, 6, 10)).toBe(expected);
  });

  it("shows pool capacity, status labels, and private personal-to-do guidance", () => {
    render(
      <WeeklySubmissionPanel
        summary={summary}
        selectedCount={6}
        alreadySubmitted={false}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("9/15")).toBeTruthy();
    expect(screen.getByText("DRAFT 7")).toBeTruthy();
    expect(screen.getByText("SUBMITTED 0")).toBeTruthy();
    expect(screen.getByText("PERSONAL_TODO 2")).toBeTruthy();
    expect(
      screen.getByText(/Personal to-dos stay private and are visible only to you/i),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", {
        name: "Submit weekly tasks",
      }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("disables resubmission and explains that later tasks remain private", () => {
    render(
      <WeeklySubmissionPanel
        summary={{ ...summary, draftCount: 0, submittedCount: 6 }}
        selectedCount={0}
        alreadySubmitted
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Tasks added later are private personal to-dos/i),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", {
        name: "Submit weekly tasks",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("provides explicit status privacy and visibility text", () => {
    expect(getSubmissionStatusMeta("DRAFT")).toMatchObject({
      label: "DRAFT",
      description: "Private until you submit it",
    });
    expect(getSubmissionStatusMeta("SUBMITTED")).toMatchObject({
      label: "SUBMITTED",
      description: "Visible to your supervisor",
    });
    expect(getSubmissionStatusMeta("PERSONAL_TODO")).toMatchObject({
      label: "PERSONAL_TODO",
      description: "Private personal to-do — only you can see this task",
    });
  });
});
