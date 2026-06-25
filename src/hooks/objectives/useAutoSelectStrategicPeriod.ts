/**
 * Hook to automatically select the current strategic period
 * Used for non-admin users who should be redirected directly to dashboard
 */
import { useEffect } from "react";
import { useStrategicPeriods } from "./useStrategicPeriods";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import {
  findCurrentPeriod,
  getAnnualPeriods,
  getAnnualTimelineForPeriod,
  getPeriodTimeStatus,
} from "@/lib/strategic-periods/periodDates";

/**
 * Auto-selects the current strategic period if none is selected.
 * For dashboard/objective consistency, annual periods are preferred when they
 * exist, while the quarter selector separately displays the active quarter.
 */
export const useAutoSelectStrategicPeriod = () => {
  const user = useAuthStore((state) => state.user);
  const { strategicPeriods, loading } = useStrategicPeriods({
    limit: 1000,
    organizationId: user?.organizationId,
  });
  const { selectedPeriod, annualTimeline, selectPeriodWithTimeline } =
    useStrategicPeriodStore();

  useEffect(() => {
    // Don't auto-select if still loading or no periods available
    if (loading || strategicPeriods.length === 0) {
      return;
    }

    // Check if the currently selected period is still valid
    const isSelectedPeriodValid =
      selectedPeriod &&
      strategicPeriods.some(
        (p) => p.strategicPeriodId === selectedPeriod.strategicPeriodId,
      );

    // If there's a valid selected period, keep it, but repair stale persisted
    // timelines from older selector logic.
    if (isSelectedPeriodValid && selectedPeriod) {
      const expectedTimeline = getAnnualTimelineForPeriod(
        selectedPeriod,
        strategicPeriods,
      );

      if (annualTimeline !== expectedTimeline) {
        selectPeriodWithTimeline(selectedPeriod, expectedTimeline);
      }

      return;
    }

    const annualPeriods = getAnnualPeriods(strategicPeriods);

    // Prefer the active/current annual period so objective dashboards keep the
    // annual strategic context while the topbar can still show the active quarter.
    const activeAnnualPeriod = annualPeriods.find(
      (p) => p.status?.toLowerCase() === "active",
    );
    const currentAnnualPeriod = findCurrentPeriod(annualPeriods);
    const firstAnnualPeriod = annualPeriods[0];

    // Fallback for data sets that only contain quarterly/monthly/custom periods.
    const activePeriod = strategicPeriods.find(
      (p) => p.status?.toLowerCase() === "active",
    );
    const currentPeriod = findCurrentPeriod(strategicPeriods);

    const periodToSelect =
      activeAnnualPeriod ??
      currentAnnualPeriod ??
      firstAnnualPeriod ??
      activePeriod ??
      currentPeriod ??
      strategicPeriods[0];

    if (periodToSelect) {
      const annualTimeline = getAnnualTimelineForPeriod(
        periodToSelect,
        strategicPeriods,
      );

      console.log("🎯 Auto-selecting strategic period:", {
        name: periodToSelect.name,
        id: periodToSelect.strategicPeriodId,
        status: periodToSelect.status,
        timeStatus: getPeriodTimeStatus(periodToSelect),
        annualTimeline,
        reason: activeAnnualPeriod
          ? "active annual status"
          : currentAnnualPeriod
            ? "current annual by date"
            : firstAnnualPeriod
              ? "first annual"
              : activePeriod
                ? "active status"
                : currentPeriod
                  ? "current by date"
                  : "first available",
      });

      selectPeriodWithTimeline(periodToSelect, annualTimeline);
    }
  }, [
    strategicPeriods,
    loading,
    selectedPeriod,
    annualTimeline,
    selectPeriodWithTimeline,
  ]);

  return {
    loading,
    selectedPeriod,
  };
};
