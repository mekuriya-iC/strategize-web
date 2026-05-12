import { gql } from '@apollo/client';

/**
 * Strategic Periods Mutations
 * Matches backend schema exactly
 */

// Create a new strategic period
export const CREATE_STRATEGIC_PERIOD = gql`
  mutation CreateStrategicPeriod($input: CreateStrategicPeriodInput!) {
    createStrategicPeriod(createStrategicPeriodInput: $input) {
      strategicPeriodId
      name
      startDate
      endDate
      periodType
      status
      createdAt
    }
  }
`;

// Update a strategic period
export const UPDATE_STRATEGIC_PERIOD = gql`
  mutation UpdateStrategicPeriod($input: UpdateStrategicPeriodInput!) {
    updateStrategicPeriod(updateStrategicPeriodInput: $input) {
      strategicPeriodId
      name
      startDate
      endDate
      periodType
      status
      openedAt
      closedAt
      updatedAt
    }
  }
`;

// Delete a strategic period
export const REMOVE_STRATEGIC_PERIOD = gql`
  mutation RemoveStrategicPeriod($strategicPeriodId: ID!) {
    removeStrategicPeriod(strategicPeriodId: $strategicPeriodId) {
      strategicPeriodId
      name
    }
  }
`;
