import type {
  KpiAggregationMethod,
  KpiCalculationBasisSource,
  KpiCalculationType,
  KpiUnitType,
} from "@/types/graphql";

export function resolveKpiUnitType({
  unitType,
  parentUnitType,
  measurementUnit,
}: {
  unitType?: KpiUnitType | null;
  parentUnitType?: KpiUnitType | null;
  measurementUnit?: string | null;
}): KpiUnitType {
  if (parentUnitType) return parentUnitType;
  if (unitType) return unitType;

  switch (measurementUnit?.toUpperCase()) {
    case "PERCENTAGE":
      return "PERCENT";
    case "CURRENCY":
      return "CURRENCY";
    case "HOUR":
      return "HOUR";
    case "NUMBER":
      return "NUMBER";
    default:
      return "NUMBER";
  }
}

export function getCompatibleAggregationMethod({
  method,
  unitType,
  calculationBasisSource = "NONE",
  calculationType,
}: {
  method: KpiAggregationMethod;
  unitType?: KpiUnitType;
  calculationBasisSource?: KpiCalculationBasisSource;
  calculationType?: KpiCalculationType;
}): KpiAggregationMethod {
  const isRate = unitType === "PERCENT" || unitType === "RATIO";
  if (
    isRate &&
    (calculationType === "RATIO_FORMULA" ||
      calculationBasisSource !== "NONE")
  ) {
    return "DENOMINATOR_WEIGHTED_AVERAGE";
  }
  return method;
}

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
  calculationType = "MANUAL_VALUE",
}: {
  method: KpiAggregationMethod;
  unitType?: KpiUnitType;
  calculationBasisSource?: KpiCalculationBasisSource;
  calculationType?: KpiCalculationType;
}): boolean {
  if (method === "SIMPLE_AVERAGE") {
    return allowsScoreAverage(unitType, calculationBasisSource);
  }
  if (method === "DENOMINATOR_WEIGHTED_AVERAGE") {
    return unitType === "PERCENT" || unitType === "RATIO";
  }
  if (
    method === "SUM" &&
    unitType === "PERCENT" &&
    calculationBasisSource === "NONE" &&
    calculationType === "MANUAL_VALUE"
  ) {
    return true;
  }
  return Boolean(unitType && additiveUnits.has(unitType));
}
