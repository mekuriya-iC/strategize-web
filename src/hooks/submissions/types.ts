/**
 * Submission Types
 * Centralized type definitions for submission-related functionality
 */

import type {
  KpiQuarterPlan,
  KpiQuarterlyAggregationMethod,
  KpiUnitType,
  SubmissionStatus,
} from "@/types/graphql";

export type SubmissionLevel = "DEPARTMENT" | "DIVISION" | "PERSONNEL";
export type SubmissionType = "OBJECTIVE" | "KPI";
export type ApproverRole = "CORPORATE" | "DIVISION" | "DEPARTMENT";
/** Inbound = approve items from below; outbound = track what you submitted upward */
export type SubmissionListMode = "inbound" | "outbound";
export type AssigneeType = "DIVISION" | "DEPARTMENT" | "PERSONNEL";

export interface SubmissionAssignee {
  assigneeId?: string;
  assigneeType?: AssigneeType;
}

export interface SubmissionKpi extends SubmissionAssignee {
  kpiId: string;
  name?: string;
  status?: string;
  weight?: number;
  baseline?: number;
  targetValue?: number | string;
  unitType?: KpiUnitType;
  quarterlyAggregationMethod?: KpiQuarterlyAggregationMethod;
  kpiMode?: string;
  managerRetentionPercent?: number;
  quarterPlans?: KpiQuarterPlan[];
  objective?: {
    objectiveId: string;
    name?: string;
    type?: string;
  } | null;
}

export interface SubmissionObjective extends SubmissionAssignee {
  objectiveId: string;
  name?: string;
  type?: string;
  status?: string;
  parent?: {
    objectiveId: string;
    name?: string;
    type?: string;
    assigneeId?: string;
    assigneeType?: string;
  } | null;
  kpis?: Array<SubmissionKpi>;
}

export interface MinimalSubmission {
  submissionId: string;
  type: SubmissionType;
  level: SubmissionLevel;
  status: SubmissionStatus;
  reason?: string;
  submittedBy: {
    employeeId?: string;
    fullName: string;
    departments?: Array<{ departmentId: string; name: string }>;
  };
  objective?: SubmissionObjective | null;
  kpi?: SubmissionKpi | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupedSubmission extends MinimalSubmission {
  associatedKpiSubmissions: MinimalSubmission[];
  kpiSubmissionCount: number;
}

export interface SubmissionApprovalsOptions {
  page?: number;
  limit?: number;
  approverRole: ApproverRole;
  status?: SubmissionStatus;
  listMode?: SubmissionListMode;
  submitterEmployeeId?: string;
}

export interface SubmissionMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
