import { gql } from '@apollo/client';

export const GET_STRATEGIC_PLANS = gql`
  query GetStrategicPlans($page: Int!, $limit: Int!, $search: String) {
    strategicPlans(page: $page, limit: $limit, search: $search) {
      items {
        strategicPlanId
        name
        description
        startDate
        endDate
        status
        organizationId
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

export const GET_STRATEGIC_PLAN = gql`
  query GetStrategicPlan($strategicPlanId: ID!) {
    strategicPlan(strategicPlanId: $strategicPlanId) {
      strategicPlanId
      name
      description
      startDate
      endDate
      status
      organizationId
      pillars {
        strategicPillarId
        name
        description
        status
      }
    }
  }
`;

export const GET_STRATEGIC_PILLARS = gql`
  query GetStrategicPillars($page: Int!, $limit: Int!, $strategicPlanId: ID) {
    strategicPillars(page: $page, limit: $limit, strategicPlanId: $strategicPlanId) {
      items {
        strategicPillarId
        name
        description
        status
        strategicPlan {
          strategicPlanId
          name
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
