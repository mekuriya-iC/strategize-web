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
          status
          phoneNumber
          picture
          title
          startDate
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

// Query to get departments with reduced payload for assignment dialog
export const GET_DEPARTMENTS_FOR_ASSIGNMENT = gql`
  query GetDepartmentsForAssignment($page: Int, $limit: Int, $search: String) {
    departments(page: $page, limit: $limit, search: $search) {
      items {
        departmentId
        name
        manager {
          employeeId
          fullName
        }
        division {
          divisionId
          name
        }
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
      }
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

      createdAt
      updatedAt
    }
  }
`;
// Lightweight query for analytics to avoid non-nullable manager resolver errors
export const GET_DEPARTMENTS_ANALYTICS = gql`
  query GetDepartmentsAnalytics($page: Int = 1, $limit: Int = 1000) {
    departments(page: $page, limit: $limit) {
      items {
        departmentId
        name
        createdAt
        division {
          divisionId
          name
        }
      }
      meta {
        totalItems
      }
    }
  }
`;

// Safe query for a single department's data without manager
export const GET_DEPARTMENT_SAFE = gql`
  query GetDepartmentSafe($departmentId: ID!) {
    department(departmentId: $departmentId) {
      departmentId
      name
      createdAt
      division {
        divisionId
        name
      }
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
      updatedAt
    }
  }
`;
