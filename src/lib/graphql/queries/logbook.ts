import { gql } from "@apollo/client";

export const GET_MY_LOGBOOK = gql`
  query GetMyLogbook {
    myLogbook {
      id
      kpiName
      target
      percentageCompletion
      weight
      approvalStatus
      createdAt
      updatedAt
    }
  }
`;

export const GET_LOGBOOK_ITEM = gql`
  query GetLogbookItem($id: ID!) {
    logbookItem(id: $id) {
      id
      kpiName
      target
      percentageCompletion
      weight
      approvalStatus
      createdAt
      updatedAt
    }
  }
`;
