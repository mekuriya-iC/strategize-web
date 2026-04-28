import { gql } from '@apollo/client';

/**
 * Authentication Mutations
 * Matches backend schema exactly
 */

// Login mutation
export const LOGIN_EMPLOYEE = gql`
  mutation LoginEmployee($input: LoginEmployeeInput!) {
    loginEmployee(loginInput: $input) {
      accessToken
      employee {
        employeeId
        fullName
        email
        role
        status
        title
        phoneNumber
        picture
      }
    }
  }
`;

// Refresh token mutation (for when backend implements it)
export const REFRESH_TOKEN = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
    }
  }
`;

// Logout mutation (for when backend implements it)
export const LOGOUT_EMPLOYEE = gql`
  mutation LogoutEmployee {
    logoutEmployee {
      success
      message
    }
  }
`;
