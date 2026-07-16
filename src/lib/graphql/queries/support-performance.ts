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
      rows {
        objectiveSupportSourceId
        sourceCorporateKpiId
        sourceCorporateKpiName
        unitType
        unitId
        unitName
        supportObjectiveId
        supportObjectiveTitle
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
          resultStatus
        }
        annualContribution
        annualAchievement
      }
      totalItems
      currentPage
      itemsPerPage
      totalPages
    }
  }
`;
