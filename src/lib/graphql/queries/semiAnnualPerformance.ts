import { gql } from '@apollo/client';

export const GET_SEMI_ANNUAL_PERIODS = gql`
  query GetSemiAnnualPeriods($organizationId: ID!) {
    semiAnnualPeriods(organizationId: $organizationId) {
      periodId
      name
      semester
      startDate
      endDate
      strategicPeriodId
      organizationId
      isActive
    }
  }
`;

export const GET_SEMI_ANNUAL_CONFIG = gql`
  query GetSemiAnnualPerformanceConfig(
    $semiAnnualPeriodId: ID!
    $organizationId: ID!
  ) {
    semiAnnualPerformanceConfig(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      configId
      semiAnnualPeriodId
      organizationId
      ownPerformanceWeight
      sharedPerformanceWeight
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const GET_SHARED_KPIS = gql`
  query GetSharedKPIs($semiAnnualPeriodId: ID!, $organizationId: ID!) {
    sharedKPIs(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      sharedKpiId
      name
      description
      achievementScore
      isActive
      semiAnnualPeriodId
      organizationId
    }
  }
`;

export const GET_SHARED_KPIS_WITH_DIVISIONS = gql`
  query GetSharedKPIsWithDivisions(
    $semiAnnualPeriodId: ID!
    $organizationId: ID!
  ) {
    sharedKPIsWithDivisions(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      sharedKpiId
      name
      description
      achievementScore
      isActive
      division {
        divisionId
        name
      }
    }
  }
`;

export const GET_ALL_SEMI_ANNUAL_RESULTS = gql`
  query GetAllSemiAnnualPerformanceResults(
    $semiAnnualPeriodId: ID!
    $organizationId: ID!
  ) {
    allSemiAnnualPerformanceResults(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      resultId
      employeeId
      semiAnnualPeriodId
      organizationId
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
      calculatedAt
      employee {
        employeeId
        fullName
        title
        picture
      }
    }
  }
`;

export const CREATE_SEMI_ANNUAL_PERIOD = gql`
  mutation CreateSemiAnnualPeriod($input: CreateSemiAnnualPeriodInput!) {
    createSemiAnnualPeriod(input: $input) {
      periodId
      name
      semester
      startDate
      endDate
      strategicPeriodId
      organizationId
      isActive
    }
  }
`;

export const CREATE_OR_UPDATE_CONFIG = gql`
  mutation CreateOrUpdateSemiAnnualConfig($input: CreatePerformanceConfigInput!) {
    createOrUpdateSemiAnnualConfig(input: $input) {
      configId
      semiAnnualPeriodId
      organizationId
      ownPerformanceWeight
      sharedPerformanceWeight
      createdBy
    }
  }
`;

export const CREATE_SHARED_KPI = gql`
  mutation CreateSharedKPI($input: CreateSharedKPIInput!) {
    createSharedKPI(input: $input) {
      sharedKpiId
      name
      description
      achievementScore
      semiAnnualPeriodId
      organizationId
      isActive
    }
  }
`;

export const UPDATE_SHARED_KPI_SCORE = gql`
  mutation UpdateSharedKPIScore($sharedKpiId: ID!, $achievementScore: Float!) {
    updateSharedKPIScore(
      sharedKpiId: $sharedKpiId
      achievementScore: $achievementScore
    ) {
      sharedKpiId
      achievementScore
    }
  }
`;

export const ASSIGN_SHARED_KPI = gql`
  mutation AssignSharedKPI($input: AssignSharedKPIInput!) {
    assignSharedKPI(input: $input) {
      assignmentId
      employeeId
      sharedKpiId
      assignedWeight
      semiAnnualPeriodId
      organizationId
    }
  }
`;

export const SYNC_DIVISIONS_TO_SHARED_KPIS = gql`
  mutation SyncDivisionsToSharedKPIs(
    $semiAnnualPeriodId: ID!
    $organizationId: ID!
  ) {
    syncDivisionsToSharedKPIs(
      semiAnnualPeriodId: $semiAnnualPeriodId
      organizationId: $organizationId
    ) {
      sharedKpiId
      name
      achievementScore
      division {
        divisionId
        name
      }
    }
  }
`;
