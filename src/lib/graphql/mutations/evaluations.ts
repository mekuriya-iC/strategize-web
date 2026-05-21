import { gql } from '@apollo/client';

/**
 * Evaluation Cycle Mutations
 */
export const CREATE_EVALUATION_CYCLE = gql`
  mutation CreateEvaluationCycle($createEvaluationCycleInput: CreateEvaluationCycleInput!) {
    createEvaluationCycle(createEvaluationCycleInput: $createEvaluationCycleInput) {
      evaluationCycleId
      name
      description
      startDate
      endDate
      status
      createdAt
    }
  }
`;

export const UPDATE_EVALUATION_CYCLE = gql`
  mutation UpdateEvaluationCycle($updateEvaluationCycleInput: UpdateEvaluationCycleInput!) {
    updateEvaluationCycle(updateEvaluationCycleInput: $updateEvaluationCycleInput) {
      evaluationCycleId
      name
      description
      startDate
      endDate
      status
      updatedAt
    }
  }
`;

export const REMOVE_EVALUATION_CYCLE = gql`
  mutation RemoveEvaluationCycle($evaluationCycleId: ID!) {
    removeEvaluationCycle(evaluationCycleId: $evaluationCycleId) {
      evaluationCycleId
      name
    }
  }
`;

/**
 * Competency Assessment Mutations
 */
export const CREATE_COMPETENCY_ASSESSMENT = gql`
  mutation CreateCompetencyAssessment($createCompetencyAssessmentInput: CreateCompetencyAssessmentInput!) {
    createCompetencyAssessment(createCompetencyAssessmentInput: $createCompetencyAssessmentInput) {
      competencyAssessmentId
      status
      relationType
      evaluatee {
        employeeId
        fullName
      }
      evaluator {
        employeeId
        fullName
      }
      evaluationCycle {
        evaluationCycleId
        name
      }
      createdAt
    }
  }
`;

export const UPDATE_COMPETENCY_ASSESSMENT = gql`
  mutation UpdateCompetencyAssessment($updateCompetencyAssessmentInput: UpdateCompetencyAssessmentInput!) {
    updateCompetencyAssessment(updateCompetencyAssessmentInput: $updateCompetencyAssessmentInput) {
      competencyAssessmentId
      status
      overallComment
      submittedAt
      updatedAt
    }
  }
`;

export const REMOVE_COMPETENCY_ASSESSMENT = gql`
  mutation RemoveCompetencyAssessment($competencyAssessmentId: ID!) {
    removeCompetencyAssessment(competencyAssessmentId: $competencyAssessmentId) {
      competencyAssessmentId
    }
  }
`;

/**
 * Assessment Response Mutations
 */
export const CREATE_ASSESSMENT_RESPONSE = gql`
  mutation CreateAssessmentResponse($createAssessmentResponseInput: CreateAssessmentResponseInput!) {
    createAssessmentResponse(createAssessmentResponseInput: $createAssessmentResponseInput) {
      assessmentResponseId
      rating
      comment
      indicator {
        competencyIndicatorId
        description
      }
      createdAt
    }
  }
`;

export const UPDATE_ASSESSMENT_RESPONSE = gql`
  mutation UpdateAssessmentResponse($updateAssessmentResponseInput: UpdateAssessmentResponseInput!) {
    updateAssessmentResponse(updateAssessmentResponseInput: $updateAssessmentResponseInput) {
      assessmentResponseId
      rating
      comment
      updatedAt
    }
  }
`;

export const REMOVE_ASSESSMENT_RESPONSE = gql`
  mutation RemoveAssessmentResponse($assessmentResponseId: ID!) {
    removeAssessmentResponse(assessmentResponseId: $assessmentResponseId) {
      assessmentResponseId
    }
  }
`;

/**
 * Evaluation Weight Config Mutations
 */
export const CREATE_EVALUATION_WEIGHT_CONFIG = gql`
  mutation CreateEvaluationWeightConfig($createEvaluationWeightConfigInput: CreateEvaluationWeightConfigInput!) {
    createEvaluationWeightConfig(createEvaluationWeightConfigInput: $createEvaluationWeightConfigInput) {
      evaluationWeightConfigId
      relationType
      weightPercent
      evaluationCycle {
        evaluationCycleId
        name
      }
      createdAt
    }
  }
`;

export const UPDATE_EVALUATION_WEIGHT_CONFIG = gql`
  mutation UpdateEvaluationWeightConfig($updateEvaluationWeightConfigInput: UpdateEvaluationWeightConfigInput!) {
    updateEvaluationWeightConfig(updateEvaluationWeightConfigInput: $updateEvaluationWeightConfigInput) {
      evaluationWeightConfigId
      relationType
      weightPercent
      updatedAt
    }
  }
`;

export const REMOVE_EVALUATION_WEIGHT_CONFIG = gql`
  mutation RemoveEvaluationWeightConfig($evaluationWeightConfigId: ID!) {
    removeEvaluationWeightConfig(evaluationWeightConfigId: $evaluationWeightConfigId) {
      evaluationWeightConfigId
    }
  }
`;

/**
 * Bulk Assign Evaluators Mutation
 */
export const BULK_ASSIGN_EVALUATORS = gql`
  mutation BulkAssignEvaluators($bulkAssignEvaluatorsInput: BulkAssignEvaluatorsInput!) {
    bulkAssignEvaluators(bulkAssignEvaluatorsInput: $bulkAssignEvaluatorsInput) {
      totalCreated
      totalSkipped
      totalErrors
      success
      errors
    }
  }
`;
