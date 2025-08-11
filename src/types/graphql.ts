// GraphQL Enums
export const EmployeeRole = {
  NORMAL: "NORMAL",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type EmployeeRole = (typeof EmployeeRole)[keyof typeof EmployeeRole];

export type EmployeeStatus = "ACTIVE" | "DISABLED" | "DELETED";

// GraphQL Input Types
export interface LoginEmployeeInput {
  email: string;
  password: string;
}

export interface CreateEmployeeInput {
  email: string;
  fullName: string;
  password: string;
  phoneNumber: string;
  picture: string;
  role: EmployeeRole;
  startDate: string;
  status: EmployeeStatus;
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
}

// Division Input Types
export interface CreateDivisionInput {
  name: string;
  managerId: string;
}

export interface UpdateDivisionInput {
  divisionId: string;
  name?: string;
  managerId?: string;
}

// Department Input Types
export interface CreateDepartmentInput {
  name: string;
  managerId?: string;
  divisionId?: string;
}

export interface UpdateDepartmentInput {
  departmentId: string;
  name?: string;
  managerId?: string;
  divisionId?: string;
}

// GraphQL Response Types
export interface Employee {
  employeeId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  picture: string;
  role: EmployeeRole;
  startDate: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  departments?: Department[];
}

export interface Division {
  divisionId: string;
  name: string;
  manager?: Employee;
  departments?: Department[];
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  departmentId: string;
  name: string;
  manager?: Employee;
  division?: Division;
  employees?: Employee[];
  createdAt: string;
  updatedAt: string;
  createdBy?: Employee;
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
  id: string;
}

export interface CreateDepartmentMutationVariables {
  input: CreateDepartmentInput;
}

export interface UpdateDepartmentMutationVariables {
  input: UpdateDepartmentInput;
}

export interface RemoveDepartmentMutationVariables {
  id: string;
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
  startDate: string;
  length: number;
  endDate: string;
  createdBy: Employee | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStrategicPeriodInput {
  startDate: string;
  length: number;
}

export interface UpdateStrategicPeriodInput {
  strategicPeriodId: string;
  startDate?: string;
  length?: number;
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
  name: string;
  type: ObjectiveType;
  status: ObjectiveStatus;
  strategicPeriod: StrategicPeriod | null;
  createdBy?: {
    employeeId: string;
    fullName: string;
  } | null;
  assigneeId?: string;
  assignerId?: string;
  assigneeType?: string;
  parent?: {
    objectiveId: string;
    name: string;
  } | null;
  kpis?: Array<{
    kpiId: string;
    name: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectiveInput {
  name: string;
  type: ObjectiveType;
  strategicPeriodId: string;
}

export interface UpdateObjectiveInput {
  objectiveId: string;
  name?: string;
  type?: ObjectiveType;
  status?: ObjectiveStatus;
  strategicPeriodId?: string;
}

export interface PaginatedObjectives {
  items: Objective[];
  meta: PaginationMeta;
}

// KPI Types
export type KpiWeightType = "NUMBER" | "PERCENT";
export type KpiStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

// Restore KPI target types
export interface KpiTarget {
  timeline: string;
  target: number;
}

export interface KpiTargetInput {
  timeline: string;
  target: number;
}

export interface Kpi {
  kpiId: string;
  name: string;
  baseline: number;
  weight: number;
  weightType: KpiWeightType;
  status: KpiStatus;
  targets: KpiTarget[];
  objective: Objective | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKpiInput {
  name: string;
  baseline: number;
  weight: number;
  weightType: KpiWeightType;
  targets: KpiTargetInput[];
  objectiveId: string;
}

export interface UpdateKpiInput {
  kpiId: string;
  name?: string;
  baseline?: number;
  weight?: number;
  weightType?: KpiWeightType;
  status?: KpiStatus;
  targets?: KpiTargetInput[];
  objectiveId?: string;
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
  id: string;
}

export interface CreateKpiMutationVariables {
  input: CreateKpiInput;
}

export interface UpdateKpiMutationVariables {
  input: UpdateKpiInput;
}

export interface RemoveKpiMutationVariables {
  id: string;
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
    name: string;
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
