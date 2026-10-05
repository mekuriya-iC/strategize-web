import { resolveReportingPeriodContext } from "./reportingPeriodContext";
import type { StrategicPeriod } from "@/types/graphql";
import { describe, expect, it } from "vitest";

const annual = {
  strategicPeriodId: "annual",
  name: "2026/27",
  periodType: "annual",
  startDate: "2026-07-01",
  endDate: "2027-06-30",
} as StrategicPeriod;
const q2 = {
  strategicPeriodId: "q2",
  name: "2026/27-Q2",
  periodType: "quarterly",
  startDate: "2026-10-01",
  endDate: "2026-12-31",
} as StrategicPeriod;
const q1 = {
  strategicPeriodId: "q1",
  name: "2026/27-Q1",
  periodType: "quarterly",
  startDate: "2026-07-01",
  endDate: "2026-09-30",
} as StrategicPeriod;

describe("resolveReportingPeriodContext", () => {
  it("keeps annual selections annual", () => {
    expect(resolveReportingPeriodContext(annual, [annual, q1, q2])).toEqual({
      annualPeriod: annual,
    });
  });

  it("maps a selected quarter to its enclosing annual period and quarter number", () => {
    expect(resolveReportingPeriodContext(q2, [annual, q1, q2])).toEqual({
      annualPeriod: annual,
      quarterNumber: 2,
    });
  });
});
