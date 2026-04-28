import { gql } from '@apollo/client';
import { DepartmentsFragment } from '../fragments/-departments';

/**
 * Mutations for departments
 */

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($createDepartmentInput: CreateDepartmentInput!) {
    createDepartment(createDepartmentInput: $createDepartmentInput) {
      ...DepartmentsFragment
    }
  }
  ${DepartmentsFragment}
`;

// Aliases for consistency
export const CREATE_DEPARTMENTS = CREATE_DEPARTMENT;

export const UPDATE_DEPARTMENT = gql`
  mutation UpdateDepartment($updateDepartmentInput: UpdateDepartmentInput!) {
    updateDepartment(updateDepartmentInput: $updateDepartmentInput) {
      ...DepartmentsFragment
    }
  }
  ${DepartmentsFragment}
`;

// Aliases for consistency
export const UPDATE_DEPARTMENTS = UPDATE_DEPARTMENT;

export const REMOVE_DEPARTMENT = gql`
  mutation RemoveDepartment($departmentId: ID!) {
    removeDepartment(departmentId: $departmentId) {
      ...DepartmentsFragment
    }
  }
  ${DepartmentsFragment}
`;

// Aliases for consistency
export const DELETE_DEPARTMENT = REMOVE_DEPARTMENT;
export const DELETE_DEPARTMENTS = REMOVE_DEPARTMENT;

// Employee management mutations (if they exist in the backend schema)
// These might need to be added based on your actual GraphQL schema
export const ADD_EMPLOYEE_TO_DEPARTMENT = gql`
  mutation AddEmployeeToDepartment($departmentId: ID!, $employeeId: ID!) {
    addEmployeeToDepartment(departmentId: $departmentId, employeeId: $employeeId) {
      ...DepartmentsFragment
    }
  }
  ${DepartmentsFragment}
`;

export const REMOVE_EMPLOYEE_FROM_DEPARTMENT = gql`
  mutation RemoveEmployeeFromDepartment($departmentId: ID!, $employeeId: ID!) {
    removeEmployeeFromDepartment(departmentId: $departmentId, employeeId: $employeeId) {
      ...DepartmentsFragment
    }
  }
  ${DepartmentsFragment}
`;
