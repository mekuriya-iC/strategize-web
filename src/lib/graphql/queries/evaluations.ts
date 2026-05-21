import { gql } from '@apollo/client';

/**
 * Evaluation Cycle Queries
 */
export const GET_EVALUATION_CYCLES = gql`
  query GetEvaluationCycles($page: Int!, $limit: Int!, $search: String, $status: EvaluationCycleStatus) {
    evaluationCycles(page: $page, limit: $limit, search: $search, status: $status) {
      items {
        evaluationCycleId
        name
        description
        startDate
        endDate
        status
        strategicPeriod {
          strategicPeriodId
          name
        }
        createdBy {
          employeeId
          fullName
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

export const GET_EVALUATION_CYCLE = gql`
  query GetEvaluationCycle($evaluationCycleId: ID!) {
    evaluationCycle(evaluationCycleId: $evaluationCycleId) {
      evaluationCycleId
      name
      description
      startDate
      endDate
      status
      strategicPeriod {
        strategicPeriodId
        name
        startDate
        endDate
      }
      createdBy {
        employeeId
        fullName
        email
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * Competency Assessment Queries
 */
export const GET_COMPETENCY_ASSESSMENTS = gql`
  query GetCompetencyAssessments(
    $page: Int!
    $limit: Int!
    $evaluationCycleId: ID
    $evaluateeUserId: ID
    $evaluatorUserId: ID
  ) {
    competencyAssessments(
      page: $page
      limit: $limit
      evaluationCycleId: $evaluationCycleId
      evaluateeUserId: $evaluateeUserId
      evaluatorUserId: $evaluatorUserId
    ) {
      items {
        competencyAssessmentId
        status
        relationType
        overallComment
        submittedAt
        evaluatee {
          employeeId
          fullName
          email
          title
        }
        evaluator {
          employeeId
          fullName
          email
        }
        evaluationCycle {
          evaluationCycleId
          name
          startDate
          endDate
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

export const GET_COMPETENCY_ASSESSMENT = gql`
  query GetCompetencyAssessment($competencyAssessmentId: ID!) {
    competencyAssessment(competencyAssessmentId: $competencyAssessmentId) {
      competencyAssessmentId
      status
      relationType
      overallComment
      submittedAt
      evaluatee {
        employeeId
        fullName
        email
        title
        picture
        organizationId
      }
      evaluator {
        employeeId
        fullName
        email
        picture
      }
      evaluationCycle {
        evaluationCycleId
        name
        description
        startDate
        endDate
        status
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * Assessment Response Queries
 */
export const GET_ASSESSMENT_RESPONSES = gql`
  query GetAssessmentResponses($assessmentId: ID!, $page: Int!, $limit: Int!) {
    assessmentResponses(assessmentId: $assessmentId, page: $page, limit: $limit) {
      items {
        assessmentResponseId
        rating
        comment
        indicator {
          competencyIndicatorId
          description
          ratingScaleMin
          ratingScaleMax
          competency {
            competencyId
            name
            description
          }
        }
        assessment {
          competencyAssessmentId
          status
        }
        createdAt
        updatedAt
      }
      meta {
        totalItems
        totalPages
        currentPage
        itemsPerPage
      }
    }
  }
`;

/**
 * Evaluation Weight Config Queries
 */
export const GET_EVALUATION_WEIGHT_CONFIGS = gql`
  query GetEvaluationWeightConfigs($evaluationCycleId: ID, $page: Int!, $limit: Int!) {
    evaluationWeightConfigs(evaluationCycleId: $evaluationCycleId, page: $page, limit: $limit) {
      items {
        evaluationWeightConfigId
        relationType
        weightPercent
        evaluationCycle {
          evaluationCycleId
          name
        }
        createdBy {
          employeeId
          fullName
        }
        createdAt
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;
