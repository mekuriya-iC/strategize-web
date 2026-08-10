/**
 * Frontend GraphQL Mutation Shape Tests
 *
 * These tests verify that the frontend GraphQL mutations match the expected
 * backend schema — field names, argument names, and return types.
 * They run without a live server using document parsing only.
 */

import { describe, it, expect } from 'vitest';
import { print } from 'graphql';
import { LOGIN_EMPLOYEE, REFRESH_TOKEN } from '../mutations/auth';
import {
  CREATE_EMPLOYEES,
  UPDATE_EMPLOYEES,
  DELETE_EMPLOYEES,
} from '../mutations/employees';
import {
  CREATE_KPI,
  UPDATE_KPI,
  DELETE_KPI,
  CREATE_KPI_UPDATE,
  UPDATE_KPI_STATUS,
  TOGGLE_KPI_ACTIVE,
  REORDER_KPIS,
} from '../mutations/kpis';
import {
  CREATE_OBJECTIVE,
  UPDATE_OBJECTIVE,
  DELETE_OBJECTIVE,
  APPROVE_OBJECTIVE,
  REJECT_OBJECTIVE,
  CASCADE_OBJECTIVE,
  CASCADE_OBJECTIVE_V2,
  ASSIGN_OBJECTIVE,
  REORDER_OBJECTIVES,
  UPDATE_OBJECTIVE_STATUS,
} from '../mutations/objectives';
import {
  CREATE_LOGBOOK_ENTRY,
  UPDATE_LOGBOOK_ENTRY,
} from '../mutations/logbook';
import { GET_KPI_RESULT_ENTRY_CONTEXT } from '../queries/logbook';

// ─── Auth Mutations ──────────────────────────────────────────────────────────

describe('Auth Mutations', () => {
  it('LOGIN_EMPLOYEE mutation has correct structure', () => {
    const printed = print(LOGIN_EMPLOYEE);
    expect(printed).toContain('mutation LoginEmployee');
    expect(printed).toContain('$input: LoginEmployeeInput!');
    expect(printed).toContain('loginEmployee(loginInput: $input)');
    expect(printed).toContain('accessToken');
    expect(printed).toContain('refreshToken');
    expect(printed).toContain('employee');
    expect(printed).toContain('employeeId');
    expect(printed).toContain('email');
    expect(printed).toContain('role');
  });

  it('REFRESH_TOKEN mutation has correct structure', () => {
    const printed = print(REFRESH_TOKEN);
    expect(printed).toContain('mutation RefreshToken');
    expect(printed).toContain('$refreshToken: String!');
    expect(printed).toContain('refreshToken(refreshToken: $refreshToken)');
    expect(printed).toContain('accessToken');
  });
});

// ─── Employee Mutations ───────────────────────────────────────────────────────

describe('Employee Mutations', () => {
  it('CREATE_EMPLOYEES mutation has correct structure', () => {
    const printed = print(CREATE_EMPLOYEES);
    expect(printed).toContain('mutation CreateEmployees');
    expect(printed).toContain('$createEmployeeInput: CreateEmployeeInput!');
    expect(printed).toContain('createEmployee(createEmployeeInput: $createEmployeeInput)');
    expect(printed).toContain('employeeId');
    expect(printed).toContain('fullName');
    expect(printed).toContain('email');
    expect(printed).toContain('role');
  });

  it('UPDATE_EMPLOYEES mutation has correct structure', () => {
    const printed = print(UPDATE_EMPLOYEES);
    expect(printed).toContain('mutation UpdateEmployees');
    expect(printed).toContain('$updateEmployeeInput: UpdateEmployeeInput!');
    expect(printed).toContain('updateEmployee(updateEmployeeInput: $updateEmployeeInput)');
    expect(printed).toContain('employeeId');
  });

  it('DELETE_EMPLOYEES mutation has correct structure', () => {
    const printed = print(DELETE_EMPLOYEES);
    expect(printed).toContain('mutation DeleteEmployees');
    expect(printed).toContain('$employeeId: ID!');
    expect(printed).toContain('removeEmployee(employeeId: $employeeId)');
    expect(printed).toContain('employeeId');
    expect(printed).toContain('fullName');
  });
});

// ─── KPI Mutations ────────────────────────────────────────────────────────────

describe('KPI Mutations', () => {
  it('CREATE_KPI mutation has correct structure', () => {
    const printed = print(CREATE_KPI);
    expect(printed).toContain('mutation CreateKpi');
    expect(printed).toContain('$input: CreateKpiInput!');
    expect(printed).toContain('createKpi(createKpiInput: $input)');
    expect(printed).toContain('kpiId');
    expect(printed).toContain('name');
    expect(printed).toContain('kpiType');
    expect(printed).toContain('measurementUnit');
    expect(printed).toContain('targetValue');
    expect(printed).toContain('frequency');
    expect(printed).toContain('isActive');
    expect(printed).toContain('createdAt');
    expect(printed).toContain('actualBasisSource');
  });

  it('UPDATE_KPI mutation has correct structure', () => {
    const printed = print(UPDATE_KPI);
    expect(printed).toContain('mutation UpdateKpi');
    expect(printed).toContain('$input: UpdateKpiInput!');
    expect(printed).toContain('updateKpi(updateKpiInput: $input)');
    expect(printed).toContain('kpiId');
    expect(printed).toContain('updatedAt');
    expect(printed).toContain('kpiMode');
    expect(printed).toContain('actualBasisSource');
  });

  it('DELETE_KPI mutation has correct structure', () => {
    const printed = print(DELETE_KPI);
    expect(printed).toContain('mutation RemoveKpi');
    expect(printed).toContain('$kpiId: ID!');
    expect(printed).toContain('removeKpi(kpiId: $kpiId)');
    expect(printed).toContain('kpiId');
    expect(printed).toContain('isDeleted');
  });

  it('CREATE_KPI_UPDATE mutation has correct structure', () => {
    const printed = print(CREATE_KPI_UPDATE);
    expect(printed).toContain('mutation CreateKpiUpdate');
    expect(printed).toContain('$input: CreateKpiUpdateInput!');
    expect(printed).toContain('createKpiUpdate(createKpiUpdateInput: $input)');
    expect(printed).toContain('kpiUpdateId');
    expect(printed).toContain('achievedValue');
    expect(printed).toContain('progressPercentage');
    expect(printed).toContain('progressStatus');
    expect(printed).toContain('reportingDate');
  });

  it('UPDATE_KPI_STATUS mutation has correct structure', () => {
    const printed = print(UPDATE_KPI_STATUS);
    expect(printed).toContain('mutation UpdateKpiStatus');
    expect(printed).toContain('$kpiId: ID!');
    expect(printed).toContain('$status: KpiStatus!');
    expect(printed).toContain('updateKpiStatus(kpiId: $kpiId, status: $status)');
    expect(printed).toContain('kpiId');
    expect(printed).toContain('status');
  });

  it('TOGGLE_KPI_ACTIVE mutation has correct structure', () => {
    const printed = print(TOGGLE_KPI_ACTIVE);
    expect(printed).toContain('mutation ToggleKpiActive');
    expect(printed).toContain('$kpiId: ID!');
    expect(printed).toContain('toggleKpiActive(kpiId: $kpiId)');
    expect(printed).toContain('isActive');
  });

  it('REORDER_KPIS mutation has correct structure', () => {
    const printed = print(REORDER_KPIS);
    expect(printed).toContain('mutation ReorderKpis');
    expect(printed).toContain('$input: [ReorderKpiInput!]!');
    expect(printed).toContain('reorderKpis(reorderKpisInput: $input)');
    expect(printed).toContain('kpiId');
    expect(printed).toContain('order');
  });
});

describe('Logbook basis result contract', () => {
  it('selects exact result fields from create and update mutations', () => {
    for (const document of [CREATE_LOGBOOK_ENTRY, UPDATE_LOGBOOK_ENTRY]) {
      const printed = print(document);
      expect(printed).toContain('kpiResultInputMode');
      expect(printed).toContain('kpiActualNumeratorExact');
      expect(printed).toContain('kpiActualRateExact');
      expect(printed).toContain('kpiActualBasisExact');
    }
  });

  it('queries the result-entry denominator context with fixed arguments', () => {
    const printed = print(GET_KPI_RESULT_ENTRY_CONTEXT);
    expect(printed).toContain('query GetKpiResultEntryContext');
    expect(printed).toContain('$kpiId: ID!');
    expect(printed).toContain('$entryDate: String!');
    expect(printed).toContain(
      'kpiResultEntryContext(kpiId: $kpiId, entryDate: $entryDate)',
    );
    expect(printed).toContain('actualBasisSource');
    expect(printed).toContain('resolvedBasisExact');
    expect(printed).toContain('basisAvailable');
  });
});

// ─── Objective Mutations ──────────────────────────────────────────────────────

describe('Objective Mutations', () => {
  it('CREATE_OBJECTIVE mutation has correct structure', () => {
    const printed = print(CREATE_OBJECTIVE);
    expect(printed).toContain('mutation CreateObjective');
    expect(printed).toContain('$input: CreateObjectiveInput!');
    expect(printed).toContain('createObjective(createObjectiveInput: $input)');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('title');
    expect(printed).toContain('level');
    expect(printed).toContain('status');
    expect(printed).toContain('cascadeStatus');
    expect(printed).toContain('createdAt');
  });

  it('UPDATE_OBJECTIVE mutation has correct structure', () => {
    const printed = print(UPDATE_OBJECTIVE);
    expect(printed).toContain('mutation UpdateObjective');
    expect(printed).toContain('$input: UpdateObjectiveInput!');
    expect(printed).toContain('updateObjective(updateObjectiveInput: $input)');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('updatedAt');
  });

  it('DELETE_OBJECTIVE mutation has correct structure', () => {
    const printed = print(DELETE_OBJECTIVE);
    expect(printed).toContain('mutation RemoveObjective');
    expect(printed).toContain('$objectiveId: ID!');
    expect(printed).toContain('removeObjective(objectiveId: $objectiveId)');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('isDeleted');
  });

  it('APPROVE_OBJECTIVE mutation has correct structure', () => {
    const printed = print(APPROVE_OBJECTIVE);
    expect(printed).toContain('mutation ApproveObjective');
    expect(printed).toContain('$objectiveId: ID!');
    expect(printed).toContain('approveObjective(objectiveId: $objectiveId');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('status');
    expect(printed).toContain('approvedAt');
    expect(printed).toContain('approvedBy');
  });

  it('REJECT_OBJECTIVE mutation has correct structure', () => {
    const printed = print(REJECT_OBJECTIVE);
    expect(printed).toContain('mutation RejectObjective');
    expect(printed).toContain('$objectiveId: ID!');
    expect(printed).toContain('$reason: String!');
    expect(printed).toContain('rejectObjective(objectiveId: $objectiveId, reason: $reason)');
    expect(printed).toContain('status');
  });

  it('CASCADE_OBJECTIVE mutation has correct structure', () => {
    const printed = print(CASCADE_OBJECTIVE);
    expect(printed).toContain('mutation CascadeObjective');
    expect(printed).toContain('$input: CascadeObjectiveInput!');
    expect(printed).toContain('cascadeObjective(cascadeObjectiveInput: $input)');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('cascadeStatus');
    expect(printed).toContain('children');
    expect(printed).toContain('assigneeId');
    expect(printed).toContain('directBasisValue');
  });

  it('CASCADE_OBJECTIVE_V2 mutation supports atomic mixed-level recipients', () => {
    const printed = print(CASCADE_OBJECTIVE_V2);
    expect(printed).toContain('mutation CascadeObjectiveV2');
    expect(printed).toContain('$input: CascadeObjectiveV2Input!');
    expect(printed).toContain('cascadeObjectiveV2(cascadeObjectiveV2Input: $input)');
    expect(printed).toContain('parentObjective');
    expect(printed).toContain('children');
    expect(printed).toContain('assigneeType');
    expect(printed).toContain('assigneeId');
    expect(printed).toContain('createdCount');
    expect(printed).toContain('updatedCount');
  });

  it('ASSIGN_OBJECTIVE mutation has correct structure', () => {
    const printed = print(ASSIGN_OBJECTIVE);
    expect(printed).toContain('mutation AssignObjective');
    expect(printed).toContain('$input: AssignObjectiveInput!');
    expect(printed).toContain('assignObjective(assignObjectiveInput: $input)');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('assigneeType');
    expect(printed).toContain('assigneeId');
    expect(printed).toContain('ownerUser');
  });

  it('REORDER_OBJECTIVES mutation has correct structure', () => {
    const printed = print(REORDER_OBJECTIVES);
    expect(printed).toContain('mutation ReorderObjectives');
    expect(printed).toContain('$input: [ReorderObjectiveInput!]!');
    expect(printed).toContain('reorderObjectives(reorderObjectivesInput: $input)');
    expect(printed).toContain('objectiveId');
    expect(printed).toContain('order');
  });

  it('UPDATE_OBJECTIVE_STATUS mutation has correct structure', () => {
    const printed = print(UPDATE_OBJECTIVE_STATUS);
    expect(printed).toContain('mutation UpdateObjectiveStatus');
    expect(printed).toContain('$objectiveId: ID!');
    expect(printed).toContain('$status: ObjectiveStatus!');
    expect(printed).toContain('updateObjectiveStatus(objectiveId: $objectiveId, status: $status)');
    expect(printed).toContain('status');
    expect(printed).toContain('updatedAt');
  });
});
