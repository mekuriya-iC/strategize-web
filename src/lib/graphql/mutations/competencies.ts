import { gql } from '@apollo/client';

/**
 * Core Competency Mutations
 */
export const CREATE_CORE_COMPETENCY = gql`
  mutation CreateCoreCompetency($createCoreCompetencyInput: CreateCoreCompetencyInput!) {
    createCoreCompetency(createCoreCompetencyInput: $createCoreCompetencyInput) {
      coreCompetencyId
      name
      description
      isActive
      createdAt
    }
  }
`;

export const UPDATE_CORE_COMPETENCY = gql`
  mutation UpdateCoreCompetency($updateCoreCompetencyInput: UpdateCoreCompetencyInput!) {
    updateCoreCompetency(updateCoreCompetencyInput: $updateCoreCompetencyInput) {
      coreCompetencyId
      name
      description
      isActive
      updatedAt
    }
  }
`;

export const REMOVE_CORE_COMPETENCY = gql`
  mutation RemoveCoreCompetency($coreCompetencyId: ID!) {
    removeCoreCompetency(coreCompetencyId: $coreCompetencyId) {
      coreCompetencyId
      name
    }
  }
`;

/**
 * Competency Mutations
 */
export const CREATE_COMPETENCY = gql`
  mutation CreateCompetency($createCompetencyInput: CreateCompetencyInput!) {
    createCompetency(createCompetencyInput: $createCompetencyInput) {
      competencyId
      name
      description
      isActive
      coreCompetency {
        coreCompetencyId
        name
      }
      createdAt
    }
  }
`;

export const UPDATE_COMPETENCY = gql`
  mutation UpdateCompetency($updateCompetencyInput: UpdateCompetencyInput!) {
    updateCompetency(updateCompetencyInput: $updateCompetencyInput) {
      competencyId
      name
      description
      isActive
      updatedAt
    }
  }
`;

export const REMOVE_COMPETENCY = gql`
  mutation RemoveCompetency($competencyId: ID!) {
    removeCompetency(competencyId: $competencyId) {
      competencyId
      name
    }
  }
`;

/**
 * Competency Indicator Mutations
 */
export const CREATE_COMPETENCY_INDICATOR = gql`
  mutation CreateCompetencyIndicator($createCompetencyIndicatorInput: CreateCompetencyIndicatorInput!) {
    createCompetencyIndicator(createCompetencyIndicatorInput: $createCompetencyIndicatorInput) {
      competencyIndicatorId
      description
      ratingScaleMin
      ratingScaleMax
      competency {
        competencyId
        name
      }
      createdAt
    }
  }
`;

export const UPDATE_COMPETENCY_INDICATOR = gql`
  mutation UpdateCompetencyIndicator($updateCompetencyIndicatorInput: UpdateCompetencyIndicatorInput!) {
    updateCompetencyIndicator(updateCompetencyIndicatorInput: $updateCompetencyIndicatorInput) {
      competencyIndicatorId
      description
      ratingScaleMin
      ratingScaleMax
      updatedAt
    }
  }
`;

export const REMOVE_COMPETENCY_INDICATOR = gql`
  mutation RemoveCompetencyIndicator($competencyIndicatorId: ID!) {
    removeCompetencyIndicator(competencyIndicatorId: $competencyIndicatorId) {
      competencyIndicatorId
    }
  }
`;

/**
 * Competency Position Assignment Mutations
 */
export const CREATE_COMPETENCY_POSITION_ASSIGNMENT = gql`
  mutation CreateCompetencyPositionAssignment($createCompetencyPositionAssignmentInput: CreateCompetencyPositionAssignmentInput!) {
    createCompetencyPositionAssignment(createCompetencyPositionAssignmentInput: $createCompetencyPositionAssignmentInput) {
      competencyPositionAssignmentId
      isMandatory
      competency {
        competencyId
        name
      }
      position {
        positionId
        title
      }
      createdAt
    }
  }
`;

export const REMOVE_COMPETENCY_POSITION_ASSIGNMENT = gql`
  mutation RemoveCompetencyPositionAssignment($competencyPositionAssignmentId: ID!) {
    removeCompetencyPositionAssignment(competencyPositionAssignmentId: $competencyPositionAssignmentId) {
      competencyPositionAssignmentId
    }
  }
`;
