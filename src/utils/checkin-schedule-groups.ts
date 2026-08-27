import type { SchedulePreviewSession, ScheduleSessionDisposition, ScheduleWeek, ScheduleWeekCoverage } from "@/components/checkin/schedule-types";

export interface ScheduleMonthGroup { key: string; calendarYear: number; calendarMonth: number; label: string; weeks: ScheduleWeek[]; }
export interface ScheduleQuarterGroup { key: string; quarterNumber: number; label: string; months: ScheduleMonthGroup[]; }
export interface ScheduleFiscalYearGroup { key: string; fiscalYearStartYear: number; label: string; quarters: ScheduleQuarterGroup[]; }

const BLOCKING_DISPOSITIONS = new Set<ScheduleSessionDisposition>(["PARTIAL_OVERLAP", "CONFLICT", "PERIOD_MISMATCH"]);

export function isSchedulePreviewBlocker(disposition: ScheduleSessionDisposition): boolean {
  return BLOCKING_DISPOSITIONS.has(disposition);
}

export function schedulePreviewReason(session: SchedulePreviewSession): string {
  switch (session.disposition) {
    case "COVERED_BY_LEGACY": return "An existing legacy session overlaps this week. It will remain unchanged, and no duplicate draft will be created.";
    case "PARTIAL_OVERLAP": return "An existing session overlaps only part of this schedule week.";
    case "CONFLICT": return "An existing session conflicts with this schedule week.";
    case "PERIOD_MISMATCH": return "The existing session belongs to a different strategic period.";
    case "ADOPTABLE": return "The existing session exactly matches this schedule week and will be adopted.";
    case "MISSING": return "A new draft session will be generated.";
  }
}

/** Returns one entry per covered week; the same legacy session may intentionally cover multiple weeks. */
export function getScheduleWeekCoverages(weeks: ScheduleWeek[]): ScheduleWeekCoverage[] {
  return weeks.flatMap((week) => week.coverages ?? []);
}

/** Parses an API date as a calendar date, without allowing the browser timezone to shift it. */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function toDateOnly(date: Date): string { return date.toISOString().slice(0, 10); }

export function firstMondayOnOrAfter(value: string): string {
  const date = parseDateOnly(value);
  if (!date) return "";
  const days = (8 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
}

export function isMonday(value: string): boolean { return parseDateOnly(value)?.getUTCDay() === 1; }

export function formatDateOnly(value: string): string {
  const date = parseDateOnly(value);
  return date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date) : value;
}

export function compareDateOnly(left: string, right: string): number { return left.slice(0, 10).localeCompare(right.slice(0, 10)); }

export function classifyScheduleWeek(week: Pick<ScheduleWeek, "weekStartDate" | "weekEndDate">, today = new Date()): "current" | "upcoming" | "history" {
  const todayKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  if (todayKey < week.weekStartDate.slice(0, 10)) return "upcoming";
  if (todayKey > week.weekEndDate.slice(0, 10)) return "history";
  return "current";
}

function metadata(week: ScheduleWeek) {
  const start = parseDateOnly(week.weekStartDate);
  const calendarYear = week.calendarYear ?? start?.getUTCFullYear() ?? 0;
  const calendarMonth = week.calendarMonth ?? (start ? start.getUTCMonth() + 1 : week.monthNumber ?? 0);
  const quarterNumber = week.fiscalQuarterNumber ?? week.quarterNumber ?? Math.ceil(calendarMonth / 3);
  const fiscalYearStartYear = week.fiscalYearStartYear ?? calendarYear;
  return { calendarYear, calendarMonth, quarterNumber, fiscalYearStartYear };
}

/** Groups by backend period ownership. IDs/metadata win even when a week crosses a period boundary. */
export function groupScheduleWeeks(weeks: ScheduleWeek[]): ScheduleFiscalYearGroup[] {
  const years = new Map<string, { startYear: number; label: string; quarters: Map<string, { number: number; months: Map<string, ScheduleWeek[]> }> }>();
  for (const week of [...weeks].sort((a, b) => a.sequence - b.sequence)) {
    const meta = metadata(week);
    const yearKey = week.annualStrategicPeriodId || `legacy-fy-${meta.fiscalYearStartYear}`;
    const year = years.get(yearKey) ?? { startYear: meta.fiscalYearStartYear, label: week.fiscalYearLabel || `FY${meta.fiscalYearStartYear}`, quarters: new Map() };
    const quarterKey = week.quarterlyStrategicPeriodId || `${yearKey}-q-${meta.quarterNumber}`;
    const quarter = year.quarters.get(quarterKey) ?? { number: meta.quarterNumber, months: new Map() };
    const monthKey = week.monthlyStrategicPeriodId || `${quarterKey}-${meta.calendarYear}-${meta.calendarMonth}`;
    const monthWeeks = quarter.months.get(monthKey) ?? [];
    monthWeeks.push(week); quarter.months.set(monthKey, monthWeeks); year.quarters.set(quarterKey, quarter); years.set(yearKey, year);
  }
  return [...years.entries()].map(([yearKey, year]) => ({
    key: yearKey, fiscalYearStartYear: year.startYear, label: year.label,
    quarters: [...year.quarters.entries()].map(([quarterKey, quarter]) => ({
      key: quarterKey, quarterNumber: quarter.number, label: `Fiscal Quarter ${quarter.number}`,
      months: [...quarter.months.entries()].map(([monthKey, monthWeeks]) => {
        const meta = metadata(monthWeeks[0]);
        const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(meta.calendarYear, meta.calendarMonth - 1, 1)));
        return { key: monthKey, calendarYear: meta.calendarYear, calendarMonth: meta.calendarMonth, label: `${monthName} ${meta.calendarYear}`, weeks: monthWeeks };
      }),
    })),
  }));
}
