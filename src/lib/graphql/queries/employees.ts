import { gql } from '@apollo/client';
import { EmployeesFragment } from '../fragments/-employees';

/**
 * Query to fetch employees
 * Supports pagination and filtering
 */
export const GETEMPLOYEES = gql`
  query GetEmployees($page: Int, $limit: Int, $search: String) {
    employees(page: $page, limit: $limit, search: $search) {
      items {
        ...EmployeesFragment
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
  ${EmployeesFragment}
`;

// Alias for consistency
export const GET_EMPLOYEES = GETEMPLOYEES;
export const GET_EMPLOYEES_COUNT = GETEMPLOYEES;

/**
 * Query to fetch single employees
 */
export const GET_EMPLOYEES_BY_ID = gql`
  query GetEmployeesById($id: ID!) {
    employee(id: $id) {
      ...EmployeesFragment
    }
  }
  ${EmployeesFragment}
`;

export const GET_EMPLOYEE = GET_EMPLOYEES_BY_ID;
