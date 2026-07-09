import { gql } from "@apollo/client";

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
      departments {
        departmentId
        name
      }
    }
    actionedBy {
      employeeId
      fullName
      email
    }
    kpi {
      kpiId
      name
      status
      assigneeType
      assigneeId
      weight
      baseline
      targetValue
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
          assigneeType
          assigneeId
          type
        }
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
        assigneeType
        assigneeId
        type
      }
    }
  }
`;
