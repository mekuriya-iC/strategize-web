import { gql } from '@apollo/client';

/**
 * Performance Aggregation Mutations
 */
export const CREATE_AGGREGATE_PERFORMANCE_RESULT = gql`
  mutation CreateAggregatePerformanceResult(
    $createAggregatePerformanceResultInput: CreateAggregatePerformanceResultInput!
  ) {
    createAggregatePerformanceResult(
      createAggregatePerformanceResultInput: $createAggregatePerformanceResultInput
    ) {
      aggregatePerformanceResultId
      aggregateScore
      competencyScore
      individualKpiScore
      sharedKpiScore
      computedAt
      user {
        employeeId
        fullName
      }
      strategicPeriod {
        strategicPeriodId
        name
      }
    }
  }
`;

export const UPDATE_AGGREGATE_PERFORMANCE_RESULT = gql`
  mutation UpdateAggregatePerformanceResult(
    $updateAggregatePerformanceResultInput: UpdateAggregatePerformanceResultInput!
  ) {
    updateAggregatePerformanceResult(
      updateAggregatePerformanceResultInput: $updateAggregatePerformanceResultInput
    ) {
      aggregatePerformanceResultId
      aggregateScore
      competencyScore
      individualKpiScore
      sharedKpiScore
      updatedAt
    }
  }
`;

export const REMOVE_AGGREGATE_PERFORMANCE_RESULT = gql`
  mutation RemoveAggregatePerformanceResult($aggregatePerformanceResultId: ID!) {
    removeAggregatePerformanceResult(
      aggregatePerformanceResultId: $aggregatePerformanceResultId
    ) {
      aggregatePerformanceResultId
      user {
        fullName
      }
    }
  }
`;

/**
 * Performance Weight Config Mutations
 */
export const CREATE_PERFORMANCE_WEIGHT_CONFIG = gql`
  mutation CreatePerformanceWeightConfig(
    $createPerformanceWeightConfigInput: CreatePerformanceWeightConfigInput!
  ) {
    createPerformanceWeightConfig(
      createPerformanceWeightConfigInput: $createPerformanceWeightConfigInput
    ) {
      performanceWeightConfigId
      competencyWeight
      individualKpiWeight
      sharedKpiWeight
      strategicPeriod {
        strategicPeriodId
        name
      }
      createdAt
    }
  }
`;

export const UPDATE_PERFORMANCE_WEIGHT_CONFIG = gql`
  mutation UpdatePerformanceWeightConfig(
    $updatePerformanceWeightConfigInput: UpdatePerformanceWeightConfigInput!
  ) {
    updatePerformanceWeightConfig(
      updatePerformanceWeightConfigInput: $updatePerformanceWeightConfigInput
    ) {
      performanceWeightConfigId
      competencyWeight
      individualKpiWeight
      sharedKpiWeight
      updatedAt
    }
  }
`;

export const REMOVE_PERFORMANCE_WEIGHT_CONFIG = gql`
  mutation RemovePerformanceWeightConfig($performanceWeightConfigId: ID!) {
    removePerformanceWeightConfig(performanceWeightConfigId: $performanceWeightConfigId) {
      performanceWeightConfigId
    }
  }
`;
