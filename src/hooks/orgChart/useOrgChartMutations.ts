import { useMutation } from '@apollo/client';
import { SAVE_ORG_CHART } from '@/lib/graphql/mutations/orgChart';
import { GET_ORG_CHART } from '@/lib/graphql/queries/orgChart';
import { useAuthStore } from '@/stores';
import { toast } from 'sonner';

export interface OrgChartNodeInput {
  id: string;
  name: string;
  subtitle?: string;
  color?: string;
  level: number;
  parentId?: string;
  nodeTypeId?: string;
  children: OrgChartNodeInput[];
}

export function useOrgChartMutations() {
  const user = useAuthStore((s) => s.user);
  const organizationId = user?.organizationId;
  const canManageStructure = user?.role === 'SUPER_ADMIN';

  const [saveOrgChartMutation, { loading }] = useMutation(SAVE_ORG_CHART, {
    onError: (error) => {
      toast.error('Failed to save structure', { description: error.message });
    },
    refetchQueries: organizationId
      ? [{ query: GET_ORG_CHART, variables: { organizationId } }]
      : [],
    awaitRefetchQueries: true,
  });

  const saveOrgChart = async (nodes: OrgChartNodeInput[]) => {
    if (!canManageStructure) {
      const error = new Error('Only super administrators can modify the organization structure');
      toast.error('Access denied', { description: error.message });
      throw error;
    }
    if (!organizationId) {
      toast.error('No organization found');
      return null;
    }
    const result = await saveOrgChartMutation({
      variables: { organizationId, nodes },
    });
    return result.data?.saveOrgChart ?? null;
  };

  return { saveOrgChart, loading };
}
