import { NetworkStatus, useQuery } from "@apollo/client";
import { GET_KPIS, GET_KPI } from "@/lib/graphql/queries/kpis";
import {
  KpisQueryVariables,
  KpiQueryVariables,
  GetKpisResponse,
  GetKpiResponse,
} from "@/types/graphql";

export const useKPIs = (variables: KpisQueryVariables = {}) => {
  const { data, loading, error, refetch, networkStatus } = useQuery<
    GetKpisResponse,
    KpisQueryVariables
  >(GET_KPIS, {
    variables: {
      page: 1,
      limit: 10,
      ...variables,
    },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  });

  const hasCachedData = Boolean(data?.kpis?.items?.length);

  return {
    kpis: data?.kpis?.items || [],
    meta: data?.kpis?.meta,
    loading: loading && !hasCachedData && networkStatus === NetworkStatus.loading,
    error,
    refetch,
  };
};

export const useKPI = (variables: KpiQueryVariables) => {
  const { data, loading, error, refetch, networkStatus } = useQuery<
    GetKpiResponse,
    KpiQueryVariables
  >(GET_KPI, {
    variables,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    skip: !variables.kpiId,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  });

  return {
    kpi: data?.kpi,
    loading: loading && !data?.kpi && networkStatus === NetworkStatus.loading,
    error,
    refetch,
  };
};
