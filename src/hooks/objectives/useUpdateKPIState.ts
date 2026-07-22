import { useState, useCallback, useEffect, useMemo } from "react";
import { useApolloClient } from "@apollo/client";
import { useKPI } from "@/hooks/objectives/useKPIs";
import { useKPIMutations } from "@/hooks/objectives/useKPIMutations";
import { kpiLogger } from "@/lib/logger";
import { resolveStrategicTimeline } from "@/components/objectives/YearSelector";
import type {
  Kpi,
  KpiWeightType,
  KpiStatus,
  KpiUnitType,
  UpdateKpiInput,
  KpiTargetInput,
  KpiAggregationMethod,
  KpiAggregationWeightSource,
  KpiCarryPolicy,
  KpiCalculationBasisSource,
} from "@/types/graphql";
import {
  basisQuartersEqualAnnual,
  buildDirectBasisTargets,
  directBasisTargetsToQuarters,
  EMPTY_BASIS_QUARTERS,
  type BasisQuarterValues,
} from "@/utils/basisCalculation";

import { useStrategicPeriodStore } from "@/stores";
import {
  getWeightAllocationForObjective,
  usesAnnualOnlyKpiTargetsForKpi,
} from "@/lib/objectives/kpiWeightScope";

export interface UpdateKPIFormData {
  name: string;
  baseline: string;
  weight: string;
  weightType: KpiWeightType;
  status?: KpiStatus;
  unitType?: KpiUnitType;
  kpiMode?: string;
  managerRetentionPercent?: string;
  aggregationMethod: KpiAggregationMethod;
  weightingBasisKpiId: string;
  aggregationWeightSource: KpiAggregationWeightSource;
  carryPolicy: KpiCarryPolicy;
  calculationBasisSource: KpiCalculationBasisSource;
  directBasisValue: string;
  numeratorLabel: string;
  denominatorLabel: string;
  basisUnitType: KpiUnitType;
}

interface UseUpdateKPIStateProps {
  kpiId: string;
  onSuccess?: () => void;
  existingKPIs?: Kpi[];
  /** Full objective from detail page — supplies strategic period dates when KPI query is sparse */
  objectiveOverride?: {
    strategicPeriod?: { startDate?: string; endDate?: string } | null;
    type?: string | null;
    assigneeType?: string | null;
    assigneeId?: string | null;
    parentId?: string | null;
  };
}

export function useUpdateKPIState({
  kpiId,
  onSuccess,
  existingKPIs = [],
  objectiveOverride,
}: UseUpdateKPIStateProps) {
  const { kpi, loading, error, refetch } = useKPI({ kpiId });
  const { updateKpi } = useKPIMutations();
  const client = useApolloClient();
  const selectedPeriod = useStrategicPeriodStore(
    (state) => state.selectedPeriod,
  );
  const annualTimeline = useStrategicPeriodStore(
    (state) => state.annualTimeline,
  );

  // Fetch parent KPI if it exists
  const { kpi: parentKpi } = useKPI(
    kpi?.parent?.kpiId ? { kpiId: kpi.parent.kpiId } : { kpiId: "" },
  );

  const isCorporate = usesAnnualOnlyKpiTargetsForKpi(kpi);

  // Form state
  const [formData, setFormData] = useState<UpdateKPIFormData>({
    name: "",
    baseline: "",
    weight: "",
    weightType: "PERCENT" as KpiWeightType,
    unitType: "NUMBER" as KpiUnitType,
    kpiMode: "AGGREGATED",
    managerRetentionPercent: "30",
    aggregationMethod: "SUM",
    weightingBasisKpiId: "",
    aggregationWeightSource: "PLANNED_TARGET",
    carryPolicy: "ADDITIVE",
    calculationBasisSource: "NONE",
    directBasisValue: "",
    numeratorLabel: "",
    denominatorLabel: "",
    basisUnitType: "NUMBER",
  });

  // Annual target state (single value for strategic period)
  const [annualTarget, setAnnualTarget] = useState<string>("0");

  // Strategic period timeline (single year from objective's strategic period)
  const strategicTimeline = useMemo(() => {
    const rawPeriod =
      objectiveOverride?.strategicPeriod ||
      kpi?.objective?.strategicPeriod ||
      selectedPeriod;

    const period =
      rawPeriod?.startDate && rawPeriod?.endDate
        ? { startDate: rawPeriod.startDate, endDate: rawPeriod.endDate }
        : null;

    return resolveStrategicTimeline(period, kpi?.targets, annualTimeline);
  }, [
    kpi?.objective?.strategicPeriod,
    kpi?.targets,
    selectedPeriod,
    annualTimeline,
    objectiveOverride?.strategicPeriod,
  ]);

  // Yearly quarters state for non-corporate breakdown
  const [yearlyQuarters, setYearlyQuarters] = useState<
    Record<string, { q1: string; q2: string; q3: string; q4: string }>
  >({});
  const [basisQuarters, setBasisQuarters] = useState<BasisQuarterValues>({
    ...EMPTY_BASIS_QUARTERS,
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track if we've already auto-populated from parent to avoid overwriting user edits
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);

  // Load KPI data on mount or when kpiId changes
  useEffect(() => {
    if (kpi) {
      const { name, baseline, weight, status, unitType, targets } = kpi;

      // Initialize form data from current KPI
      setFormData((prev) => ({
        ...prev,
        name: name || "",
        baseline:
          baseline !== null && baseline !== undefined
            ? baseline.toString()
            : "",
        weight: weight?.toString() || "0",
        weightType: prev.weightType || ("PERCENT" as KpiWeightType),
        status,
        unitType: unitType || ("NUMBER" as KpiUnitType),
        kpiMode: (kpi as any).kpiMode || "AGGREGATED",
        managerRetentionPercent:
          (kpi as any).managerRetentionPercent?.toString() || "30",
        aggregationMethod: kpi.aggregationMethod || "SUM",
        weightingBasisKpiId: kpi.weightingBasisKpiId || "",
        aggregationWeightSource:
          kpi.aggregationWeightSource || "PLANNED_TARGET",
        carryPolicy: kpi.carryPolicy || "ADDITIVE",
        calculationBasisSource: kpi.calculationBasisSource || "NONE",
        directBasisValue: kpi.directBasisValue || "",
        numeratorLabel: kpi.numeratorLabel || "",
        denominatorLabel: kpi.denominatorLabel || "",
        basisUnitType: kpi.basisUnitType || "NUMBER",
      }));
      setBasisQuarters(directBasisTargetsToQuarters(kpi.directBasisTargets));

      // Initialize annual target from existing targets
      if (targets && targets.length > 0 && strategicTimeline) {
        // PRIORITY 1: Use KPI's own assignedTargetValue if available (respects cascading)
        if (kpi.assignedTargetValue && kpi.assignedTargetValue > 0) {
          setAnnualTarget(kpi.assignedTargetValue.toString());
        } else {
          // PRIORITY 2: Try to find an annual target (non-quarterly) for the strategic period
          // Handle both exact match and prefix match (e.g. "2025" matching "2025/26")
          const annualTargetEntry = targets.find((t) => {
            const tLine = t.timeline;
            const sLine = strategicTimeline;
            const tPrefix = tLine.split("/")[0];
            const sPrefix = sLine.split("/")[0];

            return (
              !tLine.includes("-Q") &&
              (tLine === sLine ||
                tPrefix === sPrefix ||
                tLine.startsWith(sLine) ||
                sLine.startsWith(tLine))
            );
          });

          if (annualTargetEntry) {
            setAnnualTarget(annualTargetEntry.target.toString());
          } else {
            // If no annual target found, sum up quarterly targets for the strategic period
            const yearPrefix = strategicTimeline.split("/")[0];
            const quarterlyTargets = targets.filter(
              (t) =>
                (t.timeline.startsWith(yearPrefix) ||
                  t.timeline.startsWith(strategicTimeline)) &&
                t.timeline.includes("-Q"),
            );

            if (quarterlyTargets.length > 0) {
              const sum = quarterlyTargets.reduce(
                (acc, t) => acc + t.target,
                0,
              );
              const derived =
                kpi.unitType === "PERCENT" || kpi.unitType === "RATIO"
                  ? sum / quarterlyTargets.length
                  : sum;
              setAnnualTarget(derived.toString());
            } else {
              // Fallback: use first target value if it matches strategic period year prefix
              const firstTarget = targets.find((t) =>
                t.timeline.startsWith(yearPrefix),
              );
              if (firstTarget) {
                setAnnualTarget(firstTarget.target.toString());
              }
            }
          }
        }

        // Initialize yearlyQuarters from targets
        const newYearlyQuarters: Record<
          string,
          { q1: string; q2: string; q3: string; q4: string }
        > = {};

        // Pre-initialize with 0s for the strategic year to ensure fields are controlled
        // CRITICAL FIX: Always use strategicTimeline as the key to prevent duplicates like "2025" vs "2025/26"
        newYearlyQuarters[strategicTimeline] = {
          q1: "0",
          q2: "0",
          q3: "0",
          q4: "0",
        };

        const strategicYearPrefix = strategicTimeline.split("/")[0];

        targets.forEach((t) => {
          if (t.timeline.includes("-Q")) {
            const parts = t.timeline.split("-");
            if (parts.length === 2) {
              const [year, quarter] = parts;
              const cleanYear = year.trim();

              // Normalize: if the year matches the strategic prefix or full timeline, use strategicTimeline key
              const isMatch =
                cleanYear === strategicYearPrefix ||
                cleanYear === strategicTimeline;
              const targetKey = isMatch ? strategicTimeline : cleanYear;

              if (!newYearlyQuarters[targetKey]) {
                newYearlyQuarters[targetKey] = {
                  q1: "0",
                  q2: "0",
                  q3: "0",
                  q4: "0",
                };
              }

              const qKey = quarter.toLowerCase() as "q1" | "q2" | "q3" | "q4";
              if (["q1", "q2", "q3", "q4"].includes(qKey)) {
                newYearlyQuarters[targetKey][qKey] = t.target.toString();
              }
            }
          }
        });
        setYearlyQuarters(newYearlyQuarters);
      } else if (strategicTimeline) {
        // If no targets exist yet, initialize the strategic year with 0s
        setYearlyQuarters({
          [strategicTimeline]: { q1: "0", q2: "0", q3: "0", q4: "0" },
        });
      }

      // Reset auto-population flag when KPI changes
      setHasAutoPopulated(false);
    }
  }, [kpi, strategicTimeline]);

  // Ensure yearlyQuarters is initialized for the strategic period
  useEffect(() => {
    if (strategicTimeline && !isCorporate) {
      setYearlyQuarters((prev) => {
        if (!prev[strategicTimeline]) {
          return {
            ...prev,
            [strategicTimeline]: { q1: "0", q2: "0", q3: "0", q4: "0" },
          };
        }
        return prev;
      });
    }
  }, [strategicTimeline, isCorporate]);

  // Weight allocation scoped to this objective only (not parent/sibling corporate KPIs)
  const weightAllocation = useMemo(() => {
    const objectiveIdForScope =
      kpi?.objective?.objectiveId || existingKPIs[0]?.objective?.objectiveId;

    if (!objectiveIdForScope) {
      return { used: 0, remaining: 100, total: 0, isOver: false };
    }

    const kpisPool: Kpi[] =
      existingKPIs.length > 0
        ? existingKPIs
        : ((kpi?.objective?.kpis || []).map((item) => ({
            ...item,
            objective: { objectiveId: objectiveIdForScope },
          })) as unknown as Kpi[]);

    const currentWeight = parseFloat(formData.weight) || 0;
    return getWeightAllocationForObjective(
      objectiveIdForScope,
      kpisPool,
      currentWeight,
      kpiId,
    );
  }, [kpi, kpiId, formData.weight, existingKPIs]);

  // Auto-populate from parent KPI for non-corporate levels
  useEffect(() => {
    if (kpi && parentKpi && !hasAutoPopulated) {
      // Auto-populate from parent KPI for all non-corporate levels
      if (!isCorporate && kpi.parent?.kpiId) {
        kpiLogger.debug("Auto-populating from parent KPI:", parentKpi.name);

        // Auto-populate name only when the KPI has no saved name yet
        const savedName = (kpi.name || "").trim();
        if (!savedName && parentKpi.name) {
          updateField("name", parentKpi.name);
        }

        // Auto-populate baseline if empty
        if (!formData.baseline && parentKpi.baseline) {
          updateField("baseline", parentKpi.baseline.toString());
        }

        // Auto-populate weight if empty
        if (!formData.weight && parentKpi.weight) {
          updateField("weight", parentKpi.weight.toString());
        }

        // Auto-populate weightType and unitType if empty
        setFormData((prev) => ({
          ...prev,
          weightType:
            prev.weightType ||
            ((parentKpi.unitType || "PERCENT") as KpiWeightType),
          unitType:
            prev.unitType || parentKpi.unitType || ("NUMBER" as KpiUnitType),
        }));

        // Auto-populate annual target from parent if current KPI has no target
        if (strategicTimeline) {
          // Check if we already have any targets (annual or quarterly) for this KPI in the current strategic timeline
          const hasExistingTarget = kpi.targets?.some((t) => {
            const tLine = t.timeline;
            const sLine = strategicTimeline;
            const tPrefix = tLine.split("/")[0].split("-")[0];
            const sPrefix = sLine.split("/")[0].split("-")[0];

            return (
              tPrefix === sPrefix ||
              tLine.startsWith(sLine) ||
              sLine.startsWith(tLine)
            );
          });

          if (!hasExistingTarget) {
            // PRIORITY 1: Use the current KPI's own assignedTargetValue
            // This is the value assigned to THIS KPI during cascading
            if (kpi.assignedTargetValue && kpi.assignedTargetValue > 0) {
              const assignedValue = kpi.assignedTargetValue;
              setAnnualTarget(assignedValue.toString());

              // Initialize quarterly breakdown by distributing the assigned target
              const quarterlyValue =
                kpi.unitType === "PERCENT" || kpi.unitType === "RATIO"
                  ? assignedValue
                  : (assignedValue / 4).toFixed(2);

              setYearlyQuarters((prev) => ({
                ...prev,
                [strategicTimeline]: {
                  q1: quarterlyValue.toString(),
                  q2: quarterlyValue.toString(),
                  q3: quarterlyValue.toString(),
                  q4: quarterlyValue.toString(),
                },
              }));
            } else if (parentKpi.targets?.length > 0) {
              // PRIORITY 2: Fall back to parent's targets only if no assignedTargetValue
              // Try to get the parent's annual target for the strategic period
              const parentAnnualTarget = parentKpi.targets.find((t) => {
                const tLine = t.timeline;
                const sLine = strategicTimeline;
                const tPrefix = tLine.split("/")[0];
                const sPrefix = sLine.split("/")[0];

                return (
                  !tLine.includes("-Q") &&
                  (tLine === sLine ||
                    tPrefix === sPrefix ||
                    tLine.startsWith(sLine) ||
                    sLine.startsWith(tLine))
                );
              });

              if (parentAnnualTarget) {
                // Use the parent's annual target
                setAnnualTarget(parentAnnualTarget.target.toString());

                // Initialize quarterly breakdown by distributing the annual target
                const quarterlyValue =
                  parentKpi.unitType === "PERCENT" ||
                  parentKpi.unitType === "RATIO"
                    ? parentAnnualTarget.target
                    : (parentAnnualTarget.target / 4).toFixed(2);

                setYearlyQuarters((prev) => ({
                  ...prev,
                  [strategicTimeline]: {
                    q1: quarterlyValue.toString(),
                    q2: quarterlyValue.toString(),
                    q3: quarterlyValue.toString(),
                    q4: quarterlyValue.toString(),
                  },
                }));
              } else {
                // If no annual target, try to get quarterly targets
                const parentQuarterlyTargets = parentKpi.targets.filter(
                  (t) =>
                    t.timeline.startsWith(strategicTimeline.split("/")[0]) &&
                    t.timeline.includes("-Q"),
                );

                if (parentQuarterlyTargets.length > 0) {
                  // Calculate the average for PERCENT/RATIO or sum for NUMBER/CURRENCY/COUNT
                  const isPercent =
                    parentKpi.unitType === "PERCENT" ||
                    parentKpi.unitType === "RATIO";
                  const total = parentQuarterlyTargets.reduce(
                    (sum, t) => sum + t.target,
                    0,
                  );
                  const derivedAnnual = isPercent
                    ? total / parentQuarterlyTargets.length
                    : total;

                  setAnnualTarget(derivedAnnual.toString());

                  // Populate quarterly breakdown from parent's quarters (keyed by strategicTimeline)
                  const strategicYearPrefix = strategicTimeline.split("/")[0];
                  const newQuarters: Record<
                    string,
                    { q1: string; q2: string; q3: string; q4: string }
                  > = {
                    [strategicTimeline]: { q1: "0", q2: "0", q3: "0", q4: "0" },
                  };

                  parentQuarterlyTargets.forEach((t) => {
                    const [year, quarter] = t.timeline.split("-");
                    if (year && quarter) {
                      const cleanYear = year.trim();
                      const isMatch =
                        cleanYear === strategicYearPrefix ||
                        cleanYear === strategicTimeline;
                      const targetKey = isMatch ? strategicTimeline : cleanYear;
                      const qKey = quarter.toLowerCase() as
                        | "q1"
                        | "q2"
                        | "q3"
                        | "q4";
                      if (!newQuarters[targetKey]) {
                        newQuarters[targetKey] = {
                          q1: "0",
                          q2: "0",
                          q3: "0",
                          q4: "0",
                        };
                      }
                      if (["q1", "q2", "q3", "q4"].includes(qKey)) {
                        newQuarters[targetKey][qKey] = t.target.toString();
                      }
                    }
                  });

                  setYearlyQuarters(newQuarters);
                }
              }
            }
          }
        }

        setHasAutoPopulated(true);
      }
    }
  }, [
    kpi,
    parentKpi,
    hasAutoPopulated,
    strategicTimeline,
    isCorporate,
    yearlyQuarters,
  ]);

  // Update form field
  const updateField = useCallback(
    (
      field: keyof UpdateKPIFormData,
      value: UpdateKPIFormData[keyof UpdateKPIFormData],
    ) => {
      if (kpi?.status === "APPROVED" && !isCorporate) return;

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [kpi?.status, isCorporate],
  );

  const assignedAnnualTarget = useMemo(() => {
    if (!strategicTimeline) return null;

    // 1. PRIMARY: Use the current KPI's own assignedTargetValue
    // This is the value specifically assigned to THIS KPI during cascading (e.g., 168M for division)
    // NOT the parent's assignedTargetValue (which is what was assigned to the parent, e.g., 264M)
    if (kpi?.assignedTargetValue && kpi.assignedTargetValue > 0) {
      console.log(
        "🎯 Using KPI own assignedTargetValue:",
        kpi.assignedTargetValue,
      );
      return kpi.assignedTargetValue;
    }

    // 2. SECONDARY: If KPI is cascaded from a parent, try the parent's targets as a fallback
    // Only use this when the current KPI has NO assignedTargetValue of its own
    if (parentKpi && kpi?.parent?.kpiId) {
      // Fallback to parent's targets array
      if (parentKpi.targets?.length) {
        const parentAnnual = parentKpi.targets.find((t) => {
          const tLine = t.timeline;
          const sLine = strategicTimeline;
          const tPrefix = tLine.split("/")[0].split("-")[0];
          const sPrefix = sLine.split("/")[0].split("-")[0];

          return (
            !tLine.includes("-Q") &&
            (tLine === sLine ||
              tPrefix === sPrefix ||
              tLine.startsWith(sLine) ||
              sLine.startsWith(tLine))
          );
        });

        if (parentAnnual) {
          console.log(
            "🎯 Fallback: Using parent annual target from targets array:",
            parentAnnual.target,
          );
          return parentAnnual.target;
        }

        // For non-corporate parents (like Division parents of Department KPIs),
        // they might only have quarterly targets
        const parentQuarterlies = parentKpi.targets.filter((t) => {
          const tLine = t.timeline.toUpperCase();
          const sPrefix = strategicTimeline.split("/")[0].split("-")[0];

          return tLine.includes("-Q") && tLine.startsWith(sPrefix);
        });

        if (parentQuarterlies.length > 0) {
          const sum = parentQuarterlies.reduce((acc, t) => acc + t.target, 0);
          const result =
            parentKpi.unitType === "PERCENT"
              ? sum / parentQuarterlies.length
              : sum;
          console.log("🎯 Fallback: Using parent quarterly sum/avg:", result);
          return result;
        }
      }
    }

    // 3. TERTIARY: Use the KPI's own annual target from the targets array (for standalone KPIs)
    if (kpi?.targets?.length) {
      const annualTargetEntry = kpi.targets.find((t) => {
        const tLine = t.timeline;
        const sLine = strategicTimeline;
        const tPrefix = tLine.split("/")[0].split("-")[0];
        const sPrefix = sLine.split("/")[0].split("-")[0];

        return (
          !tLine.includes("-Q") &&
          (tLine === sLine ||
            tPrefix === sPrefix ||
            tLine.startsWith(sLine) ||
            sLine.startsWith(tLine)) &&
          t.target > 0
        );
      });
      if (annualTargetEntry) {
        console.log(
          "🎯 Using KPI own annual target from targets array:",
          annualTargetEntry.target,
        );
        return annualTargetEntry.target;
      }
    }

    console.log("🎯 No assigned target found, returning null");
    return null;
  }, [kpi, parentKpi, strategicTimeline, annualTarget]);

  // Handle form submission
  const handleSubmit = useCallback(async (afterKpiUpdate?: () => Promise<void>) => {
    if (kpi?.status === "APPROVED" && !isCorporate) return;

    if (!kpi) {
      // toast.error("KPI not found");
      return;
    }

    if (!isCorporate) {
      const quarterSet = yearlyQuarters[strategicTimeline];
      if (!quarterSet) {
        throw new Error("Quarterly breakdown is required");
      }
      const values = [
        quarterSet.q1,
        quarterSet.q2,
        quarterSet.q3,
        quarterSet.q4,
      ].map(Number);
      if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
        throw new Error("Every quarter must have a value greater than zero");
      }
      const annualValue =
        kpi.assignedTargetValue && kpi.assignedTargetValue > 0
          ? kpi.assignedTargetValue
          : assignedAnnualTarget && assignedAnnualTarget > 0
            ? assignedAnnualTarget
            : Number(annualTarget);
      const total = values.reduce((sum, value) => sum + value, 0);
      const averageBased =
        formData.unitType === "PERCENT" || formData.unitType === "RATIO";
      const plannedAnnual = averageBased ? total / 4 : total;
      const rateTargetsRepeat = averageBased
        ? values.every((value) => Math.abs(value - annualValue) <= 0.01)
        : true;
      const isFormulaKpi =
        kpi.calculationType === "RATIO_FORMULA" ||
        kpi.calculationType === "WEIGHTED_INDEX";
      if (
        !Number.isFinite(annualValue) ||
        annualValue <= 0 ||
        (!isFormulaKpi &&
          (averageBased
            ? !rateTargetsRepeat
            : Math.abs(plannedAnnual - annualValue) > 0.01))
      ) {
        throw new Error(
          averageBased
            ? "Every quarterly ratio/percentage target must equal the annual target"
            : "Quarterly sum must match the annual target",
        );
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare targets for submission
      const targets: KpiTargetInput[] = [];

      if (isCorporate) {
        // Corporate: Submit annual target
        if (strategicTimeline && annualTarget) {
          const targetValue = parseFloat(annualTarget) || 0;
          if (targetValue > 0) {
            targets.push({
              timeline: strategicTimeline,
              target: targetValue,
            });
          }
        }
      } else {
        // Non-Corporate: Submit quarterly breakdown.
        // DO NOT add an explicit annual target record if quarterly ones exist for the strategic period,
        // as this leads to double-counting in some parts of the system.

        Object.entries(yearlyQuarters).forEach(([year, quarters]) => {
          Object.entries(quarters).forEach(([quarter, value]) => {
            const val = parseFloat(value) || 0;
            // Always push even if 0 to ensure records are overwritten if cleared
            const qKey = quarter.toUpperCase();
            targets.push({
              timeline: `${year}-${qKey}`,
              target: val,
            });
          });
        });

        // Optional: If there are other years without quarterly breakdown but with annual targets,
        // they can be handled here, but for now we focus on the strategic period.
      }

      // Calculate targetValue from targets or annual target
      // CRITICAL: For cascaded KPIs (non-corporate with parent), preserve the original
      // assignedTargetValue as the targetValue. The backend's assignedTargetValue resolver
      // falls through to kpi.targetValue for DIVISION/DEPARTMENT/PERSONNEL KPIs, so overwriting
      // it with a quarterly value (e.g., 24) would corrupt the assigned target (e.g., 96).
      let calculatedTargetValue: number;
      if (isCorporate) {
        calculatedTargetValue = parseFloat(annualTarget) || 0;
      } else if (
        kpi.calculationType === "RATIO_FORMULA" ||
        kpi.calculationType === "WEIGHTED_INDEX"
      ) {
        // Formula results are not additive allocations; each child unit plans
        // its own result and reconciles it from exact source components.
        calculatedTargetValue = Number(annualTarget);
      } else if (kpi.assignedTargetValue && kpi.assignedTargetValue > 0) {
        // Preserve the original assigned target value — quarterly breakdown is in the targets array
        calculatedTargetValue = kpi.assignedTargetValue;
      } else if (assignedAnnualTarget && assignedAnnualTarget > 0) {
        // Preserve any resolved assigned target from parent/cascading
        calculatedTargetValue = assignedAnnualTarget;
      } else {
        const total = targets.reduce((sum, target) => sum + target.target, 0);
        const averageBased =
          formData.unitType === "PERCENT" || formData.unitType === "RATIO";
        calculatedTargetValue =
          targets.length > 0
            ? averageBased
              ? total / targets.length
              : total
            : 0;
      }

      const basisSource =
        formData.unitType === "PERCENT" || formData.unitType === "RATIO"
          ? formData.calculationBasisSource
          : "NONE";
      if (basisSource !== "NONE" && (!formData.numeratorLabel.trim() || !formData.denominatorLabel.trim())) {
        throw new Error("Numerator and denominator labels are required");
      }
      if (basisSource === "DIRECT_VALUE") {
        const annualBasis = Number(formData.directBasisValue);
        if (!Number.isFinite(annualBasis) || annualBasis <= 0) {
          throw new Error("Annual direct basis must be greater than zero");
        }
        if (!isCorporate && !basisQuartersEqualAnnual(formData.directBasisValue, basisQuarters)) {
          throw new Error("Q1–Q4 basis values must sum exactly to the annual basis");
        }
      }
      if (
        formData.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE" &&
        basisSource !== "DIRECT_VALUE" &&
        !formData.weightingBasisKpiId
      ) {
        throw new Error(
          "Select a weighting-basis KPI for denominator-weighted aggregation",
        );
      }

      // Create the update input with only the fields that are allowed by UpdateKpiInput
      const updateInput: UpdateKpiInput = {
        kpiId: kpi.kpiId,
        name: formData.name,
        baseline:
          formData.baseline !== "" ? parseFloat(formData.baseline) : undefined,
        weight: parseFloat(formData.weight) || 0,
        targetValue: calculatedTargetValue, // Add targetValue
        kpiMode: formData.kpiMode || "AGGREGATED",
        managerRetentionPercent:
          formData.kpiMode === "HYBRID" && formData.managerRetentionPercent
            ? parseFloat(formData.managerRetentionPercent)
            : undefined,
        aggregationMethod: formData.aggregationMethod || "SUM",
        weightingBasisKpiId:
          formData.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE" &&
          basisSource !== "DIRECT_VALUE"
            ? formData.weightingBasisKpiId || null
            : null,
        aggregationWeightSource: formData.aggregationWeightSource || "PLANNED_TARGET",
        carryPolicy:
          formData.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE"
            ? "NONE"
            : (formData.carryPolicy || "ADDITIVE"),
        calculationBasisSource: basisSource,
        directBasisValue:
          basisSource === "DIRECT_VALUE" ? formData.directBasisValue : null,
        directBasisTargets:
          basisSource === "DIRECT_VALUE" && !isCorporate
            ? buildDirectBasisTargets(strategicTimeline, basisQuarters)
            : [],
        numeratorLabel:
          basisSource !== "NONE" ? formData.numeratorLabel.trim() : null,
        denominatorLabel:
          basisSource !== "NONE" ? formData.denominatorLabel.trim() : null,
        basisUnitType:
          basisSource === "DIRECT_VALUE" ? formData.basisUnitType : null,
        // Workflow status is controlled by submission approval.
        ...(formData.unitType && { unitType: formData.unitType }),
        // Only include targets if we have any
        ...(targets.length > 0 && { targets }),
      };

      console.log("🎯 Updating KPI with input:", {
        kpiId: updateInput.kpiId,
        name: updateInput.name,
        targetValue: updateInput.targetValue,
        baseline: updateInput.baseline,
        weight: updateInput.weight,
        targetsCount: targets.length,
      });

      // The KPI update transaction creates/synchronizes quarter plans first.
      await updateKpi({ input: updateInput });
      await afterKpiUpdate?.();

      // Refresh any relevant queries
      await client.refetchQueries({
        include: ["GetKPI", "GetKPIs"],
      });

      onSuccess?.();
    } catch (error) {
      kpiLogger.error("Error updating KPI:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    kpi,
    updateKpi,
    client,
    onSuccess,
    strategicTimeline,
    annualTarget,
    assignedAnnualTarget,
    yearlyQuarters,
    isCorporate,
    basisQuarters,
  ]);

  // Handle annual target change
  const handleAnnualTargetChange = useCallback((value: string) => {
    setAnnualTarget(value);
    if (
      strategicTimeline &&
      !isCorporate &&
      (formData.unitType === "PERCENT" || formData.unitType === "RATIO")
    ) {
      setYearlyQuarters((prev) => ({
        ...prev,
        [strategicTimeline]: { q1: value, q2: value, q3: value, q4: value },
      }));
    }
  }, [strategicTimeline, isCorporate, formData.unitType]);

  return {
    // State
    formData,
    loading,
    error,
    isSubmitting,
    kpi,
    parentKpi,
    annualTarget,
    assignedAnnualTarget,
    strategicTimeline,
    yearlyQuarters,
    basisQuarters,
    weightAllocation,
    setYearlyQuarters,
    setBasisQuarters, // Export setter for QuarterlyBreakdown

    // Actions
    updateField,
    handleSubmit,
    handleAnnualTargetChange,
  };
}
