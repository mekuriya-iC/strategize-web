import { gql } from '@apollo/client';

/**
 * Strategic Periods Queries
 * Matches backend schema exactly
 */

// Get paginated strategic periods
export const GET_STRATEGIC_PERIODS = gql`
  query GetStrategicPeriods(
    $page: Int!
    $limit: Int!
    $strategicPlanId: ID
    $organizationId: ID
  ) {
    strategicPeriods(
      page: $page
      limit: $limit
      strategicPlanId: $strategicPlanId
      organizationId: $organizationId
    ) {
      items {
        strategicPeriodId
        name
        startDate
        endDate
        periodType
        status
        openedAt
        closedAt
        createdAt
        updatedAt
        createdBy {
          employeeId
          fullName
          email
        }
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
      }
    }
  }
`;

// Get single strategic period by ID
export const GET_STRATEGIC_PERIOD = gql`
  query GetStrategicPeriod($strategicPeriodId: ID!) {
    strategicPeriod(strategicPeriodId: $strategicPeriodId) {
      strategicPeriodId
      name
      startDate
      endDate
      periodType
      status
      openedAt
      closedAt
      createdAt
      updatedAt
      createdBy {
        employeeId
        fullName
        email
        title
      }
    }
  }
`;
