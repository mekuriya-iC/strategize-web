"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle, AlertCircle } from "lucide-react";
import {
  detectKPIType,
  getDetailedUnitLabel,
  getAssignmentMethodDescription,
} from "@/utils/unitTypeDetection";
import type { Kpi } from "@/types/graphql";

// Helper to round numbers to max 2 decimal places
const roundValue = (value: number): number => Math.round(value * 100) / 100;

import { useAssignmentContext } from "@/context/AssignmentContext";

export function TargetAssignmentCard() {
  const {
    availableKPIs: kpis,
    selectedKPIs,
    assignments,
    bulkAssignmentValues,
    setBulkAssignmentValue,
    targets, // We use this to lookup current values
    setTarget, // Replaces updateTargetAssignment
  } = useAssignmentContext();

  // Helper: Get yearly total from targets
  const getYearlyTotalFromTargets = (
    targets: Array<{ timeline: string; target: number }>,
    unitType?: string,
  ): number => {
    if (!targets || targets.length === 0) return 0;

    const yearlyTargets = new Map<string, number[]>();

    targets.forEach((target) => {
      const timeline = target.timeline;
      // Check if it's a quarterly target (contains "-Q")
      if (timeline.includes("-Q")) {
        const year = timeline.split("-")[0];
        if (!yearlyTargets.has(year)) {
          yearlyTargets.set(year, []);
        }
        yearlyTargets.get(year)!.push(target.target);
      } else {
        // It's an annual target, use it directly
        const year = timeline;
        if (!yearlyTargets.has(year)) {
          yearlyTargets.set(year, [target.target]);
        }
      }
    });

    // Calculate total: for PERCENT/RATIO use average of quarters, for others use sum
    let total = 0;
    const isAverageable = unitType === "PERCENT" || unitType === "RATIO";

    yearlyTargets.forEach((values) => {
      if (values.length === 1) {
        // Single annual value
        total += values[0];
      } else {
        // Multiple quarterly values
        const sum = values.reduce((acc, val) => acc + val, 0);
        total += isAverageable ? sum / values.length : sum;
      }
    });

    return Math.round(total * 100) / 100;
  };

  // Helper: Get total assigned target for a KPI
  const getTotalAssignedTarget = (kpiId: string) => {
    let total = 0;
    assignments.forEach((assignment) => {
      const val = targets[kpiId]?.[assignment.assigneeId] || 0;
      total += val;
    });
    return roundValue(total);
  };

  // Helper: Get average assigned target for a KPI
  const getAverageAssignedTarget = (kpiId: string) => {
    if (assignments.length === 0) return 0;
    const total = getTotalAssignedTarget(kpiId);
    return roundValue(total / assignments.length);
  };

  // Helper: Get current assignment value
  const getTargetAssignment = (kpiId: string, assigneeId: string) => {
    return targets[kpiId]?.[assigneeId] || 0;
  };

  const handleBulkAssignment = (kpiId: string, value: number) => {
    assignments.forEach((assignment) => {
      setTarget(kpiId, assignment.assigneeId, value);
    });
  };

  const getCascadeTarget = (kpi: Kpi, fullTarget: number): number => {
    const mode = kpi.kpiMode || "AGGREGATED";
    if (mode !== "HYBRID") return fullTarget;

    const retentionPercent = Number(kpi.managerRetentionPercent || 0);
    const cascadePercent = Math.max(0, 100 - retentionPercent);
    return roundValue((fullTarget * cascadePercent) / 100);
  };

  const handleAutoSplit = (kpiId: string, cascadeTarget: number) => {
    if (assignments.length === 0) return;
    const splitValue = roundValue(cascadeTarget / assignments.length);
    assignments.forEach((assignment, index) => {
      if (index === assignments.length - 1) {
        // Last one gets the remainder to ensure exact sum matching
        const valueForLast = roundValue(
          cascadeTarget - splitValue * (assignments.length - 1),
        );
        setTarget(kpiId, assignment.assigneeId, valueForLast);
      } else {
        setTarget(kpiId, assignment.assigneeId, splitValue);
      }
    });
  };

  if (selectedKPIs.length === 0 || assignments.length === 0) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Target className="w-5 h-5" />
          Target Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedKPIs.map((kpiId) => {
          const kpi = kpis.find((k) => k.kpiId === kpiId);
          if (!kpi) return null;

          const kpiType = detectKPIType(kpi);
          const cleanName = kpi.name;
          const fullParentTarget = roundValue(
            getYearlyTotalFromTargets(kpi.targets || [], kpi.unitType),
          );
          const parentTarget = getCascadeTarget(kpi, fullParentTarget);
          const totalAssigned = roundValue(getTotalAssignedTarget(kpiId));
          const unitLabel = getDetailedUnitLabel(kpi);
          const assignmentMethod = getAssignmentMethodDescription(kpi);
          const mode = kpi.kpiMode || "AGGREGATED";
          const isHybrid = mode === "HYBRID";
          const managerRetentionPercent = Number(
            kpi.managerRetentionPercent || 0,
          );

          return (
            <div key={kpiId} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{cleanName}</h4>
                  <p className="text-sm text-blue-700">{assignmentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-700">
                    {isHybrid ? "Cascade Target" : "Parent Target"}:{" "}
                    {parentTarget} {unitLabel}
                  </p>
                  {isHybrid && (
                    <p className="text-xs text-blue-600">
                      Full target {fullParentTarget} {unitLabel}:{" "}
                      {managerRetentionPercent}% manager /{" "}
                      {100 - managerRetentionPercent}% cascade
                    </p>
                  )}
                  {kpiType === "SUMMABLE" && (
                    <div className="flex flex-col items-end gap-1">
                      <p
                        className={`text-sm ${
                          totalAssigned === parentTarget
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Total Assigned: {totalAssigned} {unitLabel}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAutoSplit(kpiId, parentTarget)}
                        className="text-xs mt-1"
                      >
                        Auto Split
                      </Button>
                    </div>
                  )}
                  {kpiType === "PERCENTAGE" && (
                    <div className="flex flex-col items-end gap-1">
                      <p
                        className={`text-sm ${
                          getAverageAssignedTarget(kpiId) === parentTarget
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Average Assigned: {getAverageAssignedTarget(kpiId)}{" "}
                        {unitLabel}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={parentTarget.toString()}
                          value={bulkAssignmentValues[kpiId] || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setBulkAssignmentValue(kpiId, value);
                          }}
                          className="w-20 text-sm h-8"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const value =
                                bulkAssignmentValues[kpiId] || parentTarget;
                              handleBulkAssignment(kpiId, value);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const value =
                              bulkAssignmentValues[kpiId] || parentTarget;
                            handleBulkAssignment(kpiId, value);
                          }}
                          className="h-8 text-xs"
                        >
                          Bulk Assign
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                {assignments.map((assignment) => {
                  const assigneeName = assignment.assigneeName;

                  const currentTarget =
                    getTargetAssignment(kpiId, assignment.assigneeId) || 0;

                  return (
                    <div
                      key={`${kpiId}-${assignment.assigneeId}`}
                      className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{assigneeName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={
                            currentTarget === 0 ? "" : currentTarget.toString()
                          }
                          onChange={(e) => {
                            const newTarget = parseFloat(e.target.value) || 0;
                            setTarget(kpiId, assignment.assigneeId, newTarget);
                          }}
                          className="w-24 h-9"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">
                          {unitLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {kpiType === "SUMMABLE" && (
                <div
                  className={`flex items-center gap-2 p-2 rounded ${
                    totalAssigned === parentTarget
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {totalAssigned === parentTarget ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {totalAssigned === parentTarget
                      ? "Target allocation matches parent goal"
                      : `Total assigned (${totalAssigned}) must be exactly ${parentTarget} ${unitLabel}`}
                  </span>
                </div>
              )}

              {kpiType === "PERCENTAGE" && (
                <div
                  className={`flex items-center gap-2 p-2 rounded ${
                    getAverageAssignedTarget(kpiId) === parentTarget
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {getAverageAssignedTarget(kpiId) === parentTarget ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {getAverageAssignedTarget(kpiId) === parentTarget
                      ? "Average target matches parent goal"
                      : `Average assigned (${getAverageAssignedTarget(kpiId)}) must follow ${isHybrid ? "cascade target" : "parent goal"} ${parentTarget} ${unitLabel}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
