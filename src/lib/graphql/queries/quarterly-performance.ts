import { gql } from "@apollo/client";

export const GET_KPI_QUARTER_PERFORMANCE_REPORT = gql`
  query GetKpiQuarterPerformanceReport(
    $filters: KpiQuarterReportFiltersInput!
  ) {
    kpiQuarterPerformanceReport(filters: $filters) {
      annualStrategicPeriodId
      annualStrategicPeriodName
      scope
      availableFilters {
        divisions {
          id
          name
          parentId
          parentIds
        }
        departments {
          id
          name
          parentId
          parentIds
        }
        employees {
          id
          name
          parentId
          parentIds
        }
      }
      summary {
        rowCount
        kpiCount
        originalTarget
        carryIn
        effectiveTarget
        actual
        averageAchievementRate
        annualContribution
        carryOut
        finalCount
        provisionalCount
        pendingResultCount
      }
      quarterSummaries {
        quarterNumber
        rowCount
        kpiCount
        originalTarget
        carryIn
        effectiveTarget
        actual
        averageAchievementRate
        annualContribution
        carryOut
        finalCount
        provisionalCount
        pendingResultCount
      }
      rollups {
        level
        entityId
        entityName
        rowCount
        kpiCount
        originalTarget
        carryIn
        effectiveTarget
        actual
        averageAchievementRate
        annualContribution
        carryOut
        finalCount
        provisionalCount
        pendingResultCount
      }
      rows {
        kpiQuarterPlanId
        kpiId
        kpiName
        objectiveTitle
        level
        entityId
        entityName
        divisionId
        divisionName
        departmentId
        departmentName
        employeeId
        employeeName
        kpiMode
        unitType
        measurementUnit
        customUnitLabel
        annualTarget
        weight
        quarterNumber
        timeline
        originalTarget
        carryIn
        effectiveTarget
        managerOriginalTarget
        managerCarryIn
        managerEffectiveTarget
        teamOriginalTarget
        teamCarryIn
        teamEffectiveTarget
        planStatus
        directActual
        directAchievementRate
        aggregateActual
        aggregateAchievementRate
        actual
        achievementRate
        annualContribution
        carryOut
        managerCarryOut
        teamCarryOut
        resultStatus
        calculatedAt
        finalizedAt
      }
      totalItems
      currentPage
      itemsPerPage
      totalPages
    }
  }
`;
