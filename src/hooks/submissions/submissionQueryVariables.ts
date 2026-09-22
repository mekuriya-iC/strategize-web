import type { ObjectiveType } from "@/types/graphql";
import type { ApproverRole } from "./types";

const DEFAULT_LIMIT = 1000;
const BADGE_LIMIT = 100;

interface SubmissionQueryOptions {
  limit?: number;
  /** Server-side status filter. Prefer PENDING for inbound approval inboxes. */
  status?: "PENDING" | "APPROVED" | "REJECTED";
}

function baseVariables(
  type: ObjectiveType,
  submissionType: "OBJECTIVE" | "KPI",
  options: SubmissionQueryOptions = {},
) {
  return {
    page: 1,
    limit: options.limit ?? DEFAULT_LIMIT,
    type,
    submissionType,
    ...(options.status ? { status: options.status } : {}),
  } as const;
}

/** Objective submission inbox queries */
export function objectiveSubmissionsQueryVariables(
  type: ObjectiveType,
  options: SubmissionQueryOptions = {},
) {
  return baseVariables(type, "OBJECTIVE", options);
}

/** KPI submission inbox queries */
export function kpiSubmissionsQueryVariables(
  type: ObjectiveType,
  options: SubmissionQueryOptions = {},
) {
  return baseVariables(type, "KPI", options);
}

/**
 * Levels an approver actually needs for inbound pending work.
 * Fetching every level was a major dashboard cost (6–8 full list queries).
 */
export function inboundLevelsForApprover(
  approverRole: ApproverRole,
): ObjectiveType[] {
  switch (approverRole) {
    case "CORPORATE":
      // Division submissions + orphaned department submissions
      return ["DIVISION", "DEPARTMENT"];
    case "DIVISION":
      return ["DEPARTMENT"];
    case "DEPARTMENT":
      return ["PERSONNEL"];
    default:
      return ["DIVISION", "DEPARTMENT"];
  }
}

export function outboundLevelsForTracking(): ObjectiveType[] {
  return ["CORPORATE", "DIVISION", "DEPARTMENT", "PERSONNEL"];
}

export { BADGE_LIMIT, DEFAULT_LIMIT };
