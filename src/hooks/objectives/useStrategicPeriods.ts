import { useQuery } from '@apollo/client';
import { GET_STRATEGIC_PERIODS, GET_STRATEGIC_PERIOD } from '@/lib/graphql/queries/strategic-periods';
import { 
  StrategicPeriodsQueryVariables, 
  StrategicPeriodQueryVariables,
  GetStrategicPeriodsResponse,
  GetStrategicPeriodResponse 
} from '@/types/graphql';

export const useStrategicPeriods = (variables: StrategicPeriodsQueryVariables = {}) => {
  const { data, loading, error, refetch } = useQuery<GetStrategicPeriodsResponse, StrategicPeriodsQueryVariables>(
    GET_STRATEGIC_PERIODS,
    {
      variables: {
        page: 1,
        limit: 10,
        ...variables,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    strategicPeriods: data?.strategicPeriods?.items || [],
    meta: data?.strategicPeriods?.meta,
    loading,
    error,
    refetch,
  };
};

export const useStrategicPeriod = (variables: StrategicPeriodQueryVariables) => {
  const { data, loading, error, refetch } = useQuery<GetStrategicPeriodResponse, StrategicPeriodQueryVariables>(
    GET_STRATEGIC_PERIOD,
    {
      variables,
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    strategicPeriod: data?.strategicPeriod,
    loading,
    error,
    refetch,
  };
}; 