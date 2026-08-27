import { gql } from '@apollo/client';

/**
 * Check-In/Out Mutations
 * Matches backend schema exactly
 */

// Create a new check-in session
export const CREATE_CHECKINOUT_SESSION = gql`
  mutation CreateCheckinoutSession($input: CreateCheckinoutSessionInput!) {
    createCheckinoutSession(createCheckinoutSessionInput: $input) {
      checkinoutSessionId
      title
      weekStartDate
      weekEndDate
      overallStatus
      createdAt
      employee {
        employeeId
        fullName
      }
      supervisor {
        employeeId
        fullName
      }
    }
  }
`;

// Update a check-in session
export const UPDATE_CHECKINOUT_SESSION = gql`
  mutation UpdateCheckinoutSession($input: UpdateCheckinoutSessionInput!) {
    updateCheckinoutSession(updateCheckinoutSessionInput: $input) {
      checkinoutSessionId
      weekStartDate
      weekEndDate
      overallStatus
      checkinSubmittedAt
      checkoutSubmittedAt
      overallRating
      supervisorComment
      supervisorReviewAt
      isLocked
      updatedAt
    }
  }
`;

// Delete a check-in session
export const REMOVE_CHECKINOUT_SESSION = gql`
  mutation RemoveCheckinoutSession($checkinoutSessionId: ID!) {
    removeCheckinoutSession(checkinoutSessionId: $checkinoutSessionId) {
      checkinoutSessionId
    }
  }
`;

// Aliases for consistency
export const DELETE_CHECKIN = REMOVE_CHECKINOUT_SESSION;

// Create a new task
export const CREATE_CHECKINOUT_TASK = gql`
  mutation CreateCheckinoutTask($input: CreateCheckinoutTaskInput!) {
    createCheckinoutTask(createCheckinoutTaskInput: $input) {
      checkinoutTaskId
      taskTitle
      taskLinkType
      linkedKpiId
      linkedKpi {
        kpiId
        name
      }
      linkedInitiativeId
      linkedInitiative {
        initiativeId
        title
      }
      relatedToEmployeeId
      plannedDescription
      achievedDescription
      taskStatus
      evidenceUrl
      challenges
      nextSteps
      requiresApproval
      isMidWeekTask
      logbookStatus
      submissionStatus
      submittedAt
      submissionBatchId
      isCollaborativeTask
      collaborationRequestId
      taskStartDate
      taskEndDate
      createdAt
      updatedAt
      approvedAt
      autoRejectedAt
      approvedBy {
        employeeId
        fullName
      }
      relatedTo {
        employeeId
        fullName
      }
      session {
        checkinoutSessionId
        weekStartDate
        weekEndDate
      }
    }
  }
`;

// Update a task
export const UPDATE_CHECKINOUT_TASK = gql`
  mutation UpdateCheckinoutTask($input: UpdateCheckinoutTaskInput!) {
    updateCheckinoutTask(updateCheckinoutTaskInput: $input) {
      checkinoutTaskId
      taskTitle
      taskLinkType
      linkedKpiId
      linkedKpi {
        kpiId
        name
      }
      linkedInitiativeId
      linkedInitiative {
        initiativeId
        title
      }
      relatedToEmployeeId
      plannedDescription
      achievedDescription
      taskStatus
      evidenceUrl
      challenges
      nextSteps
      requiresApproval
      isMidWeekTask
      logbookStatus
      submissionStatus
      submittedAt
      submissionBatchId
      isCollaborativeTask
      collaborationRequestId
      taskStartDate
      taskEndDate
      approvedAt
      autoRejectedAt
      createdAt
      updatedAt
      approvedBy {
        employeeId
        fullName
      }
      relatedTo {
        employeeId
        fullName
      }
      session {
        checkinoutSessionId
        weekStartDate
        weekEndDate
      }
    }
  }
`;

// Delete a task
export const REMOVE_CHECKINOUT_TASK = gql`
  mutation RemoveCheckinoutTask($checkinoutTaskId: ID!) {
    removeCheckinoutTask(checkinoutTaskId: $checkinoutTaskId) {
      checkinoutTaskId
    }
  }
`;

export const SUBMIT_WEEKLY_TASKS = gql`
  mutation SubmitWeeklyTasks($sessionId: ID!, $taskIds: [ID!]!) {
    submitWeeklyTasks(sessionId: $sessionId, taskIds: $taskIds) {
      submissionBatchId
      submittedTaskCount
      submittedAt
      session {
        checkinoutSessionId
      }
      employee {
        employeeId
        fullName
      }
    }
  }
`;
