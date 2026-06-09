import { gql } from "@apollo/client";

export const CREATE_PERFORMANCE_WEIGHT_CONFIG = gql`
  mutation CreatePerformanceWeightConfig($input: CreateWeightConfigInput!) {
    createPerformanceWeightConfig(input: $input) {
      unifiedPerformanceWeightConfigId
      organizationId
      strategicPeriodId
      kpiWeight
      competencyWeight
      activityWeight
      isActive
      notes
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PERFORMANCE_WEIGHT_CONFIG = gql`
  mutation UpdatePerformanceWeightConfig($input: UpdateWeightConfigInput!) {
    updatePerformanceWeightConfig(input: $input) {
      unifiedPerformanceWeightConfigId
      organizationId
      strategicPeriodId
      kpiWeight
      competencyWeight
      activityWeight
      isActive
      notes
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
