import { gql } from '@apollo/client';
import { DivisionsFragment } from '../fragments/-divisions';

/**
 * Mutations for divisions
 */

export const CREATE_DIVISION = gql`
  mutation CreateDivision($createDivisionInput: CreateDivisionInput!) {
    createDivision(createDivisionInput: $createDivisionInput) {
      ...DivisionsFragment
    }
  }
  ${DivisionsFragment}
`;

// Aliases for consistency
export const CREATE_DIVISIONS = CREATE_DIVISION;

export const UPDATE_DIVISION = gql`
  mutation UpdateDivision($updateDivisionInput: UpdateDivisionInput!) {
    updateDivision(updateDivisionInput: $updateDivisionInput) {
      ...DivisionsFragment
    }
  }
  ${DivisionsFragment}
`;

// Aliases for consistency
export const UPDATE_DIVISIONS = UPDATE_DIVISION;

export const REMOVE_DIVISION = gql`
  mutation RemoveDivision($divisionId: ID!) {
    removeDivision(divisionId: $divisionId) {
      ...DivisionsFragment
    }
  }
  ${DivisionsFragment}
`;

// Aliases for consistency
export const DELETE_DIVISION = REMOVE_DIVISION;
export const DELETE_DIVISIONS = REMOVE_DIVISION;
