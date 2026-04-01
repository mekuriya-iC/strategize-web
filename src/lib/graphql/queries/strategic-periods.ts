import { gql } from "@apollo/client";

export const GET_STRATEGIC_PERIODS = gql`
  query GetStrategicPeriods($page: Int, $limit: Int) {
    strategicPeriods(page: $page, limit: $limit) {
      items {
        strategicPeriodId
        startDate
        length
        endDate
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

export const GET_STRATEGIC_PERIOD = gql`
  query GetStrategicPeriod($strategicPeriodId: ID!) {
    strategicPeriod(strategicPeriodId: $strategicPeriodId) {
      strategicPeriodId
      startDate
      length
      endDate
      createdAt
      updatedAt
    }
  }
`;
