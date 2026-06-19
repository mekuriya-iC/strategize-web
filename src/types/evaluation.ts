/**
 * Evaluation System Types
 */

export enum EvaluationCycleStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum EvaluationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  COMPLETED = 'COMPLETED',
}

export enum EvaluationRelationType {
  SELF = 'SELF',
  SUPERVISOR = 'SUPERVISOR',
  PEER = 'PEER',
  SUBORDINATE = 'SUBORDINATE',
}

export interface EvaluationCycle {
  evaluationCycleId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: EvaluationCycleStatus;
  strategicPeriod?: {
    strategicPeriodId: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  createdBy: {
    employeeId: string;
    fullName: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CoreCompetency {
  coreCompetencyId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: {
    employeeId: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Competency {
  competencyId: string;
  name: string;
  description?: string;
  isActive: boolean;
  coreCompetency: {
    coreCompetencyId: string;
    name: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyIndicator {
  competencyIndicatorId: string;
  description: string;
  ratingScaleMin: number;
  ratingScaleMax: number;
  competency: {
    competencyId: string;
    name: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyPositionAssignment {
  competencyPositionAssignmentId: string;
  isMandatory: boolean;
  competency: Competency;
  position: {
    positionId: string;
    title: string;
  };
  createdBy: {
    employeeId: string;
    fullName: string;
  };
  createdAt: string;
}

export interface CompetencyAssessment {
  competencyAssessmentId: string;
  status: EvaluationStatus;
  relationType: EvaluationRelationType;
  overallComment?: string;
  submittedAt?: string;
  evaluatee: {
    employeeId: string;
    fullName: string;
    email: string;
    title: string;
    picture?: string;
  };
  evaluator: {
    employeeId: string;
    fullName: string;
    email: string;
    picture?: string;
  };
  evaluationCycle: {
    evaluationCycleId: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: EvaluationCycleStatus;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResponse {
  assessmentResponseId: string;
  ratingValue: number;
  comment?: string;
  competencyIndicator: CompetencyIndicator;
  competencyAssessment: {
    competencyAssessmentId: string;
    status: EvaluationStatus;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationWeightConfig {
  evaluationWeightConfigId: string;
  relationType: EvaluationRelationType;
  weightPercent: number;
  evaluationCycle: {
    evaluationCycleId: string;
    name: string;
  };
  createdBy: {
    employeeId: string;
    fullName: string;
  };
  createdAt: string;
}

// Input types for mutations
export interface CreateEvaluationCycleInput {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: EvaluationCycleStatus;
  strategicPeriodId?: string;
  organizationId: string;
  totalEvaluationWeight?: number;
}

export interface UpdateEvaluationCycleInput {
  evaluationCycleId: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: EvaluationCycleStatus;
}

export interface CreateCompetencyAssessmentInput {
  evaluationCycleId: string;
  evaluateeUserId: string;
  evaluatorUserId: string;
  relationType: EvaluationRelationType;
  organizationId: string;
}

export interface UpdateCompetencyAssessmentInput {
  competencyAssessmentId: string;
  status?: EvaluationStatus;
  overallComment?: string;
  submittedAt?: string;
}

export interface CreateAssessmentResponseInput {
  competencyAssessmentId: string;
  competencyIndicatorId: string;
  ratingValue: number;
  comment?: string;
  organizationId: string;
}

export interface UpdateAssessmentResponseInput {
  assessmentResponseId: string;
  ratingValue?: number;
  comment?: string;
}

export interface CreateCoreCompetencyInput {
  name: string;
  description?: string;
  isActive?: boolean;
  organizationId: string;
}

export interface UpdateCoreCompetencyInput {
  coreCompetencyId: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateCompetencyInput {
  name: string;
  description?: string;
  coreCompetencyId: string;
  isActive?: boolean;
  organizationId: string;
}

export interface UpdateCompetencyInput {
  competencyId: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateCompetencyIndicatorInput {
  competencyId: string;
  description: string;
  ratingScaleMin: number;
  ratingScaleMax: number;
}

export interface UpdateCompetencyIndicatorInput {
  competencyIndicatorId: string;
  description?: string;
  ratingScaleMin?: number;
  ratingScaleMax?: number;
}

export interface CreateCompetencyPositionAssignmentInput {
  competencyId: string;
  positionId: string;
  isMandatory: boolean;
  organizationId: string;
}

export interface CreateEvaluationWeightConfigInput {
  evaluationCycleId: string;
  relationType: EvaluationRelationType;
  weightPercent: number;
  organizationId: string;
}

export interface UpdateEvaluationWeightConfigInput {
  evaluationWeightConfigId: string;
  relationType?: EvaluationRelationType;
  weightPercent?: number;
}
