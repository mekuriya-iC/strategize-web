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
      kpiActualDenominator
      kpiResultInputMode
      kpiActualNumeratorExact
      kpiActualRateExact
      kpiActualBasisExact
      kpiCompletionPercent
      evidenceUrl
      evidenceItems {
        type
        value
        name
        mimeType
        size
      }
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
      kpiActualDenominator
      kpiResultInputMode
      kpiActualNumeratorExact
      kpiActualRateExact
      kpiActualBasisExact
      kpiCompletionPercent
      contributionUnit
      evidenceUrl
      evidenceItems {
        type
        value
        name
        mimeType
        size
      }
      evidenceDescription
      decisionsMade
      risksIssues
      lessonsLearned
      submittedAt
      approvedAt
      rejectionReason
      evidenceApprovalRequired
      evidenceApprovalStatus
      evidenceApproverId
      evidenceApprovalRevision
      evidenceReviewedAt
      evidenceRejectionReason
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

export const CONFIGURE_EVIDENCE_APPROVER = gql`
  mutation ConfigureEvidenceApprover($employeeId: ID!, $isActive: Boolean!) {
    configureEvidenceApprover(employeeId: $employeeId, isActive: $isActive) {
      evidenceApproverAuthorizationId
      isActive
      revokedAt
      employee {
        employeeId
        fullName
        email
        title
        role
      }
      configuredBy {
        employeeId
        fullName
      }
    }
  }
`;

export const REVIEW_LOGBOOK_EVIDENCE = gql`
  mutation ReviewLogbookEvidence($input: ReviewLogbookEvidenceInput!) {
    reviewLogbookEvidence(input: $input) {
      logbookEvidenceApprovalId
      status
      rejectionReason
      reviewedAt
      logbookEntry {
        logbookEntryId
        entryStatus
        evidenceApprovalStatus
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
