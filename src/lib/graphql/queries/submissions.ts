import { gql } from '@apollo/client';
import { SubmissionsFragment } from '../fragments/-submissions';

/**
 * Query to fetch submissions
 * Supports pagination and filtering
 * Note: type parameter is required by the backend
 */
export const GETSUBMISSIONS = gql`
  query GetSubmissions(
    $page: Int!
    $limit: Int!
    $type: ObjectiveType!
    $submissionType: SubmissionType
  ) {
    submissions(
      page: $page
      limit: $limit
      type: $type
      submissionType: $submissionType
    ) {
      items {
        ...SubmissionsFragment
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
  ${SubmissionsFragment}
`;

// Aliases for consistency
export const GET_SUBMISSIONS = GETSUBMISSIONS;
export const GET_KPI_SUBMISSIONS = GETSUBMISSIONS;
export const GET_PENDING_SUBMISSIONS = GETSUBMISSIONS;
export const GET_SUBMISSIONS_BY_STATUS = GETSUBMISSIONS;

/**
 * Query to fetch single submission
 */
export const GET_SUBMISSIONS_BY_ID = gql`
  query GetSubmissionById($submissionId: ID!) {
    submission(submissionId: $submissionId) {
      ...SubmissionsFragment
    }
  }
  ${SubmissionsFragment}
`;

export const GET_SUBMISSION = GET_SUBMISSIONS_BY_ID;
