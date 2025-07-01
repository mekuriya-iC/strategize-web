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
