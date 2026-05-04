import { gql } from '@apollo/client';

/**
 * KPI Mutations
 * Matches backend schema exactly
 */

// Create a new KPI
export const CREATE_KPI = gql`
  mutation CreateKpi($input: CreateKpiInput!) {
    createKpi(createKpiInput: $input) {
      kpiId
      name
      description
      kpiType
      measurementUnit
      unitType
      customUnitLabel
      targetValue
      baselineValue
      baseline
      weight
      frequency
      status
      targetStatus
      isActive
      order
      createdAt
      objective {
        objectiveId
        title
      }
      createdBy {
        employeeId
        fullName
      }
      targets {
        timeline
        target
      }
    }
  }
`;

// Update a KPI
export const UPDATE_KPI = gql`
  mutation UpdateKpi($input: UpdateKpiInput!) {
    updateKpi(updateKpiInput: $input) {
      kpiId
      name
      description
      kpiType
      measurementUnit
      unitType
      customUnitLabel
      targetValue
      baselineValue
      baseline
      weight
      frequency
      status
      targetStatus
      isActive
      order
      updatedAt
      objective {
        objectiveId
        title
      }
      targets {
        timeline
        target
      }
    }
  }
`;

// Delete a KPI
export const DELETE_KPI = gql`
  mutation RemoveKpi($kpiId: ID!) {
    removeKpi(kpiId: $kpiId) {
      kpiId
      name
      isDeleted
    }
  }
`;

// Create KPI update/progress report
export const CREATE_KPI_UPDATE = gql`
  mutation CreateKpiUpdate($input: CreateKpiUpdateInput!) {
    createKpiUpdate(createKpiUpdateInput: $input) {
      kpiUpdateId
      achievedValue
      progressPercentage
      progressStatus
      reportingDate
      notes
      evidenceUrl
      createdAt
      kpi {
        kpiId
        name
        targetValue
        measurementUnit
      }
      reportedBy {
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

// Update KPI progress
export const UPDATE_KPI_PROGRESS = gql`
  mutation UpdateKpiProgress($input: UpdateKpiUpdateInput!) {
    updateKpiUpdate(updateKpiUpdateInput: $input) {
      kpiUpdateId
      achievedValue
      progressPercentage
      progressStatus
      reportingDate
      notes
      evidenceUrl
      updatedAt
      kpi {
        kpiId
        name
      }
    }
  }
`;

// Approve KPI update
export const APPROVE_KPI_UPDATE = gql`
  mutation ApproveKpiUpdate($kpiUpdateId: ID!, $comment: String) {
    approveKpiUpdate(kpiUpdateId: $kpiUpdateId, comment: $comment) {
      kpiUpdateId
      approvedAt
      approvedBy {
        employeeId
        fullName
      }
    }
  }
`;

// Create KPI assignment mutations
export const CREATE_KPI_ASSIGNMENT_EMPLOYEE = gql`
  mutation CreateKpiAssignmentEmployee($input: CreateKpiAssignmentEmployeeInput!) {
    createKpiAssignmentEmployee(createKpiAssignmentEmployeeInput: $input) {
      kpiAssignmentEmployeeId
      targetValue
      weight
      createdAt
      kpi {
        kpiId
        name
        measurementUnit
      }
      employee {
        employeeId
        fullName
        email
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
  }
`;

export const CREATE_KPI_ASSIGNMENT_DEPARTMENT = gql`
  mutation CreateKpiAssignmentDepartment($input: CreateKpiAssignmentDepartmentInput!) {
    createKpiAssignmentDepartment(createKpiAssignmentDepartmentInput: $input) {
      kpiAssignmentDepartmentId
      targetValue
      weight
      createdAt
      kpi {
        kpiId
        name
        measurementUnit
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
  }
`;

export const CREATE_KPI_ASSIGNMENT_DIVISION = gql`
  mutation CreateKpiAssignmentDivision($input: CreateKpiAssignmentDivisionInput!) {
    createKpiAssignmentDivision(createKpiAssignmentDivisionInput: $input) {
      kpiAssignmentDivisionId
      targetValue
      weight
      createdAt
      kpi {
        kpiId
        name
        measurementUnit
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
  }
`;

// Aliases for backward compatibility
export const ASSIGN_KPI_TO_EMPLOYEE = CREATE_KPI_ASSIGNMENT_EMPLOYEE;
export const ASSIGN_KPI_TO_DEPARTMENT = CREATE_KPI_ASSIGNMENT_DEPARTMENT;
export const ASSIGN_KPI_TO_DIVISION = CREATE_KPI_ASSIGNMENT_DIVISION;

// Remove KPI assignment from employee
export const REMOVE_KPI_ASSIGNMENT_EMPLOYEE = gql`
  mutation RemoveKpiAssignmentEmployee($kpiAssignmentEmployeeId: ID!) {
    removeKpiAssignmentEmployee(kpiAssignmentEmployeeId: $kpiAssignmentEmployeeId) {
      kpiAssignmentEmployeeId
    }
  }
`;

// Remove KPI assignment from department
export const REMOVE_KPI_ASSIGNMENT_DEPARTMENT = gql`
  mutation RemoveKpiAssignmentDepartment($kpiAssignmentDepartmentId: ID!) {
    removeKpiAssignmentDepartment(kpiAssignmentDepartmentId: $kpiAssignmentDepartmentId) {
      kpiAssignmentDepartmentId
    }
  }
`;

// Remove KPI assignment from division
export const REMOVE_KPI_ASSIGNMENT_DIVISION = gql`
  mutation RemoveKpiAssignmentDivision($kpiAssignmentDivisionId: ID!) {
    removeKpiAssignmentDivision(kpiAssignmentDivisionId: $kpiAssignmentDivisionId) {
      kpiAssignmentDivisionId
    }
  }
`;

// Reorder KPIs
export const REORDER_KPIS = gql`
  mutation ReorderKpis($input: [ReorderKpiInput!]!) {
    reorderKpis(reorderKpisInput: $input) {
      kpiId
      order
    }
  }
`;

// Update KPI status
export const UPDATE_KPI_STATUS = gql`
  mutation UpdateKpiStatus($kpiId: ID!, $status: KpiStatus!) {
    updateKpiStatus(kpiId: $kpiId, status: $status) {
      kpiId
      name
      status
      updatedAt
    }
  }
`;

// Toggle KPI active status
export const TOGGLE_KPI_ACTIVE = gql`
  mutation ToggleKpiActive($kpiId: ID!) {
    toggleKpiActive(kpiId: $kpiId) {
      kpiId
      name
      isActive
      updatedAt
    }
  }
`;

// Create shared KPI (can be assigned to multiple entities)
export const CREATE_SHARED_KPI = gql`
  mutation CreateSharedKpi($input: CreateSharedKpiInput!) {
    createSharedKpi(createSharedKpiInput: $input) {
      kpiId
      name
      description
      kpiType
      measurementUnit
      targetValue
      isActive
      createdAt
      createdBy {
        employeeId
        fullName
      }
    }
  }
`;


// Shared KPI Participants
export const CREATE_SHARED_KPI_PARTICIPANT = gql`
  mutation CreateSharedKpiParticipant($input: CreateSharedKpiParticipantInput!) {
    createSharedKpiParticipant(createSharedKpiParticipantInput: $input) {
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
  }
`;

export const UPDATE_SHARED_KPI_PARTICIPANT = gql`
  mutation UpdateSharedKpiParticipant($input: UpdateSharedKpiParticipantInput!) {
    updateSharedKpiParticipant(updateSharedKpiParticipantInput: $input) {
      sharedKpiParticipantId
      contributionWeight
      updatedAt
    }
  }
`;

export const REMOVE_SHARED_KPI_PARTICIPANT = gql`
  mutation RemoveSharedKpiParticipant($sharedKpiParticipantId: ID!) {
    removeSharedKpiParticipant(sharedKpiParticipantId: $sharedKpiParticipantId) {
      sharedKpiParticipantId
    }
  }
`;
