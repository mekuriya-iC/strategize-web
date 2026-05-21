import { gql } from '@apollo/client';

/**
 * Position Queries
 * For managing job positions and competency assignments
 */

// Get paginated positions
export const GET_POSITIONS = gql`
  query GetPositions(
    $page: Int!
    $limit: Int!
    $search: String
    $organizationId: ID
  ) {
    positions(
      page: $page
      limit: $limit
      search: $search
      organizationId: $organizationId
    ) {
      items {
        positionId
        title
        description
        grade
        createdAt
        updatedAt
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
        itemCount
      }
    }
  }
`;

// Get single position by ID
export const GET_POSITION = gql`
  query GetPosition($positionId: ID!) {
    position(positionId: $positionId) {
      positionId
      title
      description
      grade
      createdAt
      updatedAt
    }
  }
`;

// Get competency assignments for a position
export const GET_COMPETENCY_POSITION_ASSIGNMENTS = gql`
  query GetCompetencyPositionAssignments(
    $page: Int!
    $limit: Int!
    $positionId: ID
    $competencyId: ID
  ) {
    competencyPositionAssignments(
      page: $page
      limit: $limit
      positionId: $positionId
      competencyId: $competencyId
    ) {
      items {
        competencyPositionAssignmentId
        isMandatory
        createdAt
        competency {
          competencyId
          name
          description
          isActive
          coreCompetency {
            coreCompetencyId
            name
          }
        }
        position {
          positionId
          title
        }
        createdBy {
          employeeId
          fullName
        }
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
        itemCount
      }
    }
  }
`;
