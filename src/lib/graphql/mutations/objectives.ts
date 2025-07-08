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
      createdAt
      updatedAt
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
