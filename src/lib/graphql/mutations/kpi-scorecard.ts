import { gql } from "@apollo/client";

/**
 * KPI Scorecard Mutations
 */

export const CALCULATE_KPI_SCORES = gql`
  mutation CalculateKpiScores($periodId: ID!) {
    calculateKpiScores(periodId: $periodId)
  }
`;

export const AUTO_CREATE_CASCADE_MAPPINGS = gql`
  mutation AutoCreateCascadeMappings($periodId: ID!) {
    autoCreateCascadeMappings(periodId: $periodId)
  }
`;

export const CREATE_CASCADE_MAPPING = gql`
  mutation CreateCascadeMapping($input: CreateCascadeMappingInput!) {
    createCascadeMapping(input: $input) {
      kpiCascadeMappingId
      sourceKpi {
        kpiId
        name
      }
      sourceLevel
      targetKpi {
        kpiId
        name
      }
      targetLevel
      isActive
      createdAt
    }
  }
`;

export const DELETE_CASCADE_MAPPING = gql`
  mutation DeleteCascadeMapping($mappingId: ID!) {
    deleteCascadeMapping(mappingId: $mappingId)
  }
`;
