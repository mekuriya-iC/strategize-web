"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Kpi } from "@/types/graphql";
import type { YearlyQuarters, AllocationInfo } from "@/hooks/useKPIFormState";
import { roundTarget, validateQuarterlyBreakdown } from "./validation";

interface QuarterlyBreakdownProps {
  yearlyQuarters: Record<string, YearlyQuarters>;
  kpi: Kpi | undefined;
  canEditTargets: boolean;
  isEditing: boolean;
  remainingAllocation: AllocationInfo | null;
  strategicTargetsById?: Record<string, Record<string, number>>;
  onYearlyQuartersChange: (
    value: React.SetStateAction<Record<string, YearlyQuarters>>
  ) => void;
  onReloadTargets?: () => void;
}

export function QuarterlyBreakdown({
  yearlyQuarters,
  kpi,
  canEditTargets,
  isEditing,
  remainingAllocation,
  strategicTargetsById,
  onYearlyQuartersChange,
  onReloadTargets,
}: QuarterlyBreakdownProps) {
  if (Object.keys(yearlyQuarters).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No yearly targets found from parent KPI.</p>
        <p className="text-sm mt-1">
          Your parent needs to set yearly targets first.
        </p>
        <p className="text-sm mt-1">
          If this is a rejected KPI, please check if targets were saved.
        </p>
        {isEditing && onReloadTargets && (
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={onReloadTargets}>
              Reload Targets
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Quarterly Breakdown</h4>
        <p className="text-sm text-blue-700">
          Break down your assigned targets into quarterly values. The sum of
          quarters must not exceed your assigned target limit. You&apos;ll see
          real-time validation to ensure you stay within limits.
        </p>
      </div>

      {Object.entries(yearlyQuarters).map(([year, quarters]) => {
        const validation = validateQuarterlyBreakdown(
          year,
          yearlyQuarters,
          kpi,
          remainingAllocation,
          strategicTargetsById
        );

        return (
          <div key={year} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-gray-900">{year}</h5>
              <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {(() => {
                  if (
                    remainingAllocation &&
                    remainingAllocation.remaining <
                      (validation.assignedTarget ?? 0)
                  ) {
                    return (
                      <>
                        Available Allocation:{" "}
                        <span className="font-medium">
                          {roundTarget(remainingAllocation.remaining)}{" "}
                          {validation.unitLabel}
                        </span>
                      </>
                    );
                  } else if (validation.assignedTarget !== null) {
                    return (
                      <>
                        Assigned Target:{" "}
                        <span className="font-medium">
                          {roundTarget(validation.assignedTarget)}{" "}
                          {validation.unitLabel}
                        </span>
                      </>
                    );
                  }
                  return null;
                })()}
                </div>
                {/* Auto Distribute Button */}
                {canEditTargets && validation.assignedTarget !== null && validation.assignedTarget > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const targetToDistribute = remainingAllocation && remainingAllocation.remaining < validation.assignedTarget!
                        ? remainingAllocation.remaining
                        : validation.assignedTarget!;
                      const quarterlyValue = Math.round((targetToDistribute / 4) * 100) / 100;
                      // Distribute evenly, put any remainder in Q4 to ensure exact match
                      const q1q2q3Total = quarterlyValue * 3;
                      const q4Value = Math.round((targetToDistribute - q1q2q3Total) * 100) / 100;
                      
                      onYearlyQuartersChange((prev) => ({
                        ...prev,
                        [year]: {
                          q1: quarterlyValue.toString(),
                          q2: quarterlyValue.toString(),
                          q3: quarterlyValue.toString(),
                          q4: q4Value.toString(),
                        },
                      }));
                    }}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    Auto Distribute
                  </Button>
                )}
              </div>
            </div>

            {/* Validation Status */}
            {validation.assignedTarget !== null && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  validation.isValid
                    ? validation.message.includes("Perfect")
                      ? "bg-green-50 border border-green-200"
                      : "bg-yellow-50 border border-yellow-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-sm ${
                    validation.isValid
                      ? validation.message.includes("Perfect")
                        ? "text-green-700"
                        : "text-yellow-700"
                      : "text-red-700"
                  }`}
                >
                  <span>
                    {validation.isValid
                      ? validation.message.includes("Perfect")
                        ? "✅"
                        : "⚠️"
                      : "❌"}
                  </span>
                  <span>{validation.message}</span>
                </div>
                {!validation.isValid && (
                  <p className="text-xs mt-1 text-red-600">
                    Please adjust quarterly values to not exceed the assigned
                    target.
                  </p>
                )}
                <div className="text-xs mt-1 text-gray-600">
                  Current quarterly sum: {roundTarget(validation.currentSum)}{" "}
                  {validation.unitLabel}
                  {validation.remainingAllocation !== undefined && (
                    <span className="ml-2 text-blue-600">
                      (Available: {roundTarget(validation.remainingAllocation)}{" "}
                      {validation.unitLabel})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quarter Inputs */}
            <div className="grid grid-cols-4 gap-4">
              {(["q1", "q2", "q3", "q4"] as const).map((quarter, index) => (
                <div key={quarter}>
                  <Label>Q{index + 1}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quarters[quarter]}
                    onChange={(e) => {
                      onYearlyQuartersChange((prev) => ({
                        ...prev,
                        [year]: {
                          ...prev[year],
                          [quarter]: e.target.value,
                        },
                      }));
                    }}
                    placeholder="0"
                    disabled={!canEditTargets}
                    className={
                      validation.isValid
                        ? ""
                        : "border-red-300 focus:border-red-500"
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
