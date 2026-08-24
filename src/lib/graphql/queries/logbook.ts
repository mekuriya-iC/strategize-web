import { gql } from "@apollo/client";

/**
 * Logbook Queries
 * Matches backend schema exactly
 */

const LOGBOOK_FORMULA_CONTEXT_FIELDS = gql`
  fragment LogbookFormulaContextFields on KpiFormulaDefinition {
    id
    organizationId
    kpiId
    calculationType
    expressionTerms {
      id
      position
      side
      operator
      sourceType
      metricDefinitionId
      metricDefinition {
        id
        organizationId
        code
        name
        description
        unitType
        measurementUnit
        temporalRollupMethod
        isActive
        createdAt
        updatedAt
      }
      sourceKpiId
      sourceKpi {
        kpiId
        name
        description
        unitType
        measurementUnit
        isActive
      }
      constantValueExact
      factorExact
    }
    components {
      id
      organizationId
      formulaDefinitionId
      position
      sourceType
      metricDefinitionId
      metricDefinition {
        id
        organizationId
        code
        name
        description
        unitType
        measurementUnit
        temporalRollupMethod
        isActive
        createdAt
        updatedAt
      }
      sourceKpiId
      sourceKpi {
        kpiId
        name
        description
        unitType
        measurementUnit
        isActive
      }
      weight
      createdAt
    }
    numeratorSourceType
    numeratorMetricDefinitionId
    numeratorMetricDefinition {
      id
      organizationId
      code
      name
      description
      unitType
      measurementUnit
      temporalRollupMethod
      isActive
      createdAt
      updatedAt
    }
    numeratorKpiId
    numeratorKpi {
      kpiId
      name
      description
      unitType
      measurementUnit
      isActive
    }
    denominatorSourceType
    denominatorMetricDefinitionId
    denominatorMetricDefinition {
      id
      organizationId
      code
      name
      description
      unitType
      measurementUnit
      temporalRollupMethod
      isActive
      createdAt
      updatedAt
    }
    denominatorKpiId
    denominatorKpi {
      kpiId
      name
      description
      unitType
      measurementUnit
      isActive
    }
    multiplier
    temporalRollupMethod
    zeroDenominatorPolicy
    resultDirection
    status
    version
    effectiveFrom
    effectiveTo
    createdById
    approvedById
    approvedAt
    createdAt
    updatedAt
  }
`;

export const GET_LOGBOOK_FORMULA_FOR_CONTEXT = gql`
  ${LOGBOOK_FORMULA_CONTEXT_FIELDS}
  query GetLogbookFormulaForContext(
    $organizationId: ID!
    $kpiId: ID!
    $entryDate: String!
  ) {
    logbookFormulaForContext(
      organizationId: $organizationId
      kpiId: $kpiId
      entryDate: $entryDate
    ) {
      ...LogbookFormulaContextFields
    }
  }
`;

export const GET_KPI_RESULT_ENTRY_CONTEXT = gql`
  query GetKpiResultEntryContext($kpiId: ID!, $entryDate: String!) {
    kpiResultEntryContext(kpiId: $kpiId, entryDate: $entryDate) {
      quarterPlanId
      quarterNumber
      actualBasisSource
      numeratorLabel
      denominatorLabel
      basisUnitType
      approvedBasisExact
      linkedBasisKpiId
      linkedBasisKpiName
      linkedActualBasisExact
      resolvedBasisExact
      basisAvailable
      message
    }
  }
`;

// Get paginated logbook entries
export const GET_LOGBOOK_ENTRIES = gql`
  query GetLogbookEntries(
    $entryStatus: LogbookEntryStatus
    $limit: Int!
    $ownerUserId: ID
    $page: Int!
    $strategicPeriodId: ID
    $approverUserId: ID
  ) {
    logbookEntries(
      entryStatus: $entryStatus
      limit: $limit
      ownerUserId: $ownerUserId
      page: $page
      strategicPeriodId: $strategicPeriodId
      approverUserId: $approverUserId
    ) {
      items {
        logbookEntryId
        entryDate
        activityDescription
        entryStatus
        linkedKpiId
        linkedKpi {
          kpiId
          name
          targetValue
          unitType
          measurementUnit
          calculationType
          zeroDenominatorPolicy
          calculationBasisSource
          actualBasisSource
          directBasisValue
          numeratorLabel
          denominatorLabel
          basisUnitType
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
        createdAt
        updatedAt
        owner {
          employeeId
          fullName
          email
          title
          role
          departments {
            departmentId
            name
            head {
              employeeId
            }
            division {
              divisionId
              name
              head {
                employeeId
              }
            }
          }
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
      linkedKpiId
      linkedKpi {
        kpiId
        name
        targetValue
        unitType
        measurementUnit
        calculationType
        calculationBasisSource
        actualBasisSource
        directBasisValue
        numeratorLabel
        denominatorLabel
        basisUnitType
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
        role
        departments {
          departmentId
          name
          head {
            employeeId
          }
          division {
            divisionId
            name
            head {
              employeeId
            }
          }
        }
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
