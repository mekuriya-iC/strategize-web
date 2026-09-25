import { gql } from "@apollo/client";

/**
 * Employees fragment
 * Contains all common fields for employees
 */
export const EmployeesFragment = gql`
  fragment EmployeesFragment on Employee {
    employeeId
    organizationId
    managerId
    manager { employeeId fullName }
    fullName
    email
    role
    status
    title
    phoneNumber
    picture
    startDate
    organizationalUnit
    createdAt
    updatedAt
    departments {
      departmentId
      name
      division {
        divisionId
        name
      }
    }
  }
`;
