"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStrategicPeriods } from "@/hooks/objectives/useStrategicPeriods";
import { StrategicPeriod } from "@/types/graphql";
import { useEffect, useMemo, useState } from "react";
import { useStrategicPeriodStore, useAuthStore } from "@/stores";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  findCurrentPeriod,
  formatAnnualTimeline,
  getAnnualPeriods,
  getAnnualTimelineForPeriod,
  getPeriodTimeStatus,
  getPeriodsForAnnualTimeline,
  getQuarterLabelForPeriod,
  isAnnualPeriod,
  isQuarterlyPeriod,
  sortPeriodsByStartDate,
} from "@/lib/strategic-periods/periodDates";

interface StrategicPeriodSelectorProps {
  className?: string;
}

const ANNUAL_PERIOD_VALUE = "__annual_period__";

export default function StrategicPeriodSelector({
  className = "",
}: StrategicPeriodSelectorProps) {
  const user = useAuthStore((state) => state.user);
  const { strategicPeriods, loading } = useStrategicPeriods({
    limit: 1000,
    organizationId: user?.organizationId,
  });
  const { selectedPeriod, selectPeriodWithTimeline } =
    useStrategicPeriodStore();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const availableYears = useMemo(() => {
    const annualPeriods = getAnnualPeriods(strategicPeriods);

    if (annualPeriods.length > 0) {
      return annualPeriods.map((period) => ({
        label: formatAnnualTimeline(period),
        period,
      }));
    }

    const options = new Map<string, StrategicPeriod>();
    sortPeriodsByStartDate(strategicPeriods).forEach((period) => {
      const label = getAnnualTimelineForPeriod(period, strategicPeriods);
      if (!options.has(label)) options.set(label, period);
    });

    return Array.from(options, ([label, period]) => ({ label, period }));
  }, [strategicPeriods]);

  const availableQuarters = useMemo(() => {
    if (!selectedYear) return [];

    return getPeriodsForAnnualTimeline(selectedYear, strategicPeriods)
      .filter(isQuarterlyPeriod)
      .map((period) => ({
        label: getQuarterLabelForPeriod(period, strategicPeriods),
        value: period.strategicPeriodId,
        period,
      }));
  }, [selectedYear, strategicPeriods]);

  useEffect(() => {
    if (!selectedPeriod || strategicPeriods.length === 0) return;

    const yearLabel = getAnnualTimelineForPeriod(
      selectedPeriod,
      strategicPeriods,
    );
    setSelectedYear(yearLabel);

    if (isQuarterlyPeriod(selectedPeriod)) {
      setSelectedQuarter(selectedPeriod.strategicPeriodId);
      return;
    }

    // Keep the dropdown honest: if the globally selected period is annual,
    // don't display an active quarter as selected. Exact quarter filtering only
    // happens after a real quarter is selected.
    setSelectedQuarter(ANNUAL_PERIOD_VALUE);
  }, [selectedPeriod, strategicPeriods]);

  const handleYearChange = (yearLabel: string) => {
    if (yearLabel === "manage-periods") {
      router.push("/strategy-period");
      return;
    }

    setSelectedYear(yearLabel);

    const periodsForYear = getPeriodsForAnnualTimeline(
      yearLabel,
      strategicPeriods,
    );
    const annualPeriod = periodsForYear.find(isAnnualPeriod);
    const activeAnnualPeriod = periodsForYear.find(
      (period) =>
        isAnnualPeriod(period) && period.status?.toLowerCase() === "active",
    );
    const currentAnnualPeriod = periodsForYear.find(
      (period) =>
        isAnnualPeriod(period) && getPeriodTimeStatus(period) === "current",
    );
    const periodToSelect =
      activeAnnualPeriod ??
      currentAnnualPeriod ??
      annualPeriod ??
      findCurrentPeriod(periodsForYear) ??
      periodsForYear[0];

    if (periodToSelect) {
      selectPeriodWithTimeline(periodToSelect, yearLabel);
      setSelectedQuarter(
        isQuarterlyPeriod(periodToSelect)
          ? periodToSelect.strategicPeriodId
          : ANNUAL_PERIOD_VALUE,
      );

      toast.success(`Switched to ${yearLabel}`);
    }
  };

  const handleQuarterChange = (periodId: string) => {
    if (periodId === ANNUAL_PERIOD_VALUE) {
      const periodsForYear = getPeriodsForAnnualTimeline(
        selectedYear,
        strategicPeriods,
      );
      const annualPeriod =
        periodsForYear.find(
          (period) =>
            isAnnualPeriod(period) && period.status?.toLowerCase() === "active",
        ) ??
        periodsForYear.find(
          (period) =>
            isAnnualPeriod(period) && getPeriodTimeStatus(period) === "current",
        ) ??
        periodsForYear.find(isAnnualPeriod);

      if (!annualPeriod) return;

      selectPeriodWithTimeline(annualPeriod, selectedYear);
      setSelectedQuarter(ANNUAL_PERIOD_VALUE);
      toast.success(`Switched to annual period ${selectedYear}`);
      return;
    }

    const period = strategicPeriods.find(
      (p) => p.strategicPeriodId === periodId,
    );
    if (!period) return;

    const yearLabel = getAnnualTimelineForPeriod(period, strategicPeriods);
    selectPeriodWithTimeline(period, yearLabel);
    setSelectedYear(yearLabel);
    setSelectedQuarter(periodId);

    const quarter = getQuarterLabelForPeriod(period, strategicPeriods);
    toast.success(`Switched to ${quarter} ${yearLabel}`);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (strategicPeriods.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Year Selector */}
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger
          className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border-none hover:bg-gray-100 dark:hover:bg-gray-700 w-32 ${className}`}
        >
          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Select Year
          </div>
          {availableYears.map(({ label }) => (
            <SelectItem key={label} value={label}>
              <div className="flex items-center justify-between w-full gap-3">
                <span>{label}</span>
                {selectedYear === label && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    Selected
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <SelectItem
            value="manage-periods"
            className="text-primary font-medium"
          >
            <div className="flex items-center gap-2">
              <Plus size={16} />
              {isAdmin ? "Manage Periods" : "View All Periods"}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Quarter Selector - Only show if there are quarters for selected year */}
      {availableQuarters.length > 0 && (
        <Select value={selectedQuarter} onValueChange={handleQuarterChange}>
          <SelectTrigger className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border-none hover:bg-gray-100 dark:hover:bg-gray-700 w-28">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Select Quarter
            </div>
            <SelectItem value={ANNUAL_PERIOD_VALUE}>
              <div className="flex items-center justify-between w-full gap-3">
                <span>Annual period</span>
              </div>
            </SelectItem>
            {availableQuarters.map((quarter) => {
              const status = getPeriodTimeStatus(quarter.period);
              return (
                <SelectItem key={quarter.value} value={quarter.value}>
                  <div className="flex items-center justify-between w-full gap-3">
                    <span>{quarter.label}</span>
                    {status === "current" && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
