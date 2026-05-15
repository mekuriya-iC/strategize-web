import type { Kpi } from "@/types/graphql";

/**
 * KPI weights are allocated per objective (100% per objective).
 * Cascaded/assigned objectives each have their own budget — not shared with parent corporate objectives.
 */
export function getKpisForObjectiveWeight(
  objectiveId: string,
  kpis: Kpi[],
  options?: { excludeKpiId?: string }
): Kpi[] {
  if (!objectiveId) return [];

  return kpis.filter(
    (k) =>
      k.objective?.objectiveId === objectiveId &&
      k.status !== "REJECTED" &&
      k.kpiId !== options?.excludeKpiId
  );
}

export function sumKpiWeights(kpis: Kpi[]): number {
  return kpis.reduce((sum, k) => sum + (k.weight || 0), 0);
}

export function getWeightAllocationForObjective(
  objectiveId: string,
  kpis: Kpi[],
  currentFormWeight = 0,
  excludeKpiId?: string
) {
  const scoped = getKpisForObjectiveWeight(objectiveId, kpis, { excludeKpiId });
  const used = sumKpiWeights(scoped);
  const total = used + currentFormWeight;

  return {
    used,
    remaining: Math.max(0, 100 - used),
    total,
    isOver: total > 100.01,
  };
}

/** Top-level corporate objectives (not cascaded to division/dept). */
export function isTopLevelCorporateObjective(obj: {
  type?: string | null;
  assigneeType?: string | null;
  assigneeId?: string | null;
  parentId?: string | null;
  parent?: { objectiveId?: string } | null;
}): boolean {
  if (obj.parentId || obj.parent) return false;
  if (obj.assigneeType || obj.assigneeId) return false;
  const type = obj.type?.toUpperCase();
  return type === "CORPORATE" && !obj.assigneeType && !obj.assigneeId;
}

/** Annual target only — no quarterly breakdown (top-level corporate KPIs). */
export function usesAnnualOnlyKpiTargetsForKpi(
  kpi?: {
    parent?: { kpiId?: string } | null;
    objective?: {
      type?: string | null;
      assigneeType?: string | null;
      assigneeId?: string | null;
      parentId?: string | null;
      parent?: { objectiveId?: string } | null;
    } | null;
  } | null
): boolean {
  if (kpi?.parent?.kpiId) return false;
  return isTopLevelCorporateObjective(kpi?.objective ?? {});
}

export function usesAnnualOnlyKpiTargets(
  objective?: {
    type?: string | null;
    assigneeType?: string | null;
    assigneeId?: string | null;
    parentId?: string | null;
    parent?: { objectiveId?: string } | null;
  } | null
): boolean {
  if (!objective) return true;
  return isTopLevelCorporateObjective(objective);
}
