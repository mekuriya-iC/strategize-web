import { gql } from '@apollo/client';
import { EmployeesFragment } from '../fragments/-employees';

/**
 * Mutations for employees
 */

export const CREATE_EMPLOYEES = gql`
  mutation CreateEmployees($input: CreateEmployeesInput!) {
    createEmployees(input: $input) {
      ...EmployeesFragment
    }
  }
  ${EmployeesFragment}
`;

// Aliases for consistency
export const CREATE_EMPLOYEE = CREATE_EMPLOYEES;

export const UPDATE_EMPLOYEES = gql`
  mutation UpdateEmployees($id: ID!, $input: UpdateEmployeesInput!) {
    updateEmployees(id: $id, input: $input) {
      ...EmployeesFragment
    }
  }
  ${EmployeesFragment}
`;

// Aliases for consistency
export const UPDATE_EMPLOYEE = UPDATE_EMPLOYEES;

export const DELETE_EMPLOYEES = gql`
  mutation DeleteEmployees($id: ID!) {
    deleteEmployees(id: $id) {
      success
      message
    }
  }
`;

// Aliases for consistency
export const REMOVE_EMPLOYEE = DELETE_EMPLOYEES;
