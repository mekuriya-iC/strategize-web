import { Kpi } from "@/types/graphql";

// Extended unit types for frontend use (for display purposes only)
export type ExtendedUnitType = "NUMBER_MILLION" | "NUMBER_COUNT" | "PERCENT";

// Get detailed unit label for display based on backend unitType and name analysis
export const getDetailedUnitLabel = (kpi: Kpi): string => {
  const { unitType, name } = kpi; // "NUMBER" | "PERCENT"

  if (unitType === "PERCENT") {
    return "%";
  }

  // For NUMBER type, analyze the name to determine if it's million ETB or count
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

  // PERCENT unit type = Percentage KPIs (satisfaction, rates, etc.)
  if (unitType === "PERCENT") {
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
export const getAssignmentMethodDescription = (kpi: Kpi): string => {
  const kpiType = detectKPIType(kpi);

  if (kpiType === "SUMMABLE") {
    return "Split the parent target among assignees (sum must equal parent target)";
  } else {
    return "The average of all assignee targets must equal the parent target";
  }
};

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
