// In UpdateKPIForm.tsx
"use client";

import React, { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  KPIFormHeader,
  KPIInformationCard,
  QuarterlyBreakdown,
} from "./kpi-form";
import type {
  Kpi,
  KpiCalculationBasisSource,
  Objective,
} from "@/types/graphql";
import { useUpdateKPIState } from "@/hooks/objectives/useUpdateKPIState";
import { usesAnnualOnlyKpiTargets } from "@/lib/objectives/kpiWeightScope";
import { KpiModeSelector } from "@/components/objectives/KpiModeSelector";
import { KpiAggregationSelector } from "@/components/objectives/KpiAggregationSelector";
import { BasisCalculationCard } from "@/components/objectives/BasisCalculationCard";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import {
  FormulaQuarterPlanningCard,
  type FormulaQuarterPlanningCardHandle,
} from "@/components/objectives/FormulaQuarterPlanningCard";

interface KPIFormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const KPIFormSection: React.FC<KPIFormSectionProps> = ({
  title,
  children,
  className = "",
}) => (
  <div className={`space-y-4 ${className}`}>
    <h3 className="text-lg font-medium">{title}</h3>
    <div className="pl-4 border-l-2 border-gray-200">{children}</div>
  </div>
);

interface YearlyTargetInputProps {
  year: string;
  target: string;
  onTargetChange: (value: string) => void;
  disabled?: boolean;
  unitType?: string;
}

const YearlyTargetInput: React.FC<YearlyTargetInputProps> = ({
  year,
  target,
  onTargetChange,
  disabled = false,
  unitType = "NUMBER",
}) => (
  <div className="flex items-center space-x-2">
    <span className="font-medium w-24">{year}</span>
    <div className="relative flex-1">
      <FormattedNumberInput
        value={target}
        onValueChange={onTargetChange}
        currency={unitType === "CURRENCY"}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-md"
        step="any"
        min="0"
      />
      <span className="absolute right-3 top-2.5 text-gray-500">
        {unitType === "PERCENT"
          ? "%"
          : unitType === "CURRENCY"
            ? "ETB"
            : unitType === "HOUR"
              ? "hrs"
              : unitType === "RATIO"
                ? "ratio"
                : unitType === "COUNT"
                  ? "count"
                  : ""}
      </span>
    </div>
  </div>
);

interface UpdateKPIFormProps {
  kpiId: string;
  onSuccess?: () => void;
  onCancel: () => void;
  existingKPIs?: Kpi[];
  objective?: Objective;
}

export default function UpdateKPIForm({
  kpiId,
  onSuccess,
  onCancel,
  existingKPIs = [],
  objective: objectiveProp,
}: UpdateKPIFormProps) {
  const formulaPlanningRef = useRef<FormulaQuarterPlanningCardHandle>(null);
  const {
    formData,
    loading,
    error,
    isSubmitting,
    kpi,
    parentKpi, // Make sure this is destructured from the hook
    annualTarget,
    assignedAnnualTarget, // This should be included

    strategicTimeline,
    yearlyQuarters,
    basisQuarters,
    weightAllocation,
    setYearlyQuarters,
    setBasisQuarters,
    updateField,
    handleSubmit,
    handleAnnualTargetChange,
  } = useUpdateKPIState({
    kpiId,
    onSuccess: useCallback(() => {
      toast.success("KPI updated successfully!");
      onSuccess?.();
    }, [onSuccess]),
    existingKPIs,
    objectiveOverride: objectiveProp,
  });

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await handleSubmit(async () => {
          await formulaPlanningRef.current?.save();
        });
      } catch (error) {
        console.error("Error updating KPI:", error);
        toast.error("Failed to update KPI");
      }
    },
    [handleSubmit],
  );

  // Wrapper function to match KPIInformationCard's expected signature
  // Must be declared before early returns to satisfy Rules of Hooks
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      updateField(field as keyof typeof formData, value);
    },
    [updateField],
  );

  const handleBasisSourceChange = (source: KpiCalculationBasisSource) => {
    updateField("calculationBasisSource", source);
    if (source === "DIRECT_VALUE" || source === "LINKED_KPI") {
      updateField("aggregationMethod", "DENOMINATOR_WEIGHTED_AVERAGE");
      updateField("carryPolicy", "NONE");
    }
    if (source === "DIRECT_VALUE") updateField("weightingBasisKpiId", "");
  };

  // Early return checks - MUST come after all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        <p>Error loading KPI: {error.message}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!kpi) {
    return <div className="p-4">KPI not found</div>;
  }

  // Determine level-based restrictions (cascaded corporate → quarterly, not annual-only)
  const planningObjective = objectiveProp || kpi.objective;
  const isCorporate = usesAnnualOnlyKpiTargets(planningObjective);

  const objectiveType =
    planningObjective?.assigneeType ||
    planningObjective?.type ||
    kpi?.objective?.assigneeType ||
    kpi?.objective?.type;
  const showModeSelector =
    objectiveType?.toUpperCase() === "DIVISION" ||
    objectiveType?.toUpperCase() === "DEPARTMENT";

  const hasParent = !!kpi.parent?.kpiId;

  // For corporate KPIs, all fields are editable regardless of approval status
  // For non-corporate KPIs, fields are only editable if not approved
  const canEditStructure = isCorporate || kpi.status !== "APPROVED";
  const canEditWeight = isCorporate || kpi.status !== "APPROVED";
  const canEditTargets = isCorporate || kpi.status !== "APPROVED";

  // Lock annual target for all non-corporate KPIs that are cascaded from a parent
  // Only lock if we actually found a valid assigned target (> 0) from the parent.
  // Otherwise, fallback to editable mode so the user can set their own target (standalone behavior).
  const isFormulaKpi =
    kpi.calculationType === "RATIO_FORMULA" ||
    kpi.calculationType === "WEIGHTED_INDEX";
  const isAnnualTargetLocked =
    !isCorporate &&
    hasParent &&
    !isFormulaKpi &&
    assignedAnnualTarget !== null &&
    assignedAnnualTarget > 0;
  const targetLabel = isAnnualTargetLocked
    ? "Target Value (Assigned)"
    : "Target Value";

  // Derive allocation info for validations (regular variable, not useMemo to avoid hooks order issues)
  const targetToUse = isAnnualTargetLocked
    ? (assignedAnnualTarget ?? 0)
    : parseFloat(annualTarget || "0") || 0;

  const remainingAllocation = kpi
    ? {
        available: targetToUse,
        used: 0, // In update mode, used is handled by validation against assigned
        remaining: targetToUse,
        unit: kpi.unitType || "NUMBER",
      }
    : null;

  // Create compatible formData
  const compatibleFormData = {
    name: formData.name,
    baseline: formData.baseline,
    weight: formData.weight,
    weightType: formData.weightType,
  };

  return (
    <div className="space-y-6">
      <KPIFormHeader isEditing={true} onCancel={onCancel} />

      {/* Weight Allocation Display */}
      <div
        className={`p-4 rounded-lg mb-6 border ${weightAllocation.isOver ? "bg-red-50 border-red-200" : "bg-zinc-50 border-zinc-200"}`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-zinc-700">
            Objective Weight Allocation
          </span>
          <span
            className={`text-sm font-bold ${weightAllocation.isOver ? "text-red-600" : "text-zinc-900"}`}
          >
            {weightAllocation.total.toFixed(1)}% / 100%
          </span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${weightAllocation.isOver ? "bg-red-500" : "bg-blue-600"}`}
            style={{ width: `${Math.min(100, weightAllocation.total)}%` }}
          />
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">
          {weightAllocation.isOver
            ? "⚠ Total weight exceeds 100%. Please reduce weights to satisfy allocation."
            : `Available for this objective: ${weightAllocation.remaining.toFixed(1)}%`}
        </p>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="space-y-6">
          <KPIFormSection title="KPI Information" className="mb-8">
            <KPIInformationCard
              formData={compatibleFormData}
              parentId={kpi.parent?.kpiId || ""}
              candidateParentKPIs={[]} // Not needed for update
              canEditStructure={canEditStructure}
              kpiId={kpiId}
              onInputChange={handleInputChange}
              onParentIdChange={() => {}} // Disabled in update mode
              objective={kpi.objective || undefined}
              mode="edit"
            />
          </KPIFormSection>

          {/* Performance tracking mode settings for Division/Department level scorecards */}
          {showModeSelector && (
            <KpiModeSelector
              mode={formData.kpiMode || "AGGREGATED"}
              onModeChange={(mode) => updateField("kpiMode", mode)}
              retentionPercent={formData.managerRetentionPercent || "30"}
              onRetentionChange={(percent) =>
                updateField("managerRetentionPercent", percent)
              }
              targetValue={targetToUse.toString()}
            />
          )}

          <BasisCalculationCard
            unitType={formData.unitType || "NUMBER"}
            targetValue={annualTarget}
            source={formData.calculationBasisSource}
            onSourceChange={handleBasisSourceChange}
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
            candidateKpis={existingKPIs}
            currentKpiId={kpiId}
            isCorporate={isCorporate}
            disabled={!canEditStructure}
          />

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
            candidateKpis={existingKPIs}
            currentKpiId={kpiId}
            disabled={!canEditStructure}
          />

          {isCorporate ? (
            // CORPORATE VIEW: Annual Target Input Only
            <KPIFormSection title="Target Settings" className="mb-8">
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">
                    Annual Target ({strategicTimeline || "Strategic Period"})
                  </h4>
                </div>
                <YearlyTargetInput
                  year={strategicTimeline || "Strategic Period"}
                  target={annualTarget || "0"}
                  onTargetChange={handleAnnualTargetChange}
                  disabled={!canEditTargets}
                  unitType={formData.unitType}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the annual target for the strategic period. Corporate
                  KPIs use annual targets only.
                </p>
              </div>
            </KPIFormSection>
          ) : (
            // NON-CORPORATE VIEW: Parent KPI details + Target Breakdown
            <KPIFormSection title="Target Breakdown" className="mb-8">
              {/* Parent KPI Details Card (only show if KPI has a parent) */}
              {hasParent && parentKpi && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Parent KPI Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium">{parentKpi.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Baseline</p>
                      <p className="font-medium">
                        {parentKpi.baseline?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Weight</p>
                      <p className="font-medium">{parentKpi.weight}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Unit Type</p>
                      <p className="font-medium">{parentKpi.unitType}</p>
                    </div>
                  </div>
                  {/* Show assigned target to make it clear what this KPI should plan against */}
                  {kpi.assignedTargetValue && kpi.assignedTargetValue > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-gray-600 text-sm">
                        Your Assigned Target
                      </p>
                      <p className="font-bold text-blue-900 text-lg">
                        {kpi.assignedTargetValue.toLocaleString()}{" "}
                        {formData.unitType === "PERCENT"
                          ? "%"
                          : formData.unitType === "CURRENCY"
                            ? "ETB"
                            : formData.unitType === "RATIO"
                              ? "ratio"
                              : formData.unitType === "COUNT"
                                ? "count"
                                : ""}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        This is the target assigned to you from the parent KPI.
                        Plan your quarterly breakdown based on this value.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Annual Target - Strategic Period */}
              <div
                className={`mb-6 p-4 ${isAnnualTargetLocked ? "bg-gray-50" : "bg-yellow-50"} rounded-lg border ${isAnnualTargetLocked ? "border-gray-200" : "border-yellow-200"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-gray-700">
                    {targetLabel}
                  </span>
                  {isAnnualTargetLocked ? (
                    <span className="text-lg font-bold text-gray-900">
                      {(assignedAnnualTarget ?? 0).toLocaleString()}{" "}
                      {formData.unitType === "PERCENT"
                        ? "%"
                        : formData.unitType === "CURRENCY"
                          ? "ETB"
                          : formData.unitType === "RATIO"
                            ? "ratio"
                            : formData.unitType === "COUNT"
                              ? "count"
                              : ""}
                    </span>
                  ) : (
                    <div className="w-48">
                      <YearlyTargetInput
                        year={strategicTimeline || "Annual Goal"}
                        target={annualTarget || "0"}
                        onTargetChange={handleAnnualTargetChange}
                        disabled={!canEditTargets}
                        unitType={formData.unitType}
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {isAnnualTargetLocked
                    ? "This target is assigned from the parent KPI and cannot be changed here."
                    : isFormulaKpi
                      ? "Set this unit's expected annual formula result, then reconcile it from the quarterly source targets below."
                      : "Set your annual target first, then plan your quarterly targets below."}
                </p>
              </div>

              {/* Quarterly Breakdown Component */}
              <div className="mt-8 border-t pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">
                    Quarterly Planning
                  </h4>
                </div>
                <QuarterlyBreakdown
                  yearlyQuarters={yearlyQuarters}
                  kpi={kpi}
                  canEditTargets={canEditTargets}
                  isEditing={true}
                  remainingAllocation={remainingAllocation}
                  strategicTargetsById={{
                    [kpi.kpiId]: {
                      [strategicTimeline]: isAnnualTargetLocked
                        ? (assignedAnnualTarget ?? 0)
                        : parseFloat(annualTarget || "0"),
                    },
                  }}
                  onYearlyQuartersChange={setYearlyQuarters}
                  weightType={formData.weightType}
                  mode="edit"
                />
                <p className="text-xs text-gray-500 mt-4">
                  Break down the Target Value into 4 quarters. Manual percentage
                  KPIs use an average; formula KPIs are reconciled using their
                  configured temporal rollup below.
                </p>
              </div>

              {isFormulaKpi && (
                <div className="mt-8 border-t pt-8">
                  <FormulaQuarterPlanningCard
                    ref={formulaPlanningRef}
                    kpi={kpi}
                    annualPeriodId={
                      planningObjective?.strategicPeriod?.strategicPeriodId
                    }
                    canEdit={canEditTargets}
                  />
                </div>
              )}
            </KPIFormSection>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!canEditWeight && !canEditTargets)}
              className="min-w-30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update KPI"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
