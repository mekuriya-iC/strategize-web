import { render, screen } from "@testing-library/react";
import { print } from "graphql";
import { describe, expect, it, vi } from "vitest";
import {
  ACCEPT_TASK_COLLABORATION_REQUEST,
  CANCEL_TASK_COLLABORATION_REQUEST,
  REJECT_TASK_COLLABORATION_REQUEST,
} from "@/lib/graphql/mutations/task-collaboration";
import {
  GET_PENDING_TASK_COLLABORATION_REQUESTS,
  GET_SENT_TASK_COLLABORATION_REQUESTS,
  type TaskCollaborationRequest,
} from "@/lib/graphql/queries/task-collaboration";
import {
  ReceivedTaskRequestCard,
  SentTaskRequestCard,
} from "./task-request-cards";
import {
  getActionableCollaborationError,
  getAvailableTaskCollaborationActions,
} from "./task-collaboration-utils";

const baseRequest: TaskCollaborationRequest = {
  requestId: "request-1",
  status: "PENDING",
  requestMessage: "Can you help with this review?",
  responseMessage: null,
  requestedAt: "2026-08-17T08:00:00.000Z",
  respondedAt: null,
  cancelledAt: null,
  expiresAt: "2026-08-24T08:00:00.000Z",
  originatorEmployee: {
    employeeId: "employee-1",
    fullName: "Alex Originator",
  },
  collaboratorEmployee: {
    employeeId: "employee-2",
    fullName: "Casey Collaborator",
  },
  originatorTask: {
    checkinoutTaskId: "task-1",
    taskTitle: "Review launch plan",
    plannedDescription: "Review the detailed launch plan.",
    taskStartDate: "2026-08-18T08:00:00.000Z",
    taskEndDate: "2026-08-18T10:00:00.000Z",
    submissionStatus: "DRAFT",
  },
  collaboratorTask: null,
};

describe("task collaboration action availability", () => {
  it("allows received pending requests to be accepted or rejected", () => {
    expect(getAvailableTaskCollaborationActions("PENDING", "received")).toEqual([
      "accept",
      "reject",
    ]);

    render(
      <ReceivedTaskRequestCard
        request={baseRequest}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
    expect(
      screen.getByRole("status", { name: "Request status: Pending" }),
    ).toBeTruthy();
  });

  it("offers cancel only for sent pending requests", () => {
    const { rerender } = render(
      <SentTaskRequestCard request={baseRequest} onAction={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Cancel request" }),
    ).toBeTruthy();

    rerender(
      <SentTaskRequestCard
        request={{ ...baseRequest, status: "ACCEPTED" }}
        onAction={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Cancel request" }),
    ).toBeNull();
    expect(getAvailableTaskCollaborationActions("ACCEPTED", "sent")).toEqual(
      [],
    );
  });

  it("turns backend acceptance failures into actionable guidance", () => {
    expect(
      getActionableCollaborationError(
        new Error('Task time overlaps with existing task "Planning".'),
      ),
    ).toContain("Review the conflicting task");
    expect(
      getActionableCollaborationError(
        new Error("A weekly session may contain at most 15 active tasks."),
      ),
    ).toContain("task pool is full");
    expect(
      getActionableCollaborationError(
        new Error("No matching collaborator weekly session exists"),
      ),
    ).toContain("Create or open your check-in session");
  });
});

describe("task collaboration GraphQL operations", () => {
  it("selects the complete request contract in both lists", () => {
    for (const operation of [
      GET_PENDING_TASK_COLLABORATION_REQUESTS,
      GET_SENT_TASK_COLLABORATION_REQUESTS,
    ]) {
      const printed = print(operation);
      for (const field of [
        "requestId",
        "status",
        "requestMessage",
        "responseMessage",
        "requestedAt",
        "respondedAt",
        "cancelledAt",
        "expiresAt",
        "originatorEmployee",
        "collaboratorEmployee",
        "originatorTask",
        "collaboratorTask",
        "plannedDescription",
        "taskStartDate",
        "taskEndDate",
        "submissionStatus",
        "collaborationRequestId",
      ]) {
        expect(printed).toContain(field);
      }
    }
  });

  it("uses the API's response input for accept and reject", () => {
    for (const operation of [
      ACCEPT_TASK_COLLABORATION_REQUEST,
      REJECT_TASK_COLLABORATION_REQUEST,
    ]) {
      const printed = print(operation);
      expect(printed).toContain("$input: RespondTaskCollaborationInput!");
      expect(printed).toContain("(input: $input)");
      expect(printed).toContain("...TaskCollaborationRequestFields");
    }
  });

  it("passes a required request ID when cancelling", () => {
    const printed = print(CANCEL_TASK_COLLABORATION_REQUEST);
    expect(printed).toContain("$requestId: ID!");
    expect(printed).toContain(
      "cancelTaskCollaborationRequest(requestId: $requestId)",
    );
  });
});
