import { gql } from "@apollo/client";

export const CREATE_CHECKIN = gql`
  mutation CreateCheckin($input: CreateCheckinInput!) {
    createCheckin(input: $input) {
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
    }
  }
`;

export const UPDATE_CHECKIN = gql`
  mutation UpdateCheckin($id: ID!, $input: UpdateCheckinInput!) {
    updateCheckin(id: $id, input: $input) {
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
      updatedAt
    }
  }
`;

export const DELETE_CHECKIN = gql`
  mutation DeleteCheckin($id: ID!) {
    deleteCheckin(id: $id) {
      success
      message
    }
  }
`;
