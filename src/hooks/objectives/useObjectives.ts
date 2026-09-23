import { useEffect, useMemo } from "react";
import { NetworkStatus, useQuery } from "@apollo/client";
import {
  GET_OBJECTIVES,
  GET_OBJECTIVE,
} from "@/lib/graphql/queries/objectives";
import {
  ObjectivesQueryVariables,
  ObjectiveQueryVariables,
  GetObjectivesResponse,
  GetObjectiveResponse,
} from "@/types/graphql";
import { useCacheStore } from "@/stores/cacheStore";
import { useAuthStore } from "@/stores";
import {
  isPersonalObjectiveAssignment,
  usesPersonalObjectiveScope,
} from "@/lib/objectives/personalObjectiveScope";

export const useObjectives = (variables: ObjectivesQueryVariables = {}) => {
  const user = useAuthStore((state) => state.user);
  const personalOnly = usesPersonalObjectiveScope(user?.role);
  const queryVariables = {
    page: 1,
    limit: 10,
    ...variables,
    ...(personalOnly
      ? { assigneeId: user?.employeeId, organizationId: user?.organizationId }
      : {}),
  };

  const { data, loading, error, refetch, networkStatus } = useQuery<
    GetObjectivesResponse,
    ObjectivesQueryVariables
  >(GET_OBJECTIVES, {
    variables: queryVariables,
    skip: !user?.employeeId,
    fetchPolicy: personalOnly ? "cache-and-network" : "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
    // Keep showing cached rows while a background refresh runs.
    returnPartialData: true,
  });

  const objectivesRefetchPending = useCacheStore((state) =>
    state.pendingRefetches.has("objectives"),
  );
  const markRefetched = useCacheStore((state) => state.markRefetched);

  useEffect(() => {
    if (!objectivesRefetchPending || !user?.employeeId) return;

    void refetch().then(
      () => markRefetched("objectives"),
      () => undefined,
    );
  }, [objectivesRefetchPending, refetch, markRefetched, user?.employeeId]);

  const visibleObjectives = useMemo(() => {
    const rows = data?.objectives?.items || [];
    return personalOnly
      ? rows.filter((objective) => isPersonalObjectiveAssignment(objective, user?.employeeId))
      : rows;
  }, [data?.objectives?.items, personalOnly, user?.employeeId]);

  const hasCachedData = Boolean(data?.objectives?.items?.length);
  const isInitialLoading =
    loading &&
    !hasCachedData &&
    networkStatus === NetworkStatus.loading;

  return {
    objectives: visibleObjectives,
    meta: data?.objectives?.meta,
    loading: isInitialLoading,
    refreshing:
      networkStatus === NetworkStatus.refetch ||
      networkStatus === NetworkStatus.setVariables,
    error,
    refetch,
  };
};

export const useObjective = (variables: ObjectiveQueryVariables) => {
  const { data, loading, error, refetch, networkStatus } = useQuery<
    GetObjectiveResponse,
    ObjectiveQueryVariables
  >(GET_OBJECTIVE, {
    variables,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    skip: !variables.objectiveId,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  });

  return {
    objective: data?.objective,
    loading: loading && !data?.objective && networkStatus === NetworkStatus.loading,
    error,
    refetch,
  };
};
