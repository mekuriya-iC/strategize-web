import { gql } from "@apollo/client";

export const GET_MY_CHECKINS = gql`
  query GetMyCheckins {
    myCheckins {
      id
      taskType
      task
      description
      relatedTo
      startTime
      endTime
      checkoutStatus
      attachment
      remark
      isKpiMet
      isInitiativeMet
      isSelfDevComplete
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHECKIN_BY_ID = gql`
  query GetCheckinById($id: ID!) {
    checkin(id: $id) {
      id
      taskType
      task
      description
      relatedTo
      startTime
      endTime
      checkoutStatus
      attachment
      remark
      isKpiMet
      isInitiativeMet
      isSelfDevComplete
      createdAt
      updatedAt
      employee {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const GET_ALL_CHECKINS = gql`
  query GetAllCheckins($filters: CheckinFilters) {
    checkins(filters: $filters) {
      id
      taskType
      task
      description
      relatedTo
      startTime
      endTime
      checkoutStatus
      attachment
      remark
      isKpiMet
      isInitiativeMet
      isSelfDevComplete
      createdAt
      updatedAt
      employee {
        id
        firstName
        lastName
        email
      }
    }
  }
`;
