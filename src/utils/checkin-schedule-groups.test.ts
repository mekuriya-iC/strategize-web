import { describe, expect, it } from "vitest";
import { classifyScheduleWeek, firstMondayOnOrAfter, formatDateOnly, getScheduleWeekCoverages, groupScheduleWeeks, isMonday, isSchedulePreviewBlocker, parseDateOnly } from "./checkin-schedule-groups";
import type { ScheduleWeek } from "@/components/checkin/schedule-types";

const week = (overrides: Partial<ScheduleWeek>): ScheduleWeek => ({
  scheduleWeekId: "week-1", name: "Week 1", sequence: 1, quarterNumber: 1, monthNumber: 1, weekOfMonth: 1,
  weekStartDate: "2026-01-05", weekEndDate: "2026-01-11", status: "DRAFT", sessions: [], coverages: [], ...overrides,
});

describe("check-in schedule date utilities", () => {
  it("parses and formats date-only values without timezone drift", () => {
    expect(parseDateOnly("2026-01-05T23:30:00-08:00")?.toISOString()).toBe("2026-01-05T00:00:00.000Z");
    expect(formatDateOnly("2026-01-05")).toBe("Jan 5, 2026");
    expect(parseDateOnly("2026-02-31")).toBeNull();
  });

  it("aligns plan and annual starts to the first Monday", () => {
    expect(firstMondayOnOrAfter("2026-07-01")).toBe("2026-07-06");
    expect(firstMondayOnOrAfter("2027-07-05")).toBe("2027-07-05");
    expect(isMonday("2027-07-05")).toBe(true);
    expect(isMonday("2027-07-06")).toBe(false);
  });

  it("classifies boundaries as current", () => {
    const target = week({});
    expect(classifyScheduleWeek(target, new Date(2026, 0, 5, 23, 59))).toBe("current");
    expect(classifyScheduleWeek(target, new Date(2026, 0, 11, 0, 1))).toBe("current");
    expect(classifyScheduleWeek(target, new Date(2026, 0, 4))).toBe("upcoming");
    expect(classifyScheduleWeek(target, new Date(2026, 0, 12))).toBe("history");
  });
});

describe("legacy schedule coverage", () => {
  it("blocks partial overlaps but not fully covered legacy weeks", () => {
    expect(isSchedulePreviewBlocker("COVERED_BY_LEGACY")).toBe(false);
    expect(isSchedulePreviewBlocker("PARTIAL_OVERLAP")).toBe(true);
    expect(isSchedulePreviewBlocker("CONFLICT")).toBe(true);
    expect(isSchedulePreviewBlocker("PERIOD_MISMATCH")).toBe(true);
  });

  it("retains repeated coverage by the same legacy session across two weeks", () => {
    const employee = { employeeId: "employee-1", fullName: "Legacy Employee" };
    const existingSession = { checkinoutSessionId: "legacy-session", weekStartDate: "2026-01-01", weekEndDate: "2026-01-18", overallStatus: "COMPLETED", employee };
    const coverages = getScheduleWeekCoverages([
      week({ scheduleWeekId: "week-1", coverages: [{ scheduleWeekCoverageId: "coverage-1", coverageType: "LEGACY_COVERAGE", employee, existingSession }] }),
      week({ scheduleWeekId: "week-2", sequence: 2, coverages: [{ scheduleWeekCoverageId: "coverage-2", coverageType: "LEGACY_COVERAGE", employee, existingSession }] }),
    ]);
    expect(coverages).toHaveLength(2);
    expect(coverages.map((coverage) => coverage.existingSession.checkinoutSessionId)).toEqual(["legacy-session", "legacy-session"]);
  });
});

describe("multi-year fiscal schedule grouping", () => {
  const fiscalWeek = (id: string, sequence: number, start: string, metadata: Partial<ScheduleWeek>) => week({ scheduleWeekId: id, sequence, weekStartDate: start, weekEndDate: start, ...metadata });

  it("keeps FY2026/27 and FY2027/28 separate and does not merge repeated July", () => {
    const groups = groupScheduleWeeks([
      fiscalWeek("fy26", 1, "2026-07-06", { annualStrategicPeriodId: "annual-26", fiscalYearStartYear: 2026, fiscalYearLabel: "FY2026/27", fiscalQuarterNumber: 1, calendarYear: 2026, calendarMonth: 7 }),
      fiscalWeek("fy27", 2, "2027-07-05", { annualStrategicPeriodId: "annual-27", fiscalYearStartYear: 2027, fiscalYearLabel: "FY2027/28", fiscalQuarterNumber: 1, calendarYear: 2027, calendarMonth: 7 }),
    ]);
    expect(groups.map((group) => group.label)).toEqual(["FY2026/27", "FY2027/28"]);
    expect(groups.map((group) => group.quarters[0].months[0].label)).toEqual(["July 2026", "July 2027"]);
  });

  it("uses backend boundary ownership rather than a crossing week's end date", () => {
    const groups = groupScheduleWeeks([
      fiscalWeek("boundary", 1, "2027-06-28", { weekEndDate: "2027-07-04", annualStrategicPeriodId: "annual-26", quarterlyStrategicPeriodId: "q4-26", monthlyStrategicPeriodId: "jun-27", fiscalYearStartYear: 2026, fiscalYearLabel: "FY2026/27", fiscalQuarterNumber: 4, calendarYear: 2027, calendarMonth: 6 }),
      fiscalWeek("next", 2, "2027-07-05", { annualStrategicPeriodId: "annual-27", fiscalYearStartYear: 2027, fiscalYearLabel: "FY2027/28", fiscalQuarterNumber: 1, calendarYear: 2027, calendarMonth: 7 }),
    ]);
    expect(groups[0].quarters[0].months[0].label).toBe("June 2027");
    expect(groups[0].quarters[0].months[0].weeks[0].scheduleWeekId).toBe("boundary");
    expect(groups[1].label).toBe("FY2027/28");
  });

  it("retains legacy quarter/month grouping when fiscal metadata is absent", () => {
    const groups = groupScheduleWeeks([week({}), week({ scheduleWeekId: "2", sequence: 2, monthNumber: 2, weekStartDate: "2026-02-02" })]);
    expect(groups[0].quarters[0].label).toBe("Fiscal Quarter 1");
    expect(groups[0].quarters[0].months.map((month) => month.label)).toEqual(["January 2026", "February 2026"]);
  });
});
