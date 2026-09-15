import { gql } from "@apollo/client";

export const GET_TASK_CORPORATE_BASELINE = gql`
  query TaskCorporateBaseline($filters: KpiQuarterReportFiltersInput!) {
    kpiQuarterPerformanceReport(filters: $filters) {
      annualStrategicPeriodName
      scope
      summary {
        kpiCount
        weightedAchievementRate
        plannedContributionWeight
        achievedContributionWeight
        resultCoverageRate
        pendingResultCount
        finalCount
        provisionalCount
      }
    }
  }
`;

const TASK_COMPLETION_ANALYTICS_RESULT_FIELDS = gql`
  fragment TaskCompletionAnalyticsResultFields on TaskCompletionAnalyticsResult {
    summary {
      periodType
      periodStart
      periodEnd
      employeeCount
      periodCount
      totalTasks
      completedTasks
      notDoneTasks
      postponedTasks
      cancelledTasks
      completionRate
      status
    }
    availableFilters {
      employees {
        id
        name
      }
      departments {
        id
        name
      }
      divisions {
        id
        name
      }
    }
    series {
      periodStart
      periodEnd
      totalTasks
      completedTasks
      notDoneTasks
      postponedTasks
      cancelledTasks
      completionRate
      status
    }
    rows {
      employeeId
      employeeName
      email
      title
      departmentIds
      divisionIds
      periodStart
      periodEnd
      totalTasks
      completedTasks
      notDoneTasks
      postponedTasks
      cancelledTasks
      completionRate
      status
    }
    pageInfo {
      page
      limit
      totalItems
      totalPages
    }
  }
`;

export const GET_PERSONAL_TASK_COMPLETION_ANALYTICS = gql`
  query PersonalTaskCompletionAnalytics(
    $filters: PersonalTaskCompletionAnalyticsInput!
  ) {
    personalTaskCompletionAnalytics(filters: $filters) {
      ...TaskCompletionAnalyticsResultFields
    }
  }
  ${TASK_COMPLETION_ANALYTICS_RESULT_FIELDS}
`;

export const GET_HIERARCHY_TASK_COMPLETION_ANALYTICS = gql`
  query HierarchyTaskCompletionAnalytics(
    $filters: HierarchyTaskCompletionAnalyticsInput!
  ) {
    hierarchyTaskCompletionAnalytics(filters: $filters) {
      ...TaskCompletionAnalyticsResultFields
    }
  }
  ${TASK_COMPLETION_ANALYTICS_RESULT_FIELDS}
`;
