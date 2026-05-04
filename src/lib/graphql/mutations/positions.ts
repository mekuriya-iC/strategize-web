import { gql } from '@apollo/client';

/**
 * Position Mutations
 * CRUD for positions and competency assignments
 */

// Create a new position
export const CREATE_POSITION = gql`
  mutation CreatePosition($createPositionInput: CreatePositionInput!) {
    createPosition(createPositionInput: $createPositionInput) {
      positionId
      title
      description
      grade
      createdAt
      updatedAt
    }
  }
`;

// Update a position
export const UPDATE_POSITION = gql`
  mutation UpdatePosition($updatePositionInput: UpdatePositionInput!) {
    updatePosition(updatePositionInput: $updatePositionInput) {
      positionId
      title
      description
      grade
      updatedAt
    }
  }
`;

// Remove a position
export const REMOVE_POSITION = gql`
  mutation RemovePosition($positionId: ID!) {
    removePosition(positionId: $positionId) {
      positionId
      title
    }
  }
`;

// Assign a competency to a position
export const CREATE_COMPETENCY_POSITION_ASSIGNMENT = gql`
  mutation CreateCompetencyPositionAssignment(
    $createCompetencyPositionAssignmentInput: CreateCompetencyPositionAssignmentInput!
  ) {
    createCompetencyPositionAssignment(
      createCompetencyPositionAssignmentInput: $createCompetencyPositionAssignmentInput
    ) {
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

// Update a competency position assignment
export const UPDATE_COMPETENCY_POSITION_ASSIGNMENT = gql`
  mutation UpdateCompetencyPositionAssignment(
    $updateCompetencyPositionAssignmentInput: UpdateCompetencyPositionAssignmentInput!
  ) {
    updateCompetencyPositionAssignment(
      updateCompetencyPositionAssignmentInput: $updateCompetencyPositionAssignmentInput
    ) {
      competencyPositionAssignmentId
      isMandatory
    }
  }
`;

// Remove a competency position assignment
export const REMOVE_COMPETENCY_POSITION_ASSIGNMENT = gql`
  mutation RemoveCompetencyPositionAssignment($competencyPositionAssignmentId: ID!) {
    removeCompetencyPositionAssignment(
      competencyPositionAssignmentId: $competencyPositionAssignmentId
    ) {
      competencyPositionAssignmentId
    }
  }
`;
