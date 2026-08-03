import { describe, expect, it } from "vitest";
import {
  allocateBasisQuarters,
  basisQuartersEqualAnnual,
  buildDirectBasisTargets,
  calculateKpiResultPreview,
  calculateRequiredNumerator,
  decimalValuesEqualTotal,
  exactValueToDecimal,
  multiplyBasisByPercent,
  splitBasisAmong,
  splitBasisEvenly,
} from "./basisCalculation";

describe("basis calculation", () => {
  it("splits an annual basis equally and reconciles exactly", () => {
    const quarters = splitBasisEvenly("1,000,000.01");

    expect(quarters).toEqual({
      q1: "250000.0025",
      q2: "250000.0025",
      q3: "250000.0025",
      q4: "250000.0025",
    });
    expect(basisQuartersEqualAnnual("1000000.01", quarters)).toBe(true);
  });

  it("detects a quarter allocation that does not equal the annual basis", () => {
    expect(
      basisQuartersEqualAnnual("100", {
        q1: "25",
        q2: "25",
        q3: "25",
        q4: "24.99",
      }),
    ).toBe(false);
  });

  it("calculates percentage and ratio numerators with the correct multiplier", () => {
    expect(calculateRequiredNumerator("25", "800", "PERCENT")).toBe(200);
    expect(calculateRequiredNumerator("3", "800", "RATIO")).toBe(2400);
  });

  it("uses the full ratio precision when calculating a required numerator", () => {
    expect(
      calculateRequiredNumerator(
        "0.3333333333333333",
        "50025000",
        "RATIO",
      ),
    ).toBeCloseTo(16675000, 6);
  });

  it("derives an exact-ish percentage from numerator and denominator strings", () => {
    expect(
      calculateKpiResultPreview({
        inputMode: "NUMERATOR",
        numeratorExact: "1",
        basisExact: "3",
        unitType: "PERCENT",
      }),
    ).toEqual({
      numeratorExact: "1",
      basisExact: "3",
      rateExact: "33.333333333333",
    });
  });

  it("converts exact backend fractions into stable decimal input values", () => {
    expect(exactValueToDecimal("4/1")).toBe("4");
    expect(exactValueToDecimal("1/3")).toBe("0.333333333333333333");
    expect(exactValueToDecimal("733425000/1")).toBe("733425000");
  });

  it("derives percentage and ratio numerators from rate plus basis", () => {
    expect(
      calculateKpiResultPreview({
        inputMode: "RATE_AND_BASIS",
        rateExact: "25",
        basisExact: "800",
        unitType: "PERCENT",
      }).numeratorExact,
    ).toBe("200");
    expect(
      calculateKpiResultPreview({
        inputMode: "RATE_AND_BASIS",
        rateExact: "3",
        basisExact: "800",
        unitType: "RATIO",
      }).numeratorExact,
    ).toBe("2400");
  });

  it("builds the direct basis input shape for Q1-Q4", () => {
    expect(
      buildDirectBasisTargets("2026", {
        q1: "10",
        q2: "20",
        q3: "30",
        q4: "40",
      }),
    ).toEqual([
      { timeline: "2026-Q1", value: "10" },
      { timeline: "2026-Q2", value: "20" },
      { timeline: "2026-Q3", value: "30" },
      { timeline: "2026-Q4", value: "40" },
    ]);
  });

  it("calculates a hybrid team basis without floating-point drift", () => {
    expect(multiplyBasisByPercent("1000000.01", 70)).toBe("700000.007");
  });

  it("auto-splits a cascade basis with an exact final remainder", () => {
    const allocations = splitBasisAmong("100", 3);

    expect(allocations).toEqual(["33.33", "33.33", "33.34"]);
    expect(decimalValuesEqualTotal("100", allocations)).toBe(true);
  });

  it("allocates custom parent quarters proportionally and reconciles every row and column", () => {
    const allocations = allocateBasisQuarters(
      ["30", "50", "70"],
      ["15", "30", "45", "60"],
    );

    expect(allocations).not.toBeNull();
    expect(
      allocations!.map((quarters) =>
        [quarters.q1, quarters.q2, quarters.q3, quarters.q4]
          .map(Number)
          .reduce((sum, value) => sum + value, 0),
      ),
    ).toEqual([30, 50, 70]);
    expect(
      (["q1", "q2", "q3", "q4"] as const).map((quarter) =>
        allocations!.reduce(
          (sum, allocation) => sum + Number(allocation[quarter]),
          0,
        ),
      ),
    ).toEqual([15, 30, 45, 60]);
  });
});
