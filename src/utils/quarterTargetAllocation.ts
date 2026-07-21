interface QuarterTarget {
  timeline: string;
  target: number;
}

interface QuarterTargetSource {
  unitType?: string | null;
  targets?: QuarterTarget[] | null;
}

export function buildAssignedQuarterTargets(
  sourceKpi: QuarterTargetSource,
  assignedAnnualTarget: number,
  annualTimeline?: string,
): QuarterTarget[] {
  const quarterTargets = (sourceKpi.targets || []).filter((target) =>
    /-Q[1-4]$/i.test(target.timeline || ""),
  );
  const isAverageBased = ["PERCENT", "RATIO"].includes(
    String(sourceKpi.unitType || "").toUpperCase(),
  );

  if (isAverageBased) {
    const timeline =
      annualTimeline ||
      quarterTargets[0]?.timeline?.replace(/-Q[1-4]$/i, "") ||
      sourceKpi.targets?.find((target) => !/-Q[1-4]$/i.test(target.timeline))
        ?.timeline;
    if (!timeline) return [];
    return [1, 2, 3, 4].map((quarter) => ({
      timeline: `${timeline}-Q${quarter}`,
      target: assignedAnnualTarget,
    }));
  }

  if (quarterTargets.length !== 4) {
    const timeline =
      annualTimeline ||
      sourceKpi.targets?.find((target) => !/-Q[1-4]$/i.test(target.timeline))
        ?.timeline;
    if (!timeline) return [];

    const baseValue = assignedAnnualTarget / 4;
    const generated = [1, 2, 3, 4].map((quarter) => ({
      timeline: `${timeline}-Q${quarter}`,
      target: Number(baseValue.toFixed(4)),
    }));
    const firstThree = generated
      .slice(0, 3)
      .reduce((sum, target) => sum + target.target, 0);
    generated[3].target = Number(
      (assignedAnnualTarget - firstThree).toFixed(4),
    );
    return generated;
  }

  const sourceValues = quarterTargets.map((target) =>
    Number(target.target || 0),
  );
  const sourceAnnual = sourceValues.reduce((sum, value) => sum + value, 0);

  if (sourceAnnual <= 0) return [];

  const scale = assignedAnnualTarget / sourceAnnual;
  const assigned = quarterTargets.map((target) => ({
    timeline: target.timeline,
    target: Number((Number(target.target || 0) * scale).toFixed(4)),
  }));

  // Keep additive KPIs exactly reconciled after decimal rounding.
  const firstThree = assigned
    .slice(0, 3)
    .reduce((sum, target) => sum + target.target, 0);
  assigned[3].target = Number(
    (assignedAnnualTarget - firstThree).toFixed(4),
  );

  return assigned;
}
