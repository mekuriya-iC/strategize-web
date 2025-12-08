/**
 * Custom hook for KPI Form state management
 * Extracts complex state logic from KPIForm.tsx
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useApolloClient } from "@apollo/client";
import { useKPIMutations } from "@/hooks/useKPIMutations";
import { useKPI, useKPIs } from "@/hooks/useKPIs";
import { useObjective } from "@/hooks/useObjectives";
import { useStrategicPeriodStore } from "@/stores";
import { buildYearRanges } from "@/components/objectives/YearSelector";
import type {
  KpiWeightType,
  Objective as GraphQLObjective,
  Kpi,
} from "@/types/graphql";
import { kpiLogger } from "@/lib/logger";

// Types
export interface KPIFormData {
  name: string;
  baseline: string;
  weight: string;
  weightType: KpiWeightType;
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
    name: "",
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

  // Computed values
  const isKPIApproved = kpi?.status === "APPROVED";
  const isKPIRejected = kpi?.status === "REJECTED";
  const canEditStructure = !isKPIApproved || objective?.type === "CORPORATE";
  const canEditTargets = !isKPIApproved || objective?.type === "CORPORATE";
  const isInheritedKPI = Boolean(objective?.parent);
  const isQuarterlyMode = isInheritedKPI;

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

  // Get remaining allocation
  const getRemainingAllocation = useCallback((): AllocationInfo | null => {
    const hasParentKpi = kpi?.parent?.kpiId;
    const hasParentId = parentId;

    if (!hasParentKpi && !hasParentId) return null;
    if (!objective?.parent) return null;

    const parentKpiId = hasParentKpi || hasParentId || "";
    const currentKpiId = kpi?.kpiId;
    const parentKPI = getParentKPI();

    if (!parentKPI) {
      if (hasParentId && strategicTargetsById?.[hasParentId]) {
        const parentTargets = strategicTargetsById[hasParentId];
        const parentTarget = Object.values(parentTargets).reduce(
          (sum, t) => sum + t,
          0
        );
        if (parentTarget === 0) return null;
        return { available: parentTarget, used: 0, remaining: parentTarget };
      }
      return null;
    }

    const parentTargets = parentKPI.targets || [];
    const parentTarget = parentTargets.reduce((sum, t) => sum + t.target, 0);
    if (parentTarget === 0) return null;

    const siblingKPIs = kpis.filter(
      (k) =>
        k.parent?.kpiId === parentKpiId &&
        k.kpiId !== currentKpiId &&
        k.kpiId !== undefined
    );

    const usedAllocation = siblingKPIs.reduce((total, siblingKpi) => {
      const siblingTargets = siblingKpi.targets || [];
      return total + siblingTargets.reduce((sum, t) => sum + t.target, 0);
    }, 0);

    const remaining = Math.max(0, parentTarget - usedAllocation);
    return { available: parentTarget, used: usedAllocation, remaining };
  }, [
    kpi,
    parentId,
    objective?.parent,
    getParentKPI,
    strategicTargetsById,
    kpis,
  ]);

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

  // Initialize targets with default timeline
  useEffect(() => {
    if (!isEditing && defaultTimeline && targets[0]?.timeline === "") {
      setTargets([{ timeline: defaultTimeline, target: "" }]);
    }
  }, [isEditing, defaultTimeline, targets]);

  // Auto-populate from parent KPI
  useEffect(() => {
    if (parentId && !isEditing) {
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
        }));

        if (selectedParentKPI.targets && selectedParentKPI.targets.length > 0) {
          if (isQuarterlyMode) {
            const newYearlyQuarters: Record<string, YearlyQuarters> = {};

            selectedParentKPI.targets.forEach((target) => {
              const parts = target.timeline.split("-");
              if (parts.length === 2 && parts[1].startsWith("Q")) {
                const year = parts[0];
                const quarter = parts[1].toLowerCase() as
                  | "q1"
                  | "q2"
                  | "q3"
                  | "q4";

                if (!newYearlyQuarters[year]) {
                  newYearlyQuarters[year] = {
                    q1: "",
                    q2: "",
                    q3: "",
                    q4: "",
                    parentTarget: 0,
                  };
                }
                newYearlyQuarters[year][quarter] = target.target.toString();
              } else {
                const year = target.timeline;
                if (!newYearlyQuarters[year]) {
                  newYearlyQuarters[year] = {
                    q1: "",
                    q2: "",
                    q3: "",
                    q4: "",
                    parentTarget: target.target,
                  };
                } else {
                  newYearlyQuarters[year].parentTarget = target.target;
                }
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
  }, [parentId, parentKPIs, isEditing, isQuarterlyMode]);

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
