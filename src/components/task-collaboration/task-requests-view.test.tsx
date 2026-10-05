import { cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET_PENDING_TASK_COLLABORATION_REQUESTS,
  GET_SENT_TASK_COLLABORATION_REQUESTS,
  type TaskCollaborationRequest,
} from "@/lib/graphql/queries/task-collaboration";
import { usePendingTaskCollaborationCount } from "@/hooks/tasks/usePendingTaskCollaborationCount";
import { TaskRequestsView } from "./task-requests-view";

const apollo = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@apollo/client")>()),
  useQuery: apollo.useQuery,
  useMutation: apollo.useMutation,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const pendingRequest: TaskCollaborationRequest = {
  requestId: "request-1",
  status: "PENDING",
  requestMessage: "Please help review this delivery.",
  responseMessage: null,
  requestedAt: "2026-10-05T08:00:00.000Z",
  respondedAt: null,
  cancelledAt: null,
  expiresAt: "2026-10-12T08:00:00.000Z",
  originatorEmployee: {
    employeeId: "originator-1",
    fullName: "Alex Originator",
  },
  collaboratorEmployee: {
    employeeId: "collaborator-1",
    fullName: "Casey Collaborator",
  },
  originatorTask: {
    checkinoutTaskId: "task-1",
    taskTitle: "Review launch plan",
    plannedDescription: "Review the detailed launch plan.",
    taskStartDate: "2026-10-06T08:00:00.000Z",
    taskEndDate: "2026-10-06T10:00:00.000Z",
    submissionStatus: "DRAFT",
  },
  collaboratorTask: null,
};

function queryResult(data: Record<string, unknown>) {
  return {
    data,
    loading: false,
    error: undefined,
    refetch: vi.fn().mockResolvedValue({ data }),
  };
}

beforeEach(() => {
  apollo.useQuery.mockReset();
  apollo.useMutation.mockReset();
  apollo.useMutation.mockReturnValue([vi.fn(), { loading: false }]);
  apollo.useQuery.mockImplementation((document) => {
    if (document === GET_PENDING_TASK_COLLABORATION_REQUESTS) {
      return queryResult({
        pendingTaskCollaborationRequests: [pendingRequest],
      });
    }
    if (document === GET_SENT_TASK_COLLABORATION_REQUESTS) {
      return queryResult({ sentTaskCollaborationRequests: [] });
    }
    throw new Error("Unexpected GraphQL operation");
  });
});

afterEach(cleanup);

describe("task collaboration request loading", () => {
  it("loads and displays received requests instead of permanently skipping them", () => {
    render(<TaskRequestsView />);

    expect(screen.getByText("Review launch plan")).toBeTruthy();
    expect(screen.getByText("Alex Originator")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();

    expect(apollo.useQuery).toHaveBeenCalledWith(
      GET_PENDING_TASK_COLLABORATION_REQUESTS,
      expect.not.objectContaining({ skip: true }),
    );
    expect(apollo.useQuery).toHaveBeenCalledWith(
      GET_SENT_TASK_COLLABORATION_REQUESTS,
      expect.not.objectContaining({ skip: true }),
    );
  });

  it("loads the sidebar pending count by default and only skips when requested", () => {
    const { result, rerender } = renderHook(
      ({ skip }: { skip?: boolean }) =>
        usePendingTaskCollaborationCount({ skip, pollInterval: 15_000 }),
      { initialProps: { skip: undefined } },
    );

    expect(result.current.pendingCount).toBe(1);
    expect(apollo.useQuery).toHaveBeenLastCalledWith(
      GET_PENDING_TASK_COLLABORATION_REQUESTS,
      expect.objectContaining({ skip: false, pollInterval: 15_000 }),
    );

    rerender({ skip: true });
    expect(apollo.useQuery).toHaveBeenLastCalledWith(
      GET_PENDING_TASK_COLLABORATION_REQUESTS,
      expect.objectContaining({ skip: true }),
    );
  });
});
