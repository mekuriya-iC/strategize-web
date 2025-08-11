import { gql } from "@apollo/client";

export const GET_SUBMISSIONS = gql`
  query Submissions($page: Int, $limit: Int, $type: ObjectiveType!) {
    submissions(page: $page, limit: $limit, type: $type) {
      items {
        submissionId
        type
        level
        status
        reason
        submittedBy {
          employeeId
          fullName
        }
        objective {
          objectiveId
          name
        }
        kpi {
          kpiId
          name
          weight
          baseline
        }
        createdAt
      }
      meta {
        totalItems
        itemCount
        itemsPerPage
        totalPages
        currentPage
      }
    }
  }
`;

export const GET_SUBMISSION = gql`
  query Submission($id: ID!) {
    submission(submissionId: $id) {
      submissionId
      type
      level
      status
      reason
      submittedBy {
        fullName
      }
      objective {
        name
      }
      kpi {
        name
        weight
        baseline
      }
      createdAt
    }
  }
`;

// Try a query without type parameter to get all submissions
export const GET_ALL_SUBMISSIONS_NO_TYPE = gql`
  query AllSubmissionsNoType($page: Int, $limit: Int) {
    submissions(page: $page, limit: $limit) {
      items {
        submissionId
        type
        level
        status
        reason
        submittedBy {
          employeeId
          fullName
        }
        objective {
          objectiveId
          name
          type
          status
        }
        kpi {
          kpiId
          name
          status
          weight
          baseline
          objective {
            objectiveId
            name
            type
          }
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        itemCount
        itemsPerPage
        totalPages
        currentPage
      }
    }
  }
`;

// Simplified queries for submission approval workflow
export const GET_PENDING_SUBMISSIONS = gql`
  query PendingSubmissions($page: Int, $limit: Int, $type: ObjectiveType!) {
    submissions(page: $page, limit: $limit, type: $type) {
      items {
        submissionId
        type
        level
        status
        reason
        submittedBy {
          employeeId
          fullName
        }
        objective {
          objectiveId
          name
          type
          status
          kpis {
            kpiId
            name
            status
            weight
            baseline
            assigneeId
            assigneeType
          }
        }
        kpi {
          kpiId
          name
          status
          weight
          baseline
          objective {
            objectiveId
            name
            type
          }
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        itemCount
        itemsPerPage
        totalPages
        currentPage
      }
    }
  }
`;

export const GET_SUBMISSIONS_BY_STATUS = gql`
  query SubmissionsByStatus(
    $page: Int
    $limit: Int
    $type: ObjectiveType!
    $status: SubmissionStatus!
  ) {
    submissions(page: $page, limit: $limit, type: $type) {
      items {
        submissionId
        type
        level
        status
        reason
        submittedBy {
          employeeId
          fullName
        }
        objective {
          objectiveId
          name
          type
          status
        }
        kpi {
          kpiId
          name
          status
          weight
          baseline
          objective {
            objectiveId
            name
            type
          }
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        itemCount
        itemsPerPage
        totalPages
        currentPage
      }
    }
  }
`;
