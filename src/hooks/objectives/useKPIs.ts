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
    fetchPolicy: "cache-and-network",
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
    fetchPolicy: "cache-and-network",
    // Skip query if kpiId is empty or undefined
    skip: !variables.kpiId,
  });
  console.log('data fetch of kpi:', variables);
 console.log('KPI:', data?.kpi);
  return {
    kpi: data?.kpi,
    loading,
    error,
    refetch,
  };
};
