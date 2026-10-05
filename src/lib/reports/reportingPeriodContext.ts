import {
  findEnclosingAnnualPeriod,
  getQuarterLabelForPeriod,
  isQuarterlyPeriod,
} from "@/lib/strategic-periods/periodDates";
import type { StrategicPeriod } from "@/types/graphql";

export interface ReportingPeriodContext {
  annualPeriod: StrategicPeriod;
  quarterNumber?: number;
}

/**
 * Report APIs are anchored to an annual period. The global header may point at
 * either that annual period or one of its quarters, so normalize it once and
 * retain the selected quarter as a report filter.
 */
export function resolveReportingPeriodContext(
  selectedPeriod: StrategicPeriod | null | undefined,
  periods: StrategicPeriod[],
): ReportingPeriodContext | null {
  if (!selectedPeriod) return null;

  const annualPeriod = findEnclosingAnnualPeriod(selectedPeriod, periods);
  if (!annualPeriod) return null;

  if (!isQuarterlyPeriod(selectedPeriod)) return { annualPeriod };

  const quarterNumber = Number(
    getQuarterLabelForPeriod(selectedPeriod, periods).replace("Q", ""),
  );
  return {
    annualPeriod,
    quarterNumber:
      quarterNumber >= 1 && quarterNumber <= 4 ? quarterNumber : undefined,
  };
}
