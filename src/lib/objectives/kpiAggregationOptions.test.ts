import { describe, expect, it } from "vitest";
import {
  allowsScoreAverage,
  getCompatibleAggregationMethod,
  isAggregationMethodAllowed,
  isComponentRatioKpi,
  resolveKpiUnitType,
} from "./kpiAggregationOptions";

describe("KPI aggregation options", () => {
  it("allows explicit score average only for PERCENT/NUMBER score KPIs with basis NONE", () => {
    expect(allowsScoreAverage("PERCENT", "NONE")).toBe(true);
    expect(allowsScoreAverage("NUMBER", "NONE")).toBe(true);
    expect(allowsScoreAverage("RATIO", "NONE")).toBe(false);
    expect(allowsScoreAverage("PERCENT", "DIRECT_VALUE")).toBe(false);
  });

  it("inherits the parent unit for legacy cascaded KPIs before validating a ratio formula", () => {
    const unitType = resolveKpiUnitType({
      unitType: "NUMBER",
      parentUnitType: "PERCENT",
      measurementUnit: "PERCENTAGE",
    });
    const method = getCompatibleAggregationMethod({
      method: "SUM",
      unitType,
      calculationBasisSource: "NONE",
      calculationType: "RATIO_FORMULA",
    });

    expect(unitType).toBe("PERCENT");
    expect(method).toBe("DENOMINATOR_WEIGHTED_AVERAGE");
    expect(
      isAggregationMethodAllowed({
        method,
        unitType,
        calculationBasisSource: "NONE",
      }),
    ).toBe(true);
  });

  it("repairs legacy ratio formulas to denominator-weighted aggregation", () => {
    expect(
      getCompatibleAggregationMethod({
        method: "SUM",
        unitType: "PERCENT",
        calculationBasisSource: "NONE",
        calculationType: "RATIO_FORMULA",
      }),
    ).toBe("DENOMINATOR_WEIGHTED_AVERAGE");
    expect(
      getCompatibleAggregationMethod({
        method: "SUM",
        unitType: "NUMBER",
        calculationBasisSource: "NONE",
        calculationType: "SCALAR_FORMULA",
      }),
    ).toBe("SUM");
  });

  it("allows SUM for a manual percentage-point KPI but not a ratio formula", () => {
    expect(
      isAggregationMethodAllowed({
        method: "SUM",
        unitType: "PERCENT",
        calculationBasisSource: "NONE",
        calculationType: "MANUAL_VALUE",
      }),
    ).toBe(true);
    expect(
      isAggregationMethodAllowed({
        method: "SUM",
        unitType: "PERCENT",
        calculationBasisSource: "NONE",
        calculationType: "RATIO_FORMULA",
      }),
    ).toBe(false);
  });

  it("keeps sum and score average disabled for component ratio KPIs", () => {
    expect(isComponentRatioKpi("RATIO", "NONE")).toBe(true);
    expect(isComponentRatioKpi("PERCENT", "LINKED_KPI")).toBe(true);
    expect(
      isAggregationMethodAllowed({
        method: "SIMPLE_AVERAGE",
        unitType: "PERCENT",
        calculationBasisSource: "LINKED_KPI",
      }),
    ).toBe(false);
    expect(
      isAggregationMethodAllowed({
        method: "SUM",
        unitType: "RATIO",
        calculationBasisSource: "NONE",
      }),
    ).toBe(false);
    expect(
      isAggregationMethodAllowed({
        method: "DENOMINATOR_WEIGHTED_AVERAGE",
        unitType: "RATIO",
        calculationBasisSource: "NONE",
      }),
    ).toBe(true);
  });
});
