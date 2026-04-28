import { gql } from '@apollo/client';

export const GET_STRATEGIC_PERIODS = gql`
  query GetStrategicPeriods($page: Int, $limit: Int) {
    strategicPeriods(page: $page, limit: $limit) {
      items {
        strategicPeriodId
        name
        startDate
        endDate
        status
        createdAt
        updatedAt
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

export const GET_STRATEGIC_PERIOD = gql`
  query GetStrategicPeriod($strategicPeriodId: ID!) {
    strategicPeriod(strategicPeriodId: $strategicPeriodId) {
      strategicPeriodId
      name
      startDate
      endDate
      status
      createdAt
      updatedAt
    }
  }
`;
