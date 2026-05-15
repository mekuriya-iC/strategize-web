/**
 * Custom hook for KPI Form state management
 * Extracts complex state logic from KPIForm.tsx
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client";
import { useKPIMutations } from "@/hooks/objectives/useKPIMutations";
import { useKPI, useKPIs } from "@/hooks/objectives/useKPIs";
import { useObjective } from "@/hooks/objectives/useObjectives";
import { useStrategicPeriodStore } from "@/stores";
import { buildYearRanges } from "@/components/objectives/YearSelector";
import type {
  KpiWeightType,
  Objective as GraphQLObjective,
  Kpi,
} from "@/types/graphql";
import { kpiLogger } from "@/lib/logger";
import { usesAnnualOnlyKpiTargets } from "@/lib/objectives/kpiWeightScope";

// Types
export interface KPIFormData {
  name: string;
  baseline: string;
  weight: string;
  weightType: KpiWeightType;
  unitType?: string;
}

export interface YearlyQuarters {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  parentTarget?: number;
}

export interface TargetEntry {
  timeline: string;
  target: string;
}

export interface UseKPIFormStateProps {
  objectiveId: string;
  kpiId?: string | null;
  objective?: GraphQLObjective;
  strategicTargetsById?: Record<string, Record<string, number>>;
}

export interface AllocationInfo {
  available: number;
  used: number;
  remaining: number;
}

export const useKPIFormState = ({
  objectiveId,
  kpiId,
  objective,
  strategicTargetsById,
}: UseKPIFormStateProps) => {
  const isEditing = Boolean(kpiId);
  const client = useApolloClient();
  const { createKpi, updateKpi, loading: mutationLoading } = useKPIMutations();

  // Data fetching
  const { kpi, loading: kpiLoading } = useKPI(
    kpiId ? { kpiId } : { kpiId: "" }
  );
  const { kpis, refetch: refetchKPIs } = useKPIs({ page: 1, limit: 1000 });
  const { objective: parentObjective } = useObjective({
    objectiveId: objective?.parent?.objectiveId || "",
  });
  const { kpis: parentKPIs } = useKPIs({ page: 1, limit: 1000 });
  const {
    selectedPeriod,
    annualTimeline,
    setSelectedPeriod,
    setAnnualTimeline,
  } = useStrategicPeriodStore();

  // For backwards compatibility with existing code
  const strategicPeriodState = {
    period: selectedPeriod,
    annualTimeline,
  };
  const setStrategicPeriod = (val: { period?: typeof selectedPeriod; annualTimeline?: string }) => {
    if (val.period) setSelectedPeriod(val.period);
    if (val.annualTimeline) setAnnualTimeline(val.annualTimeline);
  };

  // Form state
  const [formData, setFormData] = useState<KPIFormData>({
    name: objective?.name || "",
    baseline: "",
    weight: "",
    weightType: "PERCENT",
  });
  const [parentId, setParentId] = useState<string>("");
  const [targets, setTargets] = useState<TargetEntry[]>([
    { timeline: "", target: "" },
  ]);
  const [yearlyQuarters, setYearlyQuarters] = useState<
    Record<string, YearlyQuarters>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize global strategic period and timeline with the objective context
  // This ensures the selectors and available year ranges in the form are correct from mount
  useEffect(() => {
    if (!objective?.strategicPeriod) return;

    const period = objective.strategicPeriod;
    const options = buildYearRanges(period);

    // 1. Sync Strategic Period if different from current global selection
    if (selectedPeriod?.strategicPeriodId !== period.strategicPeriodId) {
      kpiLogger.debug("KPI Sync: Updating global strategic period to match objective");
      setSelectedPeriod(period);
    }

    // 2. Sync Annual Timeline (Specific Year Range)
    // Only update if current choice is invalid for this target period
    if (!annualTimeline || !options.includes(annualTimeline)) {
      if (options.length > 0) {
        kpiLogger.debug("KPI Sync: Initializing global timeline for form context");
        setAnnualTimeline(options[0]);
      }
    }
  }, [objective, selectedPeriod, annualTimeline, setSelectedPeriod, setAnnualTimeline]);

  // Computed values
  const isKPIApproved = kpi?.status === "APPROVED";
  const isKPIRejected = kpi?.status === "REJECTED";
  // No editing allowed if approved, except for Corporate level which can always adjust
  const isTopLevelCorporate = usesAnnualOnlyKpiTargets(objective);
  const canEditStructure = !isKPIApproved || !isTopLevelCorporate;
  const canEditTargets = !isKPIApproved || !isTopLevelCorporate;
  const isInheritedKPI = Boolean(objective?.parent);
  // Quarterly breakdown for all cascaded/assigned objectives (including corporate-type assignees)
  const isQuarterlyMode = !isTopLevelCorporate || isInheritedKPI;

  // Default timeline calculation
  const defaultTimeline = useMemo(() => {
    if (objective?.strategicPeriod) {
      const options = buildYearRanges(objective.strategicPeriod);
      if (
        strategicPeriodState?.annualTimeline &&
        options.includes(strategicPeriodState.annualTimeline)
      ) {
        return strategicPeriodState.annualTimeline;
      }
      return options[0] || "";
    }
    return "";
  }, [objective?.strategicPeriod, strategicPeriodState?.annualTimeline]);

  // Candidate parent KPIs
  const candidateParentKPIs = useMemo(() => {
    if (!objective?.parent) return [];
    return (parentKPIs || [])
      .filter((k) => k.objective?.objectiveId === objective.parent?.objectiveId)
      .map((k) => ({ kpiId: k.kpiId, name: k.name }));
  }, [objective?.parent, parentKPIs]);

  // Get parent KPI
  const getParentKPI = useCallback((): Kpi | null => {
    if (!objective?.parent || !parentObjective || !parentKPIs) {
      return null;
    }

    if (parentId) {
      return parentKPIs.find((k) => k.kpiId === parentId) || null;
    }

    // Fallback to index-based matching
    const parentObjKPIs = parentKPIs.filter(
      (k) => k.objective?.objectiveId === objective.parent?.objectiveId
    );
    const currentObjKPIs = kpis.filter(
      (k) => k.objective?.objectiveId === objectiveId
    );
    const kpiIndex = currentObjKPIs.findIndex((k) => k.kpiId === kpiId);
    return parentObjKPIs[kpiIndex] || null;
  }, [
    objective?.parent,
    parentObjective,
    parentKPIs,
    parentId,
    kpis,
    objectiveId,
    kpiId,
  ]);

  // Get remaining allocation (for a specific year if provided)
  const getRemainingAllocation = useCallback((year?: string): AllocationInfo | null => {
    const hasParentKpi = kpi?.parent?.kpiId;
    const hasParentId = parentId;

    if (!hasParentKpi && !hasParentId) return null;
    if (!objective?.parent) return null;

    const parentKpiId = hasParentKpi || hasParentId || "";
    // Robustly identify the current KPI ID to exclude it from sibling calculations
    const currentKpiId = kpiId || kpi?.kpiId;
    const parentKPI = getParentKPI();

    // Use current annual timeline if no year provided
    const targetYear = year || annualTimeline;

    if (!parentKPI) {
      if (hasParentId && strategicTargetsById?.[hasParentId]) {
        const parentTargets = strategicTargetsById[hasParentId];
        // If year provided, get specific year
        if (targetYear && parentTargets[targetYear] !== undefined) {
          const val = parentTargets[targetYear];
          return { available: val, used: 0, remaining: val };
        }

        const totalParent = Object.values(parentTargets).reduce((sum, t) => sum + t, 0);
        if (totalParent === 0) return null;
        return { available: totalParent, used: 0, remaining: totalParent };
      }
      return null;
    }

    // Helper to get sum for a KPI in a specific year
    const getTargetSumForYear = (k: Kpi, yr: string) => {
      const targets = k.targets || [];
      // Check for exact year match
      const yearTarget = targets.find(t => t.timeline === yr);
      if (yearTarget) return yearTarget.target;

      // Sum quarterly targets for that year
      return targets
        .filter(t => t.timeline.startsWith(yr.split("/")[0]) && t.timeline.includes("-Q"))
        .reduce((sum, t) => sum + t.target, 0);
    };

    if (targetYear) {
      const parentYearTarget = getTargetSumForYear(parentKPI, targetYear);
      if (parentYearTarget === 0) return null;

      const siblingKPIs = kpis.filter(
        (k) => k.parent?.kpiId === parentKpiId && k.kpiId !== currentKpiId && k.kpiId !== undefined
      );

      const usedAllocation = siblingKPIs.reduce((total, siblingKpi) => {
        return total + getTargetSumForYear(siblingKpi, targetYear);
      }, 0);

      const remaining = Math.round(Math.max(0, parentYearTarget - usedAllocation) * 100) / 100;
      return { available: parentYearTarget, used: usedAllocation, remaining };
    }

    // Legacy fallback for total strategic period
    const parentTargetTotal = (parentKPI.targets || []).reduce((sum, t) => sum + t.target, 0);
    if (parentTargetTotal === 0) return null;

    const siblingKPIs = kpis.filter(
      (k) => k.parent?.kpiId === parentKpiId && k.kpiId !== currentKpiId && k.kpiId !== undefined
    );

    const usedAllocationTotal = siblingKPIs.reduce((total, siblingKpi) => {
      return total + (siblingKpi.targets || []).reduce((sum, t) => sum + t.target, 0);
    }, 0);

    const remainingTotal = Math.max(0, parentTargetTotal - usedAllocationTotal);
    return { available: parentTargetTotal, used: usedAllocationTotal, remaining: remainingTotal };
  }, [
    kpi,
    parentId,
    objective?.parent,
    getParentKPI,
    strategicTargetsById,
    kpis,
    annualTimeline
  ]);

  // Weight budget for this objective only
  const getLevelAllocation = useCallback((): { used: number; remaining: number } => {
    if (!objective?.objectiveId) return { used: 0, remaining: 100 };

    const objectiveKpis = (kpis || []).filter(
      (k) =>
        k.objective?.objectiveId === objective.objectiveId &&
        k.status !== "REJECTED" &&
        k.kpiId !== kpiId
    );

    const used = objectiveKpis.reduce((total, k) => total + (k.weight || 0), 0);
    return { used, remaining: Math.max(0, 100 - used) };
  }, [kpis, objective?.objectiveId, kpiId]);

  // Form handlers
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleTargetChange = useCallback(
    (index: number, field: "timeline" | "target", value: string) => {
      setTargets((prev) =>
        prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  const addTarget = useCallback(() => {
    setTargets((prev) => [...prev, { timeline: "", target: "" }]);
  }, []);

  const removeTarget = useCallback(
    (index: number) => {
      if (targets.length > 1) {
        setTargets((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [targets.length]
  );

  // Load existing KPI data when editing
  useEffect(() => {
    if (isEditing && kpi && !kpiLoading) {
      setFormData({
        name: kpi.name,
        baseline: kpi.baseline.toString(),
        weight: kpi.weight.toString(),
        weightType: kpi.unitType,
      });

      if (kpi.parent?.kpiId) {
        setParentId(kpi.parent.kpiId);
      }

      const tgs =
        kpi.targets.length > 0
          ? kpi.targets.map((t) => ({
            timeline: t.timeline,
            target: t.target.toString(),
          }))
          : [{ timeline: defaultTimeline, target: "" }];
      setTargets(tgs);

      // Sync global annual timeline to the first target of the KPI if editing
      if (tgs.length > 0 && tgs[0].timeline) {
        const options = objective?.strategicPeriod ? buildYearRanges(objective.strategicPeriod) : [];
        if (options.includes(tgs[0].timeline) && annualTimeline !== tgs[0].timeline) {
          kpiLogger.debug("KPI Edit Sync: Updating global timeline to match KPI targets", tgs[0].timeline);
          setAnnualTimeline(tgs[0].timeline);
        }
      }

      if (isQuarterlyMode) {
        const newYearlyQuarters: Record<string, YearlyQuarters> = {};
        const allYears = Array.from(
          new Set(tgs.map((t) => t.timeline.split("-")[0]))
        );

        allYears.forEach((year) => {
          const findQuarterVal = (q: string) =>
            tgs.find((t) => t.timeline === `${year}-Q${q}`)?.target ?? "";

          newYearlyQuarters[year] = {
            q1: findQuarterVal("1"),
            q2: findQuarterVal("2"),
            q3: findQuarterVal("3"),
            q4: findQuarterVal("4"),
            parentTarget: undefined,
          };
        });

        setYearlyQuarters(newYearlyQuarters);
      }
    }
  }, [isEditing, kpi, kpiLoading, defaultTimeline, isQuarterlyMode]);

  // Initialize targets and yearly quarters with default timeline
  useEffect(() => {
    if (!isEditing && defaultTimeline) {
      if (targets[0]?.timeline === "") {
        setTargets([{ timeline: defaultTimeline, target: "" }]);
      }

      if (isQuarterlyMode && !parentId && Object.keys(yearlyQuarters).length === 0) {
        setYearlyQuarters({
          [defaultTimeline]: { q1: "", q2: "", q3: "", q4: "", parentTarget: 0 }
        });
      }
    }
  }, [isEditing, defaultTimeline, targets, isQuarterlyMode, parentId, yearlyQuarters]);

  // Sync yearlyQuarters keys with targets when parentId is NOT set
  useEffect(() => {
    if (isQuarterlyMode && !parentId) {
      const newYearlyQuarters = { ...yearlyQuarters };
      let changed = false;

      // Ensure all years in targets exist in yearlyQuarters
      targets.forEach((t) => {
        if (t.timeline && !newYearlyQuarters[t.timeline]) {
          newYearlyQuarters[t.timeline] = {
            q1: "",
            q2: "",
            q3: "",
            q4: "",
            parentTarget: Number(t.target || 0),
          };
          changed = true;
        } else if (t.timeline && newYearlyQuarters[t.timeline]) {
          // Update parentTarget reference from the annual input
          const newTargetValue = Number(t.target || 0);
          if (newYearlyQuarters[t.timeline].parentTarget !== newTargetValue) {
            newYearlyQuarters[t.timeline].parentTarget = newTargetValue;
            changed = true;
          }
        }
      });

      // Remove years that are no longer in targets
      const targetYears = targets.map((t) => t.timeline).filter(Boolean);
      Object.keys(newYearlyQuarters).forEach((year) => {
        if (!targetYears.includes(year)) {
          delete newYearlyQuarters[year];
          changed = true;
        }
      });

      if (changed) {
        setYearlyQuarters(newYearlyQuarters);
      }
    }
  }, [isQuarterlyMode, parentId, targets, yearlyQuarters]);

  // Auto-select parent KPI if there's only one option
  useEffect(() => {
    if (!isEditing && !parentId && candidateParentKPIs.length === 1) {
      setParentId(candidateParentKPIs[0].kpiId);
    }
  }, [isEditing, parentId, candidateParentKPIs]);

  // Handle explicit switch to Standalone mode (parentId cleared by user)
  const prevParentId = useRef(parentId);
  useEffect(() => {
    if (prevParentId.current && !parentId) {
      kpiLogger.debug("KPI Mode: Switch to standalone, resetting form data");
      setFormData(prev => ({
        ...prev,
        baseline: "",
        weight: "",
        name: objective?.name || ""
      }));
    }
    prevParentId.current = parentId;
  }, [parentId, objective?.name]);

  // Auto-populate from parent KPI
  useEffect(() => {
    // We auto-populate if:
    // 1. It's a new KPI (isEditing is false) and parentId is selected.
    // 2. We're editing but the user changed the parentId from the original one.
    const isNewParentSelection = isEditing && parentId && parentId !== kpi?.parent?.kpiId;

    if (parentId && (!isEditing || isNewParentSelection)) {
      const selectedParentKPI = parentKPIs?.find((k) => k.kpiId === parentId);
      if (selectedParentKPI) {
        kpiLogger.debug(
          "Auto-populating from parent KPI:",
          selectedParentKPI.name
        );

        setFormData((prev) => ({
          ...prev,
          baseline: selectedParentKPI.baseline.toString(),
          weight: selectedParentKPI.weight.toString(),
          name: selectedParentKPI.name,
          weightType: selectedParentKPI.unitType, // Inherit unit type from parent
        }));

        if (selectedParentKPI.targets && selectedParentKPI.targets.length > 0) {
          if (isQuarterlyMode) {
            const newYearlyQuarters: Record<string, YearlyQuarters> = {};

            selectedParentKPI.targets.forEach((target) => {
              const parts = target.timeline.split("-");
              if (parts.length === 2 && parts[1].startsWith("Q")) {
                const year = parts[0];
                const quarter = parts[1].toLowerCase() as "q1" | "q2" | "q3" | "q4";

                if (!newYearlyQuarters[year]) {
                  newYearlyQuarters[year] = { q1: "", q2: "", q3: "", q4: "", parentTarget: 0 };
                }
                newYearlyQuarters[year][quarter] = target.target.toString();
              } else {
                const year = target.timeline;
                const targetValue = target.target;

                // Auto-distribute logic
                let q1, q2, q3, q4;
                if (selectedParentKPI.unitType === "PERCENT") {
                  q1 = q2 = q3 = q4 = targetValue.toString();
                } else {
                  const split = Math.round((targetValue / 4) * 100) / 100;
                  const remainder = Math.round((targetValue - (split * 3)) * 100) / 100;
                  q1 = q2 = q3 = split.toString();
                  q4 = remainder.toString();
                }

                newYearlyQuarters[year] = {
                  q1, q2, q3, q4,
                  parentTarget: targetValue,
                };
              }
            });

            setYearlyQuarters(newYearlyQuarters);
          } else {
            const preparedTargets = selectedParentKPI.targets.map((t) => ({
              timeline: t.timeline,
              target: t.target.toString(),
            }));
            setTargets(preparedTargets);
          }
        }
      }
    }
  }, [parentId, parentKPIs, isEditing, isQuarterlyMode, kpi?.parent?.kpiId]);

  return {
    // State
    formData,
    parentId,
    targets,
    yearlyQuarters,
    isSubmitting,

    // Computed values
    isEditing,
    isKPIApproved,
    isKPIRejected,
    canEditStructure,
    canEditTargets,
    isQuarterlyMode,
    defaultTimeline,
    candidateParentKPIs,

    // Data
    kpi,
    kpis,
    parentKPIs,
    loading: mutationLoading || kpiLoading,

    // Actions
    setFormData,
    setParentId,
    setTargets,
    setYearlyQuarters,
    setIsSubmitting,
    handleInputChange,
    handleTargetChange,
    addTarget,
    removeTarget,
    getParentKPI,
    getRemainingAllocation,
    getLevelAllocation,
    refetchKPIs,

    // Mutations
    createKpi,
    updateKpi,
    client,

    // Strategic period
    strategicPeriodState,
    setStrategicPeriod,
  };
};
