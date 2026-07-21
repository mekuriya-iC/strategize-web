import { gql } from "@apollo/client";

/**
 * KPI Queries
 * Matches backend schema exactly
 */

// Get paginated KPIs
export const GET_KPIS = gql`
  query GetKpis(
    $page: Int
    $limit: Int
    $search: String
    $organizationId: ID
    $strategicObjectiveId: ID
  ) {
    kpis(
      page: $page
      limit: $limit
      search: $search
      organizationId: $organizationId
      strategicObjectiveId: $strategicObjectiveId
    ) {
      items {
        kpiId
        name
        description
        kpiType
        measurementUnit
        unitType
        customUnitLabel
        targetValue
        assignedTargetValue
        baselineValue
        baseline
        weight
        frequency
        status
        targetStatus
        isActive
        order
        assigneeType
        assigneeId
        assignerId
        kpiMode
        managerRetentionPercent
        aggregationMethod
        weightingBasisKpiId
        aggregationWeightSource
        carryPolicy
      calculationType
      calculationBasisSource
        directBasisValue
        directBasisTargets {
          timeline
          value
        }
        numeratorLabel
        denominatorLabel
        basisUnitType
        weightingBasisKpi {
          kpiId
          name
          unitType
          targetValue
        }
        createdAt
        updatedAt
        isDeleted
        objective {
          objectiveId
          title
          level
          status
          type
          assigneeType
          assigneeId
          strategicPeriod {
            strategicPeriodId
            name
            startDate
            endDate
          }
        }
        createdBy {
          employeeId
          fullName
          email
        }
        parent {
          kpiId
          name
        }
        targets {
          timeline
          target
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
        latestUpdate {
          kpiUpdateId
          achievedValue
          progressPercentage
          progressStatus
          reportingDate
          notes
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
export const GETKPIS = GET_KPIS;

// Get single KPI by ID
export const GET_KPI = gql`
  query GetKpi($kpiId: ID!) {
    kpi(kpiId: $kpiId) {
      kpiId
      name
      description
      kpiType
      measurementUnit
      unitType
      customUnitLabel
      targetValue
      assignedTargetValue
      baselineValue
      baseline
      weight
      frequency
      status
      targetStatus
      isActive
      order
      assigneeType
      assigneeId
      assignerId
      kpiMode
      managerRetentionPercent
      aggregationMethod
      weightingBasisKpiId
      aggregationWeightSource
      carryPolicy
      calculationType
      calculationBasisSource
        directBasisValue
        directBasisTargets {
          timeline
          value
        }
        numeratorLabel
        denominatorLabel
        basisUnitType
      weightingBasisKpi {
        kpiId
        name
        unitType
        targetValue
      }
      createdAt
      updatedAt
      isDeleted
      objective {
        objectiveId
        title
        description
        type
        level
        status
        assigneeType
        assigneeId
        parent {
          objectiveId
        }
        strategicPeriod {
          strategicPeriodId
          name
          startDate
          endDate
        }
      }
      createdBy {
        employeeId
        fullName
        email
        title
      }
      parent {
        kpiId
        name
        targetValue
        assignedTargetValue
        measurementUnit
        unitType
        baseline
        weight
        targets {
          timeline
          target
        }
      }
      targets {
        timeline
        target
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
        status
        calculatedAt
        finalizedAt
      }
    }
  }
`;

// Get KPIs for an objective
export const GET_KPIS_BY_OBJECTIVE = gql`
  query GetKpisByObjective($objectiveId: ID!, $page: Int, $limit: Int) {
    kpisByObjective(objectiveId: $objectiveId, page: $page, limit: $limit) {
      items {
        kpiId
        name
        description
        kpiType
        measurementUnit
        unitType
        customUnitLabel
        targetValue
        baselineValue
        weight
        frequency
        status
        order
        isActive
        calculationBasisSource
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
        createdAt
        createdBy {
          employeeId
          fullName
        }
        targets {
          timeline
          target
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

// Get my KPIs (assigned to current user)
export const GET_MY_KPIS = gql`
  query GetMyKpis(
    $page: Int
    $limit: Int
    $strategicPeriodId: ID
    $status: KpiStatus
  ) {
    myKpis(
      page: $page
      limit: $limit
      strategicPeriodId: $strategicPeriodId
      status: $status
    ) {
      items {
        kpiId
        name
        description
        kpiType
        measurementUnit
        unitType
        customUnitLabel
        targetValue
        baselineValue
        weight
        frequency
        assigneeType
        assigneeId
        kpiMode
        managerRetentionPercent
        aggregationMethod
        weightingBasisKpiId
        aggregationWeightSource
        carryPolicy
      calculationType
      calculationBasisSource
        directBasisValue
        directBasisTargets {
          timeline
          value
        }
        numeratorLabel
        denominatorLabel
        basisUnitType
        status
        targetStatus
        isActive
        createdAt
        objective {
          objectiveId
          title
          level
          status
          type
        }
        targets {
          timeline
          target
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
        latestUpdate {
          kpiUpdateId
          achievedValue
          progressPercentage
          progressStatus
          reportingDate
          notes
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

// Get KPI updates/progress
export const GET_KPI_UPDATES = gql`
  query GetKpiUpdates(
    $kpiId: ID!
    $page: Int
    $limit: Int
    $strategicPeriodId: ID
  ) {
    kpiUpdates(
      kpiId: $kpiId
      page: $page
      limit: $limit
      strategicPeriodId: $strategicPeriodId
    ) {
      items {
        kpiUpdateId
        achievedValue
        progressPercentage
        progressStatus
        reportingDate
        notes
        evidenceUrl
        approvedAt
        createdAt
        updatedAt
        kpi {
          kpiId
          name
          targetValue
          measurementUnit
        }
        reportedBy {
          employeeId
          fullName
          email
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

// Get KPI assignments for an employee
// Backend: kpiAssignmentsEmployee(userId: ID, kpiId: ID, strategicPeriodId: ID, page, limit)
export const GET_KPI_ASSIGNMENTS_EMPLOYEE = gql`
  query GetKpiAssignmentsEmployee(
    $employeeId: ID!
    $strategicPeriodId: ID
    $page: Int
    $limit: Int
  ) {
    kpiAssignmentsEmployee(
      userId: $employeeId
      strategicPeriodId: $strategicPeriodId
      page: $page
      limit: $limit
    ) {
      items {
        kpiAssignmentEmployeeId
        targetValue
        weight
        parentWeightAllocation
        cap
        createdAt
        updatedAt
        kpi {
          kpiId
          name
          description
          measurementUnit
          kpiType
        }
        employee {
          employeeId
          fullName
          email
          title
        }
        assignedBy {
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

export const GET_KPI_ASSIGNMENTS_DEPARTMENT = gql`
  query GetKpiAssignmentsDepartment(
    $departmentId: ID!
    $strategicPeriodId: ID
    $page: Int
    $limit: Int
  ) {
    kpiAssignmentsDepartment(
      departmentId: $departmentId
      strategicPeriodId: $strategicPeriodId
      page: $page
      limit: $limit
    ) {
      items {
        kpiAssignmentDepartmentId
        targetValue
        weight
        parentWeightAllocation
        cap
        createdAt
        updatedAt
        kpi {
          kpiId
          name
          description
          measurementUnit
          kpiType
        }
        department {
          departmentId
          name
        }
        assignedBy {
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

export const GET_KPI_ASSIGNMENTS_DIVISION = gql`
  query GetKpiAssignmentsDivision(
    $divisionId: ID!
    $strategicPeriodId: ID
    $page: Int
    $limit: Int
  ) {
    kpiAssignmentsDivision(
      divisionId: $divisionId
      strategicPeriodId: $strategicPeriodId
      page: $page
      limit: $limit
    ) {
      items {
        kpiAssignmentDivisionId
        targetValue
        weight
        parentWeightAllocation
        cap
        createdAt
        updatedAt
        kpi {
          kpiId
          name
          description
          measurementUnit
          kpiType
        }
        division {
          divisionId
          name
        }
        assignedBy {
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

export const GET_KPI_ASSIGNMENTS_CORPORATE = gql`
  query GetKpiAssignmentsCorporate(
    $organizationId: ID!
    $strategicPeriodId: ID
    $kpiId: ID
    $page: Int
    $limit: Int
  ) {
    kpiAssignmentsCorporate(
      organizationId: $organizationId
      strategicPeriodId: $strategicPeriodId
      kpiId: $kpiId
      page: $page
      limit: $limit
    ) {
      items {
        kpiAssignmentCorporateId
        targetValue
        weight
        cap
        createdAt
        updatedAt
        kpi {
          kpiId
          name
          description
          measurementUnit
          kpiType
        }
        organization {
          organizationId
          name
        }
        assignedBy {
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

// Get shared KPI participants
export const GET_SHARED_KPI_PARTICIPANTS = gql`
  query GetSharedKpiParticipants(
    $kpiId: ID!
    $page: Int!
    $limit: Int!
    $strategicPeriodId: ID
  ) {
    sharedKpiParticipants(
      kpiId: $kpiId
      page: $page
      limit: $limit
      strategicPeriodId: $strategicPeriodId
    ) {
      items {
        sharedKpiParticipantId
        contributionWeight
        createdAt
        kpi {
          kpiId
          name
        }
        participant {
          employeeId
          fullName
          email
          title
        }
        assignedBy {
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
