import { gql } from "@apollo/client";

export type TaskCollaborationRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export type TaskSubmissionStatus = "DRAFT" | "SUBMITTED" | "PERSONAL_TODO";

export interface TaskCollaborationEmployee {
  employeeId: string;
  fullName: string;
}

export interface TaskCollaborationOriginatorTask {
  checkinoutTaskId: string;
  taskTitle: string;
  plannedDescription?: string | null;
  taskStartDate: string;
  taskEndDate: string;
  submissionStatus: TaskSubmissionStatus;
}

export interface TaskCollaborationLinkedTask {
  checkinoutTaskId: string;
  taskTitle: string;
  submissionStatus: TaskSubmissionStatus;
  collaborationRequestId?: string | null;
}

export interface TaskCollaborationRequest {
  requestId: string;
  status: TaskCollaborationRequestStatus;
  requestMessage?: string | null;
  responseMessage?: string | null;
  requestedAt: string;
  respondedAt?: string | null;
  cancelledAt?: string | null;
  expiresAt?: string | null;
  originatorEmployee: TaskCollaborationEmployee;
  collaboratorEmployee: TaskCollaborationEmployee;
  originatorTask: TaskCollaborationOriginatorTask;
  collaboratorTask?: TaskCollaborationLinkedTask | null;
}

export interface PendingTaskCollaborationRequestsData {
  pendingTaskCollaborationRequests: TaskCollaborationRequest[];
}

export interface SentTaskCollaborationRequestsData {
  sentTaskCollaborationRequests: TaskCollaborationRequest[];
}

export const TASK_COLLABORATION_REQUEST_FIELDS = gql`
  fragment TaskCollaborationRequestFields on TaskCollaborationRequest {
    requestId
    status
    requestMessage
    responseMessage
    requestedAt
    respondedAt
    cancelledAt
    expiresAt
    originatorEmployee {
      employeeId
      fullName
    }
    collaboratorEmployee {
      employeeId
      fullName
    }
    originatorTask {
      checkinoutTaskId
      taskTitle
      plannedDescription
      taskStartDate
      taskEndDate
      submissionStatus
    }
    collaboratorTask {
      checkinoutTaskId
      taskTitle
      submissionStatus
      collaborationRequestId
    }
  }
`;

export const GET_PENDING_TASK_COLLABORATION_REQUESTS = gql`
  query PendingTaskCollaborationRequests {
    pendingTaskCollaborationRequests {
      ...TaskCollaborationRequestFields
    }
  }
  ${TASK_COLLABORATION_REQUEST_FIELDS}
`;

export const GET_SENT_TASK_COLLABORATION_REQUESTS = gql`
  query SentTaskCollaborationRequests {
    sentTaskCollaborationRequests {
      ...TaskCollaborationRequestFields
    }
  }
  ${TASK_COLLABORATION_REQUEST_FIELDS}
`;
