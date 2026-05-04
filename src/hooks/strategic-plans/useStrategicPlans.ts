import { useQuery } from "@apollo/client";
import { GET_STRATEGIC_PLANS } from "@/lib/graphql/queries/strategicPlans";

export interface StrategicPlan {
  strategicPlanId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  version?: string;
  createdAt: string;
  organization: {
    organizationId: string;
    name: string;
  };
}

interface PaginatedStrategicPlans {
  items: StrategicPlan[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    itemCount: number;
  };
}

interface GetStrategicPlansResponse {
  strategicPlans: PaginatedStrategicPlans;
}

export const useStrategicPlansQuery = (variables = { page: 1, limit: 100, search: "" }) => {
  const { data, loading, error, refetch } = useQuery<GetStrategicPlansResponse>(
    GET_STRATEGIC_PLANS,
    {
      variables,
      fetchPolicy: "cache-and-network",
    }
  );

  return {
    strategicPlans: data?.strategicPlans?.items || [],
    meta: data?.strategicPlans?.meta,
    loading,
    error,
    refetch,
  };
};
