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
  // NOTE: Task collaboration feature is not yet implemented on the backend.
  // The query is permanently skipped until the backend supports
  // pendingTaskCollaborationRequests and TaskCollaborationRequest type.
  const { skip = true, pollInterval = 30_000 } = options;
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
