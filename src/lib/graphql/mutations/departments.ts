import { gql } from "@apollo/client";

// Mutation to create a new department
export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(createDepartmentInput: $input) {
      departmentId
      name
      # manager {
      #   employeeId
      #   fullName
      #   email
      #   role
      # }
      # division {
      #   divisionId
      #   name
      # }
      # employees {
      #   employeeId
      #   fullName
      #   email
      #   role
      # }
      createdAt
      updatedAt
    }
  }
`;

// Mutation to update an existing department
export const UPDATE_DEPARTMENT = gql`
  mutation UpdateDepartment($input: UpdateDepartmentInput!) {
    updateDepartment(updateDepartmentInput: $input) {
      departmentId
      name
      # manager {
      #   employeeId
      #   fullName
      #   email
      #   role
      # }
      # division {
      #   divisionId
      #   name
      # }
      # employees {
      #   employeeId
      #   fullName
      #   email
      #   role
      # }
      createdAt
      updatedAt
    }
  }
`;

// Mutation to remove a department
export const REMOVE_DEPARTMENT = gql`
  mutation RemoveDepartment($id: ID!) {
    removeDepartment(departmentId: $id) {
      name
    }
  }
`;

// Mutation to add an employee to a department
export const ADD_EMPLOYEE_TO_DEPARTMENT = gql`
  mutation AddEmployeeToDepartment($departmentId: ID!, $employeeId: ID!) {
    addEmployeeToDepartment(
      departmentId: $departmentId
      employeeId: $employeeId
    ) {
      departmentId
      name
      employees {
        employeeId
        fullName
        email
        role
      }
    }
  }
`;

// Mutation to remove an employee from a department
export const REMOVE_EMPLOYEE_FROM_DEPARTMENT = gql`
  mutation RemoveEmployeeFromDepartment($departmentId: ID!, $employeeId: ID!) {
    removeEmployeeFromDepartment(
      departmentId: $departmentId
      employeeId: $employeeId
    ) {
      departmentId
      name
      employees {
        employeeId
        fullName
        email
        role
      }
    }
  }
`;
