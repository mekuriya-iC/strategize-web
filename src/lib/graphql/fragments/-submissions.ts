import { gql } from '@apollo/client';

/**
 * Submissions fragment
 * Contains all common fields for submissions
 */
export const SubmissionsFragment = gql`
  fragment SubmissionsFragment on Submission {
    submissionId
    type
    level
    status
    reason
    createdAt
    updatedAt
    submittedBy {
      employeeId
      fullName
      email
    }
    actionedBy {
      employeeId
      fullName
      email
    }
    kpi {
      kpiId
      name
    }
    objective {
      objectiveId
      title
    }
  }
`;
