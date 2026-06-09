import { gql } from "@apollo/client";

export const GET_EMPLOYEE_PERFORMANCE = gql`
  query GetEmployeePerformance(
    $employeeId: String!
    $organizationId: String!
    $strategicPeriodId: String
    $departmentId: String
    $divisionId: String
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
        userId
        fullName
        email
        title
        picture
        department {
          departmentId
          name
        }
      }
      strategicPeriodId
      totalScore
      maxPossibleScore
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
          lastUpdated
        }
        competencyScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
          source
          lastUpdated
        }
        activityScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
          source
          lastUpdated
        }
      }
      calculatedAt
    }
  }
`;

export const GET_TEAM_PERFORMANCE = gql`
  query GetTeamPerformance(
    $organizationId: String!
    $strategicPeriodId: String
    $departmentId: String
    $divisionId: String
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
          userId
          fullName
          email
          title
          picture
          department {
            departmentId
            name
          }
        }
        strategicPeriodId
        totalScore
        maxPossibleScore
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
            lastUpdated
          }
          competencyScore {
            rawScore
            maxScore
            percentageAchieved
            weight
            weightedScore
            source
            lastUpdated
          }
          activityScore {
            rawScore
            maxScore
            percentageAchieved
            weight
            weightedScore
            source
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
          userId
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
      organizationId
      strategicPeriodId
      kpiWeight
      competencyWeight
      activityWeight
      isActive
      notes
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
      organizationId
      strategicPeriodId
      kpiWeight
      competencyWeight
      activityWeight
      isActive
      notes
      createdAt
      updatedAt
    }
  }
`;
