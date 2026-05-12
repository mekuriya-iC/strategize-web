import { gql } from '@apollo/client';

/**
 * Team Queries
 */
export const GET_TEAMS = gql`
  query GetTeams(
    $page: Int!
    $limit: Int!
    $search: String
    $departmentId: ID
  ) {
    teams(
      page: $page
      limit: $limit
      search: $search
      departmentId: $departmentId
    ) {
      items {
        teamId
        name
        description
        isActive
        department {
          departmentId
          name
        }
        teamLead {
          employeeId
          fullName
          email
          picture
        }
        members {
          teamMemberId
          employee {
            employeeId
            fullName
            picture
            title
          }
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        totalPages
        currentPage
        itemsPerPage
        itemCount
      }
    }
  }
`;

export const GET_TEAM = gql`
  query GetTeam($teamId: ID!) {
    team(teamId: $teamId) {
      teamId
      name
      description
      isActive
      isDeleted
      department {
        departmentId
        name
        division {
          divisionId
          name
        }
      }
      teamLead {
        employeeId
        fullName
        email
        picture
        title
      }
      members {
        teamMemberId
        employee {
          employeeId
          fullName
          email
          picture
          title
        }
      }
      createdAt
      updatedAt
    }
  }
`;
