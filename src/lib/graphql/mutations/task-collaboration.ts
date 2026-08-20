import { gql } from "@apollo/client";
import { TASK_COLLABORATION_REQUEST_FIELDS } from "../queries/task-collaboration";

export interface RespondTaskCollaborationRequestInput {
  requestId: string;
  responseMessage?: string;
}

export interface RespondTaskCollaborationRequestVariables {
  input: RespondTaskCollaborationRequestInput;
}

export interface CancelTaskCollaborationRequestVariables {
  requestId: string;
}

export const ACCEPT_TASK_COLLABORATION_REQUEST = gql`
  mutation AcceptTaskCollaborationRequest(
    $input: RespondTaskCollaborationInput!
  ) {
    acceptTaskCollaborationRequest(input: $input) {
      ...TaskCollaborationRequestFields
    }
  }
  ${TASK_COLLABORATION_REQUEST_FIELDS}
`;

export const REJECT_TASK_COLLABORATION_REQUEST = gql`
  mutation RejectTaskCollaborationRequest(
    $input: RespondTaskCollaborationInput!
  ) {
    rejectTaskCollaborationRequest(input: $input) {
      ...TaskCollaborationRequestFields
    }
  }
  ${TASK_COLLABORATION_REQUEST_FIELDS}
`;

export const CANCEL_TASK_COLLABORATION_REQUEST = gql`
  mutation CancelTaskCollaborationRequest($requestId: ID!) {
    cancelTaskCollaborationRequest(requestId: $requestId) {
      ...TaskCollaborationRequestFields
    }
  }
  ${TASK_COLLABORATION_REQUEST_FIELDS}
`;
