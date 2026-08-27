import { InMemoryCache } from "@apollo/client";
import { describe, expect, it } from "vitest";
import {
  GET_CHECKINOUT_TASKS,
  GET_TASK_POOL_SUMMARY,
} from "@/lib/graphql/queries/checkins";
import {
  CHECKIN_TASKS_PAGE,
  removeCheckinTask,
  upsertCheckinTask,
} from "./checkin-cache";

const task = (id: string, sessionId: string, title = id) => ({
  __typename: "CheckinoutTask",
  checkinoutTaskId: id,
  taskTitle: title,
  taskLinkType: "UNLINKED",
  linkedKpiId: null,
  linkedKpi: null,
  linkedInitiativeId: null,
  linkedInitiative: null,
  plannedDescription: "Description",
  achievedDescription: null,
  taskStatus: "NOT_DONE",
  evidenceUrl: null,
  challenges: null,
  nextSteps: null,
  requiresApproval: false,
  isMidWeekTask: false,
  logbookStatus: null,
  submissionStatus: "DRAFT",
  submittedAt: null,
  submissionBatchId: null,
  isCollaborativeTask: false,
  collaborationRequestId: null,
  taskStartDate: "2026-08-24T07:00:00.000Z",
  taskEndDate: "2026-08-24T08:00:00.000Z",
  approvedAt: null,
  autoRejectedAt: null,
  createdAt: "2026-08-24T06:00:00.000Z",
  updatedAt: "2026-08-24T06:00:00.000Z",
  approvedBy: null,
  relatedTo: null,
  session: {
    __typename: "CheckinoutSession",
    checkinoutSessionId: sessionId,
    weekStartDate: "2026-08-24",
    weekEndDate: "2026-08-28",
  },
});

function seedTasks(cache: InMemoryCache, sessionId: string, items: ReturnType<typeof task>[]) {
  cache.writeQuery({
    query: GET_CHECKINOUT_TASKS,
    variables: { sessionId, ...CHECKIN_TASKS_PAGE },
    data: {
      checkinoutTasks: {
        __typename: "PaginatedCheckinoutTasks",
        items,
        meta: {
          __typename: "PaginationMeta",
          currentPage: 1,
          totalPages: 1,
          totalItems: items.length,
          itemsPerPage: 100,
          itemCount: items.length,
        },
      },
    },
  });
}

type CachedTasks = {
  checkinoutTasks: {
    items: Array<{ checkinoutTaskId: string; taskTitle: string }>;
    meta: { totalItems: number };
  };
};

describe("check-in cache updates", () => {
  it("upserts only the exact session page and adjusts its metadata", () => {
    const cache = new InMemoryCache();
    seedTasks(cache, "session-a", [task("one", "session-a")]);
    seedTasks(cache, "session-b", [task("other", "session-b")]);

    upsertCheckinTask(cache, "session-a", task("two", "session-a"));

    const updated = cache.readQuery<CachedTasks>({
      query: GET_CHECKINOUT_TASKS,
      variables: { sessionId: "session-a", ...CHECKIN_TASKS_PAGE },
    })!;
    const untouched = cache.readQuery<CachedTasks>({
      query: GET_CHECKINOUT_TASKS,
      variables: { sessionId: "session-b", ...CHECKIN_TASKS_PAGE },
    })!;
    expect(updated.checkinoutTasks.items.map((item) => item.checkinoutTaskId)).toEqual([
      "two",
      "one",
    ]);
    expect(updated.checkinoutTasks.meta.totalItems).toBe(2);
    expect(untouched.checkinoutTasks.items).toHaveLength(1);
  });

  it("replaces an existing task without changing counts", () => {
    const cache = new InMemoryCache();
    seedTasks(cache, "session-a", [task("one", "session-a")]);

    upsertCheckinTask(cache, "session-a", task("one", "session-a", "Updated"));

    const updated = cache.readQuery<CachedTasks>({
      query: GET_CHECKINOUT_TASKS,
      variables: { sessionId: "session-a", ...CHECKIN_TASKS_PAGE },
    })!;
    expect(updated.checkinoutTasks.items[0].taskTitle).toBe("Updated");
    expect(updated.checkinoutTasks.meta.totalItems).toBe(1);
  });

  it("removes from the exact page and evicts that session's pool summary", () => {
    const cache = new InMemoryCache();
    seedTasks(cache, "session-a", [task("one", "session-a")]);
    cache.writeQuery({
      query: GET_TASK_POOL_SUMMARY,
      variables: { sessionId: "session-a" },
      data: {
        taskPoolSummary: {
          __typename: "TaskPoolSummary",
          sessionId: "session-a",
          draftCount: 1,
          submittedCount: 0,
          personalTodoCount: 0,
          activeCount: 1,
          remainingCapacity: 9,
          minimumSubmissionCount: 6,
          maximumSubmissionCount: 10,
          maximumActiveTaskCount: 10,
        },
      },
    });

    removeCheckinTask(cache, "session-a", "one");

    const updated = cache.readQuery<CachedTasks>({
      query: GET_CHECKINOUT_TASKS,
      variables: { sessionId: "session-a", ...CHECKIN_TASKS_PAGE },
    })!;
    expect(updated.checkinoutTasks.items).toEqual([]);
    expect(updated.checkinoutTasks.meta.totalItems).toBe(0);
    expect(
      cache.readQuery({
        query: GET_TASK_POOL_SUMMARY,
        variables: { sessionId: "session-a" },
      }),
    ).toBeNull();
  });
});
