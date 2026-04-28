import { gql } from '@apollo/client';

export const CREATE_STRATEGIC_PERIOD = gql`
  mutation CreateStrategicPeriod($input: CreateStrategicPeriodInput!) {
    createStrategicPeriod(createStrategicPeriodInput: $input) {
      strategicPeriodId
      name
      startDate
      endDate
      status
      createdAt
    }
  }
`;

export const UPDATE_STRATEGIC_PERIOD = gql`
  mutation UpdateStrategicPeriod($input: UpdateStrategicPeriodInput!) {
    updateStrategicPeriod(updateStrategicPeriodInput: $input) {
      strategicPeriodId
      name
      startDate
      endDate
      status
      updatedAt
    }
  }
`;

export const REMOVE_STRATEGIC_PERIOD = gql`
  mutation RemoveStrategicPeriod($strategicPeriodId: ID!) {
    removeStrategicPeriod(strategicPeriodId: $strategicPeriodId) {
      strategicPeriodId
      name
    }
  }
`;
