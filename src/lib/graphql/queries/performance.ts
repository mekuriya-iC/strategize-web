import { gql } from '@apollo/client';

/**
 * Performance Aggregation Queries
 */
export const GET_AGGREGATE_PERFORMANCE_RESULTS = gql`
  query GetAggregatePerformanceResults(
    $page: Int!
    $limit: Int!
    $strategicPeriodId: ID
    $userId: ID
  ) {
    aggregatePerformanceResults(
      page: $page
      limit: $limit
      strategicPeriodId: $strategicPeriodId
      userId: $userId
    ) {
      items {
        aggregatePerformanceResultId
        aggregateScore
        competencyScore
        individualKpiScore
        sharedKpiScore
        computedAt
        createdAt
        user {
          employeeId
          fullName
          email
          picture
          title
          department {
            departmentId
            name
          }
        }
        strategicPeriod {
          strategicPeriodId
          name
          startDate
          endDate
        }
        weightConfig {
          performanceWeightConfigId
          competencyWeight
          individualKpiWeight
          sharedKpiWeight
        }
      }
      meta {
        totalItems
        totalPages
        currentPage
        itemsPerPage
        itemCount
      }
    }
  }
`;

export const GET_AGGREGATE_PERFORMANCE_RESULT = gql`
  query GetAggregatePerformanceResult($aggregatePerformanceResultId: ID!) {
    aggregatePerformanceResult(aggregatePerformanceResultId: $aggregatePerformanceResultId) {
      aggregatePerformanceResultId
      aggregateScore
      competencyScore
      individualKpiScore
      sharedKpiScore
      computedAt
      createdAt
      updatedAt
      user {
        employeeId
        fullName
        email
        picture
        title
        department {
          departmentId
          name
        }
        division {
          divisionId
          name
        }
      }
      strategicPeriod {
        strategicPeriodId
        name
        startDate
        endDate
        periodType
      }
      weightConfig {
        performanceWeightConfigId
        competencyWeight
        individualKpiWeight
        sharedKpiWeight
        configuredBy {
          employeeId
          fullName
        }
        createdAt
      }
    }
  }
`;

/**
 * Performance Weight Config Queries
 */
export const GET_PERFORMANCE_WEIGHT_CONFIGS = gql`
  query GetPerformanceWeightConfigs(
    $page: Int!
    $limit: Int!
    $strategicPeriodId: ID
  ) {
    performanceWeightConfigs(
      page: $page
      limit: $limit
      strategicPeriodId: $strategicPeriodId
    ) {
      items {
        performanceWeightConfigId
        competencyWeight
        individualKpiWeight
        sharedKpiWeight
        createdAt
        strategicPeriod {
          strategicPeriodId
          name
        }
        configuredBy {
          employeeId
          fullName
        }
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

export const GET_PERFORMANCE_WEIGHT_CONFIG = gql`
  query GetPerformanceWeightConfig($performanceWeightConfigId: ID!) {
    performanceWeightConfig(performanceWeightConfigId: $performanceWeightConfigId) {
      performanceWeightConfigId
      competencyWeight
      individualKpiWeight
      sharedKpiWeight
      createdAt
      updatedAt
      strategicPeriod {
        strategicPeriodId
        name
        startDate
        endDate
      }
      configuredBy {
        employeeId
        fullName
        email
      }
    }
  }
`;
