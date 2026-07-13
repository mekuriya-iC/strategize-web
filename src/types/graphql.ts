// GraphQL Enums
export const EmployeeRole = {
  NORMAL: "NORMAL",
  COORDINATOR: "COORDINATOR",
  MANAGER: "MANAGER",
  DIRECTOR: "DIRECTOR",
  HR: "HR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type EmployeeRole = (typeof EmployeeRole)[keyof typeof EmployeeRole];

// Role hierarchy for display and permissions
export const ROLE_HIERARCHY = [
  "NORMAL",
  "COORDINATOR",
  "MANAGER",
  "DIRECTOR",
  "HR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

// Human-readable role labels
export const ROLE_LABELS: Record<EmployeeRole, string> = {
  NORMAL: "Employee",
  COORDINATOR: "Coordinator",
  MANAGER: "Manager",
  DIRECTOR: "Director",
  HR: "HR",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export type EmployeeStatus = "ACTIVE" | "DISABLED" | "DELETED";

// GraphQL Input Types
export interface LoginEmployeeInput {
  email: string;
  password: string;
}

export interface CreateEmployeeInput {
  organizationId?: string;
  email: string;
  fullName: string;
  password: string;
  phoneNumber: string;
  picture: string;
  role: EmployeeRole;
  startDate: string;
  status: EmployeeStatus;
  title: string;
}

export interface UpdateEmployeeInput {
  employeeId: string;
  email?: string;
  fullName?: string;
  password?: string;
  phoneNumber?: string;
  picture?: string;
  role?: EmployeeRole;
  startDate?: string;
  status?: EmployeeStatus;
  title?: string;
}

// Division Input Types
export interface CreateDivisionInput {
  name: string;
  headUserId?: string;
  organizationId?: string;
  description?: string;
  isActive?: boolean;
  parentDivisionId?: string;
}

export interface UpdateDivisionInput {
  divisionId: string;
  name?: string;
  headUserId?: string;
  organizationId?: string;
  description?: string;
  isActive?: boolean;
  parentDivisionId?: string;
}

// Department Input Types
export interface CreateDepartmentInput {
  name: string;
  headUserId?: string;
  divisionId?: string;
  organizationId?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentInput {
  departmentId: string;
  name?: string;
  headUserId?: string;
  divisionId?: string | null; // null to explicitly remove division association
  organizationId?: string;
  description?: string;
  isActive?: boolean;
}

// GraphQL Response Types
export interface Employee {
  employeeId: string;
  organizationId?: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  picture: string;
  role: EmployeeRole;
  startDate: string;
  status: EmployeeStatus;
  title: string;
  createdAt: string;
  updatedAt: string;
  departments?: Array<{ departmentId: string; name: string }>;
  // Alias for single department (first in array)
  department?: { departmentId: string; name?: string };
}

export interface Division {
  divisionId: string;
  name: string;
  head?: Employee;
  departments?: Department[];
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  departmentId: string;
  name: string;
  head?: Employee;
  division?: Division;
  employees?: Employee[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface AuthPayload {
  accessToken: string;
  employee: Employee;
}

export interface PaginationMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedEmployees {
  items: Employee[];
  meta: PaginationMeta;
}

export interface PaginatedDivisions {
  items: Division[];
  meta: PaginationMeta;
}

export interface PaginatedDepartments {
  items: Department[];
  meta: PaginationMeta;
}

// GraphQL Query Response Types
export interface GetEmployeesResponse {
  employees: PaginatedEmployees;
}

export interface GetDivisionsResponse {
  divisions: PaginatedDivisions;
}

export interface GetDepartmentsResponse {
  departments: PaginatedDepartments;
}

export interface GetDivisionResponse {
  division: Division;
}

export interface GetDepartmentResponse {
  department: Department;
}

// Query Variables Types
export interface EmployeesQueryVariables {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DivisionsQueryVariables {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DepartmentsQueryVariables {
  page?: number;
  limit?: number;
  search?: string;
  divisionId?: string;
}

export interface DivisionQueryVariables {
  divisionId: string;
}

export interface DepartmentQueryVariables {
  departmentId: string;
}

// Mutation Variables Types
export interface LoginMutationVariables {
  input: LoginEmployeeInput;
}

export interface CreateEmployeeMutationVariables {
  input: CreateEmployeeInput;
}

export interface UpdateEmployeeMutationVariables {
  input: UpdateEmployeeInput;
}

export interface RemoveEmployeeMutationVariables {
  id: string;
}

export interface CreateDivisionMutationVariables {
  input: CreateDivisionInput;
}

export interface UpdateDivisionMutationVariables {
  input: UpdateDivisionInput;
}

export interface RemoveDivisionMutationVariables {
  id?: string;
  divisionId?: string;
}

export interface CreateDepartmentMutationVariables {
  input: CreateDepartmentInput;
}

export interface UpdateDepartmentMutationVariables {
  input: UpdateDepartmentInput;
}

export interface RemoveDepartmentMutationVariables {
  id?: string;
  departmentId?: string;
}

export interface AddEmployeeToDepartmentMutationVariables {
  departmentId: string;
  employeeId: string;
}

export interface RemoveEmployeeFromDepartmentMutationVariables {
  departmentId: string;
  employeeId: string;
}

// Strategic Period Types
export interface StrategicPeriod {
  strategicPeriodId: string;
  name: string;
  startDate: string;
  endDate: string;
  periodType?: string;
  status?: string;
  openedAt?: string;
  closedAt?: string;
  length?: number; // Calculated on frontend: years between start and end
  createdBy: Employee | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStrategicPeriodInput {
  strategicPlanId: string;
  organizationId: string;
  name: string;
  periodType: string;
  startDate: string;
  endDate: string;
}

export interface UpdateStrategicPeriodInput {
  strategicPeriodId: string;
  name?: string;
  periodType?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedStrategicPeriods {
  items: StrategicPeriod[];
  meta: PaginationMeta;
}

// Objective Types
export type ObjectiveType =
  | "CORPORATE"
  | "DIVISION"
  | "DEPARTMENT"
  | "PERSONNEL";
export type ObjectiveStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface Objective {
  objectiveId: string;
  title?: string; // Backend uses 'title' - made optional for backward compatibility
  name?: string; // Deprecated: kept for backward compatibility
  description?: string;
  type: ObjectiveType;
  level: string; // ObjectiveLevel: CORPORATE, DIVISION, DEPARTMENT, INDIVIDUAL, TEAM
  status: ObjectiveStatus;
  cascadeStatus?: string;
  strategicPeriod: StrategicPeriod | null;
  createdBy?: {
    employeeId: string;
    fullName: string;
  } | null;
  approvedBy?: {
    employeeId: string;
    fullName: string;
  } | null;
  approvedAt?: string;
  assigneeId?: string;
  assignerId?: string;
  assigneeType?: string;
  ownerUser?: {
    employeeId: string;
    fullName: string;
    email?: string;
    title?: string;
  } | null;
  parent?: {
    objectiveId: string;
    title?: string; // Backend uses 'title' - made optional
    name?: string; // Deprecated: kept for backward compatibility
    level?: string;
    type?: ObjectiveType;
    assigneeType?: string;
  } | null;
  kpis?: Array<{
    kpiId: string;
    name: string;
    weight: number;
    status: string;
    targetStatus?: string;
  }>;
  weight?: number;
  order?: number;
  dueDate?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectiveInput {
  title: string; // Backend uses 'title' not 'name'
  type: ObjectiveType;
  strategicPeriodId: string;
  level: string; // ObjectiveLevel: CORPORATE, DIVISION, DEPARTMENT, INDIVIDUAL, TEAM
  organizationId: string; // Required by backend
  strategicPlanId: string; // Required by backend
  description?: string;
  assigneeId?: string;
  assigneeType?: string;
  assignerId?: string;
  parentId?: string;
  weight?: number;
  dueDate?: string;
}

export interface UpdateObjectiveInput {
  objectiveId: string;
  title?: string; // Backend uses 'title' not 'name'
  type?: ObjectiveType;
  level?: string; // ObjectiveLevel
  status?: ObjectiveStatus;
  strategicPeriodId?: string;
  description?: string;
  assigneeId?: string;
  assigneeType?: string;
  assignerId?: string;
  cascadeStatus?: string;
  weight?: number;
  order?: number;
  dueDate?: string;
  approvedAt?: string;
  approvedById?: string;
  ownerDepartmentId?: string;
  ownerDivisionId?: string;
  ownerTeamId?: string;
  ownerUserId?: string;
}

export interface PaginatedObjectives {
  items: Objective[];
  meta: PaginationMeta;
}

// KPI Types
export type KpiWeightType = "NUMBER" | "PERCENT";
export type KpiUnitType =
  | "NUMBER"
  | "PERCENT"
  | "CURRENCY"
  | "HOUR"
  | "RATIO"
  | "COUNT";
export type KpiStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
export type KpiTargetStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";
export type KpiQuarterPlanStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "LOCKED";
export type KpiQuarterPlanSource = "LEGACY_BACKFILL" | "MANUAL" | "SYSTEM";

export interface KpiQuarterPlan {
  kpiQuarterPlanId: string;
  organizationId: string;
  kpiId: string;
  annualStrategicPeriodId: string;
  quarterStrategicPeriodId?: string | null;
  quarterNumber: number;
  timeline: string;
  originalTarget: number;
  carryIn: number;
  effectiveTarget: number;
  managerOriginalTarget?: number | null;
  managerCarryIn?: number | null;
  managerEffectiveTarget?: number | null;
  teamOriginalTarget?: number | null;
  teamCarryIn?: number | null;
  teamEffectiveTarget?: number | null;
  status: KpiQuarterPlanStatus;
  source: KpiQuarterPlanSource;
  version: number;
  submittedById?: string | null;
  submittedAt?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Restore KPI target types
export interface KpiTarget {
  timeline: string;
  target: number; // Float in GraphQL schema
}

export interface KpiTargetInput {
  timeline: string;
  target: number; // Float in GraphQL schema
}

export type KpiQuarterResultStatus = "PROVISIONAL" | "FINAL";
export type ScorecardLevel =
  | "INDIVIDUAL"
  | "DEPARTMENT"
  | "DIVISION"
  | "CORPORATE";

export interface KpiQuarterResult {
  kpiQuarterResultId: string;
  kpiId: string;
  quarterPlanId: string;
  quarterPlan: KpiQuarterPlan;
  level: ScorecardLevel;
  entityId?: string | null;
  calculationMode: "AGGREGATED" | "DIRECT" | "HYBRID";
  directActual?: number | null;
  directAchievementRate?: number | null;
  aggregateActual?: number | null;
  aggregateAchievementRate?: number | null;
  finalActual: number;
  finalAchievementRate: number;
  weightedScore: number;
  carryOut: number;
  managerCarryOut?: number | null;
  teamCarryOut?: number | null;
  status: KpiQuarterResultStatus;
  calculationVersion: number;
  calculatedAt: string;
  finalizedAt?: string | null;
}

export type KpiMode = "AGGREGATED" | "DIRECT" | "HYBRID";
export type KpiQuarterReportScope =
  | "SELF"
  | "DEPARTMENT"
  | "DIVISION"
  | "ORGANIZATION";

export interface KpiQuarterReportFilterOption {
  id: string;
  name: string;
  parentId?: string | null;
  parentIds: string[];
}

export interface KpiQuarterReportSummary {
  rowCount: number;
  kpiCount: number;
  originalTarget: number;
  carryIn: number;
  effectiveTarget: number;
  actual: number;
  averageAchievementRate: number;
  annualContribution: number;
  carryOut: number;
  finalCount: number;
  provisionalCount: number;
  pendingResultCount: number;
}

export interface KpiQuarterReportQuarterSummary
  extends KpiQuarterReportSummary {
  quarterNumber: number;
}

export interface KpiQuarterReportRollup extends KpiQuarterReportSummary {
  level: ScorecardLevel;
  entityId: string;
  entityName: string;
}

export interface KpiQuarterReportRow {
  kpiQuarterPlanId: string;
  kpiId: string;
  kpiName: string;
  objectiveTitle?: string | null;
  level: ScorecardLevel;
  entityId: string;
  entityName: string;
  divisionId?: string | null;
  divisionName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  kpiMode: KpiMode;
  unitType?: KpiUnitType | null;
  measurementUnit: string;
  customUnitLabel?: string | null;
  annualTarget: number;
  weight: number;
  quarterNumber: number;
  timeline: string;
  originalTarget: number;
  carryIn: number;
  effectiveTarget: number;
  managerOriginalTarget?: number | null;
  managerCarryIn?: number | null;
  managerEffectiveTarget?: number | null;
  teamOriginalTarget?: number | null;
  teamCarryIn?: number | null;
  teamEffectiveTarget?: number | null;
  planStatus: KpiQuarterPlanStatus;
  directActual?: number | null;
  directAchievementRate?: number | null;
  aggregateActual?: number | null;
  aggregateAchievementRate?: number | null;
  actual?: number | null;
  achievementRate?: number | null;
  annualContribution?: number | null;
  carryOut?: number | null;
  managerCarryOut?: number | null;
  teamCarryOut?: number | null;
  resultStatus?: KpiQuarterResultStatus | null;
  calculatedAt?: string | null;
  finalizedAt?: string | null;
}

export interface KpiQuarterPerformanceReport {
  annualStrategicPeriodId: string;
  annualStrategicPeriodName: string;
  scope: KpiQuarterReportScope;
  availableFilters: {
    divisions: KpiQuarterReportFilterOption[];
    departments: KpiQuarterReportFilterOption[];
    employees: KpiQuarterReportFilterOption[];
  };
  summary: KpiQuarterReportSummary;
  quarterSummaries: KpiQuarterReportQuarterSummary[];
  rollups: KpiQuarterReportRollup[];
  rows: KpiQuarterReportRow[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export interface Kpi {
  kpiId: string;
  name: string;
  baseline: number; // Float in GraphQL schema
  weight: number; // Float in GraphQL schema - accepts decimal values
  unitType: KpiUnitType;
  status: KpiStatus;
  targetStatus?: KpiTargetStatus;
  targets: KpiTarget[];
  quarterPlans?: KpiQuarterPlan[];
  quarterResults?: KpiQuarterResult[];
  targetValue?: number; // Base target value of the KPI
  assignedTargetValue?: number; // Target value assigned to current user (from assignment)
  kpiMode?: string; // AGGREGATED, DIRECT, HYBRID
  managerRetentionPercent?: number; // For HYBRID mode
  assigneeId?: string; // ID of the person assigned to this KPI
  assigneeType?: string; // Type of assignee (PERSONNEL, DEPARTMENT, DIVISION, CORPORATE)
  parent?: { kpiId: string; name?: string } | null;
  objective: Objective | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKpiInput {
  name: string;
  baseline?: number;
  baselineValue?: number;
  weight?: number;
  unitType?: string;
  customUnitLabel?: string;
  targets?: KpiTargetInput[];
  strategicObjectiveId: string; // Backend uses strategicObjectiveId not objectiveId
  parentId?: string;
  frequency: string; // KpiFrequency: DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY
  measurementUnit: string; // KpiMeasurementUnit: NUMBER, PERCENTAGE, CURRENCY, etc.
  organizationId: string; // Required by backend
  targetValue: number; // Required by backend
  description?: string;
  kpiType?: string;
  initiativeId?: string;
  assigneeId?: string;
  assigneeType?: string;
  assignerId?: string;
  kpiMode?: string; // KPI mode: AGGREGATED, DIRECT, HYBRID
  managerRetentionPercent?: number; // For HYBRID mode: percentage manager retains (1-99)
}

export interface UpdateKpiInput {
  kpiId: string;
  name?: string;
  baseline?: number; // Float in GraphQL schema
  weight?: number; // Float in GraphQL schema - accepts decimal values
  targetValue?: number; // Target value for the KPI
  unitType?: KpiUnitType;
  status?: KpiStatus;
  targetStatus?: KpiTargetStatus;
  targets?: KpiTargetInput[];
  objectiveId?: string;
  parentId?: string;
  kpiMode?: string;
  managerRetentionPercent?: number;
}

export interface PaginatedKpis {
  items: Kpi[];
  meta: PaginationMeta;
}

// Query Response Types
export interface GetStrategicPeriodsResponse {
  strategicPeriods: PaginatedStrategicPeriods;
}

export interface GetStrategicPeriodResponse {
  strategicPeriod: StrategicPeriod;
}

export interface GetObjectivesResponse {
  objectives: PaginatedObjectives;
}

export interface GetObjectiveResponse {
  objective: Objective;
}

export interface GetKpisResponse {
  kpis: PaginatedKpis;
}

export interface GetKpiResponse {
  kpi: Kpi;
}

// Query Variables Types
export interface StrategicPeriodsQueryVariables {
  page?: number;
  limit?: number;
  strategicPlanId?: string;
  organizationId?: string;
}

export interface StrategicPeriodQueryVariables {
  strategicPeriodId: string;
}

export interface ObjectivesQueryVariables {
  page?: number;
  limit?: number;
  search?: string;
  assigneeId?: string;
}

export interface ObjectiveQueryVariables {
  objectiveId: string;
}

export interface KpisQueryVariables {
  page?: number;
  limit?: number;
  search?: string;
}

export interface KpiQueryVariables {
  kpiId: string;
}

// Mutation Variables Types
export interface CreateStrategicPeriodMutationVariables {
  input: CreateStrategicPeriodInput;
}

export interface UpdateStrategicPeriodMutationVariables {
  input: UpdateStrategicPeriodInput;
}

export interface RemoveStrategicPeriodMutationVariables {
  id: string;
}

export interface CreateObjectiveMutationVariables {
  input: CreateObjectiveInput;
}

export interface UpdateObjectiveMutationVariables {
  input: UpdateObjectiveInput;
}

export interface RemoveObjectiveMutationVariables {
  objectiveId: string;
}

// Alias for backward compatibility
export type DeleteObjectiveMutationVariables = RemoveObjectiveMutationVariables;

export interface ApproveObjectiveMutationVariables {
  objectiveId: string;
  comment?: string;
}

export interface RejectObjectiveMutationVariables {
  objectiveId: string;
  comment?: string;
}

export interface CascadeObjectiveMutationVariables {
  objectiveId: string;
}

export interface UpdateObjectiveStatusMutationVariables {
  objectiveId: string;
  status: ObjectiveStatus;
}

export interface CreateKpiMutationVariables {
  input: CreateKpiInput;
}

export interface UpdateKpiMutationVariables {
  input: UpdateKpiInput;
}

export interface RemoveKpiMutationVariables {
  kpiId: string;
}

// Alias for backward compatibility
export type DeleteKpiMutationVariables = RemoveKpiMutationVariables;

// Additional KPI mutation variable types
export interface CreateKpiUpdateMutationVariables {
  input: {
    kpiId: string;
    achievedValue: number;
    progressPercentage: number;
    progressStatus: string;
    reportingDate: string;
    strategicPeriodId: string;
    notes?: string;
    evidenceUrl?: string;
  };
}

export interface UpdateKpiProgressMutationVariables {
  input: {
    kpiUpdateId: string;
    achievedValue?: number;
    progressPercentage?: number;
    progressStatus?: string;
    notes?: string;
    evidenceUrl?: string;
  };
}

export interface ApproveKpiUpdateMutationVariables {
  kpiUpdateId: string;
  comment?: string;
}

export interface AssignKpiToEmployeeMutationVariables {
  kpiId: string;
  employeeId: string;
}

export interface AssignKpiToDepartmentMutationVariables {
  kpiId: string;
  departmentId: string;
}

export interface AssignKpiToDivisionMutationVariables {
  kpiId: string;
  divisionId: string;
}

export interface RemoveKpiAssignmentEmployeeMutationVariables {
  kpiId: string;
  employeeId: string;
}

export interface RemoveKpiAssignmentDepartmentMutationVariables {
  kpiId: string;
  departmentId: string;
}

export interface RemoveKpiAssignmentDivisionMutationVariables {
  kpiId: string;
  divisionId: string;
}

export interface UpdateKpiStatusMutationVariables {
  kpiId: string;
  status: KpiStatus;
}

export interface ToggleKpiActiveMutationVariables {
  kpiId: string;
}

export interface CreateSharedKpiMutationVariables {
  input: CreateKpiInput;
}

// Submission Types
export type SubmissionType = "OBJECTIVE" | "KPI";
export type SubmissionLevel = "DEPARTMENT" | "DIVISION" | "PERSONNEL"; // Reverted to match actual backend schema
export type SubmissionStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface Submission {
  submissionId: string;
  type: SubmissionType;
  level: SubmissionLevel;
  status: SubmissionStatus;
  reason: string;
  submittedBy: {
    employeeId: string;
    fullName: string;
  };
  objective?: {
    objectiveId: string;
    title?: string; // Backend uses 'title' - made optional
    name?: string; // Deprecated: kept for backward compatibility
  };
  kpi?: {
    kpiId: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedSubmissions {
  items: Submission[];
  meta: PaginationMeta;
}

// Submission Input Types
export interface CreateSubmissionInput {
  type: SubmissionType;
  level: SubmissionLevel;
  itemId: string; // objectiveId or kpiId
  reason: string;
}

export interface UpdateSubmissionInput {
  submissionId: string;
  status?: SubmissionStatus;
  reason?: string;
}

// Submission Query Variables
export interface SubmissionsQueryVariables {
  page?: number;
  limit?: number;
  type: ObjectiveType;
}

export interface SubmissionQueryVariables {
  id: string;
}

// Submission Mutation Variables
export interface CreateSubmissionMutationVariables {
  input: CreateSubmissionInput;
}

export interface CreateSubmissionsMutationVariables {
  inputs: CreateSubmissionInput[];
}

export interface UpdateSubmissionMutationVariables {
  input: UpdateSubmissionInput;
}

export interface RemoveSubmissionMutationVariables {
  id: string;
}

// Assignment Types
export interface AssignObjectiveInput {
  objectiveId: string;
  assigneeId: string;
  assignerId: string;
  assigneeType: string;
  kpis: string[];
}

export interface AssignObjectiveMutationVariables {
  input: AssignObjectiveInput;
}
