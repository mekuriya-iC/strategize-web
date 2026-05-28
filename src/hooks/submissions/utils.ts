/**
 * Submission Utilities
 * Helper functions for submission processing and filtering
 */

import type {
  MinimalSubmission,
  GroupedSubmission,
  ApproverRole,
  SubmissionLevel,
  SubmissionListMode,
} from "./types";

/**
 * Extract department ID from a submission
 * Checks both objective and KPI assignee fields
 * Also handles cases where assigneeType might not be set but the objective is department-level
 * For KPI submissions, also checks the nested kpi.objective data
 */
export const getDepartmentIdFromSubmission = (
  submission: MinimalSubmission
): string | null => {
  // Check objective's assignee - primary method
  if (
    submission.objective?.assigneeType === "DEPARTMENT" &&
    submission.objective?.assigneeId
  ) {
    return submission.objective.assigneeId;
  }

  // Fallback: If the objective type is DEPARTMENT and has an assigneeId, use it
  // (even if assigneeType isn't explicitly set to DEPARTMENT)
  if (
    submission.objective?.type === "DEPARTMENT" &&
    submission.objective?.assigneeId
  ) {
    return submission.objective.assigneeId;
  }

  // Check KPI's assignee
  if (
    submission.kpi?.assigneeType === "DEPARTMENT" &&
    submission.kpi?.assigneeId
  ) {
    return submission.kpi.assigneeId;
  }

  // For KPI submissions, check the nested objective inside the KPI
  // This is needed when KPIs are added via "Add KPI" button
  const nestedObjective = submission.kpi?.objective as {
    objectiveId?: string;
    name?: string;
    type?: string;
    assigneeId?: string;
    assigneeType?: string;
    parent?: {
      objectiveId: string;
      name?: string;
      type?: string;
      assigneeId?: string;
      assigneeType?: string;
    } | null;
  } | undefined;

  if (nestedObjective) {
    // First check if the nested objective has assigneeType = DEPARTMENT
    if (nestedObjective.assigneeType === "DEPARTMENT" && nestedObjective.assigneeId) {
      return nestedObjective.assigneeId;
    }

    // Fallback: If the objective type is DEPARTMENT and has an assigneeId
    if (nestedObjective.type === "DEPARTMENT" && nestedObjective.assigneeId) {
      return nestedObjective.assigneeId;
    }
  }

  // For PERSONNEL level, resolve department from parent objective or submitter's department
  if (submission.level === "PERSONNEL") {
    // 1. Try parent objective (current logic)
    if (submission.objective?.parent) {
      if (
        (submission.objective.parent.assigneeType === "DEPARTMENT" ||
          submission.objective.parent.type === "DEPARTMENT") &&
        submission.objective.parent.assigneeId
      ) {
        return submission.objective.parent.assigneeId;
      }
    }

    if (nestedObjective?.parent) {
      if (
        (nestedObjective.parent.assigneeType === "DEPARTMENT" ||
          nestedObjective.parent.type === "DEPARTMENT") &&
        nestedObjective.parent.assigneeId
      ) {
        return nestedObjective.parent.assigneeId;
      }
    }

    // 2. Fallback: Use the submitter's first department
    // This is often more reliable for PERSONNEL level submissions
    if (submission.submittedBy?.departments && submission.submittedBy.departments.length > 0) {
      return (submission.submittedBy.departments[0] as { departmentId: string }).departmentId;
    }
  }

  return null;
}

/**
 * Remove duplicate submissions based on submissionId
 */
export const deduplicateSubmissions = (
  submissions: MinimalSubmission[]
): MinimalSubmission[] => {
  return submissions.filter(
    (submission, index, self) =>
      index === self.findIndex((s) => s.submissionId === submission.submissionId)
  );
};

/**
 * Group KPI submissions under their parent objectives
 * Returns enhanced objective submissions with associated KPIs
 * Also creates virtual objective groupings for orphaned KPI submissions
 * (KPIs whose parent objective has already been approved)
 */
export const groupSubmissionsByObjective = (
  submissions: MinimalSubmission[]
): GroupedSubmission[] => {
  const objectiveSubmissions = submissions.filter((s) => s.type === "OBJECTIVE");
  const kpiSubmissions = submissions.filter((s) => s.type === "KPI");

  // Create a map to group KPI submissions by their objective ID
  const kpisByObjective: Record<string, MinimalSubmission[]> = {};

  kpiSubmissions.forEach((kpiSubmission) => {
    const nestedObjectiveId = kpiSubmission.kpi?.objective?.objectiveId;
    const topLevelObjectiveId = kpiSubmission.objective?.objectiveId;
    const objectiveId = nestedObjectiveId || topLevelObjectiveId;

    if (objectiveId) {
      if (!kpisByObjective[objectiveId]) {
        kpisByObjective[objectiveId] = [];
      }
      kpisByObjective[objectiveId].push(kpiSubmission);
    }
  });

  // Track which objective IDs have an objective submission
  const objectiveIdsWithSubmission = new Set(
    objectiveSubmissions.map((s) => s.objective?.objectiveId).filter(Boolean) as string[]
  );

  // Enhance objective submissions with their associated KPI submissions
  const groupedSubmissions: GroupedSubmission[] = objectiveSubmissions.map((objSubmission) => {
    const objectiveId = objSubmission.objective?.objectiveId;
    const associatedKpiSubmissions = objectiveId
      ? kpisByObjective[objectiveId] || []
      : [];

    return {
      ...objSubmission,
      associatedKpiSubmissions,
      kpiSubmissionCount: associatedKpiSubmissions.length,
    };
  });

  // Find orphaned KPI submissions (those whose objective has no pending submission)
  // and create virtual objective groupings for them
  Object.entries(kpisByObjective).forEach(([objectiveId, kpis]) => {
    if (!objectiveIdsWithSubmission.has(objectiveId) && kpis.length > 0) {
      // Get objective info from the first KPI submission
      const firstKpi = kpis[0];
      const objectiveInfo = firstKpi.kpi?.objective || firstKpi.objective;

      // Create a virtual objective grouping for these orphaned KPI submissions
      const virtualObjectiveSubmission: GroupedSubmission = {
        submissionId: `virtual-${objectiveId}`,
        type: "OBJECTIVE",
        level: firstKpi.level,
        status: "APPROVED", // The objective is already approved
        reason: "Objective approved - KPI submissions pending",
        submittedBy: firstKpi.submittedBy,
        objective: objectiveInfo ? {
          objectiveId: objectiveInfo.objectiveId,
          name: objectiveInfo.name || "Unknown Objective",
          type: objectiveInfo.type,
        } : null,
        kpi: null,
        createdAt: firstKpi.createdAt,
        updatedAt: firstKpi.updatedAt,
        associatedKpiSubmissions: kpis,
        kpiSubmissionCount: kpis.length,
      };

      groupedSubmissions.push(virtualObjectiveSubmission);
    }
  });

  return groupedSubmissions;
};

/** Level a manager submits at when requesting approval from above. */
export function getOutboundSubmissionLevel(
  approverRole: ApproverRole
): SubmissionLevel | null {
  if (approverRole === "DIVISION") return "DIVISION";
  if (approverRole === "DEPARTMENT") return "DEPARTMENT";
  return null;
}

/**
 * Inbound: items from below to approve. Outbound: items the current user submitted upward.
 */
export const filterSubmissionsByListMode = (
  submissions: MinimalSubmission[],
  mode: SubmissionListMode,
  approverRole: ApproverRole,
  submitterEmployeeId?: string | null
): MinimalSubmission[] => {
  if (mode === "inbound") {
    return submissions;
  }

  if (!submitterEmployeeId) {
    return [];
  }

  // For outbound (tracking), show all items submitted by the current user
  return submissions.filter(
    (submission) => submission.submittedBy?.employeeId === submitterEmployeeId
  );
};

/**
 * Filter submissions based on organizational hierarchy and approver role
 */
export const filterSubmissionsByHierarchy = (
  submissions: MinimalSubmission[],
  approverRole: ApproverRole,
  selectedUnitType: "division" | "department" | null,
  departmentsWithoutDivision: Set<string>,
  departmentsInSelectedDivision: Set<string> = new Set(),
  selectedUnitId: string | null = null
): MinimalSubmission[] => {
  return submissions.filter((submission) => {
    switch (approverRole) {
      case "CORPORATE":
        // Corporate (CEO/Super Admin) should ONLY see DIVISION level submissions
        if (submission.level === "DIVISION") {
          return true;
        }
        // For DEPARTMENT level, only show if the department has no division above it
        // (orphaned departments that report directly to corporate)
        if (submission.level === "DEPARTMENT") {
          const deptId = getDepartmentIdFromSubmission(submission);
          // If we can't determine the department, show it (safe default)
          // If the department has no division, show it
          return !deptId || departmentsWithoutDivision.has(deptId);
        }
        // Do NOT show PERSONNEL level submissions to corporate
        // Those should only be visible to department managers
        return false;

      case "DIVISION":
        if (selectedUnitType === "division" && selectedUnitId) {
          // Division managers should ONLY see DEPARTMENT level submissions
          // They should NOT see individual PERSONNEL submissions
          if (submission.level === "DEPARTMENT") {
            const deptId = getDepartmentIdFromSubmission(submission);
            // If we can determine the department, check if it belongs to the selected division
            if (deptId) {
              return departmentsInSelectedDivision.has(deptId);
            }
            // If we can't determine the department, don't show it (safer for division approvers)
            return false;
          }
          // Do NOT show PERSONNEL level submissions to division managers
          // Those should only be visible to department managers
        }
        return false;

      case "DEPARTMENT":
        if (selectedUnitType === "department" && selectedUnitId) {
          // Only show PERSONNEL level submissions from the selected department
          if (submission.level === "PERSONNEL") {
            const deptId = getDepartmentIdFromSubmission(submission);
            return deptId === selectedUnitId;
          }
        }
        return false;

      default:
        return false;
    }
  });
};

/**
 * Filter submissions by status
 */
export const filterSubmissionsByStatus = (
  submissions: MinimalSubmission[],
  status?: string
): MinimalSubmission[] => {
  if (!status) {
    return submissions;
  }

  const objectiveSubs = submissions.filter((s) => s.type === "OBJECTIVE");
  const kpiSubs = submissions.filter((s) => s.type === "KPI");

  const filteredObjectiveSubs = objectiveSubs.filter((s) => s.status === status);
  const filteredKpiSubs = kpiSubs.filter((s) => s.status === status);

  return [...filteredObjectiveSubs, ...filteredKpiSubs];
};

/**
 * Paginate submissions
 */
export const paginateSubmissions = <T>(
  submissions: T[],
  page: number,
  limit: number
): T[] => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return submissions.slice(startIndex, endIndex);
};

/**
 * Calculate pagination metadata
 */
export const calculatePaginationMeta = (
  totalItems: number,
  page: number,
  limit: number,
  itemCount: number
) => ({
  currentPage: page,
  itemCount,
  itemsPerPage: limit,
  totalItems,
  totalPages: Math.ceil(totalItems / limit),
});

