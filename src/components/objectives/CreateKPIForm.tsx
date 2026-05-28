"use client";

import React, { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateKPIForm } from "@/hooks/objectives/useCreateKPIForm"; // Ensure this matches path
import {
  KPIFormHeader,
  KPIInformationCard,
  QuarterlyBreakdown,
} from "./kpi-form";
// import QuarterlyBreakdown logic/types if needed
import { buildYearRanges } from "@/components/objectives/YearSelector";
import type { Objective, Kpi } from "@/types/graphql";
import {
  getKpisForObjectiveWeight,
  sumKpiWeights,
  usesAnnualOnlyKpiTargets,
} from "@/lib/objectives/kpiWeightScope";

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
    isSubmitting,
    updateField,
    handleSubmit,
  } = useCreateKPIForm({
    objectiveId,
    onSuccess: useCallback(() => {
      toast.success("KPI Created Successfully");
      onSuccess?.();
    }, [onSuccess]),
    isCorporate: usesAnnualOnlyKpiTargets(objective),
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSubmit();
    } catch (e) {
      toast.error("Failed to create KPI");
    }
  };

  const compatibleFormData = {
    name: formData.name,
    baseline: formData.baseline,
    weight: formData.weight,
    weightType: formData.weightType,
    unitType: formData.unitType,
  };

  const handleInputChange = (field: string, value: string) => {
    updateField(field as any, value);
  };

  // Calculate available years from strategic period
  const availableYears = useMemo(() => {
    if (!objective.strategicPeriod) return [];
    return buildYearRanges(objective.strategicPeriod);
  }, [objective.strategicPeriod]);

  const isCorporate = usesAnnualOnlyKpiTargets(objective);

  const strategicYear = availableYears[0];

  const unitLabel = useMemo(() => {
    switch (formData.unitType) {
      case "PERCENT":
        return "%";
      case "CURRENCY":
        return "Million/ETB";
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
    const sum = q1 + q2 + q3 + q4;

    // Must be positive overall
    if (sum <= 0) return false;

    const annual = parseFloat(annualTargets[strategicYear] || "0") || 0;
    if (annual <= 0) return false;

    const TOLERANCE = 0.01;
    if (formData.unitType === "PERCENT") {
      const avg = sum / 4;
      return Math.abs(avg - annual) <= TOLERANCE;
    }

    return Math.abs(sum - annual) <= TOLERANCE;
  }, [
    isCorporate,
    strategicYear,
    yearlyQuarters,
    annualTargets,
    formData.unitType,
  ]);

  // 100% weight budget applies to KPIs on this objective only
  const { existingWeight, remainingWeight } = useMemo(() => {
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

  const canSubmit = useMemo(() => {
    const totalWeight = existingWeight + (parseFloat(formData.weight) || 0);
    if (isSubmitting) return false;
    if (totalWeight > 100) return false;
    if (!hasValidBasicFields) return false;
    if (!strategicYear) return false;
    if (!hasAnnualTarget) return false;
    if (!isCorporate && !hasQuarterlyData) return false;
    return true;
  }, [
    existingWeight,
    formData.weight,
    isSubmitting,
    hasValidBasicFields,
    strategicYear,
    hasAnnualTarget,
    isCorporate,
    hasQuarterlyData,
  ]);

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
                  <input
                    type="number"
                    value={annualTargets[strategicYear] || ""}
                    onChange={(e) =>
                      setAnnualTargets((prev) => ({
                        ...prev,
                        [strategicYear]: e.target.value,
                      }))
                    }
                    className="w-full pl-3 pr-12 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="0.00"
                    step="0.01"
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
                  } as any
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
