/**
 * Frontend GraphQL Query Shape Tests
 *
 * These tests verify that the frontend GraphQL queries match the expected
 * backend schema — field names, argument names, and return types.
 * They run without a live server using document parsing only.
 */

import { describe, it, expect } from 'vitest';
import { print } from 'graphql';
import { GET_ME } from '../queries/auth';
import { GETEMPLOYEES, GET_EMPLOYEES_BY_ID } from '../queries/employees';
import {
  GET_KPIS,
  GET_KPI,
  GET_KPIS_BY_OBJECTIVE,
  GET_MY_KPIS,
  GET_KPI_UPDATES,
  GET_KPI_ASSIGNMENTS_EMPLOYEE,
  GET_KPI_ASSIGNMENTS_DEPARTMENT,
  GET_KPI_ASSIGNMENTS_DIVISION,
  GET_SHARED_KPI_PARTICIPANTS,
} from '../queries/kpis';
import { GET_KPI_ASSIGNMENT_BREAKDOWN } from '../queries/kpi-detail';
import {
  GET_OBJECTIVES,
  GET_OBJECTIVE,
  GET_OBJECTIVES_FOR_APPROVAL,
  GET_MY_OBJECTIVES,
  GET_OBJECTIVES_HIERARCHY,
} from '../queries/objectives';

// ─── Auth Queries ─────────────────────────────────────────────────────────────

describe('Auth Queries', () => {
  it('GET_ME query has correct structure', () => {
    const printed = print(GET_ME);
    expect(printed).toContain('query GetMe');
    expect(printed).toContain('me {');
    expect(printed).toContain('employeeId');
    expect(printed).toContain('organizationId');
    expect(printed).toContain('fullName');
    expect(printed).toContain('email');
    expect(printed).toContain('role');
    expect(printed).toContain('status');
    expect(printed).toContain('title');
    expect(printed).toContain('phoneNumber');
    expect(printed).toContain('picture');
    expect(printed).toContain('startDate');
    expect(printed).toContain('createdAt');
    expect(printed).toContain('updatedAt');
  });
});

// ─── Employee Queries ─────────────────────────────────────────────────────────

describe('Employee Queries', () => {
  it('GETEMPLOYEES query has correct structure', () => {
    const printed = print(GETEMPLOYEES);
    expect(printed).toContain('query GetEmployees');
    expect(printed).toContain('$page: Int');
    expect(printed).toContain('$limit: Int');
    expect(printed).toContain('$search: String');
    expect(printed).toContain('employees(page: $page, limit: $limit, search: $search)');
    expect(printed).toContain('items');
    expect(printed).toContain('meta');
    expect(printed).toContain('totalItems');
    expect(printed).toContain('totalPages');
    expect(printed).toContain('currentPage');
  });

  it('GET_EMPLOYEES_BY_ID query has correct structure', () => {
    const printed = print(GET_EMPLOYEES_BY_ID);
    expect(printed).toContain('query GetEmployeesById');
    expect(printed).toContain('$employeeId: ID!');
    expect(printed).toContain('employee(employeeId: $employeeId)');
    expect(printed).toContain('employeeId');
    expect(printed).toContain('fullName');
    expect(printed).toContain('email');
  });
});

// ─── KPI Queries ──────────────────────────────────────────────────────────────

describe('KPI Queries', () => {
  it('GET_KPIS query has correct structure', () => {
    const printed = print(GET_KPIS);
    expect(printed).toContain('query GetKpis');
    expect(printed).toContain('$page: Int');
    expect(printed).toContain('$limit: Int');
    expect(printed).toContain('$search: String');
    expect(printed).toContain('$organizationId: ID');
    expect(printed).toContain('$strategicObjectiveId: ID');
    expect(printed).toContain('kpis(');
    expect(printed).toContain('items');
    expect(printed).toContain('kpiId');
    expect(printed).toContain('name');
    expect(printed).toContain('kpiType');
    expect(printed).toContain('measurementUnit');
    expect(printed).toContain('quarterlyAggregationMethod');
    expect(printed).toContain('targetValue');
    expect(printed).toContain('frequency');
    expect(printed).toContain('status');
    expect(printed).toContain('isActive');
    expect(printed).toContain('meta');
    expect(printed).toContain('currentPage');
    expect(printed).toContain('totalPages');
    expect(printed).toContain('totalItems');
    expect(printed).toContain('itemsPerPage');
    expect(printed).toContain('itemCount');
  });

  it('GET_KPI query has correct structure', () => {
    const printed = print(GET_KPI);
    expect(printed).toContain('query GetKpi');
    expect(printed).toContain('$kpiId: ID!');
    expect(printed).toContain('kpi(kpiId: $kpiId)');
    expect(printed).toContain('kpiId');
    expect(printed).toContain('objective');
    expect(printed).toContain('createdBy');
    expect(printed).toContain('parent');
    expect(printed).toContain('quarterlyAggregationMethod');
    expect(printed).toContain('targets');
  });

  it('GET_KPIS_BY_OBJECTIVE query has correct structure', () => {
    const printed = print(GET_KPIS_BY_OBJECTIVE);
    expect(printed).toContain('query GetKpisByObjective');
    expect(printed).toContain('$objectiveId: ID!');
    expect(printed).toContain('kpisByObjective(');
    expect(printed).toContain('objectiveId: $objectiveId');
    expect(printed).toContain('items');
    expect(printed).toContain('kpiMode');
    expect(printed).toContain('managerRetentionPercent');
    expect(printed).toContain('calculationType');
    expect(printed).toContain('quarterlyAggregationMethod');
    expect(printed).toContain('meta');
  });

  it('GET_MY_KPIS query has correct structure', () => {
    const printed = print(GET_MY_KPIS);
    expect(printed).toContain('query GetMyKpis');
    expect(printed).toContain('myKpis(');
    expect(printed).toContain('items');
    expect(printed).toContain('kpiId');
    expect(printed).toContain('meta');
  });

  it('GET_KPI_UPDATES query has correct structure', () => {
    const printed = print(GET_KPI_UPDATES);
    expect(printed).toContain('query GetKpiUpdates');
    expect(printed).toContain('$kpiId: ID!');
    expect(printed).toContain('kpiUpdates(');
    expect(printed).toContain('kpiUpdateId');
    expect(printed).toContain('achievedValue');
    expect(printed).toContain('progressPercentage');
    expect(printed).toContain('progressStatus');
    expect(printed).toContain('reportingDate');
    expect(printed).toContain('reportedBy');
  });

  it('GET_KPI_ASSIGNMENT_BREAKDOWN queries all assignment levels by KPI', () => {
    const printed = print(GET_KPI_ASSIGNMENT_BREAKDOWN);
    expect(printed).toContain('query GetKpiAssignmentBreakdown');
    expect(printed).toContain('$kpiId: ID!');
    expect(printed).toContain('employeeAssignments: kpiAssignmentsEmployee');
    expect(printed).toContain('departmentAssignments: kpiAssignmentsDepartment');
    expect(printed).toContain('divisionAssignments: kpiAssignmentsDivision');
    expect(printed).toContain('corporateAssignments: kpiAssignmentsCorporate');
    expect(printed).toContain('kpiId: $kpiId');
    expect(printed).toContain('parentWeightAllocation');
    expect(printed).toContain('assignedBy');
  });

  it('GET_KPI_ASSIGNMENTS_EMPLOYEE query has correct structure', () => {
    const printed = print(GET_KPI_ASSIGNMENTS_EMPLOYEE);
    expect(printed).toContain('query GetKpiAssignmentsEmployee');
    expect(printed).toContain('$employeeId: ID!');
    expect(printed).toContain('kpiAssignmentsEmployee(');
    // Frontend variable $employeeId maps to userId: arg on the backend
    expect(printed).toContain('userId: $employeeId');
    expect(printed).toContain('kpiAssignmentEmployeeId');
    expect(printed).toContain('targetValue');
    expect(printed).toContain('weight');
    expect(printed).toContain('kpi');
    expect(printed).toContain('employee');
    expect(printed).toContain('assignedBy');
    expect(printed).toContain('strategicPeriod');
  });

  it('GET_KPI_ASSIGNMENTS_DEPARTMENT query has correct structure', () => {
    const printed = print(GET_KPI_ASSIGNMENTS_DEPARTMENT);
    expect(printed).toContain('query GetKpiAssignmentsDepartment');
    expect(printed).toContain('$departmentId: ID!');
    expect(printed).toContain('kpiAssignmentsDepartment(');
    expect(printed).toContain('kpiAssignmentDepartmentId');
    expect(printed).toContain('department');
  });

  it('GET_KPI_ASSIGNMENTS_DIVISION query has correct structure', () => {
    const printed = print(GET_KPI_ASSIGNMENTS_DIVISION);
    expect(printed).toContain('query GetKpiAssignmentsDivision');
    expect(printed).toContain('$divisionId: ID!');
    expect(printed).toContain('kpiAssignmentsDivision(');
    expect(printed).toContain('kpiAssignmentDivisionId');
    expect(printed).toContain('division');
  });

  it('GET_SHARED_KPI_PARTICIPANTS query has correct structure', () => {
    const printed = print(GET_SHARED_KPI_PARTICIPANTS);
    expect(printed).toContain('query GetSharedKpiParticipants');
    expect(printed).toContain('$kpiId: ID!');
    expect(printed).toContain('sharedKpiParticipants(');
    expect(printed).toContain('sharedKpiParticipantId');
    expect(printed).toContain('contributionWeight');
    expect(printed).toContain('participant');
    expect(printed).toContain('assignedBy');
  });
});

// ─── Objective Queries ────────────────────────────────────────────────────────

describe('Objective Queries', () => {
  it('GET_OBJECTIVES query has correct structure', () => {
    const printed = print(GET_OBJECTIVES);
    expect(printed).toContain('query GetObjectives');
    expect(printed).toContain('$page: Int');
    expect(printed).toContain('$limit: Int');
    expect(printed).toContain('$assigneeId: ID');
    expect(printed).toContain('$organizationId: ID');
    expect(printed).toContain('$search: String');
    expect(printed).toContain('objectives(');
    expect(printed).toContain('items');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('title');
    expect(printed).toContain('level');
    expect(printed).toContain('status');
    expect(printed).toContain('cascadeStatus');
    expect(printed).toContain('strategicPeriod');
    expect(printed).toContain('createdBy');
    expect(printed).toContain('kpis');
    expect(printed).toContain('meta');
    expect(printed).toContain('currentPage');
    expect(printed).toContain('totalPages');
    expect(printed).toContain('totalItems');
    expect(printed).toContain('itemsPerPage');
    expect(printed).toContain('itemCount');
  });

  it('GET_OBJECTIVE query has correct structure', () => {
    const printed = print(GET_OBJECTIVE);
    expect(printed).toContain('query GetObjective');
    expect(printed).toContain('$objectiveId: ID!');
    expect(printed).toContain('objective(objectiveId: $objectiveId)');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('strategicPeriod');
    expect(printed).toContain('createdBy');
    expect(printed).toContain('approvedBy');
    expect(printed).toContain('ownerUser');
    expect(printed).toContain('parent');
    expect(printed).toContain('kpis');
  });

  it('GET_OBJECTIVES_FOR_APPROVAL query has correct structure', () => {
    const printed = print(GET_OBJECTIVES_FOR_APPROVAL);
    expect(printed).toContain('query GetObjectivesForApproval');
    expect(printed).toContain('objectivesForApproval(');
    expect(printed).toContain('items');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('status');
    expect(printed).toContain('createdBy');
    expect(printed).toContain('ownerUser');
    expect(printed).toContain('kpis');
    expect(printed).toContain('meta');
  });

  it('GET_MY_OBJECTIVES query has correct structure', () => {
    const printed = print(GET_MY_OBJECTIVES);
    expect(printed).toContain('query GetMyObjectives');
    expect(printed).toContain('myObjectives(');
    expect(printed).toContain('items');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('title');
    expect(printed).toContain('status');
    expect(printed).toContain('strategicPeriod');
    expect(printed).toContain('kpis');
    expect(printed).toContain('meta');
  });

  it('GET_OBJECTIVES_HIERARCHY query has correct structure', () => {
    const printed = print(GET_OBJECTIVES_HIERARCHY);
    expect(printed).toContain('query GetObjectivesHierarchy');
    expect(printed).toContain('$strategicPeriodId: ID!');
    expect(printed).toContain('objectivesHierarchy(');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('level');
    expect(printed).toContain('cascadeStatus');
    expect(printed).toContain('ownerUser');
    expect(printed).toContain('children');
  });
});
