import { gql } from '@apollo/client';

/**
 * Mutations for submissions
 * Aligned with backend schema
 */

export const CREATE_SUBMISSION = gql`
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(createSubmissionInput: $input) {
      submissionId
      status
      reason
      type
      level
      createdAt
      submittedBy {
        employeeId
        fullName
      }
      objective {
        objectiveId
        title
      }
      kpi {
        kpiId
        name
      }
    }
  }
`;

export const CREATE_SUBMISSIONS = gql`
  mutation CreateSubmissions($inputs: [CreateSubmissionInput!]!) {
    createSubmissions(createSubmissionInputs: $inputs) {
      submissionId
      status
      type
    }
  }
`;

export const UPDATE_SUBMISSION = gql`
  mutation UpdateSubmission($input: UpdateSubmissionInput!) {
    updateSubmission(updateSubmissionInput: $input) {
      submissionId
      status
      reason
      type
      level
      updatedAt
      actionedBy {
        employeeId
        fullName
      }
      objective {
        objectiveId
        title
        status
      }
      kpi {
        kpiId
        name
        status
      }
    }
  }
`;

export const REMOVE_SUBMISSION = gql`
  mutation RemoveSubmission($submissionId: ID!) {
    removeSubmission(submissionId: $submissionId) {
      submissionId
    }
  }
`;

// Aliases for consistency
export const DELETE_SUBMISSION = REMOVE_SUBMISSION;
