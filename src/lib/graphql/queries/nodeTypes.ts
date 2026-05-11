import { gql } from '@apollo/client';

export const GET_NODE_TYPES = gql`
  query GetNodeTypes($organizationId: ID!) {
    nodeTypes(organizationId: $organizationId) {
      nodeTypeId
      name
      icon
      color
      isBuiltIn
      isDeleted
    }
  }
`;
