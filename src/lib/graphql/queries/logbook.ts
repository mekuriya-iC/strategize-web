import { gql } from '@apollo/client';

/**
 * Logbook Queries
 * Matches backend schema exactly
 */

// Get paginated logbook entries
export const GET_LOGBOOK_ENTRIES = gql`
  query GetLogbookEntries(
    $entryStatus: LogbookEntryStatus
    $limit: Int!
    $ownerUserId: ID
    $page: Int!
    $strategicPeriodId: ID
  ) {
    logbookEntries(
      entryStatus: $entryStatus
      limit: $limit
      ownerUserId: $ownerUserId
      page: $page
      strategicPeriodId: $strategicPeriodId
    ) {
      items {
        logbookEntryId
        entryDate
        activityDescription
        entryStatus
        kpiTargetValue
        kpiAchievedValue
        kpiCompletionPercent
        evidenceUrl
        evidenceDescription
        decisionsMade
        risksIssues
        lessonsLearned
        submittedAt
        approvedAt
        rejectionReason
        createdAt
        updatedAt
        owner {
          employeeId
          fullName
          email
          title
        }
        approvedBy {
          employeeId
          fullName
        }
        strategicPeriod {
          strategicPeriodId
          name
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

// Get single logbook entry
export const GET_LOGBOOK_ENTRY = gql`
  query GetLogbookEntry($logbookEntryId: ID!) {
    logbookEntry(logbookEntryId: $logbookEntryId) {
      logbookEntryId
      entryDate
      activityDescription
      entryStatus
      kpiTargetValue
      kpiAchievedValue
      kpiCompletionPercent
      evidenceUrl
      evidenceDescription
      decisionsMade
      risksIssues
      lessonsLearned
      submittedAt
      approvedAt
      rejectionReason
      createdAt
      updatedAt
      owner {
        employeeId
        fullName
        email
        title
      }
      approvedBy {
        employeeId
        fullName
      }
      strategicPeriod {
        strategicPeriodId
        name
      }
    }
  }
`;
