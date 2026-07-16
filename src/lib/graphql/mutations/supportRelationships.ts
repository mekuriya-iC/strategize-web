import { gql } from "@apollo/client";

export const CREATE_SUPPORT_OBJECTIVE_ASSIGNMENT = gql`
  mutation CreateSupportObjectiveAssignment(
    $input: CreateSupportObjectiveAssignmentInput!
  ) {
    createSupportObjectiveAssignment(input: $input) {
      objectiveId
      title
    }
  }
`;

export const CREATE_SUPPORT_KPI = gql`
  mutation CreateSupportKpi($input: CreateSupportKpiInput!) {
    createSupportKpi(input: $input) {
      kpiId
      name
      measurementUnit
      unitType
      targetValue
      weight
      kpiMode
      managerRetentionPercent
      targets {
        timeline
        target
      }
    }
  }
`;
