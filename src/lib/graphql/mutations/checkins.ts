import { gql } from '@apollo/client';

const TASK_PLANNING_MUTATION_FIELDS = gql`
  fragment TaskPlanningMutationFields on CheckinoutTask {
    checkinoutTaskId
    taskTitle
    taskLinkType
    linkedKpiId
    linkedKpi { kpiId name }
    linkedInitiativeId
    linkedInitiative { initiativeId title }
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
    planningRevision
    submissionBatchId
    isCollaborativeTask
    collaborationRequestId
    taskStartDate
    taskEndDate
    approvedAt
    autoRejectedAt
    carryoverRootTaskId
    carryoverPredecessorTaskId
    carryoverGeneration
    isCarryoverOverdue
    carryoverEscalatedAt
    createdAt
    updatedAt
    approvedBy { employeeId fullName }
    relatedTo { employeeId fullName }
    session { checkinoutSessionId weekStartDate weekEndDate }
    planningReviewHistory {
      planningReviewId
      revision
      decision
      rejectionReason
      isInitialWeeklySelection
      submittedAt
      reviewedAt
      submittedBy { employeeId fullName }
      reviewedBy { employeeId fullName }
    }
  }
`; 

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
      planningRevision
      submissionBatchId
      isCollaborativeTask
      collaborationRequestId
      taskStartDate
      taskEndDate
      carryoverRootTaskId
      carryoverPredecessorTaskId
      carryoverGeneration
      isCarryoverOverdue
      carryoverEscalatedAt
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
      ...TaskPlanningMutationFields
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
  ${TASK_PLANNING_MUTATION_FIELDS}
`;

// Delete a task
export const REMOVE_CHECKINOUT_TASK = gql`
  mutation RemoveCheckinoutTask($checkinoutTaskId: ID!) {
    removeCheckinoutTask(checkinoutTaskId: $checkinoutTaskId) {
      checkinoutTaskId
    }
  }
`;

export const SUBMIT_TASK_FOR_PLANNING_APPROVAL = gql`
  mutation SubmitTaskForPlanningApproval($taskId: ID!) {
    submitTaskForPlanningApproval(taskId: $taskId) {
      ...TaskPlanningMutationFields
    }
  }
  ${TASK_PLANNING_MUTATION_FIELDS}
`;

export const APPROVE_TASK_PLANNING = gql`
  mutation ApproveTaskPlanning($taskId: ID!) {
    approveTaskPlanning(taskId: $taskId) {
      ...TaskPlanningMutationFields
    }
  }
  ${TASK_PLANNING_MUTATION_FIELDS}
`;

export const REJECT_TASK_PLANNING = gql`
  mutation RejectTaskPlanning($taskId: ID!, $reason: String!) {
    rejectTaskPlanning(taskId: $taskId, reason: $reason) {
      ...TaskPlanningMutationFields
    }
  }
  ${TASK_PLANNING_MUTATION_FIELDS}
`;

export const REVIEW_TASK_PLANNING_BATCH = gql`
  mutation ReviewTaskPlanningBatch($reviews: [ReviewTaskPlanningInput!]!) {
    reviewTaskPlanningBatch(reviews: $reviews) {
      approvedCount
      rejectedCount
      tasks { ...TaskPlanningMutationFields }
    }
  }
  ${TASK_PLANNING_MUTATION_FIELDS}
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
