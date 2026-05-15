import type { KpiStatus, SubmissionLevel } from "@/types/graphql";
import { isTopLevelCorporateObjective } from "@/lib/objectives/kpiWeightScope";

/** KPIs without a status (legacy/cascade creates) are treated as not yet submitted. */
export function isKpiSubmittable(status?: KpiStatus | string | null): boolean {
  return (
    status == null ||
    status === "NOT_SUBMITTED" ||
    status === "REJECTED"
  );
}

/** Map objective context to the submission level / approver queue. */
export function resolveSubmissionLevel(objective: {
  type?: string | null;
  assigneeType?: string | null;
  assigneeId?: string | null;
  parentId?: string | null;
  parent?: { objectiveId?: string } | null;
}): SubmissionLevel {
  if (objective.assigneeType === "DIVISION") return "DIVISION";
  if (objective.assigneeType === "DEPARTMENT") return "DEPARTMENT";
  if (objective.assigneeType === "PERSONNEL") return "PERSONNEL";

  if (objective.type === "PERSONNEL") return "PERSONNEL";
  if (objective.type === "DEPARTMENT") return "DEPARTMENT";
  if (objective.type === "DIVISION") return "DIVISION";

  // Cascaded corporate-type objectives default to division queue (corporate admin approves)
  return "DIVISION";
}

/** Non–top-level KPIs need Q1–Q4 targets before submit. */
export function kpiHasQuarterlyTargets(kpi: {
  targets?: Array<{ timeline: string }> | null;
}): boolean {
  const timelines =
    kpi.targets?.map((t) => t.timeline.toUpperCase()) ?? [];
  return (
    timelines.some((tl) => tl.includes("-Q1")) &&
    timelines.some((tl) => tl.includes("-Q2")) &&
    timelines.some((tl) => tl.includes("-Q3")) &&
    timelines.some((tl) => tl.includes("-Q4"))
  );
}

export function validateKpisReadyForCascadeSubmit(
  kpis: Array<{ kpiId: string; name?: string | null; targets?: Array<{ timeline: string }> | null }>,
  objective: {
    type?: string | null;
    assigneeType?: string | null;
    assigneeId?: string | null;
    parentId?: string | null;
    parent?: { objectiveId?: string } | null;
  }
): { valid: boolean; message?: string } {
  if (isTopLevelCorporateObjective(objective)) {
    return { valid: true };
  }

  for (const kpi of kpis) {
    if (!kpiHasQuarterlyTargets(kpi)) {
      return {
        valid: false,
        message: `KPI "${kpi.name || "Unnamed"}" must have targets for all four quarters (Q1–Q4) before submission.`,
      };
    }
  }

  return { valid: true };
}
