import { gql } from '@apollo/client';
import { SubmissionsFragment } from '../fragments/-submissions';

/**
 * Mutations for submissions
 */

export const CREATE_SUBMISSIONS = gql`
  mutation CreateSubmissions($input: CreateSubmissionsInput!) {
    createSubmissions(input: $input) {
      ...SubmissionsFragment
    }
  }
  ${SubmissionsFragment}
`;

// Alias for consistency
export const CREATE_SUBMISSION = CREATE_SUBMISSIONS;

export const UPDATE_SUBMISSIONS = gql`
  mutation UpdateSubmissions($id: ID!, $input: UpdateSubmissionsInput!) {
    updateSubmissions(id: $id, input: $input) {
      ...SubmissionsFragment
    }
  }
  ${SubmissionsFragment}
`;

// Alias for consistency
export const UPDATE_SUBMISSION = UPDATE_SUBMISSIONS;

export const DELETE_SUBMISSIONS = gql`
  mutation DeleteSubmissions($id: ID!) {
    deleteSubmissions(id: $id) {
      success
      message
    }
  }
`;

export const DELETE_SUBMISSION = DELETE_SUBMISSIONS;

