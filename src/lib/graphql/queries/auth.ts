import { gql } from '@apollo/client';

/**
 * Authentication Queries
 * Matches backend schema exactly
 */

// Get current user
export const GET_ME = gql`
  query GetMe {
    me {
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
    }
  }
`;
