import type { Department, Objective, Kpi } from "@/types/graphql";
import { isTopLevelCorporateObjective } from "@/lib/objectives/kpiWeightScope";
import {
  canApproveSubmission,
  type UserScope,
} from "@/lib/rbac/scopes";

export interface AssignDownstreamResult {
  allowed: boolean;
  reason?: string;
}

/** Whether the user can assign this objective/KPIs to a lower organizational level. */
export function canAssignDownstream(
  objective: Pick<
    Objective,
    "type" | "assigneeType" | "assigneeId" | "parentId" | "parent" | "status" | "kpis"
  >,
  kpis?: Kpi[]
): AssignDownstreamResult {
  const kpiList = kpis ?? objective.kpis ?? [];
  if (kpiList.length === 0) {
    return {
      allowed: false,
      reason: "Add at least one KPI before assigning downstream.",
    };
  }

  if (isTopLevelCorporateObjective(objective)) {
    return { allowed: true };
  }

  if (objective.status === "APPROVED") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Requires approval before assigning downstream.",
  };
}

/** Cascaded division-level objective (assigned from corporate). */
export function isDivisionLevelObjective(
  objective: Pick<Objective, "assigneeType" | "type" | "parentId" | "parent">
): boolean {
  if (objective.assigneeType === "DIVISION") return true;
  return objective.type === "DIVISION" && !!objective.parentId;
}

/** Cascaded department-level objective. */
export function isDepartmentLevelObjective(
  objective: Pick<Objective, "assigneeType" | "type" | "parentId" | "parent">
): boolean {
  if (objective.assigneeType === "DEPARTMENT") return true;
  return objective.type === "DEPARTMENT" && !!objective.parentId;
}

/** Label for assign-down action based on objective level. */
export function getAssignDownstreamLabel(
  objective: Pick<Objective, "type" | "assigneeType" | "parentId" | "parent">
): string {
  if (isTopLevelCorporateObjective(objective)) {
    return "Assign to Division/Department";
  }
  if (isDivisionLevelObjective(objective)) {
    return "Assign to Department";
  }
  if (isDepartmentLevelObjective(objective)) {
    return "Assign to Personnel";
  }
  if (objective.type === "DIVISION") return "Assign to Department";
  if (objective.type === "DEPARTMENT") return "Assign to Personnel";
  return "Assign Downstream";
}

/** Whether the current user may approve/reject a submission row (mirrors API policy). */
export function canUserApproveSubmission(
  userRole: string | undefined,
  userScope: UserScope | null,
  submission: {
    level: string;
    objective?: {
      assigneeId?: string | null;
      assigneeType?: string | null;
    } | null;
  },
  departments: Department[] = []
): boolean {
  const level = submission.level as
    | "CORPORATE"
    | "DIVISION"
    | "DEPARTMENT"
    | "PERSONNEL";

  let departmentId: string | null = null;
  let divisionId: string | null = null;

  if (level === "DEPARTMENT" && submission.objective?.assigneeId) {
    departmentId = submission.objective.assigneeId;
    const dept = departments.find((d) => d.departmentId === departmentId);
    divisionId = dept?.division?.divisionId ?? null;
  }

  if (level === "PERSONNEL" && submission.objective?.assigneeId) {
    if (submission.objective.assigneeType === "DEPARTMENT") {
      departmentId = submission.objective.assigneeId;
      const dept = departments.find((d) => d.departmentId === departmentId);
      divisionId = dept?.division?.divisionId ?? null;
    } else {
      departmentId = submission.objective.assigneeId;
    }
  }

  const departmentReportsToCorpDirectly =
    level === "DEPARTMENT" && !!departmentId && !divisionId;

  return canApproveSubmission(
    userRole,
    userScope,
    level === "CORPORATE" ? "DIVISION" : level,
    departmentId,
    divisionId,
    departmentReportsToCorpDirectly
  );
}
