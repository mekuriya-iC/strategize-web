import type {
  KpiFrequency,
  KpiMeasurementUnit,
  KpiUnitType,
} from "@/types/graphql";

type KpiCreationEnumFields = {
  frequency: string;
  measurementUnit: string;
};

const FREQUENCY_ALIASES: Readonly<Record<string, KpiFrequency>> = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  SEMI_ANNUAL: "SEMI_ANNUAL",
  SEMIANNUAL: "SEMI_ANNUAL",
  ANNUAL: "ANNUAL",
  ANNUALLY: "ANNUAL",
};

const MEASUREMENT_UNITS = new Set<KpiMeasurementUnit>([
  "PERCENTAGE",
  "NUMBER",
  "CURRENCY",
  "BOOLEAN",
  "RATING",
  "HOUR",
  "CUSTOM",
]);

const normalizedEnumKey = (value: string): string =>
  value.trim().toUpperCase().replace(/[\s-]+/g, "_");

export const normalizeKpiFrequency = (
  frequency: string,
): KpiFrequency => {
  const normalized = FREQUENCY_ALIASES[normalizedEnumKey(frequency)];
  if (!normalized) {
    throw new Error(`Invalid KPI frequency: ${frequency}`);
  }
  return normalized;
};

export const normalizeKpiMeasurementUnit = (
  measurementUnit: string,
): KpiMeasurementUnit => {
  const normalized = normalizedEnumKey(measurementUnit);
  if (!MEASUREMENT_UNITS.has(normalized as KpiMeasurementUnit)) {
    throw new Error(`Invalid KPI measurement unit: ${measurementUnit}`);
  }
  return normalized as KpiMeasurementUnit;
};

export const measurementUnitForKpiUnitType = (
  unitType: KpiUnitType,
): KpiMeasurementUnit => {
  switch (unitType) {
    case "PERCENT":
      return "PERCENTAGE";
    case "CURRENCY":
      return "CURRENCY";
    case "HOUR":
      return "HOUR";
    case "NUMBER":
    case "RATIO":
    case "COUNT":
      return "NUMBER";
  }
};

export const normalizeKpiCreationEnums = <T extends KpiCreationEnumFields>(
  input: T,
): Omit<T, "frequency" | "measurementUnit"> & {
  frequency: KpiFrequency;
  measurementUnit: KpiMeasurementUnit;
} => ({
  ...input,
  frequency: normalizeKpiFrequency(input.frequency),
  measurementUnit: normalizeKpiMeasurementUnit(input.measurementUnit),
});
