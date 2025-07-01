import { gql } from "@apollo/client";

// Query to get paginated list of departments with search support
export const GET_DEPARTMENTS = gql`
  query GetDepartments($page: Int, $limit: Int, $search: String) {
    departments(page: $page, limit: $limit, search: $search) {
      items {
        departmentId
        name
        manager {
          employeeId
          fullName
          email
          role
        }
        division {
          divisionId
          name
        }
        employees {
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

// Query to get a single department by ID
export const GET_DEPARTMENT = gql`
  query GetDepartment($departmentId: ID!) {
    department(departmentId: $departmentId) {
      departmentId
      name
      manager {
        employeeId
        fullName
        email
        role
        phoneNumber
        picture
      }
      division {
        divisionId
        name
        manager {
          employeeId
          fullName
        }
      }
      employees {
        employeeId
        fullName
        email
        role
        phoneNumber
        picture
        status
        startDate
      }
      createdAt
      updatedAt
    }
  }
`;
