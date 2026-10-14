import { gql } from "@apollo/client";

export const GET_EMPLOYEE_PERFORMANCE = gql`
  query GetEmployeePerformance(
    $employeeId: ID!
    $organizationId: ID!
    $strategicPeriodId: ID
    $departmentId: ID
    $divisionId: ID
  ) {
    employeePerformance: unifiedEmployeePerformance(
      filters: {
        employeeId: $employeeId
        organizationId: $organizationId
        strategicPeriodId: $strategicPeriodId
        departmentId: $departmentId
        divisionId: $divisionId
      }
    ) {
      employeeId
      employee {
        employeeId
        fullName
        email
        title
        picture
        departments {
          departmentId
          name
        }
      }
      strategicPeriodId
      totalScore
      maxPossibleScore
      configuredMaxPossibleScore
      componentCoverage
      isProvisional
      overallPercentage
      rating
      breakdown {
        kpiScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
          source
          isAvailable
          status
          scope
          lastUpdated
        }
        competencyScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
          source
          isAvailable
          status
          lastUpdated
        }
        activityScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
          source
          isAvailable
          status
          lastUpdated
        }
      }
      calculatedAt
    }
  }
`;

export const GET_TEAM_PERFORMANCE = gql`
  query GetTeamPerformance(
    $organizationId: ID!
    $strategicPeriodId: ID
    $departmentId: ID
    $divisionId: ID
    $includeInactive: Boolean
  ) {
    teamPerformance: unifiedTeamPerformance(
      filters: {
        organizationId: $organizationId
        strategicPeriodId: $strategicPeriodId
        departmentId: $departmentId
        divisionId: $divisionId
        includeInactive: $includeInactive
      }
    ) {
      results {
        employeeId
        employee {
          employeeId
          fullName
          email
          title
          picture
          departments {
            departmentId
            name
          }
        }
        strategicPeriodId
        totalScore
        maxPossibleScore
        configuredMaxPossibleScore
        componentCoverage
        isProvisional
        overallPercentage
        rating
        breakdown {
          kpiScore {
            rawScore
            maxScore
            percentageAchieved
            weight
            weightedScore
            source
            isAvailable
            status
            scope
            lastUpdated
          }
          competencyScore {
            rawScore
            maxScore
            percentageAchieved
            weight
            weightedScore
            source
            isAvailable
            status
            lastUpdated
          }
          activityScore {
            rawScore
            maxScore
            percentageAchieved
            weight
            weightedScore
            source
            isAvailable
            status
            lastUpdated
          }
        }
        calculatedAt
      }
      averageScore
      medianScore
      highestScore
      lowestScore
      topPerformer {
        employeeId
        employee {
          employeeId
          fullName
          email
          title
          picture
        }
        totalScore
        overallPercentage
        rating
      }
    }
  }
`;

export const GET_PERFORMANCE_WEIGHT_CONFIGS = gql`
  query GetPerformanceWeightConfigs($organizationId: String!) {
    performanceWeightConfigs(organizationId: $organizationId) {
      unifiedPerformanceWeightConfigId
      kpiWeight
      competencyWeight
      activityWeight
      isActive
      notes
      strategicPeriod {
        strategicPeriodId
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PERFORMANCE_WEIGHT_CONFIG = gql`
  query GetPerformanceWeightConfig(
    $organizationId: String!
    $strategicPeriodId: String
  ) {
    performanceWeightConfig(
      organizationId: $organizationId
      strategicPeriodId: $strategicPeriodId
    ) {
      unifiedPerformanceWeightConfigId
      kpiWeight
      competencyWeight
      activityWeight
      isActive
      notes
      strategicPeriod {
        strategicPeriodId
        name
      }
      createdAt
      updatedAt
    }
  }
`;
