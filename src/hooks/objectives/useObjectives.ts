import { useEffect } from "react";
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

export const useObjectives = (variables: ObjectivesQueryVariables = {}) => {
  const queryVariables = {
    page: 1,
    limit: 10,
    ...variables,
  };

  const { data, loading, error, refetch, networkStatus } = useQuery<
    GetObjectivesResponse,
    ObjectivesQueryVariables
  >(GET_OBJECTIVES, {
    variables: queryVariables,
    fetchPolicy: "cache-first",
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
    if (!objectivesRefetchPending) return;

    void refetch().then(
      () => markRefetched("objectives"),
      () => undefined,
    );
  }, [objectivesRefetchPending, refetch, markRefetched]);

  const hasCachedData = Boolean(data?.objectives?.items?.length);
  const isInitialLoading =
    loading &&
    !hasCachedData &&
    networkStatus === NetworkStatus.loading;

  return {
    objectives: data?.objectives?.items || [],
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
