import { gql } from "@apollo/client";

// Employee pagination query (matches schema exactly)
// Note: departments field removed due to backend returning null for employees without departments
export const GET_EMPLOYEES = gql`
  query Employees($page: Int = 1, $limit: Int = 10, $search: String) {
    employees(page: $page, limit: $limit, search: $search) {
      items {
        employeeId
        email
        fullName
        phoneNumber
        picture
        role
        startDate
        status
        title
        createdAt
        updatedAt
        updatedAt
      }
      meta {
        currentPage
        itemCount
        itemsPerPage
        totalItems
        totalPages
      }
    }
  }
`;

// Lightweight employees query for analytics counts (avoids departments field)
export const GET_EMPLOYEES_COUNT = gql`
  query EmployeesCount($page: Int = 1, $limit: Int = 1) {
    employees(page: $page, limit: $limit) {
      items {
        employeeId
      }
      meta {
        totalItems
      }
    }
  }
`;

// "Who am I?" query (matches schema exactly)
export const GET_ME = gql`
  query Me {
    me {
      employeeId
      email
      fullName
      phoneNumber
      picture
      role
      startDate
      status
      title
      createdAt
      updatedAt
      updatedAt
    }
  }
`;
