import { gql } from "@apollo/client";

export const SUBMIT_FOR_APPROVAL = gql`
  mutation SubmitForApproval($id: ID!) {
    submitForApproval(id: $id) {
      id
      approvalStatus
    }
  }
`;

export const DELETE_LOGBOOK_ITEM = gql`
  mutation DeleteLogbookItem($id: ID!) {
    deleteLogbookItem(id: $id) {
      success
      message
    }
  }
`;
