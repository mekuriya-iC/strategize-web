import type { ApolloCache } from "@apollo/client";
import { GET_CHECKINOUT_TASKS } from "@/lib/graphql/queries/checkins";

export const CHECKIN_TASKS_PAGE = { limit: 100, page: 1 } as const;

type CheckinoutTask = {
  __typename?: string;
  checkinoutTaskId: string;
  session?: { checkinoutSessionId?: string | null } | null;
};

type CheckinoutTasksMeta = {
  __typename?: string;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  itemCount?: number;
};

type CheckinoutTasksData = {
  checkinoutTasks?: {
    __typename?: string;
    items: CheckinoutTask[];
    meta?: CheckinoutTasksMeta | null;
  } | null;
};

const taskVariables = (sessionId: string) => ({
  sessionId,
  ...CHECKIN_TASKS_PAGE,
});

function adjustMeta(meta: CheckinoutTasksMeta | null | undefined, delta: number) {
  if (!meta || delta === 0) return meta;
  return {
    ...meta,
    totalItems:
      typeof meta.totalItems === "number"
        ? Math.max(0, meta.totalItems + delta)
        : meta.totalItems,
    itemCount:
      typeof meta.itemCount === "number"
        ? Math.max(0, meta.itemCount + delta)
        : meta.itemCount,
  };
}

/** Updates the mounted session task page synchronously and invalidates only derived session data. */
export function upsertCheckinTask(
  cache: ApolloCache<unknown>,
  sessionId: string,
  task: CheckinoutTask,
) {
  const variables = taskVariables(sessionId);
  const existing = cache.readQuery<CheckinoutTasksData>({
    query: GET_CHECKINOUT_TASKS,
    variables,
  });

  if (existing?.checkinoutTasks) {
    const index = existing.checkinoutTasks.items.findIndex(
      (item) => item.checkinoutTaskId === task.checkinoutTaskId,
    );
    const items = [...existing.checkinoutTasks.items];
    if (index >= 0) items[index] = task;
    else items.unshift(task);

    cache.writeQuery<CheckinoutTasksData>({
      query: GET_CHECKINOUT_TASKS,
      variables,
      data: {
        checkinoutTasks: {
          ...existing.checkinoutTasks,
          items,
          meta: adjustMeta(existing.checkinoutTasks.meta, index >= 0 ? 0 : 1),
        },
      },
    });
  }

  invalidateCheckinDerivedFields(cache, sessionId);
}

/** Removes a task from only its exact session page and evicts its normalized entity. */
export function removeCheckinTask(
  cache: ApolloCache<unknown>,
  sessionId: string,
  taskId: string,
) {
  const variables = taskVariables(sessionId);
  const existing = cache.readQuery<CheckinoutTasksData>({
    query: GET_CHECKINOUT_TASKS,
    variables,
  });

  if (existing?.checkinoutTasks) {
    const items = existing.checkinoutTasks.items.filter(
      (item) => item.checkinoutTaskId !== taskId,
    );
    const removed = items.length !== existing.checkinoutTasks.items.length;
    if (removed) {
      cache.writeQuery<CheckinoutTasksData>({
        query: GET_CHECKINOUT_TASKS,
        variables,
        data: {
          checkinoutTasks: {
            ...existing.checkinoutTasks,
            items,
            meta: adjustMeta(existing.checkinoutTasks.meta, -1),
          },
        },
      });
    }
  }

  const taskCacheId = cache.identify({
    __typename: "CheckinoutTask",
    checkinoutTaskId: taskId,
  });
  if (taskCacheId) cache.evict({ id: taskCacheId });
  invalidateCheckinDerivedFields(cache, sessionId);
}

function invalidateCheckinDerivedFields(
  cache: ApolloCache<unknown>,
  sessionId: string,
) {
  cache.evict({
    id: "ROOT_QUERY",
    fieldName: "taskPoolSummary",
    args: { sessionId },
  });
  cache.evict({
    id: "ROOT_QUERY",
    fieldName: "checkinoutSession",
    args: { checkinoutSessionId: sessionId },
  });

  const sessionCacheId = cache.identify({
    __typename: "CheckinoutSession",
    checkinoutSessionId: sessionId,
  });
  if (sessionCacheId) {
    cache.evict({ id: sessionCacheId, fieldName: "updatedAt" });
  }
}
