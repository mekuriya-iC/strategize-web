"use client";

import { useQuery } from "@apollo/client";
import {
  GET_PENDING_TASK_COLLABORATION_REQUESTS,
  type PendingTaskCollaborationRequestsData,
} from "@/lib/graphql/queries/task-collaboration";

export interface UsePendingTaskCollaborationCountOptions {
  skip?: boolean;
  pollInterval?: number;
}

export function usePendingTaskCollaborationCount(
  options: UsePendingTaskCollaborationCountOptions = {},
) {
  const { skip = false, pollInterval = 30_000 } = options;
  const { data, loading, error, refetch } =
    useQuery<PendingTaskCollaborationRequestsData>(
      GET_PENDING_TASK_COLLABORATION_REQUESTS,
      {
        skip,
        pollInterval,
        fetchPolicy: "cache-and-network",
      },
    );

  return {
    pendingCount: data?.pendingTaskCollaborationRequests.length ?? 0,
    loading,
    error,
    refetch,
  };
}
