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
    $status: SubmissionStatus
  ) {
    submissions(
      page: $page
      limit: $limit
      type: $type
      submissionType: $submissionType
      status: $status
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

/**
 * Lightweight pending submissions for sidebar/topbar badges.
 * Avoids pulling KPI quarter plans and nested scorecard fields.
 */
export const GET_PENDING_SUBMISSIONS_LIGHT = gql`
  query GetPendingSubmissionsLight(
    $page: Int!
    $limit: Int!
    $type: ObjectiveType!
    $submissionType: SubmissionType
    $status: SubmissionStatus
  ) {
    submissions(
      page: $page
      limit: $limit
      type: $type
      submissionType: $submissionType
      status: $status
    ) {
      items {
        submissionId
        type
        level
        status
        submittedBy {
          employeeId
          fullName
          departments {
            departmentId
            name
          }
        }
        objective {
          objectiveId
          title
          type
          status
          assigneeType
          assigneeId
          parent {
            objectiveId
            title
            type
            assigneeType
            assigneeId
          }
        }
        kpi {
          kpiId
          name
          status
          assigneeType
          assigneeId
          objective {
            objectiveId
            title
            type
            assigneeType
            assigneeId
            parent {
              objectiveId
              title
              type
              assigneeType
              assigneeId
            }
          }
        }
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
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
