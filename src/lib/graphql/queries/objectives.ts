import { gql } from "@apollo/client";

export const GET_OBJECTIVES = gql`
  query GetObjectives(
    $page: Int
    $limit: Int
    $search: String
    $assigneeId: ID
  ) {
    objectives(
      page: $page
      limit: $limit
      search: $search
      assigneeId: $assigneeId
    ) {
      items {
        objectiveId
        name
        type
        status
        order
        strategicPeriod {
          strategicPeriodId
          startDate
          endDate
          length
        }
        createdBy {
          employeeId
          fullName
        }
        assigneeId
        assignerId
        assigneeType
        parent {
          objectiveId
          name
        }
        kpis {
          kpiId
          name
          status
          targetStatus
          targets {
            timeline
            target
          }
          parent {
            kpiId
            name
          }
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
      order
      strategicPeriod {
        strategicPeriodId
        startDate
        endDate
        length
      }
      createdBy {
        employeeId
        fullName
      }
      assigneeId
      assignerId
      assigneeType
      parent {
        objectiveId
        name
      }
      kpis {
        kpiId
        name
        status
        targetStatus
        targets {
          timeline
          target
        }
        parent {
          kpiId
          name
        }
      }
      createdAt
      updatedAt
    }
  }
`;
