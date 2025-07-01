import { gql } from "@apollo/client";

// Login mutation for authentication (matches schema exactly)
export const LOGIN_EMPLOYEE = gql`
  mutation Login($input: LoginEmployeeInput!) {
    loginEmployee(loginInput: $input) {
      accessToken
      employee {
        employeeId
        email
        fullName
        phoneNumber
        picture
        role
        startDate
        status
        createdAt
        updatedAt
      }
    }
  }
`;

// Employee CRUD mutations (matches schema exactly)
export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($input: CreateEmployeeInput!) {
    createEmployee(createEmployeeInput: $input) {
      employeeId
      email
      fullName
      phoneNumber
      picture
      role
      startDate
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($input: UpdateEmployeeInput!) {
    updateEmployee(updateEmployeeInput: $input) {
      employeeId
      email
      fullName
      phoneNumber
      picture
      role
      startDate
      status
      createdAt
      updatedAt
    }
  }
`;

export const REMOVE_EMPLOYEE = gql`
  mutation RemoveEmployee($id: ID!) {
    removeEmployee(employeeId: $id) {
      status
    }
  }
`;
