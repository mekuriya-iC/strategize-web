import { gql } from "@apollo/client";

/**
 * Objective Queries
 * Matches backend schema exactly
 */

// Get paginated objectives
export const GET_OBJECTIVES = gql`
  query GetObjectives(
    $page: Int!
    $limit: Int!
    $assigneeId: ID
    $organizationId: ID
    $search: String
  ) {
    objectives(
      page: $page
      limit: $limit
      assigneeId: $assigneeId
      organizationId: $organizationId
      search: $search
    ) {
      items {
        objectiveId
        title
        description
        type
        level
        status
        cascadeStatus
        assigneeType
        assigneeId
        assignerId
        weight
        order
        dueDate
        approvedAt
        createdAt
        updatedAt
        isDeleted
        strategicPeriod {
          strategicPeriodId
          name
          startDate
          endDate
        }
        createdBy {
          employeeId
          fullName
          email
        }
        approvedBy {
          employeeId
          fullName
        }
        ownerUser {
          employeeId
          fullName
          email
          title
        }
        parent {
          objectiveId
          title
        }
        kpis {
          kpiId
          name
          baseline
          weight
          unitType
          status
          targetValue
          calculationBasisSource
          actualBasisSource
          directBasisValue
          directBasisTargets {
            timeline
            value
          }
          numeratorLabel
          denominatorLabel
          basisUnitType
          aggregationMethod
          weightingBasisKpiId
          aggregationWeightSource
          carryPolicy
          kpiMode
          managerRetentionPercent
          measurementUnit
          parent {
            kpiId
          }
          targets {
            target
            timeline
          }
          quarterPlans {
            kpiQuarterPlanId
            quarterNumber
            timeline
            originalTarget
            carryIn
            effectiveTarget
          directBasisTarget
            status
            version
          }
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

// Alias for old code
export const GETOBJECTIVES = GET_OBJECTIVES;

// Get single objective by ID
export const GET_OBJECTIVE = gql`
  query GetObjective($objectiveId: ID!) {
    objective(objectiveId: $objectiveId) {
      objectiveId
      title
      description
      type
      level
      status
      cascadeStatus
      cascadeType
      assigneeType
      assigneeId
      assignerId
      weight
      order
      dueDate
      approvedAt
      createdAt
      updatedAt
      isDeleted
      strategicPeriod {
        strategicPeriodId
        name
        startDate
        endDate
      }
      createdBy {
        employeeId
        fullName
        email
      }
      approvedBy {
        employeeId
        fullName
      }
      ownerUser {
        employeeId
        fullName
        email
        title
      }
      parent {
        objectiveId
        title
        level
        type
        assigneeType
      }
      supportSources {
        objectiveSupportSourceId
        instruction
        expectedImpact
        sourceCorporateKpi {
          kpiId
          name
          description
          targetValue
          weight
          measurementUnit
          unitType
          targets {
            timeline
            target
          }
        }
      }
      kpis {
        kpiId
        name
        description
        unitType
        baseline
        weight
        status
        order
        frequency
        measurementUnit
        targetValue
        calculationBasisSource
        actualBasisSource
        directBasisValue
        directBasisTargets {
          timeline
          value
        }
        numeratorLabel
        denominatorLabel
        basisUnitType
        aggregationMethod
        weightingBasisKpiId
        aggregationWeightSource
        carryPolicy
        kpiMode
        managerRetentionPercent
        createdAt
        updatedAt
        parent {
          kpiId
          name
        }
        targets {
          target
          timeline
        }
        quarterPlans {
          kpiQuarterPlanId
          quarterNumber
          timeline
          originalTarget
          carryIn
          effectiveTarget
          directBasisTarget
          status
          version
        }
        quarterResults {
          kpiQuarterResultId
          quarterPlanId
          calculationMode
          finalActual
          finalAchievementRate
          rollupNumeratorExact
          rollupDenominatorExact
          carryOut
          managerCarryOut
          teamCarryOut
          status
          calculatedAt
          finalizedAt
        }
      }
    }
  }
`;

// Alias
export const GET_OBJECTIVES_BY_ID = GET_OBJECTIVE;

// Get objectives for approval
export const GET_OBJECTIVES_FOR_APPROVAL = gql`
  query GetObjectivesForApproval(
    $page: Int
    $limit: Int
    $strategicPeriodId: ID
    $status: ObjectiveStatus
  ) {
    objectivesForApproval(
      page: $page
      limit: $limit
      strategicPeriodId: $strategicPeriodId
      status: $status
    ) {
      items {
        objectiveId
        title
        description
        type
        level
        status
        cascadeStatus
        assigneeType
        assigneeId
        weight
        dueDate
        createdAt
        strategicPeriod {
          strategicPeriodId
          name
        }
        createdBy {
          employeeId
          fullName
          email
          title
        }
        ownerUser {
          employeeId
          fullName
          email
        }
        kpis {
          kpiId
          name
          targetValue
          measurementUnit
          quarterPlans {
            kpiQuarterPlanId
            quarterNumber
            timeline
            originalTarget
            carryIn
            effectiveTarget
          directBasisTarget
            status
            version
          }
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

// Get my objectives (assigned to current user)
export const GET_MY_OBJECTIVES = gql`
  query GetMyObjectives(
    $page: Int
    $limit: Int
    $strategicPeriodId: ID
    $status: ObjectiveStatus
  ) {
    myObjectives(
      page: $page
      limit: $limit
      strategicPeriodId: $strategicPeriodId
      status: $status
    ) {
      items {
        objectiveId
        title
        description
        type
        level
        status
        cascadeStatus
        weight
        order
        dueDate
        createdAt
        updatedAt
        strategicPeriod {
          strategicPeriodId
          name
        }
        parent {
          objectiveId
          title
        }
        kpis {
          kpiId
          name
          targetValue
          measurementUnit
          status
          weight
          quarterPlans {
            kpiQuarterPlanId
            quarterNumber
            timeline
            originalTarget
            carryIn
            effectiveTarget
          directBasisTarget
            status
            version
          }
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

// Get objectives hierarchy (for cascading view)
export const GET_OBJECTIVES_HIERARCHY = gql`
  query GetObjectivesHierarchy(
    $strategicPeriodId: ID!
    $level: ObjectiveLevel
  ) {
    objectivesHierarchy(strategicPeriodId: $strategicPeriodId, level: $level) {
      objectiveId
      title
      description
      level
      status
      cascadeStatus
      assigneeType
      assigneeId
      weight
      order
      createdAt
      ownerUser {
        employeeId
        fullName
      }
      kpis {
        kpiId
        name
        targetValue
        measurementUnit
      }
      children {
        objectiveId
        title
        level
        status
        assigneeType
        weight
        ownerUser {
          employeeId
          fullName
        }
      }
    }
  }
`;
