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
          kpiMode
          managerRetentionPercent
          quarterPlans {
            kpiQuarterPlanId
            quarterNumber
            originalTarget
            carryIn
            effectiveTarget
            status
          }
          quarterResults {
            kpiQuarterResultId
            quarterPlanId
            calculationMode
            directActual
            aggregateActual
            finalActual
            finalAchievementRate
            weightedScore
            carryOut
            managerCarryOut
            teamCarryOut
            status
            calculatedAt
            finalizedAt
          }
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
        managerActual
        managerTarget
        teamActual
        teamTarget
        managerAchievementRate
        teamAchievementRate
      }
    }
  }
`;

export const FINALIZE_KPI_QUARTER = gql`
  mutation FinalizeKpiQuarter($kpiId: ID!, $quarterNumber: Int!) {
    finalizeKpiQuarter(kpiId: $kpiId, quarterNumber: $quarterNumber) {
      kpiQuarterResultId
      quarterPlanId
      status
      finalActual
      finalAchievementRate
      weightedScore
      carryOut
      managerCarryOut
      teamCarryOut
      finalizedAt
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
          kpiMode
          managerRetentionPercent
          quarterPlans {
            kpiQuarterPlanId
            quarterNumber
            originalTarget
            carryIn
            effectiveTarget
            status
          }
          quarterResults {
            kpiQuarterResultId
            quarterPlanId
            calculationMode
            directActual
            aggregateActual
            finalActual
            finalAchievementRate
            weightedScore
            carryOut
            managerCarryOut
            teamCarryOut
            status
            calculatedAt
            finalizedAt
          }
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
        managerActual
        managerTarget
        teamActual
        teamTarget
        managerAchievementRate
        teamAchievementRate
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
        kpiMode
        managerRetentionPercent
        quarterPlans {
          kpiQuarterPlanId
          quarterNumber
          originalTarget
          carryIn
          effectiveTarget
          status
        }
        quarterResults {
          kpiQuarterResultId
          quarterPlanId
          calculationMode
          directActual
          aggregateActual
          finalActual
          finalAchievementRate
          weightedScore
          carryOut
          managerCarryOut
          teamCarryOut
          status
          calculatedAt
          finalizedAt
        }
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
      managerActual
      managerTarget
      teamActual
      teamTarget
      managerAchievementRate
      teamAchievementRate
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
