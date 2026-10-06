"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { StrategicPeriod } from "@/types/graphql";
import { useMemo } from "react";
import { useStrategicPeriodStore, useAuthStore } from "@/stores";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  findActiveOrCurrentQuarter,
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
  const { strategicPeriods, loading } = useActiveStrategicPlanPeriods();
  const { selectedPeriod, selectPeriodWithTimeline } =
    useStrategicPeriodStore();
  const router = useRouter();
  const canManagePeriods = user?.role === "SUPER_ADMIN";

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

  const activePlanSelectedPeriod = useMemo(
    () =>
      selectedPeriod &&
      strategicPeriods.some(
        (period) =>
          period.strategicPeriodId === selectedPeriod.strategicPeriodId,
      )
        ? selectedPeriod
        : null,
    [selectedPeriod, strategicPeriods],
  );

  const selectedYear = useMemo(
    () =>
      activePlanSelectedPeriod
        ? getAnnualTimelineForPeriod(
            activePlanSelectedPeriod,
            strategicPeriods,
          )
        : "",
    [activePlanSelectedPeriod, strategicPeriods],
  );

  const selectedQuarter = useMemo(() => {
    if (!activePlanSelectedPeriod || !selectedYear) return "";
    if (isQuarterlyPeriod(activePlanSelectedPeriod)) {
      return activePlanSelectedPeriod.strategicPeriodId;
    }

    return (
      findActiveOrCurrentQuarter(
        getPeriodsForAnnualTimeline(selectedYear, strategicPeriods),
      )?.strategicPeriodId ?? ANNUAL_PERIOD_VALUE
    );
  }, [activePlanSelectedPeriod, selectedYear, strategicPeriods]);

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

  const handleYearChange = (yearLabel: string) => {
    if (yearLabel === "manage-periods") {
      router.push("/strategy-period");
      return;
    }

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
      currentAnnualPeriod ??
      activeAnnualPeriod ??
      annualPeriod ??
      findCurrentPeriod(periodsForYear) ??
      periodsForYear[0];

    if (periodToSelect) {
      selectPeriodWithTimeline(periodToSelect, yearLabel);
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
            isAnnualPeriod(period) && getPeriodTimeStatus(period) === "current",
        ) ??
        periodsForYear.find(
          (period) =>
            isAnnualPeriod(period) && period.status?.toLowerCase() === "active",
        ) ??
        periodsForYear.find(isAnnualPeriod);

      if (!annualPeriod) return;

      selectPeriodWithTimeline(annualPeriod, selectedYear);
      toast.success(`Switched to annual period ${selectedYear}`);
      return;
    }

    const period = strategicPeriods.find(
      (p) => p.strategicPeriodId === periodId,
    );
    if (!period) return;

    const yearLabel = getAnnualTimelineForPeriod(period, strategicPeriods);
    selectPeriodWithTimeline(period, yearLabel);

    const quarter = getQuarterLabelForPeriod(period, strategicPeriods);
    toast.success(`Switched to ${quarter} ${yearLabel}`);
  };

  if (loading && strategicPeriods.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 dark:border-white/[0.08] dark:bg-zinc-800/80">
        <Calendar className="h-4 w-4 animate-pulse text-indigo-500" />
        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Loading...</span>
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
          className={`flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-100 hover:border-slate-300 dark:border-white/[0.08] dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800 w-32.5 ${className}`}
        >
          <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/95">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Strategic Year
          </div>
          {availableYears.map(({ label }) => (
            <SelectItem key={label} value={label} className="rounded-xl text-xs font-medium">
              <div className="flex w-full items-center justify-between gap-3">
                <span>{label}</span>
                {selectedYear === label && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    Active
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
          <div className="my-1 border-t border-slate-100 dark:border-zinc-800"></div>
          <SelectItem
            value="manage-periods"
            className="rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400"
          >
            <div className="flex items-center gap-2">
              {canManagePeriods ? <Plus size={14} /> : <Calendar size={14} />}
              {canManagePeriods ? "Manage Periods" : "View All Periods"}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Quarter Selector */}
      {availableQuarters.length > 0 && (
        <Select value={selectedQuarter} onValueChange={handleQuarterChange}>
          <SelectTrigger className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-100 hover:border-slate-300 dark:border-white/[0.08] dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800 w-28">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/95">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Reporting Quarter
            </div>
            <SelectItem value={ANNUAL_PERIOD_VALUE} className="rounded-xl text-xs font-medium">
              <div className="flex w-full items-center justify-between gap-3">
                <span>Annual period</span>
              </div>
            </SelectItem>
            {availableQuarters.map((quarter) => {
              const status = getPeriodTimeStatus(quarter.period);
              return (
                <SelectItem key={quarter.value} value={quarter.value} className="rounded-xl text-xs font-medium">
                  <div className="flex w-full items-center justify-between gap-3">
                    <span>{quarter.label}</span>
                    {status === "current" && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
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

