import { gql } from '@apollo/client';

/**
 * Strategic Plan Queries
 */

export const GET_STRATEGIC_PLANS = gql`
  query GetStrategicPlans($page: Int!, $limit: Int!, $search: String) {
    strategicPlans(page: $page, limit: $limit, search: $search) {
      items {
        strategicPlanId
        title
        description
        startDate
        endDate
        isActive
        version
        createdAt
        organization {
          organizationId
          name
        }
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
        itemCount
      }
    }
  }
`;

export const GET_STRATEGIC_PLAN = gql`
  query GetStrategicPlan($strategicPlanId: ID!) {
    strategicPlan(strategicPlanId: $strategicPlanId) {
      strategicPlanId
      title
      description
      startDate
      endDate
      isActive
      version
      createdAt
      organization {
        organizationId
        name
      }
    }
  }
`;
