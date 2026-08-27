import { gql } from '@apollo/client';

/**
 * Check-In/Out Queries
 * Matches backend schema exactly
 */

// Get paginated check-in sessions
export const GET_CHECKINOUT_SESSIONS = gql`
  query GetCheckinoutSessions(
    $employeeUserId: ID
    $limit: Int!
    $overallStatus: CheckinoutStatus
    $page: Int!
    $strategicPeriodId: ID
    $supervisorUserId: ID
  ) {
    checkinoutSessions(
      employeeUserId: $employeeUserId
      limit: $limit
      overallStatus: $overallStatus
      page: $page
      strategicPeriodId: $strategicPeriodId
      supervisorUserId: $supervisorUserId
    ) {
      items {
        checkinoutSessionId
        title
        weekStartDate
        weekEndDate
        overallStatus
        checkinSubmittedAt
        checkoutSubmittedAt
        overallRating
        supervisorComment
        supervisorReviewAt
        isLocked
        createdAt
        updatedAt
        employee {
          employeeId
          fullName
          email
          title
          role
        }
        supervisor {
          employeeId
          fullName
          email
          role
        }
        strategicPeriod {
          strategicPeriodId
          name
          startDate
          endDate
        }
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
        itemCount
      }
    }
  }
`;

export const GET_SUPER_ADMIN_CHECKINOUT_SESSION_CANDIDATES = gql`
  query SuperAdminCheckinoutSessionCandidates {
    superAdminCheckinoutSessionCandidates {
      employeeId
      managerId
      fullName
      email
      title
      role
      status
      picture
      departments {
        departmentId
        name
        division {
          divisionId
          name
        }
      }
    }
  }
`;

// Get single check-in session
export const GET_CHECKINOUT_SESSION = gql`
  query GetCheckinoutSession($checkinoutSessionId: ID!) {
    checkinoutSession(checkinoutSessionId: $checkinoutSessionId) {
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
      createdAt
      updatedAt
      employee {
        employeeId
        fullName
        email
        title
      }
      supervisor {
        employeeId
        fullName
        email
      }
      strategicPeriod {
        strategicPeriodId
        name
      }
    }
  }
`;

// Get tasks for a session
export const GET_CHECKINOUT_TASKS = gql`
  query GetCheckinoutTasks(
    $sessionId: ID
    $limit: Int!
    $page: Int!
    $taskStatus: TaskStatus
  ) {
    checkinoutTasks(
      sessionId: $sessionId
      limit: $limit
      page: $page
      taskStatus: $taskStatus
    ) {
      items {
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
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
        itemCount
      }
    }
  }
`;

// Get single task
export const GET_CHECKINOUT_TASK = gql`
  query GetCheckinoutTask($checkinoutTaskId: ID!) {
    checkinoutTask(checkinoutTaskId: $checkinoutTaskId) {
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
    }
  }
`;

export const GET_TASK_POOL_SUMMARY = gql`
  query TaskPoolSummary($sessionId: ID!) {
    taskPoolSummary(sessionId: $sessionId) {
      sessionId
      draftCount
      submittedCount
      personalTodoCount
      activeCount
      remainingCapacity
      minimumSubmissionCount
      maximumSubmissionCount
      maximumActiveTaskCount
    }
  }
`;
