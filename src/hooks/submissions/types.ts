/**
 * Submission Types
 * Centralized type definitions for submission-related functionality
 */

import type { SubmissionStatus } from "@/types/graphql";

export type SubmissionLevel = "DEPARTMENT" | "DIVISION" | "PERSONNEL";
export type SubmissionType = "OBJECTIVE" | "KPI";
export type ApproverRole = "CORPORATE" | "DIVISION" | "DEPARTMENT";
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
  kpis?: Array<SubmissionKpi>;
}

export interface MinimalSubmission {
  submissionId: string;
  type: SubmissionType;
  level: SubmissionLevel;
  status: SubmissionStatus;
  reason?: string;
  submittedBy: { fullName: string };
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
}

export interface SubmissionMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
