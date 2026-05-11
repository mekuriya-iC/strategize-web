import { gql } from '@apollo/client';

/**
 * Employees fragment
 * Contains all common fields for employees
 * Note: departments field removed to avoid null errors for employees without departments
 */
export const EmployeesFragment = gql`
  fragment EmployeesFragment on Employee {
    employeeId
    fullName
    email
    role
    status
    title
    phoneNumber
    picture
    startDate
    createdAt
    updatedAt
    user {
      userId
    }
    supervisor {
      employeeId
      fullName
      user {
        userId
      }
    }
  }
`;
