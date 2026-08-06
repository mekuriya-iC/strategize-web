import type { StrategicPeriod } from "@/types/graphql";

export type PeriodTimeStatus = "current" | "future" | "past";

const periodTypeEquals = (period: StrategicPeriod, type: string) =>
  period.periodType?.toLowerCase() === type;

export const isAnnualPeriod = (period: StrategicPeriod) =>
  periodTypeEquals(period, "annual");

export const isQuarterlyPeriod = (period: StrategicPeriod) =>
  periodTypeEquals(period, "quarterly");

export const parseStrategicDate = (value: string | Date): Date => {
  if (value instanceof Date) return value;

  const datePart = value.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  if (year && month && day) {
    // Use noon local time to avoid timezone shifts around midnight/UTC dates.
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  return new Date(value);
};

export const sortPeriodsByStartDate = <T extends Pick<StrategicPeriod, "startDate">>(
  periods: T[],
): T[] =>
  [...periods].sort(
    (a, b) =>
      parseStrategicDate(a.startDate).getTime() -
      parseStrategicDate(b.startDate).getTime(),
  );

export const getPeriodTimeStatus = (
  period: StrategicPeriod,
  referenceDate: Date = new Date(),
): PeriodTimeStatus => {
  const now = parseStrategicDate(referenceDate);
  const startDate = parseStrategicDate(period.startDate);
  const endDate = parseStrategicDate(period.endDate);

  if (now < startDate) return "future";
  if (now >= startDate && now <= endDate) return "current";
  return "past";
};

export const isDateInsidePeriod = (
  date: Date,
  period: Pick<StrategicPeriod, "startDate" | "endDate">,
): boolean => {
  const target = parseStrategicDate(date);
  return (
    target >= parseStrategicDate(period.startDate) &&
    target <= parseStrategicDate(period.endDate)
  );
};

export const isPeriodInsidePeriod = (
  child: Pick<StrategicPeriod, "startDate" | "endDate">,
  parent: Pick<StrategicPeriod, "startDate" | "endDate">,
): boolean =>
  parseStrategicDate(child.startDate) >= parseStrategicDate(parent.startDate) &&
  parseStrategicDate(child.endDate) <= parseStrategicDate(parent.endDate);

/**
 * Timeline key used by KPI targets. Mirrors YearSelector.buildYearRanges():
 * calendar years become "2026", fiscal years become "2025/26".
 */
export const formatAnnualTimeline = (
  period: Pick<StrategicPeriod, "startDate" | "endDate">,
): string => {
  const startYear = parseStrategicDate(period.startDate).getFullYear();
  const endYear = parseStrategicDate(period.endDate).getFullYear();

  if (startYear === endYear) return startYear.toString();
  return `${startYear}/${endYear.toString().slice(-2)}`;
};

export const getAnnualPeriods = (periods: StrategicPeriod[]) =>
  sortPeriodsByStartDate(periods.filter(isAnnualPeriod));

export const findEnclosingAnnualPeriod = (
  period: StrategicPeriod,
  periods: StrategicPeriod[],
): StrategicPeriod | undefined => {
  if (isAnnualPeriod(period)) return period;

  return getAnnualPeriods(periods).find((annualPeriod) =>
    isPeriodInsidePeriod(period, annualPeriod),
  );
};

export const getAnnualTimelineForPeriod = (
  period: StrategicPeriod,
  periods: StrategicPeriod[],
): string => formatAnnualTimeline(findEnclosingAnnualPeriod(period, periods) ?? period);

export const getPeriodsForAnnualTimeline = (
  timeline: string,
  periods: StrategicPeriod[],
): StrategicPeriod[] => {
  const annualPeriod = getAnnualPeriods(periods).find(
    (period) => formatAnnualTimeline(period) === timeline,
  );

  if (annualPeriod) {
    return sortPeriodsByStartDate(
      periods.filter((period) => isPeriodInsidePeriod(period, annualPeriod)),
    );
  }

  return sortPeriodsByStartDate(
    periods.filter((period) => getAnnualTimelineForPeriod(period, periods) === timeline),
  );
};

export const getQuarterLabelForPeriod = (
  period: StrategicPeriod,
  periods: StrategicPeriod[],
): string => {
  const annualPeriod = findEnclosingAnnualPeriod(period, periods);
  const quarters = sortPeriodsByStartDate(
    periods.filter(
      (candidate) =>
        isQuarterlyPeriod(candidate) &&
        (annualPeriod
          ? isPeriodInsidePeriod(candidate, annualPeriod)
          : getAnnualTimelineForPeriod(candidate, periods) ===
            getAnnualTimelineForPeriod(period, periods)),
    ),
  );

  const index = quarters.findIndex(
    (candidate) => candidate.strategicPeriodId === period.strategicPeriodId,
  );

  if (index >= 0) return `Q${index + 1}`;

  const nameQuarter = period.name?.match(/\bQ([1-4])\b/i)?.[1];
  if (nameQuarter) return `Q${nameQuarter}`;

  const month = parseStrategicDate(period.startDate).getMonth();
  return `Q${Math.floor(month / 3) + 1}`;
};

export const findCurrentPeriod = <T extends StrategicPeriod>(
  periods: T[],
  referenceDate: Date = new Date(),
): T | undefined =>
  sortPeriodsByStartDate(periods).find(
    (period) => getPeriodTimeStatus(period, referenceDate) === "current",
  );

export const findActiveOrCurrentQuarter = (
  periods: StrategicPeriod[],
  referenceDate: Date = new Date(),
): StrategicPeriod | undefined => {
  const quarters = sortPeriodsByStartDate(periods.filter(isQuarterlyPeriod));

  return (
    findCurrentPeriod(quarters, referenceDate) ??
    quarters.find((period) => period.status?.toLowerCase() === "active")
  );
};
