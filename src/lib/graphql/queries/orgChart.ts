import { gql } from '@apollo/client';

export const GET_ORG_CHART = gql`
  query GetOrgChart($organizationId: ID!) {
    getOrgChart(organizationId: $organizationId) {
      id
      name
      subtitle
      color
      level
      parentId
      nodeTypeId
      nodeType {
        nodeTypeId
        name
        icon
        color
      }
      employees {
        employeeId
        fullName
        title
        picture
      }
      children {
        id
        name
        subtitle
        color
        level
        parentId
        nodeTypeId
        nodeType {
          nodeTypeId
          name
          icon
          color
        }
        employees {
          employeeId
          fullName
          title
          picture
        }
        children {
          id
          name
          subtitle
          color
          level
          parentId
          nodeTypeId
          employees {
            employeeId
            fullName
            title
            picture
          }
          children {
            id
            name
            subtitle
            color
            level
            parentId
            employees {
              employeeId
              fullName
              title
              picture
            }
            children {
              id
              name
              subtitle
              color
              level
              parentId
              employees {
                employeeId
                fullName
                title
                picture
              }
              children {
                id
                name
                subtitle
                color
                level
                parentId
                employees {
                  employeeId
                  fullName
                  title
                  picture
                }
                children { id name subtitle color level parentId children { id name color level children { id name color level children { id name color level } } } }
              }
            }
          }
        }
      }
    }
  }
`;
