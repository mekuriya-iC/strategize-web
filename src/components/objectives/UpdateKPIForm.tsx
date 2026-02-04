// In UpdateKPIForm.tsx
"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  KPIFormHeader,
  KPIInformationCard,
  QuarterlyBreakdown
} from "./kpi-form";
import type { Kpi, KpiWeightType } from "@/types/graphql";
import { useUpdateKPIState } from "@/hooks/objectives/useUpdateKPIState";

interface KPIFormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const KPIFormSection: React.FC<KPIFormSectionProps> = ({
  title,
  children,
  className = ""
}) => (
  <div className={`space-y-4 ${className}`}>
    <h3 className="text-lg font-medium">{title}</h3>
    <div className="pl-4 border-l-2 border-gray-200">
      {children}
    </div>
  </div>
);

interface YearlyTargetInputProps {
  year: string;
  target: string;
  onTargetChange: (value: string) => void;
  disabled?: boolean;
}

const YearlyTargetInput: React.FC<YearlyTargetInputProps> = ({
  year,
  target,
  onTargetChange,
  disabled = false,
}) => (
  <div className="flex items-center space-x-2">
    <span className="font-medium w-24">{year}</span>
    <div className="relative flex-1">
      <input
        type="number"
        value={target}
        onChange={(e) => onTargetChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-md"
        step="0.01"
        min="0"
      />
      <span className="absolute right-3 top-2.5 text-gray-500">million ETB</span>
    </div>
  </div>
);

interface UpdateKPIFormProps {
  kpiId: string;
  onSuccess?: () => void;
  onCancel: () => void;
  existingKPIs?: Kpi[];
}

export default function UpdateKPIForm({
  kpiId,
  onSuccess,
  onCancel,
  existingKPIs = [],
}: UpdateKPIFormProps) {
  const {
    formData,
    loading,
    error,
    isSubmitting,
    kpi,
    parentKpi,  // Make sure this is destructured from the hook
    annualTarget,
    assignedAnnualTarget,  // This should be included

    strategicTimeline,
    yearlyQuarters,
    weightAllocation,
    setYearlyQuarters,
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
  });

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSubmit();
    } catch (error) {
      console.error("Error updating KPI:", error);
      toast.error("Failed to update KPI");
    }
  }, [handleSubmit]);

  // Derive allocation info for validations
  const remainingAllocation = useMemo(() => {
    if (!kpi || !annualTarget) return null;
    return {
      available: parseFloat(annualTarget) || 0,
      used: 0, // In update mode, used is handled by validation against assigned
      remaining: parseFloat(annualTarget) || 0,
      unit: kpi.unitType || "NUMBER",
    };
  }, [kpi, annualTarget]);

  // Wrapper function to match KPIInformationCard's expected signature
  const handleInputChange = useCallback((field: string, value: string) => {
    updateField(field as keyof typeof formData, value);
  }, [updateField, formData]);

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

  // Determine level-based restrictions
  const objectiveType = kpi.objective?.type;
  const isCorporate = objectiveType === "CORPORATE";
  const isDivision = objectiveType === "DIVISION";
  const isDepartment = objectiveType === "DEPARTMENT";
  const isPersonnel = objectiveType === "PERSONNEL";

  const hasParent = !!kpi.parent?.kpiId;

  // For corporate KPIs, all fields are editable regardless of approval status
  // For non-corporate KPIs, fields are only editable if not approved
  const canEditStructure = isCorporate || kpi.status !== "APPROVED";
  const canEditWeight = isCorporate || kpi.status !== "APPROVED";
  const canEditTargets = isCorporate || kpi.status !== "APPROVED";

  // Lock annual target for all non-corporate KPIs that are cascaded from a parent
  // Only lock if we actually found a valid assigned target (> 0) from the parent.
  // Otherwise, fallback to editable mode so the user can set their own target (standalone behavior).
  const isAnnualTargetLocked = !isCorporate && hasParent && (assignedAnnualTarget !== null && assignedAnnualTarget > 0);
  const targetLabel = isAnnualTargetLocked ? 'Target Value (Assigned)' : 'Target Value';

  // Create compatible formData
  const compatibleFormData = {
    name: formData.name,
    baseline: formData.baseline,
    weight: formData.weight,
    weightType: formData.weightType,
  };

  return (
    <div className="space-y-6">
      <KPIFormHeader
        isEditing={true}
        onCancel={onCancel}
      />

      {/* Weight Allocation Display */}
      <div className={`p-4 rounded-lg mb-6 border ${weightAllocation.isOver ? 'bg-red-50 border-red-200' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-zinc-700">Objective Weight Allocation</span>
          <span className={`text-sm font-bold ${weightAllocation.isOver ? 'text-red-600' : 'text-zinc-900'}`}>
            {weightAllocation.total.toFixed(1)}% / 100%
          </span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${weightAllocation.isOver ? 'bg-red-500' : 'bg-blue-600'}`}
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
              onParentIdChange={() => { }} // Disabled in update mode
              objective={kpi.objective || undefined}
              mode="edit"
            />
          </KPIFormSection>

          {isCorporate ? (
            // CORPORATE VIEW: Annual Target Input Only
            <KPIFormSection
              title="Target Settings"
              className="mb-8"
            >
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
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the annual target for the strategic period. Corporate KPIs use annual targets only.
                </p>
              </div>
            </KPIFormSection>
          ) : (
            // NON-CORPORATE VIEW: Parent KPI details + Target Breakdown
            <KPIFormSection
              title="Target Breakdown"
              className="mb-8"
            >
              {/* Parent KPI Details Card (only show if KPI has a parent) */}
              {hasParent && parentKpi && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Parent KPI Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium">{parentKpi.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Baseline</p>
                      <p className="font-medium">{parentKpi.baseline?.toLocaleString()}</p>
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
                </div>
              )}

              {/* Annual Target - Strategic Period */}
              <div className={`mb-6 p-4 ${isAnnualTargetLocked ? 'bg-gray-50' : 'bg-yellow-50'} rounded-lg border ${isAnnualTargetLocked ? 'border-gray-200' : 'border-yellow-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-gray-700">
                    {targetLabel}
                  </span>
                  {isAnnualTargetLocked ? (
                    <span className="text-lg font-bold text-gray-900">
                      {(assignedAnnualTarget ?? 0).toLocaleString()} {formData.unitType === "PERCENT" ? "%" : "million ETB"}
                    </span>
                  ) : (
                    <div className="w-48">
                      <YearlyTargetInput
                        year={strategicTimeline || "Annual Goal"}
                        target={annualTarget || "0"}
                        onTargetChange={handleAnnualTargetChange}
                        disabled={!canEditTargets}
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {isAnnualTargetLocked
                    ? "This target is assigned from the parent KPI and cannot be changed here."
                    : "Set your annual target first, then plan your quarterly targets below."}
                </p>
              </div>

              {/* Quarterly Breakdown Component */}
              <div className="mt-8 border-t pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Quarterly Planning</h4>
                </div>
                <QuarterlyBreakdown
                  yearlyQuarters={yearlyQuarters}
                  kpi={kpi}
                  canEditTargets={canEditTargets}
                  isEditing={true}
                  remainingAllocation={remainingAllocation}
                  strategicTargetsById={{
                    [kpi.kpiId]: {
                      [strategicTimeline]: (isAnnualTargetLocked ? assignedAnnualTarget : parseFloat(annualTarget || "0"))
                    }
                  }}
                  onYearlyQuartersChange={setYearlyQuarters}
                  weightType={formData.weightType}
                  mode="edit"
                />
                <p className="text-xs text-gray-500 mt-4">
                  Break down the Target Value into 4 quarters. The sum (or average for percentages) must match the Target Value above.
                </p>
              </div>
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
              className="min-w-[120px]"
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
      </form >
    </div >
  );
}
