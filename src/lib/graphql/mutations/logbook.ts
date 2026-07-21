import { gql } from "@apollo/client";

/**
 * Logbook Mutations
 * Matches backend schema exactly
 */

// Create a new logbook entry
export const CREATE_LOGBOOK_ENTRY = gql`
  mutation CreateLogbookEntry($input: CreateLogbookEntryInput!) {
    createLogbookEntry(createLogbookEntryInput: $input) {
      logbookEntryId
      entryDate
      activityDescription
      entryStatus
      linkedKpiId
      linkedKpi {
        kpiId
        name
        calculationType
      }
      quarterPlan {
        kpiQuarterPlanId
        quarterNumber
        timeline
        status
      }
      metricObservations {
        id
        metricDefinitionId
        value
        observedAt
        metricDefinition {
          id
          code
          name
          unitType
          measurementUnit
          temporalRollupMethod
        }
      }
      kpiTargetValue
      kpiAchievedValue
      kpiCompletionPercent
      evidenceUrl
      evidenceDescription
      decisionsMade
      risksIssues
      lessonsLearned
      submittedAt
      createdAt
      owner {
        employeeId
        fullName
      }
    }
  }
`;

// Update a logbook entry
export const UPDATE_LOGBOOK_ENTRY = gql`
  mutation UpdateLogbookEntry($input: UpdateLogbookEntryInput!) {
    updateLogbookEntry(updateLogbookEntryInput: $input) {
      logbookEntryId
      entryDate
      activityDescription
      entryStatus
      linkedKpiId
      linkedKpi {
        kpiId
        name
        calculationType
      }
      quarterPlan {
        kpiQuarterPlanId
        quarterNumber
        timeline
        status
      }
      metricObservations {
        id
        metricDefinitionId
        value
        observedAt
        metricDefinition {
          id
          code
          name
          unitType
          measurementUnit
          temporalRollupMethod
        }
      }
      kpiTargetValue
      kpiAchievedValue
      kpiCompletionPercent
      contributionUnit
      evidenceUrl
      evidenceDescription
      decisionsMade
      risksIssues
      lessonsLearned
      submittedAt
      approvedAt
      rejectionReason
      updatedAt
      owner {
        employeeId
        fullName
      }
      approvedBy {
        employeeId
        fullName
      }
    }
  }
`;

// Delete a logbook entry
export const REMOVE_LOGBOOK_ENTRY = gql`
  mutation RemoveLogbookEntry($logbookEntryId: ID!) {
    removeLogbookEntry(logbookEntryId: $logbookEntryId) {
      logbookEntryId
    }
  }
`;
