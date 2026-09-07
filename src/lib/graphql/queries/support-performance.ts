import { gql } from "@apollo/client";

export const GET_SUPPORT_PERFORMANCE_REPORT = gql`
  query GetSupportPerformanceReport(
    $filters: SupportPerformanceReportFiltersInput!
  ) {
    supportPerformanceReport(filters: $filters) {
      annualStrategicPeriodId
      scope
      readiness {
        totalAssignments
        noLocalKpi
        planningIncomplete
        pendingApproval
        ready
      }
      sourceSummaries {
        sourceCorporateKpiId
        sourceCorporateKpiName
        sourceCorporateObjectiveId
        sourceCorporateObjectiveTitle
        localKpiCount
        resultCount
        planCount
        plannedContributionWeight
        achievedContributionWeight
        achievementRate
        resultCoverageRate
      }
      rows {
        objectiveSupportSourceId
        sourceCorporateKpiId
        sourceCorporateKpiName
        sourceCorporateObjectiveId
        sourceCorporateObjectiveTitle
        unitType
        unitId
        unitName
        supportObjectiveId
        supportObjectiveTitle
        expectedImpact
        localKpiId
        localKpiName
        readinessStatus
        quarters {
          quarterNumber
          target
          planStatus
          actual
          achievement
          contribution
          plannedContributionWeight
          resultStatus
        }
        annualContribution
        plannedContributionWeight
        annualAchievement
      }
      totalItems
      currentPage
      itemsPerPage
      totalPages
    }
  }
`;
