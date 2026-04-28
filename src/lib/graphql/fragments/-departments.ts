import { gql } from '@apollo/client';

/**
 * Departments fragment
 * Contains all common fields for departments
 */
export const DepartmentsFragment = gql`
  fragment DepartmentsFragment on Department {
    departmentId
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
    division {
      divisionId
      name
    }
    employees {
      employeeId
      fullName
      email
      role
    }
  }
`;
