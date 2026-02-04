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
// Safe query for division data without problematic manager fields in departments
export const GET_DIVISION_SAFE = gql`
  query GetDivisionSafe($divisionId: ID!) {
    division(divisionId: $divisionId) {
      divisionId
      name
      departments {
        departmentId
        name
        createdAt
        updatedAt
        employees {
          employeeId
          fullName
          email
          role
          status
          phoneNumber
          picture
          title
          startDate
        }
      }
      createdAt
      updatedAt
    }
  }
`;
