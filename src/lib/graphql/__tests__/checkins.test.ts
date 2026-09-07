import { print } from "graphql";
import { describe, expect, it } from "vitest";
import {
  APPROVE_TASK_PLANNING,
  CREATE_CHECKINOUT_TASK,
  REJECT_TASK_PLANNING,
  REVIEW_TASK_PLANNING_BATCH,
  SUBMIT_TASK_FOR_PLANNING_APPROVAL,
  SUBMIT_WEEKLY_TASKS,
} from "../mutations/checkins";
import {
  GET_CHECKINOUT_TASKS,
  GET_PENDING_TASK_PLANNING_APPROVALS,
  GET_SUPER_ADMIN_CHECKINOUT_SESSION_CANDIDATES,
  GET_TASK_PLANNING_REVIEW_HISTORY,
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
      "planningRevision",
      "planningReviewHistory",
      "carryoverRootTaskId",
      "carryoverPredecessorTaskId",
      "carryoverGeneration",
      "isCarryoverOverdue",
      "carryoverEscalatedAt",
    ]) {
      expect(taskQuery).toContain(field);
      // A newly-created draft has no review rows yet; requesting the non-null
      // relation on the create payload would make an otherwise valid create fail.
      if (field !== "planningReviewHistory") {
        expect(createMutation).toContain(field);
      }
    }
  });

  it("requests all pool summary limits and counts", () => {
    const query = print(GET_TASK_POOL_SUMMARY);

    for (const field of [
      "draftCount",
      "submittedCount",
      "pendingApprovalCount",
      "approvedCount",
      "approvedInitialCount",
      "initialWeeklyApprovalCompliant",
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

  it("defines planning approval queries and mutations", () => {
    expect(print(GET_PENDING_TASK_PLANNING_APPROVALS)).toContain(
      "pendingTaskPlanningApprovals(sessionId: $sessionId)",
    );
    expect(print(GET_TASK_PLANNING_REVIEW_HISTORY)).toContain(
      "taskPlanningReviewHistory(taskId: $taskId)",
    );
    expect(print(SUBMIT_TASK_FOR_PLANNING_APPROVAL)).toContain(
      "submitTaskForPlanningApproval(taskId: $taskId)",
    );
    expect(print(APPROVE_TASK_PLANNING)).toContain(
      "approveTaskPlanning(taskId: $taskId)",
    );
    expect(print(REJECT_TASK_PLANNING)).toContain(
      "rejectTaskPlanning(taskId: $taskId, reason: $reason)",
    );
    expect(print(REVIEW_TASK_PLANNING_BATCH)).toContain(
      "reviewTaskPlanningBatch(reviews: $reviews)",
    );
  });

  it("submits selected task ids and requests the batch result", () => {
    const mutation = print(SUBMIT_WEEKLY_TASKS);

    expect(mutation).toContain("$taskIds: [ID!]!");
    expect(mutation).toContain("submitWeeklyTasks(sessionId: $sessionId, taskIds: $taskIds)");
    expect(mutation).toContain("submittedTaskCount");
    expect(mutation).toContain("submissionBatchId");
  });
});
