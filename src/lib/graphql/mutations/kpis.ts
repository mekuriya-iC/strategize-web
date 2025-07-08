import { gql } from "@apollo/client";

export const CREATE_KPI = gql`
  mutation CreateKpi($input: CreateKpiInput!) {
    createKpi(createKpiInput: $input) {
      kpiId
      name
      baseline
      weight
      weightType
      status
      targets {
        timeline
        target
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_KPI = gql`
  mutation UpdateKpi($input: UpdateKpiInput!) {
    updateKpi(updateKpiInput: $input) {
      kpiId
      name
      baseline
      weight
      weightType
      status
      targets {
        timeline
        target
      }
      createdAt
      updatedAt
    }
  }
`;

export const REMOVE_KPI = gql`
  mutation RemoveKpi($id: ID!) {
    removeKpi(kpiId: $id) {
      name
    }
  }
`;
