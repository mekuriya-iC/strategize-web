import { describe, expect, it } from "vitest";
import type { StrategicPeriod } from "@/types/graphql";
import {
  findActiveOrCurrentQuarter,
  findCurrentPeriod,
  formatAnnualTimeline,
  getAnnualPeriods,
  getPeriodsForAnnualTimeline,
  getQuarterLabelForPeriod,
} from "./periodDates";

const period = (
  strategicPeriodId: string,
  name: string,
  periodType: string,
  startDate: string,
  endDate: string,
  status = "DRAFT",
): StrategicPeriod => ({
  strategicPeriodId,
  name,
  periodType,
  startDate,
  endDate,
  status,
  createdBy: null,
  createdAt: startDate,
  updatedAt: startDate,
});

const annual = period(
  "annual-2026",
  "FY 2026",
  "ANNUAL",
  "2026-01-01",
  "2026-12-31",
  "ACTIVE",
);
const quarters = [
  period("q1", "First quarter", "QUARTERLY", "2026-01-01", "2026-03-31", "ACTIVE"),
  period("q2", "Second quarter", "QUARTERLY", "2026-04-01", "2026-06-30"),
  period("q3", "Third quarter", "QUARTERLY", "2026-07-01", "2026-09-30"),
  period("q4", "Fourth quarter", "QUARTERLY", "2026-10-01", "2026-12-31"),
];

const periods = [annual, ...quarters];

describe("strategic period date context", () => {
  it("returns only canonical annual periods for strategy cards", () => {
    expect(getAnnualPeriods(periods).map((item) => item.strategicPeriodId)).toEqual([
      "annual-2026",
    ]);
  });

  it("resolves the current year and quarter by date before stale ACTIVE status", () => {
    const referenceDate = new Date(2026, 7, 4);
    const currentAnnual = findCurrentPeriod(
      getAnnualPeriods(periods),
      referenceDate,
    );
    const year = currentAnnual ? formatAnnualTimeline(currentAnnual) : "";
    const periodsForYear = getPeriodsForAnnualTimeline(year, periods);
    const currentQuarter = findActiveOrCurrentQuarter(
      periodsForYear,
      referenceDate,
    );

    expect(year).toBe("2026");
    expect(currentQuarter?.strategicPeriodId).toBe("q3");
    expect(
      currentQuarter && getQuarterLabelForPeriod(currentQuarter, periods),
    ).toBe("Q3");
  });
});
