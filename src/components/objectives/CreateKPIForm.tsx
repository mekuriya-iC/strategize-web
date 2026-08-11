"use client";

import React, { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateKPIForm,
  type CreateKPIFormData,
} from "@/hooks/objectives/useCreateKPIForm";
import {
  KPIFormHeader,
  KPIInformationCard,
  QuarterlyBreakdown,
} from "./kpi-form";
import { KpiModeSelector } from "./KpiModeSelector";
import { KpiAggregationSelector } from "./KpiAggregationSelector";
import { BasisCalculationCard } from "./BasisCalculationCard";
import { buildYearRanges } from "@/components/objectives/YearSelector";
import type {
  KpiCalculationBasisSource,
  Objective,
  Kpi,
} from "@/types/graphql";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import {
  getKpisForObjectiveWeight,
  sumKpiWeights,
  usesAnnualOnlyKpiTargets,
} from "@/lib/objectives/kpiWeightScope";
import { basisQuartersEqualAnnual } from "@/utils/basisCalculation";
import { isAggregationMethodAllowed } from "@/lib/objectives/kpiAggregationOptions";

interface CreateKPIFormProps {
  objectiveId: string;
  onSuccess?: () => void;
  onCancel: () => void;
  objective: Objective;
  existingKPIs?: Kpi[]; // Optional - for weight calculation
}

export default function CreateKPIForm({
  objectiveId,
  onSuccess,
  onCancel,
  objective,
  existingKPIs = [],
}: CreateKPIFormProps) {
  const {
    formData,
    annualTargets,
    setAnnualTargets,
    yearlyQuarters,
    setYearlyQuarters,
    basisQuarters,
    setBasisQuarters,
    isSubmitting,
    updateField,
    selectedSupportSourceIds,
    setSelectedSupportSourceIds,
    handleSubmit,
  } = useCreateKPIForm({
    objectiveId,
    onSuccess: useCallback(() => {
      toast.success("KPI Created Successfully");
      onSuccess?.();
    }, [onSuccess]),
    isCorporate: usesAnnualOnlyKpiTargets(objective),
    isSupport: objective.cascadeType === "SUPPORT",
    supportSourceIds: (objective.supportSources ?? []).map(
      (source) => source.sourceCorporateKpi.kpiId,
    ),
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSubmit();
    } catch (error) {
      toast.error("Failed to create KPI", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  const compatibleFormData = {
    name: formData.name,
    baseline: formData.baseline,
    weight: formData.weight,
    weightType: formData.weightType,
    unitType: formData.unitType,
    quarterlyAggregationMethod: formData.quarterlyAggregationMethod,
  };

  const handleInputChange = (field: string, value: string) => {
    updateField(field as keyof CreateKPIFormData, value);
    if (field === "unitType") {
      updateField(
        "quarterlyAggregationMethod",
        value === "PERCENT" || value === "RATIO" ? "AVERAGE" : "SUM",
      );
    }
  };

  // Calculate available years from strategic period
  const availableYears = useMemo(() => {
    if (!objective.strategicPeriod) return [];
    return buildYearRanges(objective.strategicPeriod);
  }, [objective.strategicPeriod]);

  const isCorporate = usesAnnualOnlyKpiTargets(objective);
  const isSupport = objective.cascadeType === "SUPPORT";
  const supportSources = objective.supportSources ?? [];
  const effectiveObjectiveType = objective?.assigneeType || objective?.type;

  const strategicYear = availableYears[0];

  const unitLabel = useMemo(() => {
    switch (formData.unitType) {
      case "PERCENT":
        return "%";
      case "CURRENCY":
        return "ETB";
      case "HOUR":
        return "hrs";
      case "RATIO":
        return "ratio";
      case "COUNT":
        return "count";
      case "NUMBER":
      default:
        return "number";
    }
  }, [formData.unitType]);

  const hasAnnualTarget = useMemo(() => {
    if (!strategicYear) return false;
    return (parseFloat(annualTargets[strategicYear] || "0") || 0) > 0;
  }, [annualTargets, strategicYear]);

  // Validation for Quarterly Data (Required for Non-Corporate)
  // Corporate: Only needs annual target for strategic period
  // Non-Corporate: Requires quarterly breakdown for strategic period
  const hasQuarterlyData = useMemo(() => {
    if (isCorporate) return true;

    // Non-Corporate: Require quarterly breakdown for strategic period
    if (!strategicYear) return false;

    const q = yearlyQuarters[strategicYear];
    if (!q) return false;

    const q1 = parseFloat(q.q1) || 0;
    const q2 = parseFloat(q.q2) || 0;
    const q3 = parseFloat(q.q3) || 0;
    const q4 = parseFloat(q.q4) || 0;
    const values = [q1, q2, q3, q4];
    if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
      return false;
    }
    const sum = q1 + q2 + q3 + q4;

    const annual = parseFloat(annualTargets[strategicYear] || "0") || 0;
    if (annual <= 0) return false;

    const TOLERANCE = 0.01;
    const plannedAnnual =
      formData.quarterlyAggregationMethod === "AVERAGE"
        ? sum / values.length
        : sum;
    return Math.abs(plannedAnnual - annual) <= TOLERANCE;
  }, [
    isCorporate,
    strategicYear,
    yearlyQuarters,
    annualTargets,
    formData.quarterlyAggregationMethod,
  ]);

  // 100% weight budget applies to KPIs on this objective only
  const { existingWeight } = useMemo(() => {
    const scoped = getKpisForObjectiveWeight(
      objectiveId,
      existingKPIs.length > 0 ? existingKPIs : (objective.kpis as Kpi[]) || [],
    );
    const total = sumKpiWeights(scoped);
    return {
      existingWeight: total,
      remainingWeight: Math.max(0, 100 - total),
    };
  }, [existingKPIs, objectiveId, objective.kpis]);

  const hasValidBasicFields = useMemo(() => {
    if (!formData.name.trim()) return false;

    // Baseline is now optional. If empty, it's valid (will be saved as 0 or null depending on backend)
    // If provided, it must be a valid number.
    if (formData.baseline.trim() !== "" && isNaN(Number(formData.baseline)))
      return false;

    if (formData.weight.trim() === "") return false;
    if (isNaN(Number(formData.weight))) return false;

    return true;
  }, [formData.name, formData.baseline, formData.weight]);

  const hasValidBasis = useMemo(() => {
    if (formData.unitType !== "PERCENT" && formData.unitType !== "RATIO") {
      return true;
    }
    if (formData.calculationBasisSource === "NONE") return true;
    if (!formData.numeratorLabel.trim() || !formData.denominatorLabel.trim()) {
      return false;
    }
    if (formData.calculationBasisSource === "LINKED_KPI") {
      return !!formData.weightingBasisKpiId;
    }
    if (formData.actualBasisSource === "LINKED_KPI_ACTUAL") return false;
    const annualBasis = Number(formData.directBasisValue);
    return (
      Number.isFinite(annualBasis) &&
      annualBasis > 0 &&
      (isCorporate ||
        basisQuartersEqualAnnual(formData.directBasisValue, basisQuarters))
    );
  }, [formData, isCorporate, basisQuarters]);

  const canSubmit = useMemo(() => {
    const totalWeight = existingWeight + (parseFloat(formData.weight) || 0);
    if (isSubmitting) return false;
    if (totalWeight > 100) return false;
    if (!hasValidBasicFields || !hasValidBasis) return false;
    if (!strategicYear) return false;
    if (!hasAnnualTarget) return false;
    if (!isCorporate && !hasQuarterlyData) return false;
    if (isSupport && supportSources.length === 0) return false;
    if (isSupport && selectedSupportSourceIds.length === 0) return false;
    if (
      !isSupport &&
      formData.kpiMode !== "DIRECT" &&
      !isAggregationMethodAllowed({
        method: formData.aggregationMethod,
        unitType: formData.unitType,
        calculationBasisSource: formData.calculationBasisSource,
      })
    ) return false;
    if (
      !isSupport &&
      formData.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE" &&
      formData.calculationBasisSource !== "DIRECT_VALUE" &&
      !formData.weightingBasisKpiId
    ) return false;
    return true;
  }, [
    existingWeight,
    formData.weight,
    isSubmitting,
    hasValidBasicFields,
    hasValidBasis,
    strategicYear,
    hasAnnualTarget,
    isCorporate,
    hasQuarterlyData,
    isSupport,
    supportSources.length,
    selectedSupportSourceIds.length,
    formData.aggregationMethod,
    formData.weightingBasisKpiId,
    formData.calculationBasisSource,
    formData.kpiMode,
    formData.unitType,
  ]);

  const handleBasisSourceChange = (source: KpiCalculationBasisSource) => {
    updateField("calculationBasisSource", source);
    if (
      source !== "LINKED_KPI" &&
      formData.actualBasisSource === "LINKED_KPI_ACTUAL"
    ) {
      updateField("actualBasisSource", "USE_APPROVED_BASIS");
    }
    if (source === "DIRECT_VALUE" || source === "LINKED_KPI") {
      updateField("aggregationMethod", "DENOMINATOR_WEIGHTED_AVERAGE");
      updateField("carryPolicy", "NONE");
    }
    if (source === "DIRECT_VALUE") updateField("weightingBasisKpiId", "");
  };

  const handleAnnualTargetChange = (value: string) => {
    if (!strategicYear) return;
    setAnnualTargets((prev) => ({ ...prev, [strategicYear]: value }));
    if (
      !isCorporate &&
      (formData.unitType === "PERCENT" || formData.unitType === "RATIO")
    ) {
      const numericValue = Number(value);
      const quarterValue =
        formData.quarterlyAggregationMethod === "SUM" &&
        Number.isFinite(numericValue)
          ? String(numericValue / 4)
          : value;
      setYearlyQuarters((prev) => ({
        ...prev,
        [strategicYear]: {
          q1: quarterValue,
          q2: quarterValue,
          q3: quarterValue,
          q4: quarterValue,
        },
      }));
    }
  };

  // Sync yearlyQuarters with strategic period year only (not all years)
  React.useEffect(() => {
    if (!isCorporate && strategicYear) {
      setYearlyQuarters((prev) => {
        if (!prev[strategicYear]) {
          return {
            ...prev,
            [strategicYear]: { q1: "0", q2: "0", q3: "0", q4: "0" },
          };
        }
        return prev;
      });
    }
  }, [strategicYear, isCorporate, setYearlyQuarters]);

  return (
    <div className="space-y-6">
      <KPIFormHeader isEditing={false} onCancel={onCancel} />

      <form onSubmit={handleFormSubmit}>
        <div className="space-y-6">
          {isSupport && (
            <section className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
              <h3 className="font-semibold text-amber-950">
                Corporate KPI support source <span className="text-red-600">*</span>
              </h3>
              <p className="mt-1 text-sm text-amber-900">
                Select the Corporate KPI this local KPI will help deliver. Source
                targets and weights are shown for context only and are not allocated
                to this objective.
              </p>

              {supportSources.length === 0 ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  No Corporate KPI support sources are configured for this objective.
                  KPI creation is unavailable until a source is assigned.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {supportSources.map((source) => {
                    const sourceKpi = source.sourceCorporateKpi;
                    const checked = selectedSupportSourceIds.includes(sourceKpi.kpiId);
                    return (
                      <label
                        key={source.objectiveSupportSourceId}
                        className="flex cursor-pointer gap-3 rounded-md border border-amber-200 bg-white p-3"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={supportSources.length === 1}
                          onChange={(event) =>
                            setSelectedSupportSourceIds((current) =>
                              event.target.checked
                                ? [...new Set([...current, sourceKpi.kpiId])]
                                : current.filter((id) => id !== sourceKpi.kpiId),
                            )
                          }
                          className="mt-1 h-4 w-4 accent-amber-700"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-900">
                            {sourceKpi.name}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-600">
                            <span>Source target: {sourceKpi.targetValue ?? "—"}</span>
                            <span>Source weight: {sourceKpi.weight ?? "—"}%</span>
                          </span>
                          {source.instruction && (
                            <span className="mt-2 block text-sm text-slate-700">
                              <strong>Instruction:</strong> {source.instruction}
                            </span>
                          )}
                          {source.expectedImpact && (
                            <span className="mt-1 block text-sm text-slate-700">
                              <strong>Expected impact:</strong> {source.expectedImpact}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <p className="mt-4 text-xs text-amber-800">
                The local KPI below remains independent: set its own target, weight,
                measurement unit, mode, and Q1–Q4 plan.
              </p>
            </section>
          )}

          <KPIInformationCard
            formData={compatibleFormData}
            parentId={""} // No parent reference for creation
            candidateParentKPIs={[]} // Removed parent KPI references
            canEditStructure={true}
            kpiId={"new"}
            onInputChange={handleInputChange}
            onParentIdChange={() => {}} // Disabled - no parent selection
            objective={objective}
            mode="create"
            hideParentSelector={true} // Always hide for creation
          />

          {/* KPI Mode Selector - Only for Division/Department managers */}
          {(effectiveObjectiveType?.toUpperCase() === "DIVISION" ||
            effectiveObjectiveType?.toUpperCase() === "DEPARTMENT") && (
            <KpiModeSelector
              mode={formData.kpiMode || (isSupport ? "DIRECT" : "AGGREGATED")}
              onModeChange={(mode) => updateField("kpiMode", mode)}
              retentionPercent={formData.managerRetentionPercent || "30"}
              onRetentionChange={(percent) =>
                updateField("managerRetentionPercent", percent)
              }
              targetValue={annualTargets[strategicYear || ""] || "0"}
            />
          )}

          {!isSupport && (
            <BasisCalculationCard
              unitType={formData.unitType}
              targetValue={annualTargets[strategicYear || ""] || ""}
              source={formData.calculationBasisSource}
              onSourceChange={handleBasisSourceChange}
              actualBasisSource={formData.actualBasisSource}
              onActualBasisSourceChange={(value) =>
                updateField("actualBasisSource", value)
              }
              zeroDenominatorPolicy={formData.zeroDenominatorPolicy}
              onZeroDenominatorPolicyChange={(value) =>
                updateField("zeroDenominatorPolicy", value)
              }
              numeratorLabel={formData.numeratorLabel}
              onNumeratorLabelChange={(value) => updateField("numeratorLabel", value)}
              denominatorLabel={formData.denominatorLabel}
              onDenominatorLabelChange={(value) => updateField("denominatorLabel", value)}
              basisUnitType={formData.basisUnitType}
              onBasisUnitTypeChange={(value) => updateField("basisUnitType", value)}
              directBasisValue={formData.directBasisValue}
              onDirectBasisValueChange={(value) => updateField("directBasisValue", value)}
              basisQuarters={basisQuarters}
              onBasisQuartersChange={setBasisQuarters}
              basisKpiId={formData.weightingBasisKpiId}
              onBasisKpiChange={(value) => updateField("weightingBasisKpiId", value)}
              candidateKpis={
                existingKPIs.length > 0
                  ? existingKPIs
                  : ((objective.kpis as Kpi[] | undefined) ?? [])
              }
              isCorporate={isCorporate}
            />
          )}

          {!isSupport && (
            <KpiAggregationSelector
              method={formData.aggregationMethod}
              onMethodChange={(value) => updateField("aggregationMethod", value)}
              basisKpiId={formData.weightingBasisKpiId}
              onBasisChange={(value) => updateField("weightingBasisKpiId", value)}
              weightSource={formData.aggregationWeightSource}
              onWeightSourceChange={(value) =>
                updateField("aggregationWeightSource", value)
              }
              carryPolicy={formData.carryPolicy}
              onCarryPolicyChange={(value) => updateField("carryPolicy", value)}
              unitType={formData.unitType}
              calculationBasisSource={formData.calculationBasisSource}
              candidateKpis={
                existingKPIs.length > 0
                  ? existingKPIs
                  : ((objective.kpis as Kpi[] | undefined) ?? [])
              }
            />
          )}

          {/* Weight Allocation Display */}
          <div
            className={`p-4 rounded-lg mb-6 border ${existingWeight + (parseFloat(formData.weight) || 0) > 100 ? "bg-red-50 border-red-200" : "bg-zinc-50 border-zinc-200"}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-700">
                Objective Weight Allocation
              </span>
              <span
                className={`text-sm font-bold ${existingWeight + (parseFloat(formData.weight) || 0) > 100 ? "text-red-600" : "text-zinc-900"}`}
              >
                {(existingWeight + (parseFloat(formData.weight) || 0)).toFixed(
                  1,
                )}
                % / 100%
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${existingWeight + (parseFloat(formData.weight) || 0) > 100 ? "bg-red-500" : "bg-blue-600"}`}
                style={{
                  width: `${Math.min(100, existingWeight + (parseFloat(formData.weight) || 0))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              {existingWeight + (parseFloat(formData.weight) || 0) > 100
                ? "⚠ Total weight exceeds 100%. Please reduce weights to satisfy allocation."
                : `Available for this objective: ${(100 - (existingWeight + (parseFloat(formData.weight) || 0))).toFixed(1)}%`}
            </p>
          </div>

          {/* Annual Target - Strategic Period Only */}
          {strategicYear && (
            <div className="border p-4 rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">
                  Strategic Period Target
                </h3>
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  {strategicYear || "Strategic Period"}
                </span>
              </div>
              <div className="bg-white p-3 rounded border shadow-sm">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Annual Target ({strategicYear})
                </label>
                <div className="relative">
                  <FormattedNumberInput
                    value={annualTargets[strategicYear] || ""}
                    onValueChange={handleAnnualTargetChange}
                    currency={formData.unitType === "CURRENCY"}
                    className="w-full pl-3 pr-12 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={
                      formData.unitType === "CURRENCY" ? "283,654,789" : "0.00"
                    }
                    step="any"
                    min="0"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-xs font-medium pointer-events-none">
                    {unitLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter the annual target for the strategic period only.
                </p>
              </div>
            </div>
          )}

          {/* Quarterly Breakdown - Only for Non-Corporate, Strategic Period Only */}
          {strategicYear && !isCorporate && (
            <div className="border p-4 rounded-md shadow-sm">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <span>Quarterly Breakdown</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {unitLabel}
                </span>
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Plan quarterly targets for the strategic period ({strategicYear}
                ). Quarterly planning is required for non-corporate KPIs.
              </p>
              <QuarterlyBreakdown
                yearlyQuarters={yearlyQuarters}
                kpi={
                  {
                    kpiId: "new",
                    name: formData.name,
                    unitType: formData.unitType,
                    quarterlyAggregationMethod:
                      formData.quarterlyAggregationMethod,
                  } as Kpi
                }
                canEditTargets={true}
                isEditing={false}
                remainingAllocation={null}
                onYearlyQuartersChange={setYearlyQuarters}
                weightType={formData.weightType}
                mode="create"
                strategicTargetsById={{
                  // Only include strategic period year
                  new: strategicYear
                    ? {
                        [strategicYear]: parseFloat(
                          annualTargets[strategicYear] || "0",
                        ),
                      }
                    : {},
                }}
              />
            </div>
          )}

          <div className="flex justify-end pt-6 border-t gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className={`min-w-[140px] ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create KPI"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
