import { gql } from '@apollo/client';

/**
 * Competency Queries
 * For managing competencies, core competencies, and indicators
 */

// Get all competencies with pagination
export const GET_COMPETENCIES = gql`
  query GetCompetencies($page: Int!, $limit: Int!, $search: String) {
    competencies(page: $page, limit: $limit, search: $search) {
      items {
        competencyId
        name
        description
        isActive
        coreCompetency {
          coreCompetencyId
          name
          description
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

// Get single competency with details
export const GET_COMPETENCY = gql`
  query GetCompetency($competencyId: ID!) {
    competency(competencyId: $competencyId) {
      competencyId
      name
      description
      isActive
      coreCompetency {
        coreCompetencyId
        name
        description
      }
      createdAt
      updatedAt
    }
  }
`;

// Get all core competencies
export const GET_CORE_COMPETENCIES = gql`
  query GetCoreCompetencies($page: Int!, $limit: Int!) {
    coreCompetencies(page: $page, limit: $limit) {
      items {
        coreCompetencyId
        name
        description
        createdAt
        createdBy {
          employeeId
          fullName
        }
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

// Get competency indicators for a competency
export const GET_COMPETENCY_INDICATORS = gql`
  query GetCompetencyIndicators($competencyId: ID!, $page: Int!, $limit: Int!) {
    competencyIndicators(competencyId: $competencyId, page: $page, limit: $limit) {
      items {
        competencyIndicatorId
        description
        ratingScaleMin
        ratingScaleMax
        competency {
          competencyId
          name
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

// Get competencies assigned to a position
export const GET_POSITION_COMPETENCIES = gql`
  query GetPositionCompetencies($positionId: ID!, $page: Int!, $limit: Int!) {
    competencyPositionAssignments(positionId: $positionId, page: $page, limit: $limit) {
      items {
        competencyPositionAssignmentId
        isMandatory
        competency {
          competencyId
          name
          description
          coreCompetency {
            coreCompetencyId
            name
          }
        }
        position {
          positionId
          title
        }
        createdAt
        createdBy {
          employeeId
          fullName
        }
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;
