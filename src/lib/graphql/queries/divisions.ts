import { gql } from "@apollo/client";

// Query to get paginated list of divisions with search support
export const GET_DIVISIONS = gql`
  query GetDivisions($page: Int, $limit: Int, $search: String) {
    divisions(page: $page, limit: $limit, search: $search) {
      items {
        divisionId
        name
        manager {
          employeeId
          fullName
          email
          role
        }
        departments {
          departmentId
          name
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        itemCount
        itemsPerPage
        totalPages
        currentPage
      }
    }
  }
`;

// Query to get a single division by ID
export const GET_DIVISION = gql`
  query GetDivision($divisionId: ID!) {
    division(divisionId: $divisionId) {
      divisionId
      name
      manager {
        employeeId
        fullName
        email
        role
        phoneNumber
        picture
      }
      departments {
        departmentId
        name
        manager {
          employeeId
          fullName
          email
        }
        employees {
          employeeId
          fullName
        }
        createdAt
        updatedAt
      }
      createdAt
      updatedAt
    }
  }
`;

// Query to get basic division info without departments (to avoid manager constraint)
export const GET_DIVISION_BASIC = gql`
  query GetDivisionBasic($divisionId: ID!) {
    division(divisionId: $divisionId) {
      divisionId
      name
      manager {
        employeeId
        fullName
        email
        role
        phoneNumber
        picture
      }
      createdAt
      updatedAt
    }
  }
`;
