import { gql } from "@apollo/client";

export const CREATE_SUBMISSION = gql`
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(createSubmissionInput: $input) {
      submissionId
      type
      level
      status
      reason
      createdAt
    }
  }
`;

export const CREATE_SUBMISSIONS = gql`
  mutation CreateSubmissions($inputs: [CreateSubmissionInput!]!) {
    createSubmissions(createSubmissionInputs: $inputs) {
      submissionId
      type
      level
      status
      reason
      createdAt
    }
  }
`;

export const UPDATE_SUBMISSION = gql`
  mutation UpdateSubmission($input: UpdateSubmissionInput!) {
    updateSubmission(updateSubmissionInput: $input) {
      submissionId
      status
      reason
      updatedAt
    }
  }
`;

export const REMOVE_SUBMISSION = gql`
  mutation RemoveSubmission($id: ID!) {
    removeSubmission(submissionId: $id) {
      submissionId
      status
    }
  }
`;
