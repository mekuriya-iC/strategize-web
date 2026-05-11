import { gql } from '@apollo/client';

export const SAVE_ORG_CHART = gql`
  mutation SaveOrgChart($organizationId: ID!, $nodes: [OrgChartNodeInput!]!) {
    saveOrgChart(organizationId: $organizationId, nodes: $nodes) {
      id
      name
      subtitle
      color
      level
      parentId
      children {
        id
        name
        subtitle
        color
        level
        parentId
        children {
          id
          name
          subtitle
          color
          level
          parentId
          children {
            id
            name
            subtitle
            color
            level
            parentId
            children { id name color level parentId children { id name color level parentId children { id name color level parentId } } }
          }
        }
      }
    }
  }
`;
