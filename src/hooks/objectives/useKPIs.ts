import { useQuery } from "@apollo/client";
import { GET_KPIS, GET_KPI } from "@/lib/graphql/queries/kpis";
import {
  KpisQueryVariables,
  KpiQueryVariables,
  GetKpisResponse,
  GetKpiResponse,
} from "@/types/graphql";

export const useKPIs = (variables: KpisQueryVariables = {}) => {
  const { data, loading, error, refetch } = useQuery<
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
  });

  return {
    kpis: data?.kpis?.items || [],
    meta: data?.kpis?.meta,
    loading,
    error,
    refetch,
  };
};

export const useKPI = (variables: KpiQueryVariables) => {
  const { data, loading, error, refetch } = useQuery<
    GetKpiResponse,
    KpiQueryVariables
  >(GET_KPI, {
    variables,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    // Skip query if kpiId is empty or undefined
    skip: !variables.kpiId,
  });

  return {
    kpi: data?.kpi,
    loading,
    error,
    refetch,
  };
};
