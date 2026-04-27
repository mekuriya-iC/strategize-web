import { gql } from '@apollo/client';

export const EMPLOYEE_FRAGMENT = gql`
  fragment EmployeeFields on Employee {
    # TODO: Add fields from your schema
    # Example fields:
    # id
    # name
    # createdAt
    # updatedAt
  }
`;
