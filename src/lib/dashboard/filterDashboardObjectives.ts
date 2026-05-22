import type { Objective } from "@/types/graphql";

export interface DashboardObjectiveFilterOptions {
  objectives: Objective[];
  userRole?: string;
  selectedUnit?: { id: string; type: "division" | "department" } | null;
  selectedPeriodId?: string | null;
  annualTimeline?: string | null;
}

/**
 * Shared dashboard scope: same rules as analytics summary cards.
 */
export function filterDashboardObjectives({
  objectives,
  userRole,
  selectedUnit,
  selectedPeriodId,
  annualTimeline,
}: DashboardObjectiveFilterOptions): Objective[] {
  let filtered = objectives;

  if (selectedPeriodId) {
    filtered = filtered.filter(
      (obj) => obj.strategicPeriod?.strategicPeriodId === selectedPeriodId,
    );
  }

  // Corporate landing view: only top-level corporate objectives (no assignee)
  if ((userRole === "ADMIN" || userRole === "SUPER_ADMIN") && !selectedUnit) {
    filtered = filtered.filter((obj) => !obj.assigneeType && !obj.assigneeId);
  }

  if (annualTimeline) {
    filtered = filtered.filter((obj) =>
      obj.kpis?.some((kpi) => {
        const targets =
          (kpi as { targets?: Array<{ timeline?: string | null }> }).targets ??
          [];

        return targets.some(
          (t) =>
            t.timeline === annualTimeline ||
            (t.timeline && t.timeline.startsWith(`${annualTimeline}-`)),
        );
      }),
    );
  }

  return filtered;
}
