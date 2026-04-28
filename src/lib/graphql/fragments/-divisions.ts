import { gql } from '@apollo/client';

/**
 * Divisions fragment
 * Contains all common fields for divisions
 */
export const DivisionsFragment = gql`
  fragment DivisionsFragment on Division {
    divisionId
    name
    description
    isActive
    isDeleted
    createdAt
    updatedAt
    head {
      employeeId
      fullName
      email
    }
    parentDivision {
      divisionId
      name
    }
    departments {
      departmentId
      name
    }
  }
`;
