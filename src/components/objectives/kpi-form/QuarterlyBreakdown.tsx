"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Kpi, KpiQuarterPlanStatus } from "@/types/graphql";
import type {
  YearlyQuarters,
  AllocationInfo,
} from "@/hooks/objectives/useKPIFormState";
import { roundTarget, validateQuarterlyBreakdown } from "./validation";

const LOCKED_PLAN_STATUSES: KpiQuarterPlanStatus[] = [
  "PENDING",
  "APPROVED",
  "LOCKED",
];

interface QuarterlyBreakdownProps {
  yearlyQuarters: Record<string, YearlyQuarters>;
  kpi: Kpi | undefined;
  canEditTargets: boolean;
  isEditing: boolean;
  remainingAllocation: AllocationInfo | null;
  strategicTargetsById?: Record<string, Record<string, number>>;
  onYearlyQuartersChange: (
    value: React.SetStateAction<Record<string, YearlyQuarters>>,
  ) => void;
  onReloadTargets?: () => void;
  getRemainingAllocation?: (year: string) => AllocationInfo | null;
  weightType?: string;
  mode?: "create" | "edit";
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
  getRemainingAllocation,
  weightType,
}: QuarterlyBreakdownProps) {
  if (Object.keys(yearlyQuarters).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
        <p>No quarterly breakdown initialized.</p>
        <p className="text-sm mt-1">
          Please ensure an annual target is set for the strategic period.
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
          Break down your assigned targets into quarterly values. For NUMBER
          KPIs the quarterly sum must match the assigned target. For PERCENT
          KPIs the quarterly average must match the assigned target.
        </p>
      </div>

      {Object.entries(yearlyQuarters).map(([year, quarters]) => {
        const yearAllocation = getRemainingAllocation
          ? getRemainingAllocation(year)
          : remainingAllocation;

        const isPercent = kpi?.unitType
          ? kpi.unitType === "PERCENT" || kpi.unitType === "RATIO"
          : weightType === "PERCENT" || weightType === "RATIO";

        const validation = validateQuarterlyBreakdown(
          year,
          yearlyQuarters,
          kpi,
          yearAllocation,
          strategicTargetsById,
          weightType,
        );

        return (
          <div key={year} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-gray-900">{year}</h5>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {validation.assignedTarget !== null && (
                    <>
                      Target Value:{" "}
                      <span className="font-medium">
                        {roundTarget(validation.assignedTarget)}{" "}
                        {validation.unitLabel}
                      </span>
                    </>
                  )}
                </div>
                {/* Auto Distribute Button */}
                {canEditTargets &&
                  validation.assignedTarget !== null &&
                  validation.assignedTarget > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const isPercent = kpi?.unitType
                          ? kpi.unitType === "PERCENT" ||
                            kpi.unitType === "RATIO"
                          : weightType === "PERCENT" || weightType === "RATIO";

                        const targetToDistribute = isPercent
                          ? validation.assignedTarget!
                          : validation.assignedTarget!;

                        let q1, q2, q3, q4;
                        if (isPercent) {
                          const v = (
                            Math.round(targetToDistribute * 100) / 100
                          ).toString();
                          q1 = q2 = q3 = q4 = v;
                        } else {
                          const quarterlyValue =
                            Math.round((targetToDistribute / 4) * 100) / 100;
                          const q1q2q3Total = quarterlyValue * 3;
                          const q4Value =
                            Math.round(
                              (targetToDistribute - q1q2q3Total) * 100,
                            ) / 100;
                          q1 = q2 = q3 = quarterlyValue.toString();
                          q4 = q4Value.toString();
                        }

                        onYearlyQuartersChange((prev) => ({
                          ...prev,
                          [year]: {
                            ...prev[year],
                            q1,
                            q2,
                            q3,
                            q4,
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
                    Please adjust quarterly values to match the assigned target.
                  </p>
                )}
                <div className="text-xs mt-1 text-gray-600">
                  Current planning {isPercent ? "average" : "total"}:{" "}
                  {roundTarget(validation.currentSum)} {validation.unitLabel}
                  {validation.remainingAllocation !== undefined && (
                    <span className="ml-2 text-blue-600">
                      (Available Limit:{" "}
                      {roundTarget(validation.remainingAllocation)}{" "}
                      {validation.unitLabel})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quarter Inputs */}
            <div className="grid grid-cols-4 gap-4">
              {(["q1", "q2", "q3", "q4"] as const).map((quarter, index) => {
                const plan = kpi?.quarterPlans?.find(
                  (candidate) => candidate.quarterNumber === index + 1,
                );
                const planLocked = plan
                  ? LOCKED_PLAN_STATUSES.includes(plan.status)
                  : false;

                return (
                  <div key={quarter}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Label>Q{index + 1}</Label>
                      {plan && (
                        <Badge
                          variant="outline"
                          className={
                            plan.status === "APPROVED" ||
                            plan.status === "LOCKED"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : plan.status === "REJECTED"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : plan.status === "PENDING"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                          }
                        >
                          {plan.status}
                        </Badge>
                      )}
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
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
                      disabled={!canEditTargets || planLocked}
                      className={
                        validation.isValid
                          ? ""
                          : "border-red-300 focus:border-red-500"
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
