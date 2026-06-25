import { gql } from "@apollo/client";

/**
 * Semi-annual performance operations.
 *
 * Backed by `SemiAnnualPerformanceResolver` in the API.
 *
 * NOTE: This module intentionally bundles queries and mutations together
 * (rather than splitting them across `queries/` and `mutations/`) because
 * the two semi-annual dashboard pages consume them as a single feature
 * surface.
 */

// ==================== FRAGMENTS ====================

const SEMI_ANNUAL_PERIOD_FIELDS = gql`
  fragment SemiAnnualPeriodFields on SemiAnnualPeriod {
    periodId
    name
    semester
    startDate
    endDate
    organizationId
    isActive
    createdAt
    updatedAt
  }
`;

const SEMI_ANNUAL_CONFIG_FIELDS = gql`
  fragment SemiAnnualConfigFields on SemiAnnualPerformanceConfig {
    configId
    semiAnnualPeriod {
      ...SemiAnnualPeriodFields
    }
    organizationId
    ownPerformanceWeight
    sharedPerformanceWeight
    createdBy
    createdAt
    updatedAt
  }
`;

const SHARED_KPI_FIELDS = gql`
  fragment SharedKPIFields on SharedKPI {
    sharedKpiId
    name
    description
    achievementScore
    isActive
    organizationId
    createdAt
    updatedAt
    division {
      divisionId
      name
      description
      isActive
    }
  }
`;

const SEMI_ANNUAL_RESULT_FIELDS = gql`
  fragment SemiAnnualResultFields on SemiAnnualPerformanceResult {
    resultId
    organizationId
    semiAnnualPeriod {
      ...SemiAnnualPeriodFields
    }
    kpiScore
    evaluation360Score
    baseScore
    ownPerformanceWeight
    ownPerformanceScore
    sharedKPIScores {
      sharedKpiId
      name
      assignedWeight
      achievementScore
      earnedScore
    }
    totalSharedKPIScore
    finalScore
    rating
    isFinalized
    finalizedAt
    finalizedBy
    calculatedAt
    updatedAt
    employee {
      employeeId
      fullName
      title
      picture
      departments {
        departmentId
        name
      }
    }
  }
`;

// ==================== QUERIES ====================

export const GET_SEMI_ANNUAL_PERIODS = gql`
  query GetSemiAnnualPeriods($organizationId: String!) {
    semiAnnualPeriods(organizationId: $organizationId) {
      ...SemiAnnualPeriodFields
    }
  }
  ${SEMI_ANNUAL_PERIOD_FIELDS}
`;

export const GET_SEMI_ANNUAL_CONFIG = gql`
  query GetSemiAnnualConfig(
    $semiAnnualPeriodId: String!
    $organizationId: String!
  ) {
    semiAnnualPerformanceConfig(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      ...SemiAnnualConfigFields
    }
  }
  ${SEMI_ANNUAL_PERIOD_FIELDS}
  ${SEMI_ANNUAL_CONFIG_FIELDS}
`;

export const GET_SHARED_KPIS = gql`
  query GetSharedKPIs(
    $semiAnnualPeriodId: String!
    $organizationId: String!
  ) {
    sharedKPIs(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      ...SharedKPIFields
    }
  }
  ${SHARED_KPI_FIELDS}
`;

export const GET_SHARED_KPIS_WITH_DIVISIONS = gql`
  query GetSharedKPIsWithDivisions(
    $semiAnnualPeriodId: String!
    $organizationId: String!
  ) {
    sharedKPIsWithDivisions(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      ...SharedKPIFields
    }
  }
  ${SHARED_KPI_FIELDS}
`;

export const GET_ALL_SEMI_ANNUAL_RESULTS = gql`
  query GetAllSemiAnnualResults(
    $semiAnnualPeriodId: String!
    $organizationId: String!
  ) {
    allSemiAnnualPerformanceResults(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      ...SemiAnnualResultFields
    }
  }
  ${SEMI_ANNUAL_PERIOD_FIELDS}
  ${SEMI_ANNUAL_RESULT_FIELDS}
`;

// ==================== MUTATIONS ====================

export const CREATE_SEMI_ANNUAL_PERIOD = gql`
  mutation CreateSemiAnnualPeriod($input: CreateSemiAnnualPeriodInput!) {
    createSemiAnnualPeriod(input: $input) {
      ...SemiAnnualPeriodFields
    }
  }
  ${SEMI_ANNUAL_PERIOD_FIELDS}
`;

export const CREATE_OR_UPDATE_CONFIG = gql`
  mutation CreateOrUpdateSemiAnnualConfig(
    $input: CreatePerformanceConfigInput!
  ) {
    createOrUpdateSemiAnnualConfig(input: $input) {
      ...SemiAnnualConfigFields
    }
  }
  ${SEMI_ANNUAL_PERIOD_FIELDS}
  ${SEMI_ANNUAL_CONFIG_FIELDS}
`;

export const CREATE_SHARED_KPI = gql`
  mutation CreateSharedKPI($input: CreateSharedKPIInput!) {
    createSharedKPI(input: $input) {
      ...SharedKPIFields
    }
  }
  ${SHARED_KPI_FIELDS}
`;

export const UPDATE_SHARED_KPI_SCORE = gql`
  mutation UpdateSharedKPIScore(
    $sharedKpiId: String!
    $achievementScore: Float!
  ) {
    updateSharedKPIScore(
      sharedKpiId: $sharedKpiId
      achievementScore: $achievementScore
    ) {
      sharedKpiId
      achievementScore
      updatedAt
    }
  }
`;

export const ASSIGN_SHARED_KPI = gql`
  mutation AssignSharedKPI($input: AssignSharedKPIInput!) {
    assignSharedKPI(input: $input) {
      assignmentId
      employeeId
      sharedKpiId
      semiAnnualPeriodId
      assignedWeight
      organizationId
      assignedBy
      assignedAt
      updatedAt
    }
  }
`;

export const SYNC_DIVISIONS_TO_SHARED_KPIS = gql`
  mutation SyncDivisionsToSharedKPIs(
    $semiAnnualPeriodId: String!
    $organizationId: String!
  ) {
    syncDivisionsToSharedKPIs(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      ...SharedKPIFields
    }
  }
  ${SHARED_KPI_FIELDS}
`;
