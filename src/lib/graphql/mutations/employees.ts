import { gql } from '@apollo/client';
import { EmployeesFragment } from '../fragments/-employees';

/**
 * Mutations for employees
 * Matches backend resolver exactly:
 *   createEmployee(createEmployeeInput: CreateEmployeeInput!)
 *   updateEmployee(updateEmployeeInput: UpdateEmployeeInput!)
 *   removeEmployee(employeeId: ID!)
 */

export const CREATE_EMPLOYEES = gql`
  mutation CreateEmployees($createEmployeeInput: CreateEmployeeInput!) {
    createEmployee(createEmployeeInput: $createEmployeeInput) {
      ...EmployeesFragment
    }
  }
  ${EmployeesFragment}
`;

// Aliases for consistency
export const CREATE_EMPLOYEE = CREATE_EMPLOYEES;

export const UPDATE_EMPLOYEES = gql`
  mutation UpdateEmployees($updateEmployeeInput: UpdateEmployeeInput!) {
    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {
      ...EmployeesFragment
    }
  }
  ${EmployeesFragment}
`;

// Aliases for consistency
export const UPDATE_EMPLOYEE = UPDATE_EMPLOYEES;

export const DELETE_EMPLOYEES = gql`
  mutation DeleteEmployees($employeeId: ID!) {
    removeEmployee(employeeId: $employeeId) {
      employeeId
      fullName
      email
    }
  }
`;

// Aliases for consistency
export const REMOVE_EMPLOYEE = DELETE_EMPLOYEES;
