import type { Kpi } from "@/types/graphql";

export type TargetAssignmentStrategy =
  | "ADDITIVE_SUM"
  | "REPEATED_RATE"
  | "DIRECT_BASIS_RATE"
  | "LINKED_BASIS_RATE"
  | "WEIGHTED_COMPONENT_RATE"
  | "SCORE_AVERAGE"
  | "FORMULA_RATIO"
  | "FORMULA_RESULT";

export function getTargetAssignmentStrategy(
  kpi: Pick<
    Kpi,
    | "calculationType"
    | "calculationBasisSource"
    | "aggregationMethod"
    | "unitType"
  >,
): TargetAssignmentStrategy {
  if (kpi.calculationType === "RATIO_FORMULA") return "FORMULA_RATIO";
  if (
    kpi.calculationType === "SCALAR_FORMULA" ||
    kpi.calculationType === "WEIGHTED_INDEX"
  ) {
    return "FORMULA_RESULT";
  }
  if (kpi.calculationBasisSource === "DIRECT_VALUE") {
    return "DIRECT_BASIS_RATE";
  }
  if (kpi.calculationBasisSource === "LINKED_KPI") {
    return "LINKED_BASIS_RATE";
  }
  if (kpi.aggregationMethod === "SIMPLE_AVERAGE") return "SCORE_AVERAGE";
  if (kpi.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE") {
    return "WEIGHTED_COMPONENT_RATE";
  }
  if (kpi.unitType === "PERCENT" || kpi.unitType === "RATIO") {
    return "REPEATED_RATE";
  }
  return "ADDITIVE_SUM";
}

export function getTargetAssignmentDescription(
  strategy: TargetAssignmentStrategy,
): string {
  switch (strategy) {
    case "FORMULA_RATIO":
      return "Assign each child its expected formula result. Child rates may differ; the parent is calculated from summed child numerators divided by summed child denominators.";
    case "FORMULA_RESULT":
      return "Assign each child its expected calculated result. The approved formula is inherited and reconciled from that child's source plans.";
    case "DIRECT_BASIS_RATE":
      return "Repeat the parent rate for every child and allocate the approved denominator exactly across those children.";
    case "LINKED_BASIS_RATE":
      return "Repeat the parent rate for every child and cascade the linked denominator KPI to every matching child.";
    case "WEIGHTED_COMPONENT_RATE":
      return "Assign each child its expected rate and cascade its weighting-basis KPI. Child rates may differ; the parent uses exact component weighting, never a simple average.";
    case "SCORE_AVERAGE":
      return "Assign each child its score target. Every child has equal influence, so the simple average of child targets should equal the parent target.";
    case "REPEATED_RATE":
      return "Repeat the parent rate target for every child; this KPI does not split its rate across assignees.";
    case "ADDITIVE_SUM":
      return "Allocate the parent target across children; the child targets must sum exactly to the parent target.";
  }
}
