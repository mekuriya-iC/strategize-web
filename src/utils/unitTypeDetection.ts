import { Kpi } from "@/types/graphql";
import {
  getTargetAssignmentDescription,
  getTargetAssignmentStrategy,
} from "@/lib/objectives/targetAssignmentStrategy";

// Extended unit types for frontend use (for display purposes only)
export type ExtendedUnitType = "NUMBER_MILLION" | "NUMBER_COUNT" | "PERCENT";

// Get detailed unit label for display based on backend unitType and name analysis
export const getDetailedUnitLabel = (kpi: Kpi): string => {
  const { unitType, name } = kpi; // "NUMBER" | "PERCENT"

  if (unitType === "PERCENT") {
    return "%";
  }

  if (unitType === "RATIO") {
    return "ratio";
  }

  if (unitType === "CURRENCY") {
    return "ETB";
  }

  // For legacy NUMBER values, analyze the name to determine the display unit
  const nameLower = name.toLowerCase();

  // Check for revenue, profit, cost, financial indicators (million ETB)
  if (
    nameLower.includes("revenue") ||
    nameLower.includes("profit") ||
    nameLower.includes("cost") ||
    nameLower.includes("birr") ||
    nameLower.includes("etb") ||
    nameLower.includes("money") ||
    nameLower.includes("income") ||
    nameLower.includes("earnings") ||
    nameLower.includes("gross") ||
    nameLower.includes("net")
  ) {
    return "million ETB";
  }

  // Check for count indicators (items)
  if (
    nameLower.includes("number") ||
    nameLower.includes("count") ||
    nameLower.includes("quantity") ||
    nameLower.includes("clients") ||
    nameLower.includes("projects") ||
    nameLower.includes("staff") ||
    nameLower.includes("partners") ||
    nameLower.includes("products") ||
    nameLower.includes("services") ||
    nameLower.includes("units") ||
    nameLower.includes("items") ||
    nameLower.includes("programs")
  ) {
    return "items";
  }

  // Default for NUMBER type
  return "million ETB";
};

// Get display name for unit type selection (for UI consistency)
export const getUnitTypeDisplayName = (unitType: ExtendedUnitType): string => {
  switch (unitType) {
    case "NUMBER_MILLION":
      return "Million ETB";
    case "NUMBER_COUNT":
      return "Count";
    case "PERCENT":
      return "Percentage";
    default:
      return "Unknown";
  }
};

// Detect KPI type for assignment method based on backend unitType
export const detectKPIType = (kpi: Kpi): "SUMMABLE" | "PERCENTAGE" => {
  const unitType = kpi.unitType; // "NUMBER" | "PERCENT"

  // Percentage and ratio KPIs are rate-like: each child keeps the target rate.
  if (unitType === "PERCENT" || unitType === "RATIO") {
    return "PERCENTAGE";
  }

  // NUMBER unit type = Summable KPIs (revenue, counts, birr, etc.)
  if (unitType === "NUMBER") {
    return "SUMMABLE";
  }

  // Default fallback
  return "SUMMABLE";
};

// Get assignment method description
export const getAssignmentMethodDescription = (kpi: Kpi): string =>
  getTargetAssignmentDescription(getTargetAssignmentStrategy(kpi));

// Get the inferred unit type for a KPI (for internal use)
export const getInferredUnitType = (kpi: Kpi): ExtendedUnitType => {
  const { unitType, name } = kpi;

  if (unitType === "PERCENT") {
    return "PERCENT";
  }

  // For NUMBER type, analyze the name
  const nameLower = name.toLowerCase();

  // Financial indicators (million ETB)
  if (
    nameLower.includes("revenue") ||
    nameLower.includes("profit") ||
    nameLower.includes("cost") ||
    nameLower.includes("birr") ||
    nameLower.includes("etb") ||
    nameLower.includes("money") ||
    nameLower.includes("income") ||
    nameLower.includes("earnings") ||
    nameLower.includes("gross") ||
    nameLower.includes("net")
  ) {
    return "NUMBER_MILLION";
  }

  // Count indicators (items)
  if (
    nameLower.includes("number") ||
    nameLower.includes("count") ||
    nameLower.includes("quantity") ||
    nameLower.includes("clients") ||
    nameLower.includes("projects") ||
    nameLower.includes("staff") ||
    nameLower.includes("partners") ||
    nameLower.includes("products") ||
    nameLower.includes("services") ||
    nameLower.includes("units") ||
    nameLower.includes("items") ||
    nameLower.includes("programs")
  ) {
    return "NUMBER_COUNT";
  }

  // Default for NUMBER type
  return "NUMBER_MILLION";
};

// Clean up KPI names that have old prefixes (for migration)
export const cleanKpiName = (name: string): string => {
  if (name.startsWith("[MILLION] ")) {
    return name.substring(11);
  }
  if (name.startsWith("[COUNT] ")) {
    return name.substring(8);
  }
  if (name.startsWith("[PERCENT] ")) {
    return name.substring(10);
  }
  return name;
};
