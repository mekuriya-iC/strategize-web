import { useQuery, useMutation } from '@apollo/client';
import { GET_NODE_TYPES } from '@/lib/graphql/queries/nodeTypes';
import { CREATE_NODE_TYPE, REMOVE_NODE_TYPE } from '@/lib/graphql/mutations/nodeTypes';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { toast } from 'sonner';

export interface NodeType {
  nodeTypeId: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  isBuiltIn: boolean;
  isDeleted: boolean;
}

export function useNodeTypes() {
  const organizationId = useOrganizationId();

  const { data, loading, refetch } = useQuery(GET_NODE_TYPES, {
    variables: { organizationId },
    skip: !organizationId,
    fetchPolicy: 'cache-and-network',
  });

  const [createMutation, { loading: creating }] = useMutation(CREATE_NODE_TYPE, {
    onError: (e) => toast.error('Failed to save', { description: e.message }),
    refetchQueries: [{ query: GET_NODE_TYPES, variables: { organizationId } }],
    awaitRefetchQueries: true,
  });

  const [removeMutation, { loading: removing }] = useMutation(REMOVE_NODE_TYPE, {
    onError: (e) => toast.error('Failed to delete', { description: e.message }),
    refetchQueries: [{ query: GET_NODE_TYPES, variables: { organizationId } }],
    awaitRefetchQueries: true,
  });

  const nodeTypes: NodeType[] = (data?.nodeTypes ?? []).filter((n: NodeType) => !n.isDeleted);
  const builtIn = nodeTypes.filter((n) => n.isBuiltIn);
  const custom = nodeTypes.filter((n) => !n.isBuiltIn);

  const createNodeType = async (name: string, color: string, icon?: string) => {
    if (!organizationId) return;
    const result = await createMutation({
      variables: { createNodeTypeInput: { organizationId, name, color, icon } },
    });
    return result.data?.createNodeType as NodeType | undefined;
  };

  const removeNodeType = async (nodeTypeId: string) => {
    await removeMutation({ variables: { nodeTypeId } });
  };

  return { nodeTypes, builtIn, custom, loading, creating, removing, createNodeType, removeNodeType, refetch };
}
