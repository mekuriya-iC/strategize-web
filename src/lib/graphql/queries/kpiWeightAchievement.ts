import { gql } from "@apollo/client";

/**
 * Get individual employee KPI weight achievement
 * Shows both local weight achievement and parent weight contribution
 */
export const GET_INDIVIDUAL_KPI_WEIGHT_ACHIEVEMENT = gql`
  query GetIndividualKpiWeightAchievement($employeeId: ID!, $periodId: ID!) {
    individualKpiWeightAchievement(
      employeeId: $employeeId
      periodId: $periodId
    ) {
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

/**
 * Get team/department KPI weight achievement
 * Shows aggregated parent weight contributions from team members
 */
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

// ========== NEW: Hierarchical Contribution Queries ==========

/**
 * Get corporate KPIs with division contributions
 * For Super Admin / Admin view
 */
export const GET_CORPORATE_KPI_WITH_DIVISION_CONTRIBUTIONS = gql`
  query GetCorporateKpiWithDivisionContributions(
    $organizationId: ID!
    $periodId: ID!
  ) {
    corporateKpiWithDivisionContributions(
      organizationId: $organizationId
      periodId: $periodId
    ) {
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
        kpiMode
        managerRetentionPercent
        managerActual
        managerTarget
        teamActual
        teamTarget
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
    }
  }
`;

/**
 * Get division KPIs with department contributions
 * For Director view
 */
export const GET_DIVISION_KPI_WITH_DEPARTMENT_CONTRIBUTIONS = gql`
  query GetDivisionKpiWithDepartmentContributions(
    $divisionId: ID!
    $periodId: ID!
  ) {
    divisionKpiWithDepartmentContributions(
      divisionId: $divisionId
      periodId: $periodId
    ) {
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
        kpiMode
        managerRetentionPercent
        managerActual
        managerTarget
        teamActual
        teamTarget
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
    }
  }
`;
/**
 * Get department KPIs with employee contributions
 * For Manager view
 */
export const GET_DEPARTMENT_KPI_WITH_EMPLOYEE_CONTRIBUTIONS = gql`
  query GetDepartmentKpiWithEmployeeContributions(
    $departmentId: ID!
    $periodId: ID!
  ) {
    departmentKpiWithEmployeeContributions(
      departmentId: $departmentId
      periodId: $periodId
    ) {
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
        kpiMode
        managerRetentionPercent
        managerActual
        managerTarget
        teamActual
        teamTarget
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
    }
  }
`;
