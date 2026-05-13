import { gql } from '@apollo/client';

/**
 * Team Mutations
 */
export const CREATE_TEAM = gql`
  mutation CreateTeam($createTeamInput: CreateTeamInput!) {
    createTeam(createTeamInput: $createTeamInput) {
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
      createdAt
    }
  }
`;

export const UPDATE_TEAM = gql`
  mutation UpdateTeam($updateTeamInput: UpdateTeamInput!) {
    updateTeam(updateTeamInput: $updateTeamInput) {
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
