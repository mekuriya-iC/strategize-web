import { gql } from "@apollo/client";

/**
 * KPI Scorecard Queries
 */

export const GET_REALTIME_INDIVIDUAL_SCORECARD = gql`
  query GetRealtimeIndividualScorecard(
    $employeeId: ID!
    $periodId: ID!
    $capFinalScore: Boolean
  ) {
    realtimeIndividualScorecard(
      employeeId: $employeeId
      periodId: $periodId
      capFinalScore: $capFinalScore
    ) {
      totalScore
      uncappedTotalScore
      maxPossibleScore
      finalScoreCapApplied
      percentageAchieved
      kpiScores {
        aggregatedKpiScoreId
        kpi {
          kpiId
          name
          description
        }
        level
        actualValue
        targetValue
        weight
        cap
        achievementRate
        cappedRate
        score
        calculatedAt
      }
    }
  }
`;

export const GET_KPI_ASSIGNMENT_EMPLOYEE_WITH_WEIGHTS = gql`
  query GetKpiAssignmentEmployee($employeeId: ID!, $periodId: ID!) {
    kpiAssignmentEmployees(
      filters: { employeeId: $employeeId, strategicPeriodId: $periodId }
    ) {
      items {
        kpiAssignmentEmployeeId
        kpi {
          kpiId
          name
          description
        }
        targetValue
        weight
        parentWeightAllocation
        cap
      }
    }
  }
`;

export const GET_TOTAL_SCORECARD_SCORE = gql`
  query GetTotalScorecardScore(
    $level: ScorecardLevel!
    $entityId: ID!
    $periodId: ID!
    $capFinalScore: Boolean
  ) {
    totalScorecardScore(
      level: $level
      entityId: $entityId
      periodId: $periodId
      capFinalScore: $capFinalScore
    ) {
      totalScore
      uncappedTotalScore
      maxPossibleScore
      finalScoreCapApplied
      percentageAchieved
      kpiScores {
        aggregatedKpiScoreId
        kpi {
          kpiId
          name
          description
        }
        level
        actualValue
        targetValue
        weight
        cap
        achievementRate
        cappedRate
        score
        calculatedAt
      }
    }
  }
`;

export const GET_KPI_SCORES_BY_ENTITY = gql`
  query GetKpiScoresByEntity(
    $level: ScorecardLevel!
    $entityId: ID!
    $periodId: ID!
  ) {
    kpiScoresByEntity(level: $level, entityId: $entityId, periodId: $periodId) {
      aggregatedKpiScoreId
      kpi {
        kpiId
        name
        description
        measurementUnit
      }
      level
      actualValue
      targetValue
      weight
      cap
      achievementRate
      cappedRate
      score
      calculatedAt
    }
  }
`;

export const GET_CASCADE_MAPPINGS_BY_PERIOD = gql`
  query GetCascadeMappingsByPeriod($periodId: ID!) {
    cascadeMappingsByPeriod(periodId: $periodId) {
      kpiCascadeMappingId
      sourceKpi {
        kpiId
        name
      }
      sourceLevel
      targetKpi {
        kpiId
        name
      }
      targetLevel
      isActive
      createdAt
    }
  }
`;
