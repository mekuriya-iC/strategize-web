import { gql } from '@apollo/client';
import { DivisionsFragment } from '../fragments/-divisions';

/**
 * Query to fetch divisions
 * Supports pagination and filtering
 */
export const GETDIVISIONS = gql`
  query GetDivisions($page: Int, $limit: Int, $search: String, $organizationId: ID) {
    divisions(page: $page, limit: $limit, search: $search, organizationId: $organizationId) {
      items {
        ...DivisionsFragment
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
  ${DivisionsFragment}
`;

// Alias for consistency
export const GET_DIVISIONS = GETDIVISIONS;

/**
 * Query to fetch single division
 */
export const GET_DIVISIONS_BY_ID = gql`
  query GetDivisionById($divisionId: ID!) {
    division(divisionId: $divisionId) {
      ...DivisionsFragment
    }
  }
  ${DivisionsFragment}
`;

export const GET_DIVISION = GET_DIVISIONS_BY_ID;
export const GET_DIVISION_SAFE = GET_DIVISIONS_BY_ID;
export const GET_DIVISION_BASIC = GET_DIVISIONS_BY_ID;
