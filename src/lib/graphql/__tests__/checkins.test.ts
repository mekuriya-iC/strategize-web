import { print } from "graphql";
import { describe, expect, it } from "vitest";
import {
  CREATE_CHECKINOUT_TASK,
  SUBMIT_WEEKLY_TASKS,
} from "../mutations/checkins";
import {
  GET_CHECKINOUT_TASKS,
  GET_SUPER_ADMIN_CHECKINOUT_SESSION_CANDIDATES,
  GET_TASK_POOL_SUMMARY,
} from "../queries/checkins";

describe("check-in draft pool GraphQL operations", () => {
  it("requests task submission and collaboration fields", () => {
    const taskQuery = print(GET_CHECKINOUT_TASKS);
    const createMutation = print(CREATE_CHECKINOUT_TASK);

    for (const field of [
      "submissionStatus",
      "submittedAt",
      "submissionBatchId",
      "isCollaborativeTask",
      "collaborationRequestId",
    ]) {
      expect(taskQuery).toContain(field);
      expect(createMutation).toContain(field);
    }
  });

  it("requests all pool summary limits and counts", () => {
    const query = print(GET_TASK_POOL_SUMMARY);

    for (const field of [
      "draftCount",
      "submittedCount",
      "personalTodoCount",
      "activeCount",
      "remainingCapacity",
      "minimumSubmissionCount",
      "maximumSubmissionCount",
      "maximumActiveTaskCount",
    ]) {
      expect(query).toContain(field);
    }
  });

  it("uses the server-authoritative super-admin session candidate list", () => {
    const query = print(GET_SUPER_ADMIN_CHECKINOUT_SESSION_CANDIDATES);

    expect(query).toContain("superAdminCheckinoutSessionCandidates");
    expect(query).toContain("managerId");
    expect(query).toContain("role");
    expect(query).toContain("status");
  });

  it("submits selected task ids and requests the batch result", () => {
    const mutation = print(SUBMIT_WEEKLY_TASKS);

    expect(mutation).toContain("$taskIds: [ID!]!");
    expect(mutation).toContain("submitWeeklyTasks(sessionId: $sessionId, taskIds: $taskIds)");
    expect(mutation).toContain("submittedTaskCount");
    expect(mutation).toContain("submissionBatchId");
  });
});
