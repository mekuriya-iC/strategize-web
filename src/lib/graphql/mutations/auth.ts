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
      refreshToken
      employee {
        employeeId
        fullName
        email
        role
        status
        title
        phoneNumber
        picture
        isFirstLogin
        mustChangePassword
      }
    }
  }
`;

// Refresh token mutation
export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
    }
  }
`;

// Change password mutation
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

// Logout mutation — not yet implemented in the API, kept for future use
// export const LOGOUT_EMPLOYEE = gql`
//   mutation LogoutEmployee {
//     logoutEmployee {
//       success
//       message
//     }
//   }
// `;
