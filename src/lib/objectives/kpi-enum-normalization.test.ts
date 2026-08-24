import { describe, expect, it } from "vitest";
import {
  measurementUnitForKpiUnitType,
  normalizeKpiCreationEnums,
  normalizeKpiFrequency,
  normalizeKpiMeasurementUnit,
} from "./kpi-enum-normalization";

describe("KPI creation enum normalization", () => {
  it("normalizes lower-case creation values to GraphQL enum members", () => {
    expect(
      normalizeKpiCreationEnums({
        frequency: "quarterly",
        measurementUnit: "hour",
      }),
    ).toEqual({
      frequency: "QUARTERLY",
      measurementUnit: "HOUR",
    });
    expect(normalizeKpiMeasurementUnit("percentage")).toBe("PERCENTAGE");
    expect(normalizeKpiFrequency("annual")).toBe("ANNUAL");
    expect(normalizeKpiFrequency("annually")).toBe("ANNUAL");
    expect(normalizeKpiFrequency("semi_annual")).toBe("SEMI_ANNUAL");
  });

  it.each([
    ["PERCENT", "PERCENTAGE"],
    ["CURRENCY", "CURRENCY"],
    ["HOUR", "HOUR"],
    ["NUMBER", "NUMBER"],
    ["RATIO", "NUMBER"],
    ["COUNT", "NUMBER"],
  ] as const)("maps %s unit type to %s", (unitType, measurementUnit) => {
    expect(measurementUnitForKpiUnitType(unitType)).toBe(measurementUnit);
  });

  it("rejects values that are not valid GraphQL enum members", () => {
    expect(() => normalizeKpiFrequency("daily")).toThrow(
      "Invalid KPI frequency",
    );
    expect(() => normalizeKpiMeasurementUnit("minutes")).toThrow(
      "Invalid KPI measurement unit",
    );
  });
});
