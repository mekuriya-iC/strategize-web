import { gql } from "@apollo/client";

export const CREATE_OBJECTIVE = gql`
  mutation CreateObjective($input: CreateObjectiveInput!) {
    createObjective(createObjectiveInput: $input) {
      objectiveId
      name
      type
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_OBJECTIVE = gql`
  mutation UpdateObjective($input: UpdateObjectiveInput!) {
    updateObjective(updateObjectiveInput: $input) {
      objectiveId
      name
      type
      status
      order
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_OBJECTIVES_ORDER = gql`
  mutation UpdateObjectivesOrder($input: [UpdateObjectiveInput!]!) {
    updateObjectives(updateObjectiveInputs: $input) {
      objectiveId
      name
      order
    }
  }
`;

export const REMOVE_OBJECTIVE = gql`
  mutation RemoveObjective($id: ID!) {
    removeObjective(objectiveId: $id) {
      name
      type
      status
    }
  }
`;

export const ASSIGN_OBJECTIVE = gql`
  mutation AssignObjective($input: AssignObjectiveInput!) {
    assignObjective(assignObjectiveInput: $input) {
      objectiveId
      name
      type
      status
      assigneeId
      assignerId
      assigneeType
      parent {
        objectiveId
        name
      }
      kpis {
        kpiId
        name
        status
      }
    }
  }
`;
