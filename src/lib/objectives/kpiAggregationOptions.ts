import type {
  KpiAggregationMethod,
  KpiCalculationBasisSource,
  KpiUnitType,
} from "@/types/graphql";

const additiveUnits = new Set<KpiUnitType>([
  "NUMBER",
  "CURRENCY",
  "COUNT",
  "HOUR",
]);

export function allowsScoreAverage(
  unitType?: KpiUnitType,
  calculationBasisSource: KpiCalculationBasisSource = "NONE",
): boolean {
  return (
    calculationBasisSource === "NONE" &&
    (unitType === "PERCENT" || unitType === "NUMBER")
  );
}

export function isComponentRatioKpi(
  unitType?: KpiUnitType,
  calculationBasisSource: KpiCalculationBasisSource = "NONE",
): boolean {
  return (
    unitType === "RATIO" ||
    (unitType === "PERCENT" && calculationBasisSource !== "NONE")
  );
}

export function isAggregationMethodAllowed({
  method,
  unitType,
  calculationBasisSource = "NONE",
}: {
  method: KpiAggregationMethod;
  unitType?: KpiUnitType;
  calculationBasisSource?: KpiCalculationBasisSource;
}): boolean {
  if (method === "SIMPLE_AVERAGE") {
    return allowsScoreAverage(unitType, calculationBasisSource);
  }
  if (method === "DENOMINATOR_WEIGHTED_AVERAGE") {
    return unitType === "PERCENT" || unitType === "RATIO";
  }
  return Boolean(unitType && additiveUnits.has(unitType));
}
