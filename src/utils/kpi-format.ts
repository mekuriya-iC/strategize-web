/**
 * Utility functions for formatting KPI values with their units
 */

export type KpiUnitType =
  | "NUMBER"
  | "PERCENT"
  | "CURRENCY"
  | "HOUR"
  | "RATIO"
  | "COUNT";

/**
 * Get the display label for a KPI unit type
 */
export function getUnitLabel(unitType: KpiUnitType | string): string {
  switch (unitType) {
    case "NUMBER":
      return "Num";
    case "PERCENT":
      return "%";
    case "CURRENCY":
      return "Million ETB";
    case "HOUR":
      return "hrs";
    case "RATIO":
      return "Ratio";
    case "COUNT":
      return "Count";
    default:
      return "";
  }
}

/**
 * Get the full unit name for a KPI unit type
 */
export function getUnitName(unitType: KpiUnitType | string): string {
  switch (unitType) {
    case "NUMBER":
      return "Number";
    case "PERCENT":
      return "Percentage";
    case "CURRENCY":
      return "Currency (Million ETB)";
    case "HOUR":
      return "Hours";
    case "RATIO":
      return "Ratio";
    case "COUNT":
      return "Count";
    default:
      return "Unknown";
  }
}

/**
 * Format a KPI value with its unit
 */
export function formatKpiValue(
  value: number | string | undefined | null,
  unitType: KpiUnitType | string,
  options?: {
    showUnit?: boolean;
    decimals?: number;
    compact?: boolean;
  }
): string {
  const {
    showUnit = true,
    decimals,
    compact = false,
  } = options || {};

  if (value === undefined || value === null || value === "") {
    return "-";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return "-";
  }

  // Determine decimal places
  let decimalPlaces = decimals;
  if (decimalPlaces === undefined) {
    decimalPlaces = unitType === "PERCENT" ? 1 : 0;
  }

  // Format the number
  let formatted: string;
  
  if (compact && numValue >= 1000000) {
    // Compact format for large numbers
    formatted = (numValue / 1000000).toFixed(1) + "M";
  } else if (compact && numValue >= 1000) {
    formatted = (numValue / 1000).toFixed(1) + "K";
  } else {
    formatted = numValue.toFixed(decimalPlaces);
  }

  // Add unit if requested
  if (showUnit) {
    switch (unitType) {
      case "PERCENT":
        return `${formatted}%`;
      case "CURRENCY":
        return compact ? `${formatted} Million ETB` : `${numValue.toLocaleString()} Million ETB`;
      case "HOUR":
        return `${formatted} hrs`;
      case "RATIO":
        return formatted;
      case "COUNT":
      case "NUMBER":
      default:
        return formatted;
    }
  }

  return formatted;
}

/**
 * Format a KPI value for display in tables (shorter format)
 */
export function formatKpiValueShort(
  value: number | string | undefined | null,
  unitType: KpiUnitType | string
): string {
  return formatKpiValue(value, unitType, {
    showUnit: false,
    compact: true,
  });
}

/**
 * Format a KPI value for display with full unit label
 */
export function formatKpiValueWithLabel(
  value: number | string | undefined | null,
  unitType: KpiUnitType | string
): string {
  const formatted = formatKpiValue(value, unitType, { showUnit: true });
  return formatted;
}
