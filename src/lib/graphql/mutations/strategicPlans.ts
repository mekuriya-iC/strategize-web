import { gql } from '@apollo/client';

export const CREATE_STRATEGIC_PLAN = gql`
  mutation CreateStrategicPlan($input: CreateStrategicPlanInput!) {
    createStrategicPlan(createStrategicPlanInput: $input) {
      strategicPlanId
      title
      isActive
    }
  }
`;

export const UPDATE_STRATEGIC_PLAN = gql`
  mutation UpdateStrategicPlan($input: UpdateStrategicPlanInput!) {
    updateStrategicPlan(updateStrategicPlanInput: $input) {
      strategicPlanId
      title
      isActive
    }
  }
`;

export const REMOVE_STRATEGIC_PLAN = gql`
  mutation RemoveStrategicPlan($strategicPlanId: ID!) {
    removeStrategicPlan(strategicPlanId: $strategicPlanId) {
      strategicPlanId
    }
  }
`;

export const CREATE_STRATEGIC_PILLAR = gql`
  mutation CreateStrategicPillar($input: CreateStrategicPillarInput!) {
    createStrategicPillar(createStrategicPillarInput: $input) {
      strategicPillarId
      name
    }
  }
`;

export const UPDATE_STRATEGIC_PILLAR = gql`
  mutation UpdateStrategicPillar($input: UpdateStrategicPillarInput!) {
    updateStrategicPillar(updateStrategicPillarInput: $input) {
      strategicPillarId
      name
    }
  }
`;

export const REMOVE_STRATEGIC_PILLAR = gql`
  mutation RemoveStrategicPillar($strategicPillarId: ID!) {
    removeStrategicPillar(strategicPillarId: $strategicPillarId) {
      strategicPillarId
    }
  }
`;

export const ACTIVATE_STRATEGIC_PLAN = gql`
  mutation ActivateStrategicPlan($strategicPlanId: ID!) {
    updateStrategicPlan(updateStrategicPlanInput: {
      strategicPlanId: $strategicPlanId
      isActive: true
    }) {
      strategicPlanId
      title
      isActive
    }
  }
`;

export const DEACTIVATE_STRATEGIC_PLAN = gql`
  mutation DeactivateStrategicPlan($strategicPlanId: ID!) {
    updateStrategicPlan(updateStrategicPlanInput: {
      strategicPlanId: $strategicPlanId
      isActive: false
    }) {
      strategicPlanId
      title
      isActive
    }
  }
`;
