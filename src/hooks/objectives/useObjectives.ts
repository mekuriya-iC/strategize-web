import { useEffect } from "react";
import { useQuery } from "@apollo/client";
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
import { useAuthStore } from "@/stores/authStore";

export const useObjectives = (variables: ObjectivesQueryVariables = {}) => {
  const queryVariables = {
    page: 1,
    limit: 10,
    ...variables,
  };

  const { data, loading, error, refetch } = useQuery<
    GetObjectivesResponse,
    ObjectivesQueryVariables
  >(GET_OBJECTIVES, {
    variables: queryVariables,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const objectivesInvalidatedAt = useCacheStore(
    (state) => state.invalidationTimestamps.objectives
  );
  const markRefetched = useCacheStore((state) => state.markRefetched);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.employeeId);

  useEffect(() => {
    if (objectivesInvalidatedAt > 0) {
      refetch().finally(() => markRefetched("objectives"));
    }
  }, [objectivesInvalidatedAt, refetch, markRefetched]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      refetch();
    }
  }, [isAuthenticated, userId, refetch]);

  return {
    objectives: data?.objectives?.items || [],
    meta: data?.objectives?.meta,
    loading,
    error,
    refetch,
  };
};

export const useObjective = (variables: ObjectiveQueryVariables) => {
  const { data, loading, error, refetch } = useQuery<
    GetObjectiveResponse,
    ObjectiveQueryVariables
  >(GET_OBJECTIVE, {
    variables,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    // Skip query if objectiveId is empty or undefined
    skip: !variables.objectiveId,
  });

  return {
    objective: data?.objective,
    loading,
    error,
    refetch,
  };
};
