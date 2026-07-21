import { describe, expect, it } from "vitest";
import {
  basisQuartersEqualAnnual,
  buildDirectBasisTargets,
  calculateRequiredNumerator,
  decimalValuesEqualTotal,
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
});
