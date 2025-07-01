import { gql } from "@apollo/client";

// Employee pagination query (matches schema exactly)
export const GET_EMPLOYEES = gql`
  query Employees($page: Int = 1, $limit: Int = 10) {
    employees(page: $page, limit: $limit) {
      items {
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
      createdAt
      updatedAt
    }
  }
`;
 