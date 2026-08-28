import { gql } from '@apollo/client';

/**
 * Initiative Mutations
 * CRUD for initiatives and activities
 */

// Create a new initiative
export const CREATE_INITIATIVE = gql`
  mutation CreateInitiative($createInitiativeInput: CreateInitiativeInput!) {
    createInitiative(createInitiativeInput: $createInitiativeInput) {
      initiativeId
      title
      description
      scopeType
      scopeId
      status
      completionPercentage
      startDate
      dueDate
      createdAt
      owner {
        employeeId
        fullName
      }
      createdBy {
        employeeId
        fullName
      }
    }
  }
`;

// Update an initiative
export const UPDATE_INITIATIVE = gql`
  mutation UpdateInitiative($updateInitiativeInput: UpdateInitiativeInput!) {
    updateInitiative(updateInitiativeInput: $updateInitiativeInput) {
      initiativeId
      title
      description
      scopeType
      scopeId
      status
      completionPercentage
      startDate
      dueDate
      updatedAt
      owner {
        employeeId
        fullName
      }
    }
  }
`;

// Remove an initiative
export const REMOVE_INITIATIVE = gql`
  mutation RemoveInitiative($initiativeId: ID!) {
    removeInitiative(initiativeId: $initiativeId) {
      initiativeId
      title
      scopeType
      scopeId
      isDeleted
    }
  }
`;

// Create an activity within an initiative
export const CREATE_ACTIVITY = gql`
  mutation CreateActivity($createActivityInput: CreateActivityInput!) {
    createActivity(createActivityInput: $createActivityInput) {
      activityId
      title
      description
      status
      milestone
      startDate
      dueDate
      notes
      createdAt
      initiative {
        initiativeId
        title
        scopeType
        scopeId
      }
      assignedTo {
        employeeId
        fullName
      }
      createdBy {
        employeeId
        fullName
      }
    }
  }
`;

// Update an activity
export const UPDATE_ACTIVITY = gql`
  mutation UpdateActivity($updateActivityInput: UpdateActivityInput!) {
    updateActivity(updateActivityInput: $updateActivityInput) {
      activityId
      title
      description
      status
      milestone
      startDate
      dueDate
      notes
      updatedAt
      initiative {
        initiativeId
        title
        scopeType
        scopeId
      }
      assignedTo {
        employeeId
        fullName
      }
    }
  }
`;

// Remove an activity
export const REMOVE_ACTIVITY = gql`
  mutation RemoveActivity($activityId: ID!) {
    removeActivity(activityId: $activityId) {
      activityId
      title
      isDeleted
    }
  }
`;
