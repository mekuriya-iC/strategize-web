/**
 * Hook to automatically select the current strategic period
 * Used for non-admin users who should be redirected directly to dashboard
 */
import { useEffect } from "react";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { useStrategicPeriodStore } from "@/stores";
import {
  findCurrentPeriod,
  getAnnualPeriods,
  getAnnualTimelineForPeriod,
} from "@/lib/strategic-periods/periodDates";

/**
 * Auto-selects the current strategic period if none is selected.
 * For dashboard/objective consistency, annual periods are preferred when they
 * exist, while the quarter selector separately displays the active quarter.
 */
export const useAutoSelectStrategicPeriod = () => {
  const { strategicPeriods, loading, error, contextReady } =
    useActiveStrategicPlanPeriods();
  const {
    selectedPeriod,
    annualTimeline,
    selectionValidated,
    selectPeriodWithTimeline,
    setSelectionValidated,
    clearSelection,
  } = useStrategicPeriodStore();

  useEffect(() => {
    if (!contextReady || loading || error) {
      if (selectionValidated) setSelectionValidated(false);
      return;
    }

    if (strategicPeriods.length === 0) {
      if (selectedPeriod) clearSelection();
      setSelectionValidated(true);
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
      setSelectionValidated(true);

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
      currentAnnualPeriod ??
      activeAnnualPeriod ??
      firstAnnualPeriod ??
      currentPeriod ??
      activePeriod ??
      strategicPeriods[0];

    if (periodToSelect) {
      const annualTimeline = getAnnualTimelineForPeriod(
        periodToSelect,
        strategicPeriods,
      );

      selectPeriodWithTimeline(periodToSelect, annualTimeline);
    }
    setSelectionValidated(true);
  }, [
    strategicPeriods,
    loading,
    contextReady,
    error,
    selectedPeriod,
    annualTimeline,
    selectionValidated,
    selectPeriodWithTimeline,
    setSelectionValidated,
    clearSelection,
  ]);

  return {
    loading,
    selectedPeriod,
  };
};
