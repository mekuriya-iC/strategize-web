"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle, AlertCircle } from "lucide-react";
import { getDetailedUnitLabel } from "@/utils/unitTypeDetection";
import {
  getTargetAssignmentDescription,
  getTargetAssignmentStrategy,
} from "@/lib/objectives/targetAssignmentStrategy";
import type { Kpi } from "@/types/graphql";
import {
  calculateRequiredNumerator,
  decimalValuesEqualTotal,
  formatBasisNumber,
  multiplyBasisByPercent,
  splitBasisAmong,
} from "@/utils/basisCalculation";

// Helper to round numbers to max 2 decimal places
const roundValue = (value: number): number => Math.round(value * 100) / 100;

import { useAssignmentContext } from "@/context/AssignmentContext";

export function TargetAssignmentCard() {
  const {
    availableKPIs: kpis,
    assignments,
    bulkAssignmentValues,
    setBulkAssignmentValue,
    targets, // We use this to lookup current values
    setTarget, // Replaces updateTargetAssignment
    directBasisAllocations,
    setDirectBasisAllocation,
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
    assignments
      .filter((assignment) => assignment.kpis.includes(kpiId))
      .forEach((assignment) => {
        const val = targets[kpiId]?.[assignment.assigneeId] || 0;
        total += val;
      });
    return roundValue(total);
  };

  const rateTargetsRepeat = (kpiId: string, expectedTarget: number) => {
    const assigned = assignments.filter((assignment) =>
      assignment.kpis.includes(kpiId),
    );
    return (
      assigned.length > 0 &&
      assigned.every((assignment) =>
        Math.abs(
          Number(targets[kpiId]?.[assignment.assigneeId] || 0) - expectedTarget,
        ) <= 0.01,
      )
    );
  };

  const allTargetsEntered = (kpiId: string) => {
    const assigned = assignments.filter((assignment) =>
      assignment.kpis.includes(kpiId),
    );
    return (
      assigned.length > 0 &&
      assigned.every(
        (assignment) => targets[kpiId]?.[assignment.assigneeId] != null,
      )
    );
  };

  const getAverageAssignedTarget = (kpiId: string) => {
    const assigned = assignments.filter((assignment) =>
      assignment.kpis.includes(kpiId),
    );
    if (assigned.length === 0) return 0;
    return (
      assigned.reduce(
        (sum, assignment) =>
          sum + Number(targets[kpiId]?.[assignment.assigneeId] || 0),
        0,
      ) / assigned.length
    );
  };

  const handleBulkAssignment = (kpiId: string, value: number) => {
    assignments.forEach((assignment) => {
      setTarget(kpiId, assignment.assigneeId, value);
    });
  };

  const getCascadeTarget = (kpi: Kpi, fullTarget: number): number => {
    if (kpi.unitType === "PERCENT" || kpi.unitType === "RATIO") {
      return fullTarget;
    }
    const mode = kpi.kpiMode || "AGGREGATED";
    if (mode !== "HYBRID") return fullTarget;

    const retentionPercent = Number(kpi.managerRetentionPercent || 0);
    const cascadePercent = Math.max(0, 100 - retentionPercent);
    return roundValue((fullTarget * cascadePercent) / 100);
  };

  const handleAutoSplit = (kpiId: string, cascadeTarget: number) => {
    const assigned = assignments.filter((assignment) =>
      assignment.kpis.includes(kpiId),
    );
    if (assigned.length === 0) return;
    const splitValue = roundValue(cascadeTarget / assigned.length);
    assigned.forEach((assignment, index) => {
      if (index === assigned.length - 1) {
        // Last one gets the remainder to ensure exact sum matching
        const valueForLast = roundValue(
          cascadeTarget - splitValue * (assigned.length - 1),
        );
        setTarget(kpiId, assignment.assigneeId, valueForLast);
      } else {
        setTarget(kpiId, assignment.assigneeId, splitValue);
      }
    });
  };

  const handleAutoSplitBasis = (
    kpiId: string,
    cascadeBasis: string,
    assigned: typeof assignments,
  ) => {
    splitBasisAmong(cascadeBasis, assigned.length).forEach((value, index) => {
      setDirectBasisAllocation(kpiId, assigned[index].assigneeId, value);
    });
  };

  const assignedKpiIds = [
    ...new Set(assignments.flatMap((assignment) => assignment.kpis)),
  ];

  if (assignedKpiIds.length === 0 || assignments.length === 0) {
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
        {assignedKpiIds.map((kpiId) => {
          const kpi = kpis.find((k) => k.kpiId === kpiId);
          if (!kpi) return null;

          const assignmentStrategy = getTargetAssignmentStrategy(kpi);
          const isDirectBasis = assignmentStrategy === "DIRECT_BASIS_RATE";
          const requiresRepeatedRate =
            assignmentStrategy === "REPEATED_RATE" ||
            assignmentStrategy === "LINKED_BASIS_RATE";
          const isAdditive = assignmentStrategy === "ADDITIVE_SUM";
          const isScoreAverage = assignmentStrategy === "SCORE_AVERAGE";
          const usesChildSpecificTargets =
            assignmentStrategy === "FORMULA_RATIO" ||
            assignmentStrategy === "FORMULA_RESULT" ||
            assignmentStrategy === "WEIGHTED_COMPONENT_RATE";
          const kpiAssignments = assignments.filter((assignment) =>
            assignment.kpis.includes(kpiId),
          );
          if (kpiAssignments.length === 0) return null;
          const isCurrency = kpi.unitType === "CURRENCY";
          const formatTarget = (value: number) =>
            isCurrency ? value.toLocaleString() : value;
          const cleanName = kpi.name;
          const fullParentTarget = roundValue(
            getYearlyTotalFromTargets(kpi.targets || [], kpi.unitType) ||
              Number(kpi.targetValue || 0),
          );
          const parentTarget = getCascadeTarget(kpi, fullParentTarget);
          const totalAssigned = roundValue(getTotalAssignedTarget(kpiId));
          const unitLabel = getDetailedUnitLabel(kpi);
          const assignmentMethod =
            getTargetAssignmentDescription(assignmentStrategy);
          const assignedAverage = getAverageAssignedTarget(kpiId);
          const everyTargetEntered = allTargetsEntered(kpiId);
          const scoreAverageMatches =
            everyTargetEntered &&
            Math.abs(assignedAverage - parentTarget) <= 0.01;
          const mode = kpi.kpiMode || "AGGREGATED";
          const isHybrid = mode === "HYBRID";
          const managerRetentionPercent = Number(
            kpi.managerRetentionPercent || 0,
          );
          const cascadeBasisString = isHybrid
            ? multiplyBasisByPercent(
                kpi.directBasisValue || "0",
                Math.max(0, 100 - managerRetentionPercent),
              ) || "0"
            : kpi.directBasisValue || "0";
          const cascadeBasis = Number(cascadeBasisString);
          const assignedBasisValues = kpiAssignments.map(
            (assignment) =>
              directBasisAllocations[kpiId]?.[assignment.assigneeId] || "",
          );
          const basisReconciles =
            isDirectBasis &&
            decimalValuesEqualTotal(cascadeBasisString, assignedBasisValues);

          return (
            <div key={kpiId} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{cleanName}</h4>
                  <p className="text-sm text-blue-700">
                    {assignmentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-700">
                    {isHybrid ? "Cascade Target" : "Parent Target"}:{" "}
                    {formatTarget(parentTarget)} {unitLabel}
                  </p>
                  {isHybrid && (
                    <p className="text-xs text-blue-600">
                      {isDirectBasis
                        ? `${managerRetentionPercent}% of the basis stays with the manager; ${100 - managerRetentionPercent}% is allocated to the team.`
                        : `Full target ${formatTarget(fullParentTarget)} ${unitLabel}: ${managerRetentionPercent}% manager / ${100 - managerRetentionPercent}% cascade`}
                    </p>
                  )}
                  {isDirectBasis && (
                    <div className="mt-1 flex flex-col items-end gap-1">
                      <p className={basisReconciles ? "text-sm text-green-600" : "text-sm text-red-600"}>
                        Approved denominator allocated: {formatBasisNumber(
                          assignedBasisValues.reduce((sum, value) => sum + (Number(value) || 0), 0),
                        )} / {formatBasisNumber(cascadeBasis)} {kpi.basisUnitType || ""}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => handleAutoSplitBasis(kpiId, cascadeBasisString, kpiAssignments)}
                        className="text-xs"
                      >
                        Auto-split approved denominator
                      </Button>
                    </div>
                  )}
                  {isAdditive && (
                    <div className="flex flex-col items-end gap-1">
                      <p
                        className={`text-sm ${
                          totalAssigned === parentTarget
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Total Assigned: {formatTarget(totalAssigned)} {unitLabel}
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
                  {requiresRepeatedRate && (
                    <div className="flex flex-col items-end gap-1">
                      <p
                        className={`text-sm ${
                          rateTargetsRepeat(kpiId, parentTarget)
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Rate target must repeat for every assignee: {parentTarget}{" "}
                        {unitLabel}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          step="any"
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
                  {isScoreAverage && (
                    <p
                      className={`mt-1 text-sm ${
                        scoreAverageMatches ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      Child score average: {roundValue(assignedAverage)} / {parentTarget}{" "}
                      {unitLabel}
                    </p>
                  )}
                  {usesChildSpecificTargets && (
                    <p
                      className={`mt-1 text-sm ${
                        everyTargetEntered ? "text-green-600" : "text-amber-700"
                      }`}
                    >
                      {everyTargetEntered
                        ? "Every child has its own expected target."
                        : "Enter an expected target for every child."}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                {kpiAssignments.map((assignment) => {
                  const assigneeName = assignment.assigneeName;

                  const currentTarget =
                    targets[kpiId]?.[assignment.assigneeId] ?? null;

                  return (
                    <div
                      key={`${kpiId}-${assignment.assigneeId}`}
                      className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{assigneeName}</p>
                      </div>
                      {isDirectBasis ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <FormattedNumberInput
                              step="any"
                              value={
                                directBasisAllocations[kpiId]?.[
                                  assignment.assigneeId
                                ] || ""
                              }
                              currency={kpi.basisUnitType === "CURRENCY"}
                              onValueChange={(value) =>
                                setDirectBasisAllocation(
                                  kpiId,
                                  assignment.assigneeId,
                                  value,
                                )
                              }
                              className="w-40 h-9"
                              placeholder="Approved denominator allocation"
                            />
                            <span className="text-sm text-gray-600">
                              {kpi.basisUnitType || "basis"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Target {kpi.unitType === "RATIO" ? `${parentTarget}:1` : `${parentTarget}%`} · Required {kpi.numeratorLabel || "numerator"}: {formatBasisNumber(
                              calculateRequiredNumerator(
                                parentTarget,
                                directBasisAllocations[kpiId]?.[
                                  assignment.assigneeId
                                ] || "",
                                kpi.unitType,
                              ),
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FormattedNumberInput
                            step="any"
                            value={
                              currentTarget == null ? "" : currentTarget.toString()
                            }
                            currency={isCurrency}
                            onValueChange={(value) => {
                              const normalized = value.trim();
                              setTarget(
                                kpiId,
                                assignment.assigneeId,
                                normalized === "" ? null : Number(normalized),
                              );
                            }}
                            className="w-32 h-9"
                            placeholder={isCurrency ? "283,654,789" : "0"}
                          />
                          <span className="text-sm text-gray-600">
                            {unitLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isAdditive && (
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
                      : `Total assigned (${formatTarget(totalAssigned)}) must be exactly ${formatTarget(parentTarget)} ${unitLabel}`}
                  </span>
                </div>
              )}

              {isDirectBasis && (
                <div
                  className={`flex items-center gap-2 p-2 rounded ${
                    basisReconciles
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {basisReconciles ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {basisReconciles
                      ? "Approved denominator allocation matches the parent cascade denominator exactly."
                      : `Approved denominator allocations must sum exactly to ${formatBasisNumber(cascadeBasis)} ${kpi.basisUnitType || ""}.`}
                  </span>
                </div>
              )}

              {requiresRepeatedRate && (
                <div
                  className={`flex items-center gap-2 p-2 rounded ${
                    rateTargetsRepeat(kpiId, parentTarget)
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {rateTargetsRepeat(kpiId, parentTarget) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {rateTargetsRepeat(kpiId, parentTarget)
                      ? "The same rate target is assigned to every child."
                      : `Every assignee must receive the ${isHybrid ? "cascade" : "parent"} rate target ${parentTarget} ${unitLabel}; this manual rate is repeated, not split.`}
                  </span>
                </div>
              )}

              {isScoreAverage && (
                <div
                  className={`flex items-center gap-2 rounded p-2 ${
                    scoreAverageMatches
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {scoreAverageMatches ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {scoreAverageMatches
                      ? "The simple average of all child score targets matches the parent target."
                      : `The simple average of all child score targets (${roundValue(assignedAverage)} ${unitLabel}) must equal ${parentTarget} ${unitLabel}.`}
                  </span>
                </div>
              )}

              {usesChildSpecificTargets && (
                <div
                  className={`flex items-center gap-2 rounded p-2 ${
                    everyTargetEntered
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {everyTargetEntered ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {assignmentStrategy === "FORMULA_RATIO"
                      ? "Child targets may differ. Parent achievement is calculated as sum of child numerators divided by sum of child denominators; child rates are never averaged."
                      : assignmentStrategy === "WEIGHTED_COMPONENT_RATE"
                        ? "Child targets may differ. Parent achievement uses the configured weighting basis, not a simple average of child rates."
                        : "Child targets may differ. Each child must reconcile its target from the inherited approved formula and source plans."}
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
