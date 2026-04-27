/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

export type Activity = {
  activityId: Scalars['ID']['output'];
  assignedTo?: Maybe<Employee>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  initiative: Initiative;
  isDeleted: Scalars['Boolean']['output'];
  milestone: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['String']['output']>;
  status: TaskStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum ActivityEventType {
  ActivityCreated = 'ACTIVITY_CREATED',
  ActivityDeleted = 'ACTIVITY_DELETED',
  ActivityStatusChanged = 'ACTIVITY_STATUS_CHANGED',
  ActivityUpdated = 'ACTIVITY_UPDATED',
  ApprovalGranted = 'APPROVAL_GRANTED',
  ApprovalRejectedAction = 'APPROVAL_REJECTED_ACTION',
  ApprovalSubmitted = 'APPROVAL_SUBMITTED',
  CheckinAutoRejected = 'CHECKIN_AUTO_REJECTED',
  CheckinSessionOpened = 'CHECKIN_SESSION_OPENED',
  CheckinSessionReviewed = 'CHECKIN_SESSION_REVIEWED',
  CheckinSubmitted = 'CHECKIN_SUBMITTED',
  CheckinTaskAdded = 'CHECKIN_TASK_ADDED',
  CheckinTaskApproved = 'CHECKIN_TASK_APPROVED',
  CheckinTaskRejected = 'CHECKIN_TASK_REJECTED',
  CheckinTaskUpdated = 'CHECKIN_TASK_UPDATED',
  CheckoutSubmitted = 'CHECKOUT_SUBMITTED',
  CompetencyAssignedPosition = 'COMPETENCY_ASSIGNED_POSITION',
  CompetencyCreated = 'COMPETENCY_CREATED',
  CompetencyIndicatorAdded = 'COMPETENCY_INDICATOR_ADDED',
  CompetencyUpdated = 'COMPETENCY_UPDATED',
  CustomRoleCreated = 'CUSTOM_ROLE_CREATED',
  CustomRoleDeleted = 'CUSTOM_ROLE_DELETED',
  CustomRoleUpdated = 'CUSTOM_ROLE_UPDATED',
  DepartmentCreated = 'DEPARTMENT_CREATED',
  DepartmentUpdated = 'DEPARTMENT_UPDATED',
  DivisionCreated = 'DIVISION_CREATED',
  DivisionUpdated = 'DIVISION_UPDATED',
  EmailVerified = 'EMAIL_VERIFIED',
  EvaluationAssigned = 'EVALUATION_ASSIGNED',
  EvaluationCycleClosed = 'EVALUATION_CYCLE_CLOSED',
  EvaluationCycleCreated = 'EVALUATION_CYCLE_CREATED',
  EvaluationCycleOpened = 'EVALUATION_CYCLE_OPENED',
  EvaluationStarted = 'EVALUATION_STARTED',
  EvaluationSubmitted = 'EVALUATION_SUBMITTED',
  EvaluationWeightConfigured = 'EVALUATION_WEIGHT_CONFIGURED',
  FileDeleted = 'FILE_DELETED',
  FileUploaded = 'FILE_UPLOADED',
  InitiativeCompleted = 'INITIATIVE_COMPLETED',
  InitiativeCreated = 'INITIATIVE_CREATED',
  InitiativeDeleted = 'INITIATIVE_DELETED',
  InitiativeUpdated = 'INITIATIVE_UPDATED',
  KpiAssignedDepartment = 'KPI_ASSIGNED_DEPARTMENT',
  KpiAssignedDivision = 'KPI_ASSIGNED_DIVISION',
  KpiAssignedEmployee = 'KPI_ASSIGNED_EMPLOYEE',
  KpiCreated = 'KPI_CREATED',
  KpiDeleted = 'KPI_DELETED',
  KpiUpdated = 'KPI_UPDATED',
  KpiUpdateApproved = 'KPI_UPDATE_APPROVED',
  KpiUpdateRejected = 'KPI_UPDATE_REJECTED',
  KpiUpdateSubmitted = 'KPI_UPDATE_SUBMITTED',
  KpiWeightChanged = 'KPI_WEIGHT_CHANGED',
  LogbookEntryApproved = 'LOGBOOK_ENTRY_APPROVED',
  LogbookEntryCreated = 'LOGBOOK_ENTRY_CREATED',
  LogbookEntryDeleted = 'LOGBOOK_ENTRY_DELETED',
  LogbookEntryRejected = 'LOGBOOK_ENTRY_REJECTED',
  LogbookEntrySubmitted = 'LOGBOOK_ENTRY_SUBMITTED',
  LogbookEntryUpdated = 'LOGBOOK_ENTRY_UPDATED',
  NotificationConfigUpdated = 'NOTIFICATION_CONFIG_UPDATED',
  ObjectiveAdjusted = 'OBJECTIVE_ADJUSTED',
  ObjectiveApproved = 'OBJECTIVE_APPROVED',
  ObjectiveCascaded = 'OBJECTIVE_CASCADED',
  ObjectiveCreated = 'OBJECTIVE_CREATED',
  ObjectiveDeleted = 'OBJECTIVE_DELETED',
  ObjectiveRejected = 'OBJECTIVE_REJECTED',
  ObjectiveSubmitted = 'OBJECTIVE_SUBMITTED',
  ObjectiveUpdated = 'OBJECTIVE_UPDATED',
  OrganizationCreated = 'ORGANIZATION_CREATED',
  OrganizationUpdated = 'ORGANIZATION_UPDATED',
  PasswordResetCompleted = 'PASSWORD_RESET_COMPLETED',
  PasswordResetRequested = 'PASSWORD_RESET_REQUESTED',
  PerformanceScoreComputed = 'PERFORMANCE_SCORE_COMPUTED',
  PerformanceWeightConfigured = 'PERFORMANCE_WEIGHT_CONFIGURED',
  PeriodArchived = 'PERIOD_ARCHIVED',
  PeriodClosed = 'PERIOD_CLOSED',
  PeriodCreated = 'PERIOD_CREATED',
  PeriodOpened = 'PERIOD_OPENED',
  PermissionGranted = 'PERMISSION_GRANTED',
  PermissionRevoked = 'PERMISSION_REVOKED',
  PillarCreated = 'PILLAR_CREATED',
  PillarUpdated = 'PILLAR_UPDATED',
  PositionCreated = 'POSITION_CREATED',
  PositionUpdated = 'POSITION_UPDATED',
  ReportExported = 'REPORT_EXPORTED',
  ReportGenerated = 'REPORT_GENERATED',
  RoleAssignedToUser = 'ROLE_ASSIGNED_TO_USER',
  SharedKpiParticipantAdded = 'SHARED_KPI_PARTICIPANT_ADDED',
  SharedKpiParticipantRemoved = 'SHARED_KPI_PARTICIPANT_REMOVED',
  StrategicPlanApproved = 'STRATEGIC_PLAN_APPROVED',
  StrategicPlanArchived = 'STRATEGIC_PLAN_ARCHIVED',
  StrategicPlanCreated = 'STRATEGIC_PLAN_CREATED',
  StrategicPlanUpdated = 'STRATEGIC_PLAN_UPDATED',
  SystemConfigUpdated = 'SYSTEM_CONFIG_UPDATED',
  TeamCreated = 'TEAM_CREATED',
  TeamUpdated = 'TEAM_UPDATED',
  UserAssignedToDept = 'USER_ASSIGNED_TO_DEPT',
  UserCreated = 'USER_CREATED',
  UserDeactivated = 'USER_DEACTIVATED',
  UserLogin = 'USER_LOGIN',
  UserLoginFailed = 'USER_LOGIN_FAILED',
  UserLogout = 'USER_LOGOUT',
  UserReactivated = 'USER_REACTIVATED',
  UserRoleChanged = 'USER_ROLE_CHANGED',
  UserUpdated = 'USER_UPDATED'
}

export type ActivityLog = {
  actionDetail?: Maybe<Scalars['String']['output']>;
  actionSummary: Scalars['String']['output'];
  activityLogId: Scalars['ID']['output'];
  browser?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  entityId?: Maybe<Scalars['ID']['output']>;
  entityLabel?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  eventType: ActivityEventType;
  failureReason?: Maybe<Scalars['String']['output']>;
  httpStatusCode?: Maybe<Scalars['Int']['output']>;
  ipAddress: Scalars['String']['output'];
  isSuccessful: Scalars['Boolean']['output'];
  module: SystemModule;
  userAgent: Scalars['String']['output'];
  userEmail?: Maybe<Scalars['String']['output']>;
};

export type AggregatePerformanceResult = {
  aggregatePerformanceResultId: Scalars['ID']['output'];
  aggregateScore: Scalars['Float']['output'];
  competencyScore?: Maybe<Scalars['Float']['output']>;
  computedAt: Scalars['DateTime']['output'];
  createdAt: Scalars['DateTime']['output'];
  individualKpiScore?: Maybe<Scalars['Float']['output']>;
  sharedKpiScore?: Maybe<Scalars['Float']['output']>;
  strategicPeriod: StrategicPeriod;
  updatedAt: Scalars['DateTime']['output'];
  user: Employee;
  weightConfig: PerformanceWeightConfig;
};

export enum ApprovalAction {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  RevisionRequested = 'REVISION_REQUESTED'
}

export type ApprovalWorkflow = {
  action: ApprovalAction;
  approvalWorkflowId: Scalars['ID']['output'];
  comments?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  entityId: Scalars['ID']['output'];
  entityType: Scalars['String']['output'];
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<Employee>;
  submittedAt: Scalars['DateTime']['output'];
  submittedBy: Employee;
  updatedAt: Scalars['DateTime']['output'];
};

export type AssessmentResponse = {
  assessment: CompetencyAssessment;
  assessmentResponseId: Scalars['ID']['output'];
  comment?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  indicator: CompetencyIndicator;
  rating: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AssignObjectiveInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeType: AssigneeType;
  assignerId?: InputMaybe<Scalars['ID']['input']>;
  kpis: Array<Scalars['ID']['input']>;
  objectiveId: Scalars['ID']['input'];
};

export enum AssigneeType {
  Department = 'DEPARTMENT',
  Division = 'DIVISION',
  Personnel = 'PERSONNEL'
}

export enum AuditAction {
  Approve = 'APPROVE',
  CascadeAssign = 'CASCADE_ASSIGN',
  Create = 'CREATE',
  Delete = 'DELETE',
  KpiUpdate = 'KPI_UPDATE',
  LogbookSign = 'LOGBOOK_SIGN',
  Login = 'LOGIN',
  Logout = 'LOGOUT',
  Reject = 'REJECT',
  RoleChange = 'ROLE_CHANGE',
  Update = 'UPDATE'
}

export type AuditLog = {
  action: AuditAction;
  auditLogId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  entityId?: Maybe<Scalars['ID']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type AuthPayload = {
  accessToken: Scalars['String']['output'];
  employee: Employee;
};

export enum CascadeStatus {
  Adjusted = 'ADJUSTED',
  Approved = 'APPROVED',
  PendingAdjustment = 'PENDING_ADJUSTMENT',
  Rejected = 'REJECTED',
  SubmittedForApproval = 'SUBMITTED_FOR_APPROVAL'
}

export type CheckinoutSession = {
  checkinSubmittedAt?: Maybe<Scalars['DateTime']['output']>;
  checkinoutSessionId: Scalars['ID']['output'];
  checkoutSubmittedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  employee: Employee;
  overallRating?: Maybe<Scalars['Float']['output']>;
  overallStatus: CheckinoutStatus;
  strategicPeriod: StrategicPeriod;
  supervisor: Employee;
  supervisorComment?: Maybe<Scalars['String']['output']>;
  supervisorReviewAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  weekEndDate: Scalars['String']['output'];
  weekStartDate: Scalars['String']['output'];
};

export enum CheckinoutStatus {
  Approved = 'APPROVED',
  Open = 'OPEN',
  Rejected = 'REJECTED',
  Reviewed = 'REVIEWED',
  Submitted = 'SUBMITTED'
}

export type CheckinoutTask = {
  achievedDescription?: Maybe<Scalars['String']['output']>;
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedBy?: Maybe<Employee>;
  autoRejectedAt?: Maybe<Scalars['DateTime']['output']>;
  challenges?: Maybe<Scalars['String']['output']>;
  checkinoutTaskId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  evidenceUrl?: Maybe<Scalars['String']['output']>;
  nextSteps?: Maybe<Scalars['String']['output']>;
  plannedDescription?: Maybe<Scalars['String']['output']>;
  relatedTo?: Maybe<Employee>;
  requiresApproval: Scalars['Boolean']['output'];
  session: CheckinoutSession;
  taskEndDate: Scalars['DateTime']['output'];
  taskLinkType: TaskLinkType;
  taskStartDate: Scalars['DateTime']['output'];
  taskStatus: TaskStatus;
  taskTitle: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Competency = {
  competencyId: Scalars['ID']['output'];
  coreCompetency: CoreCompetency;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CompetencyAssessment = {
  competencyAssessmentId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  evaluatee: Employee;
  evaluationCycle: EvaluationCycle;
  evaluator: Employee;
  overallComment?: Maybe<Scalars['String']['output']>;
  relationType: EvaluationRelationType;
  status: EvaluationStatus;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type CompetencyIndicator = {
  competency: Competency;
  competencyIndicatorId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  ratingScaleMax: Scalars['Int']['output'];
  ratingScaleMin: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CompetencyPositionAssignment = {
  competency: Competency;
  competencyPositionAssignmentId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  isMandatory: Scalars['Boolean']['output'];
  position: Position;
};

export type CoreCompetency = {
  coreCompetencyId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CreateActivityInput = {
  assignedToUserId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  initiativeId: Scalars['ID']['input'];
  milestone?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TaskStatus>;
  title: Scalars['String']['input'];
};

export type CreateActivityLogInput = {
  actionDetail?: InputMaybe<Scalars['String']['input']>;
  actionSummary: Scalars['String']['input'];
  browser?: InputMaybe<Scalars['String']['input']>;
  entityId?: InputMaybe<Scalars['ID']['input']>;
  entityLabel?: InputMaybe<Scalars['String']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  eventType: ActivityEventType;
  failureReason?: InputMaybe<Scalars['String']['input']>;
  httpStatusCode?: InputMaybe<Scalars['Int']['input']>;
  ipAddress: Scalars['String']['input'];
  isSuccessful?: InputMaybe<Scalars['Boolean']['input']>;
  module: SystemModule;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  userAgent: Scalars['String']['input'];
  userEmail?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateAggregatePerformanceResultInput = {
  aggregateScore: Scalars['Float']['input'];
  competencyScore?: InputMaybe<Scalars['Float']['input']>;
  individualKpiScore?: InputMaybe<Scalars['Float']['input']>;
  organizationId: Scalars['ID']['input'];
  sharedKpiScore?: InputMaybe<Scalars['Float']['input']>;
  strategicPeriodId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
  weightConfigId: Scalars['ID']['input'];
};

export type CreateApprovalWorkflowInput = {
  entityId: Scalars['ID']['input'];
  entityType: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  submittedById?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateAssessmentResponseInput = {
  assessmentId: Scalars['ID']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  indicatorId: Scalars['ID']['input'];
  rating: Scalars['Int']['input'];
};

export type CreateAuditLogInput = {
  action: AuditAction;
  entityId?: InputMaybe<Scalars['ID']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateCheckinoutSessionInput = {
  employeeUserId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  strategicPeriodId: Scalars['ID']['input'];
  supervisorUserId: Scalars['ID']['input'];
  weekEndDate: Scalars['String']['input'];
  weekStartDate: Scalars['String']['input'];
};

export type CreateCheckinoutTaskInput = {
  achievedDescription?: InputMaybe<Scalars['String']['input']>;
  challenges?: InputMaybe<Scalars['String']['input']>;
  evidenceUrl?: InputMaybe<Scalars['String']['input']>;
  linkedInitiativeId?: InputMaybe<Scalars['ID']['input']>;
  linkedKpiId?: InputMaybe<Scalars['ID']['input']>;
  linkedObjectiveId?: InputMaybe<Scalars['ID']['input']>;
  nextSteps?: InputMaybe<Scalars['String']['input']>;
  plannedDescription?: InputMaybe<Scalars['String']['input']>;
  relatedToEmployeeId?: InputMaybe<Scalars['ID']['input']>;
  requiresApproval?: InputMaybe<Scalars['Boolean']['input']>;
  sessionId: Scalars['ID']['input'];
  taskEndDate: Scalars['DateTime']['input'];
  taskLinkType: TaskLinkType;
  taskStartDate: Scalars['DateTime']['input'];
  taskStatus?: InputMaybe<TaskStatus>;
  taskTitle: Scalars['String']['input'];
};

export type CreateCompetencyAssessmentInput = {
  evaluateeUserId: Scalars['ID']['input'];
  evaluationCycleId: Scalars['ID']['input'];
  evaluatorUserId: Scalars['ID']['input'];
  relationType: EvaluationRelationType;
};

export type CreateCompetencyIndicatorInput = {
  competencyId: Scalars['ID']['input'];
  description: Scalars['String']['input'];
  ratingScaleMax?: InputMaybe<Scalars['Int']['input']>;
  ratingScaleMin?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateCompetencyInput = {
  coreCompetencyId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};

export type CreateCompetencyPositionAssignmentInput = {
  competencyId: Scalars['ID']['input'];
  isMandatory?: InputMaybe<Scalars['Boolean']['input']>;
  positionId: Scalars['ID']['input'];
};

export type CreateCoreCompetencyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};

export type CreateDepartmentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  divisionId?: InputMaybe<Scalars['ID']['input']>;
  headUserId?: InputMaybe<Scalars['ID']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};

export type CreateDivisionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  headUserId?: InputMaybe<Scalars['ID']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  parentDivisionId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateEmployeeInput = {
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
  picture: Scalars['String']['input'];
  role: EmployeeRole;
  startDate: Scalars['String']['input'];
  status: EmployeeStatus;
  title: Scalars['String']['input'];
};

export type CreateEvaluationCycleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['String']['input'];
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  startDate: Scalars['String']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateEvaluationWeightConfigInput = {
  evaluationCycleId: Scalars['ID']['input'];
  relationType: EvaluationRelationType;
  weightPercent: Scalars['Float']['input'];
};

export type CreateFileAttachmentInput = {
  fileName: Scalars['String']['input'];
  fileSizeBytes?: InputMaybe<Scalars['Int']['input']>;
  fileType?: InputMaybe<Scalars['String']['input']>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  organizationId: Scalars['ID']['input'];
  relatedEntityId?: InputMaybe<Scalars['ID']['input']>;
  relatedEntityType?: InputMaybe<Scalars['String']['input']>;
  storageKey: Scalars['String']['input'];
  storageUrl: Scalars['String']['input'];
  uploadedByUserId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateInitiativeInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  ownerUserId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<InitiativeStatus>;
  strategicObjectiveId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type CreateKpiAssignmentDepartmentInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  departmentId: Scalars['ID']['input'];
  kpiId: Scalars['ID']['input'];
  strategicPeriodId: Scalars['ID']['input'];
  targetValue?: InputMaybe<Scalars['Float']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateKpiAssignmentDivisionInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  divisionId: Scalars['ID']['input'];
  kpiId: Scalars['ID']['input'];
  strategicPeriodId: Scalars['ID']['input'];
  targetValue?: InputMaybe<Scalars['Float']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateKpiAssignmentEmployeeInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  kpiId: Scalars['ID']['input'];
  strategicPeriodId: Scalars['ID']['input'];
  targetValue?: InputMaybe<Scalars['Float']['input']>;
  userId: Scalars['ID']['input'];
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateKpiInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeType?: InputMaybe<AssigneeType>;
  assignerId?: InputMaybe<Scalars['ID']['input']>;
  baseline?: InputMaybe<Scalars['Float']['input']>;
  baselineValue?: InputMaybe<Scalars['Float']['input']>;
  customUnitLabel?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  frequency: KpiFrequency;
  initiativeId?: InputMaybe<Scalars['ID']['input']>;
  kpiType?: InputMaybe<KpiType>;
  measurementUnit: KpiMeasurementUnit;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  strategicObjectiveId?: InputMaybe<Scalars['ID']['input']>;
  targetValue: Scalars['Float']['input'];
  targets?: InputMaybe<Array<KpiTargetInput>>;
  unitType?: InputMaybe<KpiUnitType>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateKpiUpdateInput = {
  achievedValue: Scalars['Float']['input'];
  evidenceUrl?: InputMaybe<Scalars['String']['input']>;
  kpiId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  progressPercentage: Scalars['Float']['input'];
  progressStatus: KpiProgressStatus;
  reportingDate: Scalars['String']['input'];
  strategicPeriodId: Scalars['ID']['input'];
};

export type CreateLogbookEntryInput = {
  activityDescription: Scalars['String']['input'];
  checkinoutTaskId?: InputMaybe<Scalars['ID']['input']>;
  decisionsMade?: InputMaybe<Scalars['String']['input']>;
  entryDate: Scalars['String']['input'];
  evidenceDescription?: InputMaybe<Scalars['String']['input']>;
  evidenceUrl?: InputMaybe<Scalars['String']['input']>;
  kpiAchievedValue?: InputMaybe<Scalars['Float']['input']>;
  kpiCompletionPercent?: InputMaybe<Scalars['Float']['input']>;
  kpiTargetValue?: InputMaybe<Scalars['Float']['input']>;
  lessonsLearned?: InputMaybe<Scalars['String']['input']>;
  linkedInitiativeId?: InputMaybe<Scalars['ID']['input']>;
  linkedKpiId?: InputMaybe<Scalars['ID']['input']>;
  linkedObjectiveId?: InputMaybe<Scalars['ID']['input']>;
  organizationId: Scalars['ID']['input'];
  risksIssues?: InputMaybe<Scalars['String']['input']>;
  strategicPeriodId: Scalars['ID']['input'];
};

export type CreateNotificationInput = {
  message: Scalars['String']['input'];
  notificationType: NotificationType;
  organizationId: Scalars['ID']['input'];
  recipientUserId: Scalars['ID']['input'];
  relatedEntityId?: InputMaybe<Scalars['ID']['input']>;
  relatedEntityType?: InputMaybe<Scalars['String']['input']>;
  senderUserId?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
};

export type CreateObjectiveInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeType?: InputMaybe<AssigneeType>;
  assignerId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  level: ObjectiveLevel;
  organizationId: Scalars['ID']['input'];
  ownerDepartmentId?: InputMaybe<Scalars['ID']['input']>;
  ownerDivisionId?: InputMaybe<Scalars['ID']['input']>;
  ownerTeamId?: InputMaybe<Scalars['ID']['input']>;
  ownerUserId?: InputMaybe<Scalars['ID']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  strategicPeriodId: Scalars['ID']['input'];
  strategicPillarId?: InputMaybe<Scalars['ID']['input']>;
  strategicPlanId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  type?: InputMaybe<ObjectiveType>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateOrganizationInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  industry?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  shortName?: InputMaybe<Scalars['String']['input']>;
  subscriptionActive?: InputMaybe<Scalars['Boolean']['input']>;
  subscriptionExpiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type CreatePerformanceWeightConfigInput = {
  competencyWeight: Scalars['Float']['input'];
  individualKpiWeight: Scalars['Float']['input'];
  organizationId: Scalars['ID']['input'];
  sharedKpiWeight: Scalars['Float']['input'];
  strategicPeriodId: Scalars['ID']['input'];
};

export type CreatePermissionDefinitionInput = {
  action: PermissionAction;
  code: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  isSystemDefault?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  module: SystemModule;
  scope: PermissionScope;
};

export type CreatePositionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  grade?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type CreateRoleAuditLogInput = {
  actionDescription: Scalars['String']['input'];
  actionType: Scalars['String']['input'];
  affectedPermissionId?: InputMaybe<Scalars['ID']['input']>;
  affectedRoleId?: InputMaybe<Scalars['ID']['input']>;
  affectedUserId?: InputMaybe<Scalars['ID']['input']>;
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  performedByUserId?: InputMaybe<Scalars['ID']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRoleInput = {
  code: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  isCustom?: InputMaybe<Scalars['Boolean']['input']>;
  isSystemRole?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  parentRoleId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateRolePermissionInput = {
  grantedById?: InputMaybe<Scalars['ID']['input']>;
  permissionId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};

export type CreateSharedKpiParticipantInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  contributionWeight?: InputMaybe<Scalars['Float']['input']>;
  kpiId: Scalars['ID']['input'];
  participantUserId: Scalars['ID']['input'];
  strategicPeriodId: Scalars['ID']['input'];
};

export type CreateStrategicPeriodInput = {
  endDate: Scalars['String']['input'];
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  periodType: StrategicPeriodType;
  startDate: Scalars['String']['input'];
  strategicPlanId: Scalars['ID']['input'];
};

export type CreateStrategicPillarInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  strategicPlanId: Scalars['ID']['input'];
};

export type CreateStrategicPlanInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  startDate: Scalars['String']['input'];
  title: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSubmissionInput = {
  itemId: Scalars['String']['input'];
  level: SubmissionLevel;
  reason?: InputMaybe<Scalars['String']['input']>;
  type: SubmissionType;
};

export type CreateSystemConfigurationInput = {
  checkinDayOfWeek?: InputMaybe<Scalars['Int']['input']>;
  checkoutDayOfWeek?: InputMaybe<Scalars['Int']['input']>;
  defaultRatingScaleMax?: InputMaybe<Scalars['Int']['input']>;
  defaultRatingScaleMin?: InputMaybe<Scalars['Int']['input']>;
  enableEmailNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  enableLogbookAttachments?: InputMaybe<Scalars['Boolean']['input']>;
  enableSharedKpis?: InputMaybe<Scalars['Boolean']['input']>;
  fiscalYearStartMonth?: InputMaybe<Scalars['Int']['input']>;
  organizationId: Scalars['ID']['input'];
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTeamInput = {
  departmentId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  teamLeadUserId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateUserPermissionOverrideInput = {
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  isGranted: Scalars['Boolean']['input'];
  organizationId: Scalars['ID']['input'];
  permissionId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};

export type CreateUserRoleAssignmentInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  isPrimary?: InputMaybe<Scalars['Boolean']['input']>;
  organizationId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type CreateUserSessionInput = {
  expiresAt: Scalars['DateTime']['input'];
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  tokenHash: Scalars['String']['input'];
  userAgent?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};

export type Department = {
  createdAt: Scalars['DateTime']['output'];
  departmentId: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  division?: Maybe<Division>;
  employees: Array<Employee>;
  head?: Maybe<Employee>;
  isActive: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Division = {
  createdAt: Scalars['DateTime']['output'];
  departments: Array<Department>;
  description?: Maybe<Scalars['String']['output']>;
  divisionId: Scalars['ID']['output'];
  head?: Maybe<Employee>;
  isActive: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  parentDivision?: Maybe<Division>;
  updatedAt: Scalars['DateTime']['output'];
};

export type Employee = {
  createdAt: Scalars['DateTime']['output'];
  departments: Array<Department>;
  email: Scalars['String']['output'];
  employeeId: Scalars['ID']['output'];
  fullName: Scalars['String']['output'];
  phoneNumber: Scalars['String']['output'];
  picture: Scalars['String']['output'];
  role: EmployeeRole;
  startDate: Scalars['String']['output'];
  status: EmployeeStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum EmployeeRole {
  Admin = 'ADMIN',
  Coordinator = 'COORDINATOR',
  Director = 'DIRECTOR',
  Manager = 'MANAGER',
  Normal = 'NORMAL',
  SuperAdmin = 'SUPER_ADMIN'
}

export enum EmployeeStatus {
  Active = 'ACTIVE',
  Deleted = 'DELETED',
  Disabled = 'DISABLED'
}

export type EvaluationCycle = {
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  description?: Maybe<Scalars['String']['output']>;
  endDate: Scalars['String']['output'];
  evaluationCycleId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  startDate: Scalars['String']['output'];
  status: EvaluationCycleStatus;
  strategicPeriod?: Maybe<StrategicPeriod>;
  updatedAt: Scalars['DateTime']['output'];
};

export enum EvaluationCycleStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Closed = 'CLOSED',
  Upcoming = 'UPCOMING'
}

export enum EvaluationRelationType {
  Peer = 'PEER',
  Self = 'SELF',
  Subordinate = 'SUBORDINATE',
  Supervisor = 'SUPERVISOR'
}

export enum EvaluationStatus {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED',
  Submitted = 'SUBMITTED'
}

export type EvaluationWeightConfig = {
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  evaluationCycle: EvaluationCycle;
  evaluationWeightConfigId: Scalars['ID']['output'];
  relationType: EvaluationRelationType;
  weightPercent: Scalars['Float']['output'];
};

export type FileAttachment = {
  createdAt: Scalars['DateTime']['output'];
  fileAttachmentId: Scalars['ID']['output'];
  fileName: Scalars['String']['output'];
  fileSizeBytes?: Maybe<Scalars['Int']['output']>;
  fileType?: Maybe<Scalars['String']['output']>;
  isPublic: Scalars['Boolean']['output'];
  relatedEntityId?: Maybe<Scalars['ID']['output']>;
  relatedEntityType?: Maybe<Scalars['String']['output']>;
  storageKey: Scalars['String']['output'];
  storageUrl: Scalars['String']['output'];
  uploadedBy: Employee;
};

export type Initiative = {
  completionPercentage: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  initiativeId: Scalars['ID']['output'];
  isDeleted: Scalars['Boolean']['output'];
  owner?: Maybe<Employee>;
  startDate?: Maybe<Scalars['String']['output']>;
  status: InitiativeStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum InitiativeStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Draft = 'DRAFT',
  OnHold = 'ON_HOLD'
}

export type Kpi = {
  assigneeId?: Maybe<Scalars['String']['output']>;
  assigneeType?: Maybe<AssigneeType>;
  assignerId?: Maybe<Scalars['String']['output']>;
  baseline?: Maybe<Scalars['Float']['output']>;
  baselineValue?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  customUnitLabel?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  frequency: KpiFrequency;
  isActive: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  kpiId: Scalars['ID']['output'];
  kpiType: KpiType;
  measurementUnit: KpiMeasurementUnit;
  name: Scalars['String']['output'];
  objective?: Maybe<Objective>;
  order: Scalars['Float']['output'];
  parent?: Maybe<Kpi>;
  status?: Maybe<KpiStatus>;
  targetStatus?: Maybe<KpiTargetStatus>;
  targetValue: Scalars['Float']['output'];
  targets?: Maybe<Array<KpiTarget>>;
  unitType?: Maybe<KpiUnitType>;
  updatedAt: Scalars['DateTime']['output'];
  weight?: Maybe<Scalars['Float']['output']>;
};

export type KpiAssignmentDepartment = {
  assignedBy?: Maybe<Employee>;
  createdAt: Scalars['DateTime']['output'];
  department: Department;
  kpi: Kpi;
  kpiAssignmentDepartmentId: Scalars['ID']['output'];
  strategicPeriod: StrategicPeriod;
  targetValue?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  weight?: Maybe<Scalars['Float']['output']>;
};

export type KpiAssignmentDivision = {
  assignedBy?: Maybe<Employee>;
  createdAt: Scalars['DateTime']['output'];
  division: Division;
  kpi: Kpi;
  kpiAssignmentDivisionId: Scalars['ID']['output'];
  strategicPeriod: StrategicPeriod;
  targetValue?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  weight?: Maybe<Scalars['Float']['output']>;
};

export type KpiAssignmentEmployee = {
  assignedBy?: Maybe<Employee>;
  createdAt: Scalars['DateTime']['output'];
  employee: Employee;
  kpi: Kpi;
  kpiAssignmentEmployeeId: Scalars['ID']['output'];
  strategicPeriod: StrategicPeriod;
  targetValue?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  weight?: Maybe<Scalars['Float']['output']>;
};

export enum KpiFrequency {
  Annual = 'ANNUAL',
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  SemiAnnual = 'SEMI_ANNUAL',
  Weekly = 'WEEKLY'
}

export enum KpiMeasurementUnit {
  Boolean = 'BOOLEAN',
  Currency = 'CURRENCY',
  Custom = 'CUSTOM',
  Number = 'NUMBER',
  Percentage = 'PERCENTAGE',
  Rating = 'RATING'
}

export enum KpiProgressStatus {
  AtRisk = 'AT_RISK',
  Completed = 'COMPLETED',
  NotStarted = 'NOT_STARTED',
  OffTrack = 'OFF_TRACK',
  OnTrack = 'ON_TRACK'
}

export enum KpiStatus {
  Approved = 'APPROVED',
  NotSubmitted = 'NOT_SUBMITTED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export type KpiTarget = {
  target: Scalars['Float']['output'];
  timeline: Scalars['String']['output'];
};

export type KpiTargetInput = {
  target: Scalars['Float']['input'];
  timeline: Scalars['String']['input'];
};

export enum KpiTargetStatus {
  Approved = 'APPROVED',
  NotSubmitted = 'NOT_SUBMITTED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum KpiType {
  Individual = 'INDIVIDUAL',
  Shared = 'SHARED'
}

export enum KpiUnitType {
  Number = 'NUMBER',
  Percent = 'PERCENT'
}

export type KpiUpdate = {
  achievedValue: Scalars['Float']['output'];
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedBy?: Maybe<Employee>;
  createdAt: Scalars['DateTime']['output'];
  evidenceUrl?: Maybe<Scalars['String']['output']>;
  kpi: Kpi;
  kpiUpdateId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  progressPercentage: Scalars['Float']['output'];
  progressStatus: KpiProgressStatus;
  reportedBy: Employee;
  reportingDate: Scalars['String']['output'];
  strategicPeriod: StrategicPeriod;
  updatedAt: Scalars['DateTime']['output'];
};

export type LogbookEntry = {
  activityDescription: Scalars['String']['output'];
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedBy?: Maybe<Employee>;
  createdAt: Scalars['DateTime']['output'];
  decisionsMade?: Maybe<Scalars['String']['output']>;
  entryDate: Scalars['String']['output'];
  entryStatus: LogbookEntryStatus;
  evidenceDescription?: Maybe<Scalars['String']['output']>;
  evidenceUrl?: Maybe<Scalars['String']['output']>;
  isDeleted: Scalars['Boolean']['output'];
  kpiAchievedValue?: Maybe<Scalars['Float']['output']>;
  kpiCompletionPercent?: Maybe<Scalars['Float']['output']>;
  kpiTargetValue?: Maybe<Scalars['Float']['output']>;
  lessonsLearned?: Maybe<Scalars['String']['output']>;
  logbookEntryId: Scalars['ID']['output'];
  owner: Employee;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  risksIssues?: Maybe<Scalars['String']['output']>;
  strategicPeriod: StrategicPeriod;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export enum LogbookEntryStatus {
  Approved = 'APPROVED',
  Draft = 'DRAFT',
  Rejected = 'REJECTED',
  Submitted = 'SUBMITTED'
}

export type LoginEmployeeInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Mutation = {
  addEmployeeToDepartment: Department;
  assignObjective: Objective;
  createActivity: Activity;
  createActivityLog: ActivityLog;
  createAggregatePerformanceResult: AggregatePerformanceResult;
  createApprovalWorkflow: ApprovalWorkflow;
  createAssessmentResponse: AssessmentResponse;
  createAuditLog: AuditLog;
  createCheckinoutSession: CheckinoutSession;
  createCheckinoutTask: CheckinoutTask;
  createCompetency: Competency;
  createCompetencyAssessment: CompetencyAssessment;
  createCompetencyIndicator: CompetencyIndicator;
  createCompetencyPositionAssignment: CompetencyPositionAssignment;
  createCoreCompetency: CoreCompetency;
  createDepartment: Department;
  createDivision: Division;
  createEmployee: Employee;
  createEvaluationCycle: EvaluationCycle;
  createEvaluationWeightConfig: EvaluationWeightConfig;
  createFileAttachment: FileAttachment;
  createInitiative: Initiative;
  createKpi: Kpi;
  createKpiAssignmentDepartment: KpiAssignmentDepartment;
  createKpiAssignmentDivision: KpiAssignmentDivision;
  createKpiAssignmentEmployee: KpiAssignmentEmployee;
  createKpiUpdate: KpiUpdate;
  createLogbookEntry: LogbookEntry;
  createNotification: Notification;
  createObjective: Objective;
  createOrganization: Organization;
  createPerformanceWeightConfig: PerformanceWeightConfig;
  createPermissionDefinition: PermissionDefinition;
  createPosition: Position;
  createRole: Role;
  createRoleAuditLog: RoleAuditLog;
  createRolePermission: RolePermission;
  createSharedKpiParticipant: SharedKpiParticipant;
  createStrategicPeriod: StrategicPeriod;
  createStrategicPillar: StrategicPillar;
  createStrategicPlan: StrategicPlan;
  createSubmission: Submission;
  createSubmissions: Array<Submission>;
  createSystemConfiguration: SystemConfiguration;
  createTeam: Team;
  createUserPermissionOverride: UserPermissionOverride;
  createUserRoleAssignment: UserRoleAssignment;
  createUserSession: UserSession;
  loginEmployee: AuthPayload;
  markAllNotificationsRead: Scalars['Boolean']['output'];
  removeActivity: Activity;
  removeAggregatePerformanceResult: AggregatePerformanceResult;
  removeApprovalWorkflow: ApprovalWorkflow;
  removeAssessmentResponse: AssessmentResponse;
  removeCheckinoutSession: CheckinoutSession;
  removeCheckinoutTask: CheckinoutTask;
  removeCompetency: Competency;
  removeCompetencyAssessment: CompetencyAssessment;
  removeCompetencyIndicator: CompetencyIndicator;
  removeCompetencyPositionAssignment: CompetencyPositionAssignment;
  removeCoreCompetency: CoreCompetency;
  removeDepartment: Department;
  removeDivision: Division;
  removeEmployee: Employee;
  removeEmployeeFromDepartment: Department;
  removeEvaluationCycle: EvaluationCycle;
  removeEvaluationWeightConfig: EvaluationWeightConfig;
  removeFileAttachment: FileAttachment;
  removeInitiative: Initiative;
  removeKpi: Kpi;
  removeKpiAssignmentDepartment: KpiAssignmentDepartment;
  removeKpiAssignmentDivision: KpiAssignmentDivision;
  removeKpiAssignmentEmployee: KpiAssignmentEmployee;
  removeKpiUpdate: KpiUpdate;
  removeLogbookEntry: LogbookEntry;
  removeNotification: Notification;
  removeObjective: Objective;
  removeOrganization: Organization;
  removePerformanceWeightConfig: PerformanceWeightConfig;
  removePermissionDefinition: PermissionDefinition;
  removePosition: Position;
  removeRole: Role;
  removeRolePermission: RolePermission;
  removeSharedKpiParticipant: SharedKpiParticipant;
  removeStrategicPeriod: StrategicPeriod;
  removeStrategicPillar: StrategicPillar;
  removeStrategicPlan: StrategicPlan;
  removeSubmission: Submission;
  removeSystemConfiguration: SystemConfiguration;
  removeTeam: Team;
  removeUserPermissionOverride: UserPermissionOverride;
  removeUserRoleAssignment: UserRoleAssignment;
  removeUserSession: UserSession;
  revokeUserSession: UserSession;
  updateActivity: Activity;
  updateAggregatePerformanceResult: AggregatePerformanceResult;
  updateApprovalWorkflow: ApprovalWorkflow;
  updateAssessmentResponse: AssessmentResponse;
  updateCheckinoutSession: CheckinoutSession;
  updateCheckinoutTask: CheckinoutTask;
  updateCompetency: Competency;
  updateCompetencyAssessment: CompetencyAssessment;
  updateCompetencyIndicator: CompetencyIndicator;
  updateCompetencyPositionAssignment: CompetencyPositionAssignment;
  updateCoreCompetency: CoreCompetency;
  updateDepartment: Department;
  updateDivision: Division;
  updateEmployee: Employee;
  updateEvaluationCycle: EvaluationCycle;
  updateEvaluationWeightConfig: EvaluationWeightConfig;
  updateFileAttachment: FileAttachment;
  updateInitiative: Initiative;
  updateKpi: Kpi;
  updateKpiAssignmentDepartment: KpiAssignmentDepartment;
  updateKpiAssignmentDivision: KpiAssignmentDivision;
  updateKpiAssignmentEmployee: KpiAssignmentEmployee;
  updateKpiUpdate: KpiUpdate;
  updateKpis: Array<Kpi>;
  updateLogbookEntry: LogbookEntry;
  updateNotification: Notification;
  updateObjective: Objective;
  updateObjectives: Array<Objective>;
  updateOrganization: Organization;
  updatePerformanceWeightConfig: PerformanceWeightConfig;
  updatePermissionDefinition: PermissionDefinition;
  updatePosition: Position;
  updateRole: Role;
  updateRolePermission: RolePermission;
  updateSharedKpiParticipant: SharedKpiParticipant;
  updateStrategicPeriod: StrategicPeriod;
  updateStrategicPillar: StrategicPillar;
  updateStrategicPlan: StrategicPlan;
  updateSubmission: Submission;
  updateSystemConfiguration: SystemConfiguration;
  updateTeam: Team;
  updateUserPermissionOverride: UserPermissionOverride;
  updateUserRoleAssignment: UserRoleAssignment;
};


export type MutationAddEmployeeToDepartmentArgs = {
  departmentId: Scalars['ID']['input'];
  employeeId: Scalars['ID']['input'];
};


export type MutationAssignObjectiveArgs = {
  assignObjectiveInput: AssignObjectiveInput;
};


export type MutationCreateActivityArgs = {
  createActivityInput: CreateActivityInput;
};


export type MutationCreateActivityLogArgs = {
  createActivityLogInput: CreateActivityLogInput;
};


export type MutationCreateAggregatePerformanceResultArgs = {
  createAggregatePerformanceResultInput: CreateAggregatePerformanceResultInput;
};


export type MutationCreateApprovalWorkflowArgs = {
  createApprovalWorkflowInput: CreateApprovalWorkflowInput;
};


export type MutationCreateAssessmentResponseArgs = {
  createAssessmentResponseInput: CreateAssessmentResponseInput;
};


export type MutationCreateAuditLogArgs = {
  createAuditLogInput: CreateAuditLogInput;
};


export type MutationCreateCheckinoutSessionArgs = {
  createCheckinoutSessionInput: CreateCheckinoutSessionInput;
};


export type MutationCreateCheckinoutTaskArgs = {
  createCheckinoutTaskInput: CreateCheckinoutTaskInput;
};


export type MutationCreateCompetencyArgs = {
  createCompetencyInput: CreateCompetencyInput;
};


export type MutationCreateCompetencyAssessmentArgs = {
  createCompetencyAssessmentInput: CreateCompetencyAssessmentInput;
};


export type MutationCreateCompetencyIndicatorArgs = {
  createCompetencyIndicatorInput: CreateCompetencyIndicatorInput;
};


export type MutationCreateCompetencyPositionAssignmentArgs = {
  createCompetencyPositionAssignmentInput: CreateCompetencyPositionAssignmentInput;
};


export type MutationCreateCoreCompetencyArgs = {
  createCoreCompetencyInput: CreateCoreCompetencyInput;
};


export type MutationCreateDepartmentArgs = {
  createDepartmentInput: CreateDepartmentInput;
};


export type MutationCreateDivisionArgs = {
  createDivisionInput: CreateDivisionInput;
};


export type MutationCreateEmployeeArgs = {
  createEmployeeInput: CreateEmployeeInput;
};


export type MutationCreateEvaluationCycleArgs = {
  createEvaluationCycleInput: CreateEvaluationCycleInput;
};


export type MutationCreateEvaluationWeightConfigArgs = {
  createEvaluationWeightConfigInput: CreateEvaluationWeightConfigInput;
};


export type MutationCreateFileAttachmentArgs = {
  createFileAttachmentInput: CreateFileAttachmentInput;
};


export type MutationCreateInitiativeArgs = {
  createInitiativeInput: CreateInitiativeInput;
};


export type MutationCreateKpiArgs = {
  createKpiInput: CreateKpiInput;
};


export type MutationCreateKpiAssignmentDepartmentArgs = {
  createKpiAssignmentDepartmentInput: CreateKpiAssignmentDepartmentInput;
};


export type MutationCreateKpiAssignmentDivisionArgs = {
  createKpiAssignmentDivisionInput: CreateKpiAssignmentDivisionInput;
};


export type MutationCreateKpiAssignmentEmployeeArgs = {
  createKpiAssignmentEmployeeInput: CreateKpiAssignmentEmployeeInput;
};


export type MutationCreateKpiUpdateArgs = {
  createKpiUpdateInput: CreateKpiUpdateInput;
};


export type MutationCreateLogbookEntryArgs = {
  createLogbookEntryInput: CreateLogbookEntryInput;
};


export type MutationCreateNotificationArgs = {
  createNotificationInput: CreateNotificationInput;
};


export type MutationCreateObjectiveArgs = {
  createObjectiveInput: CreateObjectiveInput;
};


export type MutationCreateOrganizationArgs = {
  createOrganizationInput: CreateOrganizationInput;
};


export type MutationCreatePerformanceWeightConfigArgs = {
  createPerformanceWeightConfigInput: CreatePerformanceWeightConfigInput;
};


export type MutationCreatePermissionDefinitionArgs = {
  createPermissionDefinitionInput: CreatePermissionDefinitionInput;
};


export type MutationCreatePositionArgs = {
  createPositionInput: CreatePositionInput;
};


export type MutationCreateRoleArgs = {
  createRoleInput: CreateRoleInput;
};


export type MutationCreateRoleAuditLogArgs = {
  createRoleAuditLogInput: CreateRoleAuditLogInput;
};


export type MutationCreateRolePermissionArgs = {
  createRolePermissionInput: CreateRolePermissionInput;
};


export type MutationCreateSharedKpiParticipantArgs = {
  createSharedKpiParticipantInput: CreateSharedKpiParticipantInput;
};


export type MutationCreateStrategicPeriodArgs = {
  createStrategicPeriodInput: CreateStrategicPeriodInput;
};


export type MutationCreateStrategicPillarArgs = {
  createStrategicPillarInput: CreateStrategicPillarInput;
};


export type MutationCreateStrategicPlanArgs = {
  createStrategicPlanInput: CreateStrategicPlanInput;
};


export type MutationCreateSubmissionArgs = {
  createSubmissionInput: CreateSubmissionInput;
};


export type MutationCreateSubmissionsArgs = {
  createSubmissionInputs: Array<CreateSubmissionInput>;
};


export type MutationCreateSystemConfigurationArgs = {
  createSystemConfigurationInput: CreateSystemConfigurationInput;
};


export type MutationCreateTeamArgs = {
  createTeamInput: CreateTeamInput;
};


export type MutationCreateUserPermissionOverrideArgs = {
  createUserPermissionOverrideInput: CreateUserPermissionOverrideInput;
};


export type MutationCreateUserRoleAssignmentArgs = {
  createUserRoleAssignmentInput: CreateUserRoleAssignmentInput;
};


export type MutationCreateUserSessionArgs = {
  createUserSessionInput: CreateUserSessionInput;
};


export type MutationLoginEmployeeArgs = {
  loginInput: LoginEmployeeInput;
};


export type MutationMarkAllNotificationsReadArgs = {
  recipientUserId: Scalars['ID']['input'];
};


export type MutationRemoveActivityArgs = {
  activityId: Scalars['ID']['input'];
};


export type MutationRemoveAggregatePerformanceResultArgs = {
  aggregatePerformanceResultId: Scalars['ID']['input'];
};


export type MutationRemoveApprovalWorkflowArgs = {
  approvalWorkflowId: Scalars['ID']['input'];
};


export type MutationRemoveAssessmentResponseArgs = {
  assessmentResponseId: Scalars['ID']['input'];
};


export type MutationRemoveCheckinoutSessionArgs = {
  checkinoutSessionId: Scalars['ID']['input'];
};


export type MutationRemoveCheckinoutTaskArgs = {
  checkinoutTaskId: Scalars['ID']['input'];
};


export type MutationRemoveCompetencyArgs = {
  competencyId: Scalars['ID']['input'];
};


export type MutationRemoveCompetencyAssessmentArgs = {
  competencyAssessmentId: Scalars['ID']['input'];
};


export type MutationRemoveCompetencyIndicatorArgs = {
  competencyIndicatorId: Scalars['ID']['input'];
};


export type MutationRemoveCompetencyPositionAssignmentArgs = {
  competencyPositionAssignmentId: Scalars['ID']['input'];
};


export type MutationRemoveCoreCompetencyArgs = {
  coreCompetencyId: Scalars['ID']['input'];
};


export type MutationRemoveDepartmentArgs = {
  departmentId: Scalars['ID']['input'];
};


export type MutationRemoveDivisionArgs = {
  divisionId: Scalars['ID']['input'];
};


export type MutationRemoveEmployeeArgs = {
  employeeId: Scalars['ID']['input'];
};


export type MutationRemoveEmployeeFromDepartmentArgs = {
  departmentId: Scalars['ID']['input'];
  employeeId: Scalars['ID']['input'];
};


export type MutationRemoveEvaluationCycleArgs = {
  evaluationCycleId: Scalars['ID']['input'];
};


export type MutationRemoveEvaluationWeightConfigArgs = {
  evaluationWeightConfigId: Scalars['ID']['input'];
};


export type MutationRemoveFileAttachmentArgs = {
  fileAttachmentId: Scalars['ID']['input'];
};


export type MutationRemoveInitiativeArgs = {
  initiativeId: Scalars['ID']['input'];
};


export type MutationRemoveKpiArgs = {
  kpiId: Scalars['ID']['input'];
};


export type MutationRemoveKpiAssignmentDepartmentArgs = {
  kpiAssignmentDepartmentId: Scalars['ID']['input'];
};


export type MutationRemoveKpiAssignmentDivisionArgs = {
  kpiAssignmentDivisionId: Scalars['ID']['input'];
};


export type MutationRemoveKpiAssignmentEmployeeArgs = {
  kpiAssignmentEmployeeId: Scalars['ID']['input'];
};


export type MutationRemoveKpiUpdateArgs = {
  kpiUpdateId: Scalars['ID']['input'];
};


export type MutationRemoveLogbookEntryArgs = {
  logbookEntryId: Scalars['ID']['input'];
};


export type MutationRemoveNotificationArgs = {
  notificationId: Scalars['ID']['input'];
};


export type MutationRemoveObjectiveArgs = {
  objectiveId: Scalars['ID']['input'];
};


export type MutationRemoveOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};


export type MutationRemovePerformanceWeightConfigArgs = {
  performanceWeightConfigId: Scalars['ID']['input'];
};


export type MutationRemovePermissionDefinitionArgs = {
  permissionDefinitionId: Scalars['ID']['input'];
};


export type MutationRemovePositionArgs = {
  positionId: Scalars['ID']['input'];
};


export type MutationRemoveRoleArgs = {
  roleId: Scalars['ID']['input'];
};


export type MutationRemoveRolePermissionArgs = {
  rolePermissionId: Scalars['ID']['input'];
};


export type MutationRemoveSharedKpiParticipantArgs = {
  sharedKpiParticipantId: Scalars['ID']['input'];
};


export type MutationRemoveStrategicPeriodArgs = {
  strategicPeriodId: Scalars['ID']['input'];
};


export type MutationRemoveStrategicPillarArgs = {
  strategicPillarId: Scalars['ID']['input'];
};


export type MutationRemoveStrategicPlanArgs = {
  strategicPlanId: Scalars['ID']['input'];
};


export type MutationRemoveSubmissionArgs = {
  submissionId: Scalars['ID']['input'];
};


export type MutationRemoveSystemConfigurationArgs = {
  systemConfigurationId: Scalars['ID']['input'];
};


export type MutationRemoveTeamArgs = {
  teamId: Scalars['ID']['input'];
};


export type MutationRemoveUserPermissionOverrideArgs = {
  userPermissionOverrideId: Scalars['ID']['input'];
};


export type MutationRemoveUserRoleAssignmentArgs = {
  userRoleAssignmentId: Scalars['ID']['input'];
};


export type MutationRemoveUserSessionArgs = {
  userSessionId: Scalars['ID']['input'];
};


export type MutationRevokeUserSessionArgs = {
  userSessionId: Scalars['ID']['input'];
};


export type MutationUpdateActivityArgs = {
  updateActivityInput: UpdateActivityInput;
};


export type MutationUpdateAggregatePerformanceResultArgs = {
  updateAggregatePerformanceResultInput: UpdateAggregatePerformanceResultInput;
};


export type MutationUpdateApprovalWorkflowArgs = {
  updateApprovalWorkflowInput: UpdateApprovalWorkflowInput;
};


export type MutationUpdateAssessmentResponseArgs = {
  updateAssessmentResponseInput: UpdateAssessmentResponseInput;
};


export type MutationUpdateCheckinoutSessionArgs = {
  updateCheckinoutSessionInput: UpdateCheckinoutSessionInput;
};


export type MutationUpdateCheckinoutTaskArgs = {
  updateCheckinoutTaskInput: UpdateCheckinoutTaskInput;
};


export type MutationUpdateCompetencyArgs = {
  updateCompetencyInput: UpdateCompetencyInput;
};


export type MutationUpdateCompetencyAssessmentArgs = {
  updateCompetencyAssessmentInput: UpdateCompetencyAssessmentInput;
};


export type MutationUpdateCompetencyIndicatorArgs = {
  updateCompetencyIndicatorInput: UpdateCompetencyIndicatorInput;
};


export type MutationUpdateCompetencyPositionAssignmentArgs = {
  updateCompetencyPositionAssignmentInput: UpdateCompetencyPositionAssignmentInput;
};


export type MutationUpdateCoreCompetencyArgs = {
  updateCoreCompetencyInput: UpdateCoreCompetencyInput;
};


export type MutationUpdateDepartmentArgs = {
  updateDepartmentInput: UpdateDepartmentInput;
};


export type MutationUpdateDivisionArgs = {
  updateDivisionInput: UpdateDivisionInput;
};


export type MutationUpdateEmployeeArgs = {
  updateEmployeeInput: UpdateEmployeeInput;
};


export type MutationUpdateEvaluationCycleArgs = {
  updateEvaluationCycleInput: UpdateEvaluationCycleInput;
};


export type MutationUpdateEvaluationWeightConfigArgs = {
  updateEvaluationWeightConfigInput: UpdateEvaluationWeightConfigInput;
};


export type MutationUpdateFileAttachmentArgs = {
  updateFileAttachmentInput: UpdateFileAttachmentInput;
};


export type MutationUpdateInitiativeArgs = {
  updateInitiativeInput: UpdateInitiativeInput;
};


export type MutationUpdateKpiArgs = {
  updateKpiInput: UpdateKpiInput;
};


export type MutationUpdateKpiAssignmentDepartmentArgs = {
  updateKpiAssignmentDepartmentInput: UpdateKpiAssignmentDepartmentInput;
};


export type MutationUpdateKpiAssignmentDivisionArgs = {
  updateKpiAssignmentDivisionInput: UpdateKpiAssignmentDivisionInput;
};


export type MutationUpdateKpiAssignmentEmployeeArgs = {
  updateKpiAssignmentEmployeeInput: UpdateKpiAssignmentEmployeeInput;
};


export type MutationUpdateKpiUpdateArgs = {
  updateKpiUpdateInput: UpdateKpiUpdateInput;
};


export type MutationUpdateKpisArgs = {
  updateKpiInputs: Array<UpdateKpiInput>;
};


export type MutationUpdateLogbookEntryArgs = {
  updateLogbookEntryInput: UpdateLogbookEntryInput;
};


export type MutationUpdateNotificationArgs = {
  updateNotificationInput: UpdateNotificationInput;
};


export type MutationUpdateObjectiveArgs = {
  updateObjectiveInput: UpdateObjectiveInput;
};


export type MutationUpdateObjectivesArgs = {
  updateObjectiveInputs: Array<UpdateObjectiveInput>;
};


export type MutationUpdateOrganizationArgs = {
  updateOrganizationInput: UpdateOrganizationInput;
};


export type MutationUpdatePerformanceWeightConfigArgs = {
  updatePerformanceWeightConfigInput: UpdatePerformanceWeightConfigInput;
};


export type MutationUpdatePermissionDefinitionArgs = {
  updatePermissionDefinitionInput: UpdatePermissionDefinitionInput;
};


export type MutationUpdatePositionArgs = {
  updatePositionInput: UpdatePositionInput;
};


export type MutationUpdateRoleArgs = {
  updateRoleInput: UpdateRoleInput;
};


export type MutationUpdateRolePermissionArgs = {
  updateRolePermissionInput: UpdateRolePermissionInput;
};


export type MutationUpdateSharedKpiParticipantArgs = {
  updateSharedKpiParticipantInput: UpdateSharedKpiParticipantInput;
};


export type MutationUpdateStrategicPeriodArgs = {
  updateStrategicPeriodInput: UpdateStrategicPeriodInput;
};


export type MutationUpdateStrategicPillarArgs = {
  updateStrategicPillarInput: UpdateStrategicPillarInput;
};


export type MutationUpdateStrategicPlanArgs = {
  updateStrategicPlanInput: UpdateStrategicPlanInput;
};


export type MutationUpdateSubmissionArgs = {
  updateSubmissionInput: UpdateSubmissionInput;
};


export type MutationUpdateSystemConfigurationArgs = {
  updateSystemConfigurationInput: UpdateSystemConfigurationInput;
};


export type MutationUpdateTeamArgs = {
  updateTeamInput: UpdateTeamInput;
};


export type MutationUpdateUserPermissionOverrideArgs = {
  updateUserPermissionOverrideInput: UpdateUserPermissionOverrideInput;
};


export type MutationUpdateUserRoleAssignmentArgs = {
  updateUserRoleAssignmentInput: UpdateUserRoleAssignmentInput;
};

export type Notification = {
  createdAt: Scalars['DateTime']['output'];
  message: Scalars['String']['output'];
  notificationId: Scalars['ID']['output'];
  notificationType: NotificationType;
  readAt?: Maybe<Scalars['DateTime']['output']>;
  recipient: Employee;
  relatedEntityId?: Maybe<Scalars['ID']['output']>;
  relatedEntityType?: Maybe<Scalars['String']['output']>;
  sender?: Maybe<Employee>;
  status: NotificationStatus;
  title: Scalars['String']['output'];
};

export enum NotificationStatus {
  Dismissed = 'DISMISSED',
  Read = 'READ',
  Unread = 'UNREAD'
}

export enum NotificationType {
  ApprovalRequest = 'APPROVAL_REQUEST',
  ApprovalResult = 'APPROVAL_RESULT',
  Assignment = 'ASSIGNMENT',
  CheckinReminder = 'CHECKIN_REMINDER',
  CheckoutReminder = 'CHECKOUT_REMINDER',
  DeadlineReminder = 'DEADLINE_REMINDER',
  EvaluationReminder = 'EVALUATION_REMINDER',
  KpiUpdate = 'KPI_UPDATE',
  OverdueAlert = 'OVERDUE_ALERT',
  SystemAlert = 'SYSTEM_ALERT'
}

export type Objective = {
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedBy?: Maybe<Employee>;
  assigneeId?: Maybe<Scalars['String']['output']>;
  assigneeType?: Maybe<AssigneeType>;
  assignerId?: Maybe<Scalars['String']['output']>;
  cascadeStatus: CascadeStatus;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  isDeleted: Scalars['Boolean']['output'];
  kpis?: Maybe<Array<Kpi>>;
  level: ObjectiveLevel;
  objectiveId: Scalars['ID']['output'];
  order: Scalars['Float']['output'];
  ownerUser?: Maybe<Employee>;
  parent?: Maybe<Objective>;
  status: ObjectiveStatus;
  strategicPeriod: StrategicPeriod;
  title: Scalars['String']['output'];
  type?: Maybe<ObjectiveType>;
  updatedAt: Scalars['DateTime']['output'];
  weight?: Maybe<Scalars['Float']['output']>;
};

export enum ObjectiveLevel {
  Corporate = 'CORPORATE',
  Department = 'DEPARTMENT',
  Division = 'DIVISION',
  Individual = 'INDIVIDUAL',
  Team = 'TEAM'
}

export enum ObjectiveStatus {
  Active = 'ACTIVE',
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Draft = 'DRAFT',
  NotSubmitted = 'NOT_SUBMITTED',
  OnHold = 'ON_HOLD',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum ObjectiveType {
  Corporate = 'CORPORATE',
  Department = 'DEPARTMENT',
  Division = 'DIVISION',
  Personnel = 'PERSONNEL'
}

export type Organization = {
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  industry?: Maybe<Scalars['String']['output']>;
  isDeleted: Scalars['Boolean']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  shortName?: Maybe<Scalars['String']['output']>;
  subscriptionActive: Scalars['Boolean']['output'];
  subscriptionExpiresAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  website?: Maybe<Scalars['String']['output']>;
};

export type PaginatedActivities = {
  items: Array<Activity>;
  meta: PaginationMeta;
};

export type PaginatedActivityLogs = {
  items: Array<ActivityLog>;
  meta: PaginationMeta;
};

export type PaginatedAggregatePerformanceResults = {
  items: Array<AggregatePerformanceResult>;
  meta: PaginationMeta;
};

export type PaginatedApprovalWorkflows = {
  items: Array<ApprovalWorkflow>;
  meta: PaginationMeta;
};

export type PaginatedAssessmentResponses = {
  items: Array<AssessmentResponse>;
  meta: PaginationMeta;
};

export type PaginatedAuditLogs = {
  items: Array<AuditLog>;
  meta: PaginationMeta;
};

export type PaginatedCheckinoutSessions = {
  items: Array<CheckinoutSession>;
  meta: PaginationMeta;
};

export type PaginatedCheckinoutTasks = {
  items: Array<CheckinoutTask>;
  meta: PaginationMeta;
};

export type PaginatedCompetencies = {
  items: Array<Competency>;
  meta: PaginationMeta;
};

export type PaginatedCompetencyAssessments = {
  items: Array<CompetencyAssessment>;
  meta: PaginationMeta;
};

export type PaginatedCompetencyIndicators = {
  items: Array<CompetencyIndicator>;
  meta: PaginationMeta;
};

export type PaginatedCompetencyPositionAssignments = {
  items: Array<CompetencyPositionAssignment>;
  meta: PaginationMeta;
};

export type PaginatedCoreCompetencies = {
  items: Array<CoreCompetency>;
  meta: PaginationMeta;
};

export type PaginatedDepartments = {
  items: Array<Department>;
  meta: PaginationMeta;
};

export type PaginatedDivisions = {
  items: Array<Division>;
  meta: PaginationMeta;
};

export type PaginatedEmployees = {
  items: Array<Employee>;
  meta: PaginationMeta;
};

export type PaginatedEvaluationCycles = {
  items: Array<EvaluationCycle>;
  meta: PaginationMeta;
};

export type PaginatedEvaluationWeightConfigs = {
  items: Array<EvaluationWeightConfig>;
  meta: PaginationMeta;
};

export type PaginatedFileAttachments = {
  items: Array<FileAttachment>;
  meta: PaginationMeta;
};

export type PaginatedInitiatives = {
  items: Array<Initiative>;
  meta: PaginationMeta;
};

export type PaginatedKpiAssignmentDepartments = {
  items: Array<KpiAssignmentDepartment>;
  meta: PaginationMeta;
};

export type PaginatedKpiAssignmentDivisions = {
  items: Array<KpiAssignmentDivision>;
  meta: PaginationMeta;
};

export type PaginatedKpiAssignmentEmployees = {
  items: Array<KpiAssignmentEmployee>;
  meta: PaginationMeta;
};

export type PaginatedKpiUpdates = {
  items: Array<KpiUpdate>;
  meta: PaginationMeta;
};

export type PaginatedKpis = {
  items: Array<Kpi>;
  meta: PaginationMeta;
};

export type PaginatedLogbookEntries = {
  items: Array<LogbookEntry>;
  meta: PaginationMeta;
};

export type PaginatedNotifications = {
  items: Array<Notification>;
  meta: PaginationMeta;
};

export type PaginatedObjectives = {
  items: Array<Objective>;
  meta: PaginationMeta;
};

export type PaginatedOrganizations = {
  items: Array<Organization>;
  meta: PaginationMeta;
};

export type PaginatedPerformanceWeightConfigs = {
  items: Array<PerformanceWeightConfig>;
  meta: PaginationMeta;
};

export type PaginatedPermissionDefinitions = {
  items: Array<PermissionDefinition>;
  meta: PaginationMeta;
};

export type PaginatedPositions = {
  items: Array<Position>;
  meta: PaginationMeta;
};

export type PaginatedRoleAuditLogs = {
  items: Array<RoleAuditLog>;
  meta: PaginationMeta;
};

export type PaginatedRolePermissions = {
  items: Array<RolePermission>;
  meta: PaginationMeta;
};

export type PaginatedRoles = {
  items: Array<Role>;
  meta: PaginationMeta;
};

export type PaginatedSharedKpiParticipants = {
  items: Array<SharedKpiParticipant>;
  meta: PaginationMeta;
};

export type PaginatedStrategicPeriods = {
  items: Array<StrategicPeriod>;
  meta: PaginationMeta;
};

export type PaginatedStrategicPillars = {
  items: Array<StrategicPillar>;
  meta: PaginationMeta;
};

export type PaginatedStrategicPlans = {
  items: Array<StrategicPlan>;
  meta: PaginationMeta;
};

export type PaginatedSubmissions = {
  items: Array<Submission>;
  meta: PaginationMeta;
};

export type PaginatedSystemConfigurations = {
  items: Array<SystemConfiguration>;
  meta: PaginationMeta;
};

export type PaginatedTeams = {
  items: Array<Team>;
  meta: PaginationMeta;
};

export type PaginatedUserPermissionOverrides = {
  items: Array<UserPermissionOverride>;
  meta: PaginationMeta;
};

export type PaginatedUserRoleAssignments = {
  items: Array<UserRoleAssignment>;
  meta: PaginationMeta;
};

export type PaginatedUserSessions = {
  items: Array<UserSession>;
  meta: PaginationMeta;
};

export type PaginationMeta = {
  currentPage: Scalars['Int']['output'];
  itemCount: Scalars['Int']['output'];
  itemsPerPage: Scalars['Int']['output'];
  totalItems: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PerformanceWeightConfig = {
  competencyWeight: Scalars['Float']['output'];
  configuredBy: Employee;
  createdAt: Scalars['DateTime']['output'];
  individualKpiWeight: Scalars['Float']['output'];
  performanceWeightConfigId: Scalars['ID']['output'];
  sharedKpiWeight: Scalars['Float']['output'];
  strategicPeriod: StrategicPeriod;
  updatedAt: Scalars['DateTime']['output'];
};

export enum PermissionAction {
  Approve = 'APPROVE',
  Assign = 'ASSIGN',
  Cascade = 'CASCADE',
  Configure = 'CONFIGURE',
  Create = 'CREATE',
  Delete = 'DELETE',
  Evaluate = 'EVALUATE',
  Export = 'EXPORT',
  Monitor = 'MONITOR',
  Read = 'READ',
  Reject = 'REJECT',
  Update = 'UPDATE'
}

export type PermissionDefinition = {
  action: PermissionAction;
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isSystemDefault: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  module: SystemModule;
  permissionDefinitionId: Scalars['ID']['output'];
  scope: PermissionScope;
  updatedAt: Scalars['DateTime']['output'];
};

export enum PermissionScope {
  Department = 'DEPARTMENT',
  Division = 'DIVISION',
  Organization = 'ORGANIZATION',
  Own = 'OWN',
  Platform = 'PLATFORM',
  Team = 'TEAM'
}

export type Position = {
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  grade?: Maybe<Scalars['String']['output']>;
  positionId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Query = {
  activities: PaginatedActivities;
  activity: Activity;
  activityLog: ActivityLog;
  activityLogs: PaginatedActivityLogs;
  aggregatePerformanceResult: AggregatePerformanceResult;
  aggregatePerformanceResults: PaginatedAggregatePerformanceResults;
  approvalWorkflow: ApprovalWorkflow;
  approvalWorkflows: PaginatedApprovalWorkflows;
  assessmentResponse: AssessmentResponse;
  assessmentResponses: PaginatedAssessmentResponses;
  auditLog: AuditLog;
  auditLogs: PaginatedAuditLogs;
  checkinoutSession: CheckinoutSession;
  checkinoutSessions: PaginatedCheckinoutSessions;
  checkinoutTask: CheckinoutTask;
  checkinoutTasks: PaginatedCheckinoutTasks;
  competencies: PaginatedCompetencies;
  competency: Competency;
  competencyAssessment: CompetencyAssessment;
  competencyAssessments: PaginatedCompetencyAssessments;
  competencyIndicator: CompetencyIndicator;
  competencyIndicators: PaginatedCompetencyIndicators;
  competencyPositionAssignment: CompetencyPositionAssignment;
  competencyPositionAssignments: PaginatedCompetencyPositionAssignments;
  coreCompetencies: PaginatedCoreCompetencies;
  coreCompetency: CoreCompetency;
  department: Department;
  departments: PaginatedDepartments;
  division: Division;
  divisions: PaginatedDivisions;
  employee: Employee;
  employees: PaginatedEmployees;
  evaluationCycle: EvaluationCycle;
  evaluationCycles: PaginatedEvaluationCycles;
  evaluationWeightConfig: EvaluationWeightConfig;
  evaluationWeightConfigs: PaginatedEvaluationWeightConfigs;
  fileAttachment: FileAttachment;
  fileAttachments: PaginatedFileAttachments;
  initiative: Initiative;
  initiatives: PaginatedInitiatives;
  kpi: Kpi;
  kpiAssignmentDepartment: KpiAssignmentDepartment;
  kpiAssignmentDivision: KpiAssignmentDivision;
  kpiAssignmentEmployee: KpiAssignmentEmployee;
  kpiAssignmentsDepartment: PaginatedKpiAssignmentDepartments;
  kpiAssignmentsDivision: PaginatedKpiAssignmentDivisions;
  kpiAssignmentsEmployee: PaginatedKpiAssignmentEmployees;
  kpiUpdate: KpiUpdate;
  kpiUpdates: PaginatedKpiUpdates;
  kpis: PaginatedKpis;
  logbookEntries: PaginatedLogbookEntries;
  logbookEntry: LogbookEntry;
  me: Employee;
  notification: Notification;
  notifications: PaginatedNotifications;
  objective: Objective;
  objectives: PaginatedObjectives;
  organization: Organization;
  organizations: PaginatedOrganizations;
  performanceWeightConfig: PerformanceWeightConfig;
  performanceWeightConfigs: PaginatedPerformanceWeightConfigs;
  permissionDefinition: PermissionDefinition;
  permissionDefinitions: PaginatedPermissionDefinitions;
  position: Position;
  positions: PaginatedPositions;
  role: Role;
  roleAuditLog: RoleAuditLog;
  roleAuditLogs: PaginatedRoleAuditLogs;
  rolePermission: RolePermission;
  rolePermissions: PaginatedRolePermissions;
  roles: PaginatedRoles;
  sharedKpiParticipant: SharedKpiParticipant;
  sharedKpiParticipants: PaginatedSharedKpiParticipants;
  strategicPeriod: StrategicPeriod;
  strategicPeriods: PaginatedStrategicPeriods;
  strategicPillar: StrategicPillar;
  strategicPillars: PaginatedStrategicPillars;
  strategicPlan: StrategicPlan;
  strategicPlans: PaginatedStrategicPlans;
  submission: Submission;
  submissions: PaginatedSubmissions;
  systemConfiguration: SystemConfiguration;
  systemConfigurationByOrg?: Maybe<SystemConfiguration>;
  systemConfigurations: PaginatedSystemConfigurations;
  team: Team;
  teams: PaginatedTeams;
  userPermissionOverride: UserPermissionOverride;
  userPermissionOverrides: PaginatedUserPermissionOverrides;
  userRoleAssignment: UserRoleAssignment;
  userRoleAssignments: PaginatedUserRoleAssignments;
  userSession: UserSession;
  userSessions: PaginatedUserSessions;
};


export type QueryActivitiesArgs = {
  initiativeId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryActivityArgs = {
  activityId: Scalars['ID']['input'];
};


export type QueryActivityLogArgs = {
  activityLogId: Scalars['ID']['input'];
};


export type QueryActivityLogsArgs = {
  entityType?: InputMaybe<Scalars['String']['input']>;
  eventType?: InputMaybe<ActivityEventType>;
  isSuccessful?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  module?: InputMaybe<SystemModule>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryAggregatePerformanceResultArgs = {
  aggregatePerformanceResultId: Scalars['ID']['input'];
};


export type QueryAggregatePerformanceResultsArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryApprovalWorkflowArgs = {
  approvalWorkflowId: Scalars['ID']['input'];
};


export type QueryApprovalWorkflowsArgs = {
  action?: InputMaybe<ApprovalAction>;
  entityId?: InputMaybe<Scalars['ID']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
};


export type QueryAssessmentResponseArgs = {
  assessmentResponseId: Scalars['ID']['input'];
};


export type QueryAssessmentResponsesArgs = {
  assessmentId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryAuditLogArgs = {
  auditLogId: Scalars['ID']['input'];
};


export type QueryAuditLogsArgs = {
  action?: InputMaybe<AuditAction>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryCheckinoutSessionArgs = {
  checkinoutSessionId: Scalars['ID']['input'];
};


export type QueryCheckinoutSessionsArgs = {
  employeeUserId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  overallStatus?: InputMaybe<CheckinoutStatus>;
  page: Scalars['Int']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  supervisorUserId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryCheckinoutTaskArgs = {
  checkinoutTaskId: Scalars['ID']['input'];
};


export type QueryCheckinoutTasksArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  sessionId?: InputMaybe<Scalars['ID']['input']>;
  taskStatus?: InputMaybe<TaskStatus>;
};


export type QueryCompetenciesArgs = {
  coreCompetencyId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCompetencyArgs = {
  competencyId: Scalars['ID']['input'];
};


export type QueryCompetencyAssessmentArgs = {
  competencyAssessmentId: Scalars['ID']['input'];
};


export type QueryCompetencyAssessmentsArgs = {
  evaluateeUserId?: InputMaybe<Scalars['ID']['input']>;
  evaluationCycleId?: InputMaybe<Scalars['ID']['input']>;
  evaluatorUserId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryCompetencyIndicatorArgs = {
  competencyIndicatorId: Scalars['ID']['input'];
};


export type QueryCompetencyIndicatorsArgs = {
  competencyId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryCompetencyPositionAssignmentArgs = {
  competencyPositionAssignmentId: Scalars['ID']['input'];
};


export type QueryCompetencyPositionAssignmentsArgs = {
  competencyId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  positionId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryCoreCompetenciesArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCoreCompetencyArgs = {
  coreCompetencyId: Scalars['ID']['input'];
};


export type QueryDepartmentArgs = {
  departmentId: Scalars['ID']['input'];
};


export type QueryDepartmentsArgs = {
  divisionId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDivisionArgs = {
  divisionId: Scalars['ID']['input'];
};


export type QueryDivisionsArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEmployeeArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeesArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEvaluationCycleArgs = {
  evaluationCycleId: Scalars['ID']['input'];
};


export type QueryEvaluationCyclesArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EvaluationCycleStatus>;
};


export type QueryEvaluationWeightConfigArgs = {
  evaluationWeightConfigId: Scalars['ID']['input'];
};


export type QueryEvaluationWeightConfigsArgs = {
  evaluationCycleId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryFileAttachmentArgs = {
  fileAttachmentId: Scalars['ID']['input'];
};


export type QueryFileAttachmentsArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  relatedEntityId?: InputMaybe<Scalars['ID']['input']>;
  relatedEntityType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryInitiativeArgs = {
  initiativeId: Scalars['ID']['input'];
};


export type QueryInitiativesArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<InitiativeStatus>;
  strategicObjectiveId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryKpiArgs = {
  kpiId: Scalars['ID']['input'];
};


export type QueryKpiAssignmentDepartmentArgs = {
  kpiAssignmentDepartmentId: Scalars['ID']['input'];
};


export type QueryKpiAssignmentDivisionArgs = {
  kpiAssignmentDivisionId: Scalars['ID']['input'];
};


export type QueryKpiAssignmentEmployeeArgs = {
  kpiAssignmentEmployeeId: Scalars['ID']['input'];
};


export type QueryKpiAssignmentsDepartmentArgs = {
  departmentId?: InputMaybe<Scalars['ID']['input']>;
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryKpiAssignmentsDivisionArgs = {
  divisionId?: InputMaybe<Scalars['ID']['input']>;
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryKpiAssignmentsEmployeeArgs = {
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryKpiUpdateArgs = {
  kpiUpdateId: Scalars['ID']['input'];
};


export type QueryKpiUpdatesArgs = {
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  reportedByUserId?: InputMaybe<Scalars['ID']['input']>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryKpisArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  strategicObjectiveId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryLogbookEntriesArgs = {
  entryStatus?: InputMaybe<LogbookEntryStatus>;
  limit: Scalars['Int']['input'];
  ownerUserId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryLogbookEntryArgs = {
  logbookEntryId: Scalars['ID']['input'];
};


export type QueryNotificationArgs = {
  notificationId: Scalars['ID']['input'];
};


export type QueryNotificationsArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  recipientUserId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<NotificationStatus>;
};


export type QueryObjectiveArgs = {
  objectiveId: Scalars['ID']['input'];
};


export type QueryObjectivesArgs = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};


export type QueryOrganizationsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPerformanceWeightConfigArgs = {
  performanceWeightConfigId: Scalars['ID']['input'];
};


export type QueryPerformanceWeightConfigsArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPermissionDefinitionArgs = {
  permissionDefinitionId: Scalars['ID']['input'];
};


export type QueryPermissionDefinitionsArgs = {
  action?: InputMaybe<PermissionAction>;
  limit: Scalars['Int']['input'];
  module?: InputMaybe<SystemModule>;
  page: Scalars['Int']['input'];
  scope?: InputMaybe<PermissionScope>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPositionArgs = {
  positionId: Scalars['ID']['input'];
};


export type QueryPositionsArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRoleArgs = {
  roleId: Scalars['ID']['input'];
};


export type QueryRoleAuditLogArgs = {
  roleAuditLogId: Scalars['ID']['input'];
};


export type QueryRoleAuditLogsArgs = {
  affectedRoleId?: InputMaybe<Scalars['ID']['input']>;
  affectedUserId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  performedByUserId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRolePermissionArgs = {
  rolePermissionId: Scalars['ID']['input'];
};


export type QueryRolePermissionsArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  permissionId?: InputMaybe<Scalars['ID']['input']>;
  roleId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRolesArgs = {
  isSystemRole?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySharedKpiParticipantArgs = {
  sharedKpiParticipantId: Scalars['ID']['input'];
};


export type QuerySharedKpiParticipantsArgs = {
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryStrategicPeriodArgs = {
  strategicPeriodId: Scalars['ID']['input'];
};


export type QueryStrategicPeriodsArgs = {
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  strategicPlanId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryStrategicPillarArgs = {
  strategicPillarId: Scalars['ID']['input'];
};


export type QueryStrategicPillarsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  strategicPlanId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryStrategicPlanArgs = {
  strategicPlanId: Scalars['ID']['input'];
};


export type QueryStrategicPlansArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySubmissionArgs = {
  submissionId: Scalars['ID']['input'];
};


export type QuerySubmissionsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  submissionType?: InputMaybe<SubmissionType>;
  type: ObjectiveType;
};


export type QuerySystemConfigurationArgs = {
  systemConfigurationId: Scalars['ID']['input'];
};


export type QuerySystemConfigurationByOrgArgs = {
  organizationId: Scalars['ID']['input'];
};


export type QuerySystemConfigurationsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryTeamArgs = {
  teamId: Scalars['ID']['input'];
};


export type QueryTeamsArgs = {
  departmentId?: InputMaybe<Scalars['ID']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUserPermissionOverrideArgs = {
  userPermissionOverrideId: Scalars['ID']['input'];
};


export type QueryUserPermissionOverridesArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  permissionId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserRoleAssignmentArgs = {
  userRoleAssignmentId: Scalars['ID']['input'];
};


export type QueryUserRoleAssignmentsArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  roleId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserSessionArgs = {
  userSessionId: Scalars['ID']['input'];
};


export type QueryUserSessionsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type Role = {
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Employee>;
  description?: Maybe<Scalars['String']['output']>;
  isCustom: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  isSystemRole: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  parentRole?: Maybe<Role>;
  roleId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type RoleAuditLog = {
  actionDescription: Scalars['String']['output'];
  actionType: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  performedBy: Employee;
  roleAuditLogId: Scalars['ID']['output'];
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type RolePermission = {
  grantedAt: Scalars['DateTime']['output'];
  grantedBy?: Maybe<Employee>;
  isActive: Scalars['Boolean']['output'];
  permission: PermissionDefinition;
  role: Role;
  rolePermissionId: Scalars['ID']['output'];
};

export type SharedKpiParticipant = {
  assignedBy?: Maybe<Employee>;
  contributionWeight?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  kpi: Kpi;
  participant: Employee;
  sharedKpiParticipantId: Scalars['ID']['output'];
  strategicPeriod: StrategicPeriod;
};

export type StrategicPeriod = {
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  endDate: Scalars['String']['output'];
  name: Scalars['String']['output'];
  openedAt?: Maybe<Scalars['DateTime']['output']>;
  periodType: StrategicPeriodType;
  startDate: Scalars['String']['output'];
  status: StrategicPeriodStatus;
  strategicPeriodId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum StrategicPeriodStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Closed = 'CLOSED',
  Upcoming = 'UPCOMING'
}

export enum StrategicPeriodType {
  Annual = 'ANNUAL',
  Custom = 'CUSTOM',
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  SemiAnnual = 'SEMI_ANNUAL',
  Weekly = 'WEEKLY'
}

export type StrategicPillar = {
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  strategicPillarId: Scalars['ID']['output'];
  strategicPlan: StrategicPlan;
  updatedAt: Scalars['DateTime']['output'];
};

export type StrategicPlan = {
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedBy?: Maybe<Employee>;
  archivedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Employee;
  description?: Maybe<Scalars['String']['output']>;
  endDate: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  organization: Organization;
  startDate: Scalars['String']['output'];
  strategicPlanId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

export type Submission = {
  actionedBy: Employee;
  createdAt: Scalars['DateTime']['output'];
  kpi?: Maybe<Kpi>;
  level: SubmissionLevel;
  objective?: Maybe<Objective>;
  reason?: Maybe<Scalars['String']['output']>;
  status: SubmissionStatus;
  submissionId: Scalars['ID']['output'];
  submittedBy: Employee;
  type: SubmissionType;
  updatedAt: Scalars['DateTime']['output'];
};

export enum SubmissionLevel {
  Department = 'DEPARTMENT',
  Division = 'DIVISION',
  Personnel = 'PERSONNEL'
}

export enum SubmissionStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum SubmissionType {
  Kpi = 'KPI',
  Objective = 'OBJECTIVE'
}

export type SystemConfiguration = {
  checkinDayOfWeek: Scalars['Int']['output'];
  checkoutDayOfWeek: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  defaultRatingScaleMax: Scalars['Int']['output'];
  defaultRatingScaleMin: Scalars['Int']['output'];
  enableEmailNotifications: Scalars['Boolean']['output'];
  enableLogbookAttachments: Scalars['Boolean']['output'];
  enableSharedKpis: Scalars['Boolean']['output'];
  fiscalYearStartMonth: Scalars['Int']['output'];
  systemConfigurationId: Scalars['ID']['output'];
  timezone: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Employee>;
};

export enum SystemModule {
  ApprovalWorkflows = 'APPROVAL_WORKFLOWS',
  AuditLogs = 'AUDIT_LOGS',
  Cascading = 'CASCADING',
  CheckinCheckout = 'CHECKIN_CHECKOUT',
  CompetencyLibrary = 'COMPETENCY_LIBRARY',
  Evaluation = 'EVALUATION',
  FileAttachments = 'FILE_ATTACHMENTS',
  KpiManagement = 'KPI_MANAGEMENT',
  Logbook = 'LOGBOOK',
  Notifications = 'NOTIFICATIONS',
  OrganizationStructure = 'ORGANIZATION_STRUCTURE',
  PerformanceAggregate = 'PERFORMANCE_AGGREGATE',
  ReportsDashboard = 'REPORTS_DASHBOARD',
  SharedKpis = 'SHARED_KPIS',
  StrategicPeriods = 'STRATEGIC_PERIODS',
  StrategicPlanning = 'STRATEGIC_PLANNING',
  SystemConfiguration = 'SYSTEM_CONFIGURATION',
  UserManagement = 'USER_MANAGEMENT'
}

export enum TaskLinkType {
  InitiativeFulfilled = 'INITIATIVE_FULFILLED',
  InitiativeUnmet = 'INITIATIVE_UNMET',
  KpiFulfilled = 'KPI_FULFILLED',
  KpiUnmate = 'KPI_UNMATE',
  SelfDevelopment = 'SELF_DEVELOPMENT',
  Unlinked = 'UNLINKED'
}

export enum TaskStatus {
  Cancelled = 'CANCELLED',
  Done = 'DONE',
  NotDone = 'NOT_DONE',
  Postponed = 'POSTPONED'
}

export type Team = {
  createdAt: Scalars['DateTime']['output'];
  department?: Maybe<Department>;
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  teamId: Scalars['ID']['output'];
  teamLead?: Maybe<Employee>;
  updatedAt: Scalars['DateTime']['output'];
};

export type UpdateActivityInput = {
  activityId: Scalars['ID']['input'];
  assignedToUserId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  initiativeId?: InputMaybe<Scalars['ID']['input']>;
  milestone?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TaskStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAggregatePerformanceResultInput = {
  aggregatePerformanceResultId: Scalars['ID']['input'];
  aggregateScore?: InputMaybe<Scalars['Float']['input']>;
  competencyScore?: InputMaybe<Scalars['Float']['input']>;
  individualKpiScore?: InputMaybe<Scalars['Float']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  sharedKpiScore?: InputMaybe<Scalars['Float']['input']>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
  weightConfigId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateApprovalWorkflowInput = {
  action?: InputMaybe<ApprovalAction>;
  approvalWorkflowId: Scalars['ID']['input'];
  comments?: InputMaybe<Scalars['String']['input']>;
  reviewedAt?: InputMaybe<Scalars['DateTime']['input']>;
  reviewedById?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateAssessmentResponseInput = {
  assessmentResponseId: Scalars['ID']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateCheckinoutSessionInput = {
  checkinSubmittedAt?: InputMaybe<Scalars['DateTime']['input']>;
  checkinoutSessionId: Scalars['ID']['input'];
  checkoutSubmittedAt?: InputMaybe<Scalars['DateTime']['input']>;
  employeeUserId?: InputMaybe<Scalars['ID']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  overallRating?: InputMaybe<Scalars['Float']['input']>;
  overallStatus?: InputMaybe<CheckinoutStatus>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  supervisorComment?: InputMaybe<Scalars['String']['input']>;
  supervisorReviewAt?: InputMaybe<Scalars['DateTime']['input']>;
  supervisorUserId?: InputMaybe<Scalars['ID']['input']>;
  weekEndDate?: InputMaybe<Scalars['String']['input']>;
  weekStartDate?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCheckinoutTaskInput = {
  achievedDescription?: InputMaybe<Scalars['String']['input']>;
  challenges?: InputMaybe<Scalars['String']['input']>;
  checkinoutTaskId: Scalars['ID']['input'];
  evidenceUrl?: InputMaybe<Scalars['String']['input']>;
  linkedInitiativeId?: InputMaybe<Scalars['ID']['input']>;
  linkedKpiId?: InputMaybe<Scalars['ID']['input']>;
  linkedObjectiveId?: InputMaybe<Scalars['ID']['input']>;
  nextSteps?: InputMaybe<Scalars['String']['input']>;
  plannedDescription?: InputMaybe<Scalars['String']['input']>;
  relatedToEmployeeId?: InputMaybe<Scalars['ID']['input']>;
  requiresApproval?: InputMaybe<Scalars['Boolean']['input']>;
  sessionId?: InputMaybe<Scalars['ID']['input']>;
  taskEndDate?: InputMaybe<Scalars['DateTime']['input']>;
  taskLinkType?: InputMaybe<TaskLinkType>;
  taskStartDate?: InputMaybe<Scalars['DateTime']['input']>;
  taskStatus?: InputMaybe<TaskStatus>;
  taskTitle?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCompetencyAssessmentInput = {
  competencyAssessmentId: Scalars['ID']['input'];
  overallComment?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EvaluationStatus>;
  submittedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UpdateCompetencyIndicatorInput = {
  competencyId?: InputMaybe<Scalars['ID']['input']>;
  competencyIndicatorId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  ratingScaleMax?: InputMaybe<Scalars['Int']['input']>;
  ratingScaleMin?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateCompetencyInput = {
  competencyId: Scalars['ID']['input'];
  coreCompetencyId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateCompetencyPositionAssignmentInput = {
  competencyPositionAssignmentId: Scalars['ID']['input'];
  isMandatory?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateCoreCompetencyInput = {
  coreCompetencyId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateDepartmentInput = {
  departmentId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  divisionId?: InputMaybe<Scalars['ID']['input']>;
  headUserId?: InputMaybe<Scalars['ID']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateDivisionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  divisionId: Scalars['ID']['input'];
  headUserId?: InputMaybe<Scalars['ID']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  parentDivisionId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateEmployeeInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  employeeId: Scalars['ID']['input'];
  fullName?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  picture?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<EmployeeRole>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EmployeeStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEvaluationCycleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  evaluationCycleId: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EvaluationCycleStatus>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateEvaluationWeightConfigInput = {
  evaluationCycleId?: InputMaybe<Scalars['ID']['input']>;
  evaluationWeightConfigId: Scalars['ID']['input'];
  relationType?: InputMaybe<EvaluationRelationType>;
  weightPercent?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateFileAttachmentInput = {
  fileAttachmentId: Scalars['ID']['input'];
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  relatedEntityId?: InputMaybe<Scalars['ID']['input']>;
  relatedEntityType?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInitiativeInput = {
  completionPercentage?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  initiativeId: Scalars['ID']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  ownerUserId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<InitiativeStatus>;
  strategicObjectiveId?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateKpiAssignmentDepartmentInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  departmentId?: InputMaybe<Scalars['ID']['input']>;
  kpiAssignmentDepartmentId: Scalars['ID']['input'];
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  targetValue?: InputMaybe<Scalars['Float']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateKpiAssignmentDivisionInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  divisionId?: InputMaybe<Scalars['ID']['input']>;
  kpiAssignmentDivisionId: Scalars['ID']['input'];
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  targetValue?: InputMaybe<Scalars['Float']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateKpiAssignmentEmployeeInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  kpiAssignmentEmployeeId: Scalars['ID']['input'];
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  targetValue?: InputMaybe<Scalars['Float']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateKpiInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeType?: InputMaybe<AssigneeType>;
  assignerId?: InputMaybe<Scalars['ID']['input']>;
  baseline?: InputMaybe<Scalars['Float']['input']>;
  baselineValue?: InputMaybe<Scalars['Float']['input']>;
  customUnitLabel?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  frequency?: InputMaybe<KpiFrequency>;
  initiativeId?: InputMaybe<Scalars['ID']['input']>;
  kpiId: Scalars['ID']['input'];
  kpiType?: InputMaybe<KpiType>;
  measurementUnit?: InputMaybe<KpiMeasurementUnit>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<KpiStatus>;
  strategicObjectiveId?: InputMaybe<Scalars['ID']['input']>;
  targetStatus?: InputMaybe<KpiTargetStatus>;
  targetValue?: InputMaybe<Scalars['Float']['input']>;
  targets?: InputMaybe<Array<KpiTargetInput>>;
  unitType?: InputMaybe<KpiUnitType>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateKpiUpdateInput = {
  achievedValue?: InputMaybe<Scalars['Float']['input']>;
  approvedAt?: InputMaybe<Scalars['DateTime']['input']>;
  approvedById?: InputMaybe<Scalars['ID']['input']>;
  evidenceUrl?: InputMaybe<Scalars['String']['input']>;
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  kpiUpdateId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  progressPercentage?: InputMaybe<Scalars['Float']['input']>;
  progressStatus?: InputMaybe<KpiProgressStatus>;
  reportingDate?: InputMaybe<Scalars['String']['input']>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateLogbookEntryInput = {
  activityDescription?: InputMaybe<Scalars['String']['input']>;
  approvedAt?: InputMaybe<Scalars['DateTime']['input']>;
  checkinoutTaskId?: InputMaybe<Scalars['ID']['input']>;
  decisionsMade?: InputMaybe<Scalars['String']['input']>;
  entryDate?: InputMaybe<Scalars['String']['input']>;
  entryStatus?: InputMaybe<LogbookEntryStatus>;
  evidenceDescription?: InputMaybe<Scalars['String']['input']>;
  evidenceUrl?: InputMaybe<Scalars['String']['input']>;
  kpiAchievedValue?: InputMaybe<Scalars['Float']['input']>;
  kpiCompletionPercent?: InputMaybe<Scalars['Float']['input']>;
  kpiTargetValue?: InputMaybe<Scalars['Float']['input']>;
  lessonsLearned?: InputMaybe<Scalars['String']['input']>;
  linkedInitiativeId?: InputMaybe<Scalars['ID']['input']>;
  linkedKpiId?: InputMaybe<Scalars['ID']['input']>;
  linkedObjectiveId?: InputMaybe<Scalars['ID']['input']>;
  logbookEntryId: Scalars['ID']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  rejectionReason?: InputMaybe<Scalars['String']['input']>;
  risksIssues?: InputMaybe<Scalars['String']['input']>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
  submittedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UpdateNotificationInput = {
  notificationId: Scalars['ID']['input'];
  readAt?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<NotificationStatus>;
};

export type UpdateObjectiveInput = {
  approvedAt?: InputMaybe<Scalars['DateTime']['input']>;
  approvedById?: InputMaybe<Scalars['ID']['input']>;
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeType?: InputMaybe<AssigneeType>;
  assignerId?: InputMaybe<Scalars['ID']['input']>;
  cascadeStatus?: InputMaybe<CascadeStatus>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  level?: InputMaybe<ObjectiveLevel>;
  objectiveId: Scalars['ID']['input'];
  order?: InputMaybe<Scalars['Float']['input']>;
  ownerDepartmentId?: InputMaybe<Scalars['ID']['input']>;
  ownerDivisionId?: InputMaybe<Scalars['ID']['input']>;
  ownerTeamId?: InputMaybe<Scalars['ID']['input']>;
  ownerUserId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<ObjectiveStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateOrganizationInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  industry?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  shortName?: InputMaybe<Scalars['String']['input']>;
  subscriptionActive?: InputMaybe<Scalars['Boolean']['input']>;
  subscriptionExpiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePerformanceWeightConfigInput = {
  competencyWeight?: InputMaybe<Scalars['Float']['input']>;
  individualKpiWeight?: InputMaybe<Scalars['Float']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  performanceWeightConfigId: Scalars['ID']['input'];
  sharedKpiWeight?: InputMaybe<Scalars['Float']['input']>;
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdatePermissionDefinitionInput = {
  action?: InputMaybe<PermissionAction>;
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isSystemDefault?: InputMaybe<Scalars['Boolean']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  module?: InputMaybe<SystemModule>;
  permissionDefinitionId: Scalars['ID']['input'];
  scope?: InputMaybe<PermissionScope>;
};

export type UpdatePositionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  grade?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  positionId: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRoleInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isCustom?: InputMaybe<Scalars['Boolean']['input']>;
  isSystemRole?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  parentRoleId?: InputMaybe<Scalars['ID']['input']>;
  roleId: Scalars['ID']['input'];
};

export type UpdateRolePermissionInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  rolePermissionId: Scalars['ID']['input'];
};

export type UpdateSharedKpiParticipantInput = {
  assignedById?: InputMaybe<Scalars['ID']['input']>;
  contributionWeight?: InputMaybe<Scalars['Float']['input']>;
  kpiId?: InputMaybe<Scalars['ID']['input']>;
  participantUserId?: InputMaybe<Scalars['ID']['input']>;
  sharedKpiParticipantId: Scalars['ID']['input'];
  strategicPeriodId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateStrategicPeriodInput = {
  closedAt?: InputMaybe<Scalars['DateTime']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  openedAt?: InputMaybe<Scalars['DateTime']['input']>;
  periodType?: InputMaybe<StrategicPeriodType>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<StrategicPeriodStatus>;
  strategicPeriodId: Scalars['ID']['input'];
};

export type UpdateStrategicPillarInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  strategicPillarId: Scalars['ID']['input'];
  strategicPlanId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateStrategicPlanInput = {
  approvedAt?: InputMaybe<Scalars['DateTime']['input']>;
  approvedById?: InputMaybe<Scalars['ID']['input']>;
  archivedAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  strategicPlanId: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSubmissionInput = {
  itemId?: InputMaybe<Scalars['String']['input']>;
  level?: InputMaybe<SubmissionLevel>;
  reason?: InputMaybe<Scalars['String']['input']>;
  status: SubmissionStatus;
  submissionId: Scalars['ID']['input'];
  type?: InputMaybe<SubmissionType>;
};

export type UpdateSystemConfigurationInput = {
  checkinDayOfWeek?: InputMaybe<Scalars['Int']['input']>;
  checkoutDayOfWeek?: InputMaybe<Scalars['Int']['input']>;
  defaultRatingScaleMax?: InputMaybe<Scalars['Int']['input']>;
  defaultRatingScaleMin?: InputMaybe<Scalars['Int']['input']>;
  enableEmailNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  enableLogbookAttachments?: InputMaybe<Scalars['Boolean']['input']>;
  enableSharedKpis?: InputMaybe<Scalars['Boolean']['input']>;
  fiscalYearStartMonth?: InputMaybe<Scalars['Int']['input']>;
  systemConfigurationId: Scalars['ID']['input'];
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTeamInput = {
  departmentId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  teamId: Scalars['ID']['input'];
  teamLeadUserId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateUserPermissionOverrideInput = {
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isGranted?: InputMaybe<Scalars['Boolean']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  userPermissionOverrideId: Scalars['ID']['input'];
};

export type UpdateUserRoleAssignmentInput = {
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  revocationReason?: InputMaybe<Scalars['String']['input']>;
  revokedAt?: InputMaybe<Scalars['DateTime']['input']>;
  revokedById?: InputMaybe<Scalars['ID']['input']>;
  userRoleAssignmentId: Scalars['ID']['input'];
};

export type UserPermissionOverride = {
  createdAt: Scalars['DateTime']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  grantedAt: Scalars['DateTime']['output'];
  grantedBy: Employee;
  isActive: Scalars['Boolean']['output'];
  isGranted: Scalars['Boolean']['output'];
  permission: PermissionDefinition;
  reason?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user: Employee;
  userPermissionOverrideId: Scalars['ID']['output'];
};

export type UserRoleAssignment = {
  assignedAt: Scalars['DateTime']['output'];
  assignedBy?: Maybe<Employee>;
  createdAt: Scalars['DateTime']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  isActive: Scalars['Boolean']['output'];
  isPrimary: Scalars['Boolean']['output'];
  revocationReason?: Maybe<Scalars['String']['output']>;
  revokedAt?: Maybe<Scalars['DateTime']['output']>;
  revokedBy?: Maybe<Employee>;
  role: Role;
  updatedAt: Scalars['DateTime']['output'];
  user: Employee;
  userRoleAssignmentId: Scalars['ID']['output'];
};

export type UserSession = {
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  revokedAt?: Maybe<Scalars['DateTime']['output']>;
  tokenHash: Scalars['String']['output'];
  user: Employee;
  userAgent?: Maybe<Scalars['String']['output']>;
  userSessionId: Scalars['ID']['output'];
};
