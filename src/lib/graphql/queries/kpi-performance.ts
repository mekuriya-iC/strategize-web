import { gql } from '@apollo/client';

/**
 * KPI Performance Tracker GraphQL Queries
 * 
 * These queries fetch KPI performance tracking data for the Phase 2 enhancement:
 * - Flagged KPIs (unmet for 5+ consecutive weeks)
 * - Performance statistics
 * - Team overview for supervisors
 */

/**
 * Fragment for KPI Performance Tracker fields
 */
export const KPI_PERFORMANCE_TRACKER_FIELDS = gql`
  fragment KpiPerformanceTrackerFields on KpiPerformanceTracker {
    trackerId
    kpiId
    employeeId
    consecutiveUnmetWeeks
    lastUnmetSessionId
    firstUnmetDate
    isFlagged
    flaggedAt
    resolvedAt
    createdAt
    updatedAt
  }
`;

/**
 * Query: Get my flagged KPIs (employee view)
 * 
 * Returns all KPIs that are currently flagged for the current user
 * Used in employee dashboard to show warning badges
 */
export const GET_MY_FLAGGED_KPIS = gql`
  ${KPI_PERFORMANCE_TRACKER_FIELDS}
  query GetMyFlaggedKpis {
    myFlaggedKpis {
      ...KpiPerformanceTrackerFields
      kpi {
        kpiId
        name
        description
        targetValue
        aggregationMethod
        weight
      }
      employee {
        employeeId
        fullName
        email
      }
      lastUnmetSession {
        checkinoutSessionId
        weekStartDate
        weekEndDate
        overallStatus
      }
    }
  }
`;

/**
 * Query: Get flagged KPIs for my team (supervisor view)
 * 
 * Returns all flagged KPIs for direct reports
 * Used in supervisor dashboard
 */
export const GET_TEAM_FLAGGED_KPIS = gql`
  ${KPI_PERFORMANCE_TRACKER_FIELDS}
  query GetTeamFlaggedKpis {
    teamFlaggedKpis {
      ...KpiPerformanceTrackerFields
      kpi {
        kpiId
        name
        description
        targetValue
        aggregationMethod
        weight
      }
      employee {
        employeeId
        fullName
        email
        title
      }
      lastUnmetSession {
        checkinoutSessionId
        weekStartDate
        weekEndDate
        overallStatus
      }
    }
  }
`;

/**
 * Query: Get performance stats for a specific KPI
 * 
 * Returns tracking data for a single KPI and employee
 * Used in KPI detail pages
 */
export const GET_KPI_TRACKER_STATS = gql`
  ${KPI_PERFORMANCE_TRACKER_FIELDS}
  query GetKpiTrackerStats($kpiId: ID!, $employeeId: ID!) {
    kpiTrackerStats(kpiId: $kpiId, employeeId: $employeeId) {
      ...KpiPerformanceTrackerFields
      kpi {
        kpiId
        name
        description
        targetValue
      }
      employee {
        employeeId
        fullName
      }
      lastUnmetSession {
        checkinoutSessionId
        weekStartDate
        weekEndDate
      }
    }
  }
`;

/**
 * Query: Get count of my flagged KPIs
 * 
 * Returns just the count for badge display
 * Lightweight query for dashboard badges
 */
export const GET_MY_FLAGGED_KPI_COUNT = gql`
  query GetMyFlaggedKpiCount {
    myFlaggedKpiCount
  }
`;

/**
 * Query: Get count of team flagged KPIs
 * 
 * Returns count for supervisor dashboard badge
 */
export const GET_TEAM_FLAGGED_KPI_COUNT = gql`
  query GetTeamFlaggedKpiCount {
    teamFlaggedKpiCount
  }
`;

/**
 * Query: Get all trackers for employee (including non-flagged)
 * 
 * Returns all KPI performance trackers for analytics
 * Used in detailed performance analysis pages
 */
export const GET_MY_KPI_TRACKERS = gql`
  ${KPI_PERFORMANCE_TRACKER_FIELDS}
  query GetMyKpiTrackers {
    myKpiTrackers {
      ...KpiPerformanceTrackerFields
      kpi {
        kpiId
        name
        description
        targetValue
        aggregationMethod
      }
    }
  }
`;
