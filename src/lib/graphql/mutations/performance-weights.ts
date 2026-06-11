import { gql } from "@apollo/client";

export const CREATE_PERFORMANCE_WEIGHT_CONFIG = gql`
  mutation CreatePerformanceWeightConfig($input: CreateWeightConfigInput!) {
    createPerformanceWeightConfig(input: $input) {
      unifiedPerformanceWeightConfigId
      kpiWeight
      competencyWeight
      activityWeight
      isActive
      notes
      strategicPeriod {
        strategicPeriodId
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PERFORMANCE_WEIGHT_CONFIG = gql`
  mutation UpdatePerformanceWeightConfig($input: UpdateWeightConfigInput!) {
    updatePerformanceWeightConfig(input: $input) {
      unifiedPerformanceWeightConfigId
      kpiWeight
      competencyWeight
      activityWeight
      isActive
      notes
      strategicPeriod {
        strategicPeriodId
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_PERFORMANCE_WEIGHT_CONFIG = gql`
  mutation DeletePerformanceWeightConfig($configId: String!) {
    deletePerformanceWeightConfig(configId: $configId)
  }
`;
