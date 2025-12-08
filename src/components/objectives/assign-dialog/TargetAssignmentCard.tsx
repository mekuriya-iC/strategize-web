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
import type { Kpi, Division, Department, Employee } from "@/types/graphql";

// Helper to round numbers to max 2 decimal places
const roundValue = (value: number): number => Math.round(value * 100) / 100;

interface Assignment {
  assigneeId: string;
  assigneeType: "DIVISION" | "DEPARTMENT" | "PERSONNEL";
  assigneeName: string;
  kpis: string[];
}

interface TargetAssignmentCardProps {
  selectedKPIs: string[];
  kpis: Kpi[];
  assignments: Assignment[];
  bulkAssignmentValues: Record<string, number>;
  onBulkAssignmentValueChange: (kpiId: string, value: number) => void;
  onBulkAssignment: (kpiId: string, value: number) => void;
  getTargetAssignment: (kpiId: string, assigneeId: string) => number | null;
  getTotalAssignedTarget: (kpiId: string) => number;
  getYearlyTotalFromTargets: (targets: Array<{ timeline: string; target: number }>) => number;
  updateTargetAssignment: (kpiId: string, assigneeId: string, value: number, kpi: Kpi) => void;
  getAssigneeDetails: (assigneeId: string, type: "DIVISION" | "DEPARTMENT" | "PERSONNEL") => Division | Department | Employee | null | undefined;
}

export function TargetAssignmentCard({
  selectedKPIs,
  kpis,
  assignments,
  bulkAssignmentValues,
  onBulkAssignmentValueChange,
  onBulkAssignment,
  getTargetAssignment,
  getTotalAssignedTarget,
  getYearlyTotalFromTargets,
  updateTargetAssignment,
  getAssigneeDetails,
}: TargetAssignmentCardProps) {
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
          const parentTarget = roundValue(getYearlyTotalFromTargets(kpi.targets || []));
          const totalAssigned = roundValue(getTotalAssignedTarget(kpiId));
          const unitLabel = getDetailedUnitLabel(kpi);
          const assignmentMethod = getAssignmentMethodDescription(kpi);

          return (
            <div key={kpiId} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{cleanName}</h4>
                  <p className="text-sm text-blue-700">{assignmentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-700">
                    Parent Target: {parentTarget} {unitLabel}
                  </p>
                  {kpiType === "SUMMABLE" && (
                    <p
                      className={`text-sm ${
                        totalAssigned === parentTarget
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Total Assigned: {totalAssigned} {unitLabel}
                    </p>
                  )}
                  {kpiType === "PERCENTAGE" && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={parentTarget.toString()}
                        value={bulkAssignmentValues[kpiId] || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          onBulkAssignmentValueChange(kpiId, value);
                        }}
                        className="w-20 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = bulkAssignmentValues[kpiId] || parentTarget;
                            onBulkAssignment(kpiId, value);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const value = bulkAssignmentValues[kpiId] || parentTarget;
                          onBulkAssignment(kpiId, value);
                        }}
                        className="text-xs"
                      >
                        Bulk Assign
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                {assignments.map((assignment) => {
                  const assignee = getAssigneeDetails(
                    assignment.assigneeId,
                    assignment.assigneeType
                  );
                  const assigneeName =
                    assignment.assigneeType === "PERSONNEL"
                      ? (assignee as Employee)?.fullName || ""
                      : (assignee as Division | Department)?.name || "";

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
                          value={currentTarget === 0 ? "" : currentTarget.toString()}
                          onChange={(e) => {
                            const newTarget = parseFloat(e.target.value) || 0;
                            updateTargetAssignment(
                              kpiId,
                              assignment.assigneeId,
                              newTarget,
                              kpi
                            );
                          }}
                          className="w-24"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">{unitLabel}</span>
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
                      ? "Target allocation is valid"
                      : `Target allocation must equal ${parentTarget} ${unitLabel}`}
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

