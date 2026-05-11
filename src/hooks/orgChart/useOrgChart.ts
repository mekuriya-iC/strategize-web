import { useQuery } from '@apollo/client';
import { GET_ORG_CHART } from '@/lib/graphql/queries/orgChart';
import { useAuthStore } from '@/stores';

export interface OrgChartEmployee {
  employeeId: string;
  fullName: string;
  title?: string;
  picture?: string;
}

export interface OrgChartNode {
  id: string;
  name: string;
  subtitle?: string | null;
  color?: string | null;
  level: number;
  parentId?: string | null;
  nodeTypeId?: string | null;
  nodeType?: { nodeTypeId: string; name: string; icon?: string; color?: string } | null;
  employees: OrgChartEmployee[];
  children: OrgChartNode[];
}

export function useOrgChart() {
  const user = useAuthStore((s) => s.user);
  const organizationId = user?.organizationId;

  const { data, loading, error, refetch } = useQuery(GET_ORG_CHART, {
    variables: { organizationId },
    skip: !organizationId,
    fetchPolicy: 'cache-and-network',
  });

  // API returns a flat array of root nodes; we take the first as the tree root
  const nodes: OrgChartNode[] = data?.getOrgChart ?? [];
  const root: OrgChartNode | null = nodes[0] ?? null;

  return { root, nodes, loading, error, refetch };
}
