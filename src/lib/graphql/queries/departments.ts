import { gql } from '@apollo/client';
import { DepartmentsFragment } from '../fragments/-departments';

/**
 * Query to fetch departments
 * Supports pagination and filtering
 */
export const GETDEPARTMENTS = gql`
  query GetDepartments($page: Int, $limit: Int, $search: String, $divisionId: ID, $organizationId: ID) {
    departments(page: $page, limit: $limit, search: $search, divisionId: $divisionId, organizationId: $organizationId) {
      items {
        ...DepartmentsFragment
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
  ${DepartmentsFragment}
`;

// Alias for consistency
export const GET_DEPARTMENTS = GETDEPARTMENTS;

/**
 * Query to fetch single department
 */
export const GET_DEPARTMENTS_BY_ID = gql`
  query GetDepartmentById($departmentId: ID!) {
    department(departmentId: $departmentId) {
      ...DepartmentsFragment
    }
  }
  ${DepartmentsFragment}
`;

export const GET_DEPARTMENT = GET_DEPARTMENTS_BY_ID;
export const GET_DEPARTMENT_SAFE = GET_DEPARTMENTS_BY_ID;
export const GET_DEPARTMENTS_ANALYTICS = GETDEPARTMENTS;
