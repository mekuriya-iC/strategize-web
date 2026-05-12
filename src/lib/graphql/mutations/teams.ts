import { gql } from '@apollo/client';

/**
 * Team Mutations
 */
export const CREATE_TEAM = gql`
  mutation CreateTeam($createTeamInput: CreateTeamInput!, $memberIds: [ID!]) {
    createTeam(createTeamInput: $createTeamInput, memberIds: $memberIds) {
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
    }
  }
`;

export const UPDATE_TEAM = gql`
  mutation UpdateTeam($updateTeamInput: UpdateTeamInput!, $memberIds: [ID!]) {
    updateTeam(updateTeamInput: $updateTeamInput, memberIds: $memberIds) {
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
      updatedAt
    }
  }
`;

export const REMOVE_TEAM = gql`
  mutation RemoveTeam($teamId: ID!) {
    removeTeam(teamId: $teamId) {
      teamId
      name
    }
  }
`;
