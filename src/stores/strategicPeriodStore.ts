/**
 * Strategic Period Store
 * Manages selected strategic period and timeline
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StrategicPeriod } from "@/types/graphql";
import { appLogger } from "@/lib/logger";

interface StrategicPeriodState {
  // State
  selectedPeriod: StrategicPeriod | null;
  annualTimeline: string | null; // e.g., "2025/26"

  // Actions
  setSelectedPeriod: (period: StrategicPeriod | null) => void;
  setAnnualTimeline: (timeline: string | null) => void;
  selectPeriodWithTimeline: (period: StrategicPeriod, timeline: string) => void;
  clearSelection: () => void;
}

export const useStrategicPeriodStore = create<StrategicPeriodState>()(
  persist(
    (set) => ({
      // Initial state
      selectedPeriod: null,
      annualTimeline: null,

      // Set selected period
      setSelectedPeriod: (period) => {
        set({ selectedPeriod: period });
        if (period) {
          appLogger.debug("Strategic period selected", {
            id: period.strategicPeriodId,
          });
        }
      },

      // Set annual timeline
      setAnnualTimeline: (timeline) => {
        set({ annualTimeline: timeline });
        if (timeline) {
          appLogger.debug("Annual timeline selected", { timeline });
        }
      },

      // Select period with timeline in one action
      selectPeriodWithTimeline: (period, timeline) => {
        set({
          selectedPeriod: period,
          annualTimeline: timeline,
        });
        appLogger.debug("Strategic period and timeline selected", {
          periodId: period.strategicPeriodId,
          timeline,
        });
      },

      // Clear selection
      clearSelection: () => {
        set({
          selectedPeriod: null,
          annualTimeline: null,
        });
        appLogger.debug("Strategic period selection cleared");
      },
    }),
    {
      name: "strategic-period-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Selector hooks
export const useSelectedStrategicPeriod = () =>
  useStrategicPeriodStore((state) => state.selectedPeriod);
export const useAnnualTimeline = () =>
  useStrategicPeriodStore((state) => state.annualTimeline);

// Combined selector for backwards compatibility
export const useStrategicPeriodState = () => {
  const period = useStrategicPeriodStore((state) => state.selectedPeriod);
  const timeline = useStrategicPeriodStore((state) => state.annualTimeline);
  return { period, annualTimeline: timeline };
};


