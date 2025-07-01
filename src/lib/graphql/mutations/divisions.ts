import { gql } from "@apollo/client";

// Mutation to create a new division
export const CREATE_DIVISION = gql`
  mutation CreateDivision($input: CreateDivisionInput!) {
    createDivision(createDivisionInput: $input) {
      divisionId
      name
      createdAt
      updatedAt
    }
  }
`;

// Mutation to update an existing division
export const UPDATE_DIVISION = gql`
  mutation UpdateDivision($input: UpdateDivisionInput!) {
    updateDivision(updateDivisionInput: $input) {
      divisionId
      name
      createdAt
      updatedAt
    }
  }
`;

// Mutation to remove a division
export const REMOVE_DIVISION = gql`
  mutation RemoveDivision($id: ID!) {
    removeDivision(divisionId: $id) {
      name
    }
  }
`;
