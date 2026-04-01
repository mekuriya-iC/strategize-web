import { gql } from "@apollo/client";

export const CREATE_STRATEGIC_PERIOD = gql`
  mutation CreateStrategicPeriod($input: CreateStrategicPeriodInput!) {
    createStrategicPeriod(createStrategicPeriodInput: $input) {
      strategicPeriodId
      startDate
      length
      endDate
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_STRATEGIC_PERIOD = gql`
  mutation UpdateStrategicPeriod($input: UpdateStrategicPeriodInput!) {
    updateStrategicPeriod(updateStrategicPeriodInput: $input) {
      strategicPeriodId
      startDate
      length
      endDate
      createdAt
      updatedAt
    }
  }
`;

export const REMOVE_STRATEGIC_PERIOD = gql`
  mutation RemoveStrategicPeriod($id: ID!) {
    removeStrategicPeriod(strategicPeriodId: $id) {
      startDate
    }
  }
`;
