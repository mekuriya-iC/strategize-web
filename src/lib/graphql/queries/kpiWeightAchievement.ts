import { gql } from '@apollo/client';

const HIERARCHICAL_KPI_BREAKDOWN_FIELDS = `
  level
  entityId
  entityName
  totalWeightPossible
  totalWeightAchieved
  achievementPercentage
  kpis {
    kpiId
    kpiName
    kpiLevel
    totalWeight
    targetValue
    achievedValue
    achievementPercentage
    hasContributors
    contributors {
      contributorId
      contributorName
      contributorType
      parentWeightAllocation
      targetValue
      achievedValue
      achievementPercentage
      weightContribution
    }
  }
`;

export const GET_INDIVIDUAL_KPI_WEIGHT_ACHIEVEMENT = gql`
  query GetIndividualKpiWeightAchievement($employeeId: ID!, $periodId: ID!) {
    individualKpiWeightAchievement(employeeId: $employeeId, periodId: $periodId) {
      totalWeightPossible
      totalWeightAchieved
      totalParentContribution
      achievementPercentage
      kpis {
        kpiId
        kpiName
        localWeight
        parentWeightAllocation
        targetValue
        achievedValue
        achievementPercentage
        localWeightAchieved
        parentWeightContribution
      }
    }
  }
`;

export const GET_TEAM_KPI_WEIGHT_ACHIEVEMENT = gql`
  query GetTeamKpiWeightAchievement($departmentId: ID!, $periodId: ID!) {
    teamKpiWeightAchievement(departmentId: $departmentId, periodId: $periodId) {
      totalWeightPossible
      totalWeightAchieved
      achievementPercentage
      teamMembers {
        employeeId
        employeeName
        totalWeightPossible
        totalWeightAchieved
        achievementPercentage
        kpis {
          kpiId
          kpiName
          parentWeightAllocation
          targetValue
          achievedValue
          achievementPercentage
          parentWeightContribution
        }
      }
    }
  }
`;

export const GET_CORPORATE_KPI_WITH_DIVISION_CONTRIBUTIONS = gql`
  query GetCorporateKpiWithDivisionContributions(
    $organizationId: ID!
    $periodId: ID!
  ) {
    corporateKpiWithDivisionContributions(
      organizationId: $organizationId
      periodId: $periodId
    ) {
      ${HIERARCHICAL_KPI_BREAKDOWN_FIELDS}
    }
  }
`;

export const GET_DIVISION_KPI_WITH_DEPARTMENT_CONTRIBUTIONS = gql`
  query GetDivisionKpiWithDepartmentContributions(
    $divisionId: ID!
    $periodId: ID!
  ) {
    divisionKpiWithDepartmentContributions(
      divisionId: $divisionId
      periodId: $periodId
    ) {
      ${HIERARCHICAL_KPI_BREAKDOWN_FIELDS}
    }
  }
`;

export const GET_DEPARTMENT_KPI_WITH_EMPLOYEE_CONTRIBUTIONS = gql`
  query GetDepartmentKpiWithEmployeeContributions(
    $departmentId: ID!
    $periodId: ID!
  ) {
    departmentKpiWithEmployeeContributions(
      departmentId: $departmentId
      periodId: $periodId
    ) {
      ${HIERARCHICAL_KPI_BREAKDOWN_FIELDS}
    }
  }
`;
