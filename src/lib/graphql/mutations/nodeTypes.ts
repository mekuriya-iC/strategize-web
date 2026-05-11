import { gql } from '@apollo/client';

export const CREATE_NODE_TYPE = gql`
  mutation CreateNodeType($createNodeTypeInput: CreateNodeTypeInput!) {
    createNodeType(createNodeTypeInput: $createNodeTypeInput) {
      nodeTypeId
      name
      icon
      color
      isBuiltIn
      isDeleted
    }
  }
`;

export const REMOVE_NODE_TYPE = gql`
  mutation RemoveNodeType($nodeTypeId: ID!) {
    removeNodeType(nodeTypeId: $nodeTypeId) {
      nodeTypeId
      name
    }
  }
`;
