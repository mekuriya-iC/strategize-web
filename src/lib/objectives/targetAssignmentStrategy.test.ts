import { describe, expect, it } from "vitest";
import type { Kpi } from "@/types/graphql";
import {
  getTargetAssignmentDescription,
  getTargetAssignmentStrategy,
} from "./targetAssignmentStrategy";

function strategyFor(overrides: Partial<Kpi>) {
  return getTargetAssignmentStrategy({
    calculationType: "MANUAL_VALUE",
    calculationBasisSource: "NONE",
    aggregationMethod: "SUM",
    unitType: "NUMBER",
    ...overrides,
  });
}

describe("target assignment strategy", () => {
  it("treats formula ratios as child-specific ratio-of-sums targets", () => {
    const strategy = strategyFor({
      calculationType: "RATIO_FORMULA",
      unitType: "PERCENT",
      aggregationMethod: "DENOMINATOR_WEIGHTED_AVERAGE",
    });

    expect(strategy).toBe("FORMULA_RATIO");
    expect(getTargetAssignmentDescription(strategy)).toContain(
      "Child rates may differ",
    );
    expect(getTargetAssignmentDescription(strategy)).toContain(
      "summed child numerators",
    );
  });

  it("keeps direct and linked basis rates on their enforced repeated-rate paths", () => {
    expect(
      strategyFor({ unitType: "PERCENT", calculationBasisSource: "DIRECT_VALUE" }),
    ).toBe("DIRECT_BASIS_RATE");
    expect(
      strategyFor({ unitType: "PERCENT", calculationBasisSource: "LINKED_KPI" }),
    ).toBe("LINKED_BASIS_RATE");
  });

  it("distinguishes score averages from component-weighted rates", () => {
    expect(
      strategyFor({ unitType: "NUMBER", aggregationMethod: "SIMPLE_AVERAGE" }),
    ).toBe("SCORE_AVERAGE");
    expect(
      strategyFor({
        unitType: "RATIO",
        aggregationMethod: "DENOMINATOR_WEIGHTED_AVERAGE",
      }),
    ).toBe("WEIGHTED_COMPONENT_RATE");
  });

  it("uses child-specific targets for scalar and weighted formulas", () => {
    expect(strategyFor({ calculationType: "SCALAR_FORMULA" })).toBe(
      "FORMULA_RESULT",
    );
    expect(strategyFor({ calculationType: "WEIGHTED_INDEX" })).toBe(
      "FORMULA_RESULT",
    );
  });

  it("preserves additive and legacy repeated-rate behavior", () => {
    expect(strategyFor({ unitType: "CURRENCY" })).toBe("ADDITIVE_SUM");
    expect(strategyFor({ unitType: "PERCENT" })).toBe("REPEATED_RATE");
  });
});
