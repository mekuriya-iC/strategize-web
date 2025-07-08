import { gql } from "@apollo/client";

export const GET_OBJECTIVES = gql`
  query GetObjectives($page: Int, $limit: Int, $search: String) {
    objectives(page: $page, limit: $limit, search: $search) {
      items {
        objectiveId
        name
        type
        status
        strategicPeriod {
          strategicPeriodId
          startDate
          endDate
          length
        }
        createdAt
        updatedAt
      }
      meta {
        currentPage
        itemCount
        itemsPerPage
        totalItems
        totalPages
      }
    }
  }
`;

export const GET_OBJECTIVE = gql`
  query GetObjective($objectiveId: ID!) {
    objective(objectiveId: $objectiveId) {
      objectiveId
      name
      type
      status
      strategicPeriod {
        strategicPeriodId
        startDate
        endDate
        length
      }
      createdAt
      updatedAt
    }
  }
`;
