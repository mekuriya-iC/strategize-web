"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import type { Objective, Kpi } from "@/types/graphql";

interface Assignment {
  assigneeId: string;
  assigneeType: "DIVISION" | "DEPARTMENT" | "PERSONNEL";
  assigneeName: string;
  kpis: string[];
}

interface AssignmentPreviewCardProps {
  assignments: Assignment[];
  kpis: Kpi[];
  allObjectives: Objective[];
  objective: Objective;
  getAssigneeObjectiveType: () => string;
}

export function AssignmentPreviewCard({
  assignments,
  kpis,
  allObjectives,
  objective,
  getAssigneeObjectiveType,
}: AssignmentPreviewCardProps) {
  if (assignments.length === 0) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Info className="w-5 h-5" />
          Assignment Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.map((assignment) => {
          // Calculate preview for each assignment
          const existingObjective = allObjectives?.find(
            (obj) =>
              obj.assigneeType === getAssigneeObjectiveType() &&
              obj.assigneeId === assignment.assigneeId &&
              obj.parent?.objectiveId === objective.objectiveId
          );

          // Get existing KPIs if objective exists
          const existingKPIs = existingObjective?.kpis || [];

          // Check which selected KPIs already exist
          const selectedKPIObjects = kpis.filter((k) =>
            assignment.kpis.includes(k.kpiId)
          );
          const existingSelectedKPIs = selectedKPIObjects.filter((k) =>
            existingKPIs.some((existing) => existing.name === k.name)
          );
          const newKPIs = selectedKPIObjects.filter(
            (k) => !existingKPIs.some((existing) => existing.name === k.name)
          );

          const preview = {
            assigneeId: assignment.assigneeId,
            assigneeName: assignment.assigneeName,
            existingObjective,
            existingKPIs: existingKPIs.map((k) => k.name),
            existingSelectedKPIs: existingSelectedKPIs.map((k) => k.name),
            newKPIs: newKPIs.map((k) => k.name),
            willCreate: !existingObjective,
            willAdd: existingObjective && newKPIs.length > 0,
            willSkip: existingObjective && newKPIs.length === 0,
            hasWarnings: existingSelectedKPIs.length > 0,
          };

          return (
            <div
              key={preview.assigneeId}
              className="p-3 bg-white border border-blue-200 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-blue-900">
                  {preview.assigneeName}
                </h4>
                {preview.willCreate && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-300"
                  >
                    ➕ New Objective
                  </Badge>
                )}
                {preview.willAdd && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-300"
                  >
                    ➕ Add New KPIs
                  </Badge>
                )}
                {preview.willSkip && (
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-700 border-gray-300"
                  >
                    ⏭️ Skip (All Exist)
                  </Badge>
                )}
                {preview.hasWarnings && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-700 border-yellow-300"
                  >
                    ⚠️ Duplicates Found
                  </Badge>
                )}
              </div>

              <div className="space-y-1 text-sm">
                {preview.willCreate && (
                  <div className="text-green-700">
                    ➕ Will create new objective with {preview.newKPIs.length} KPI
                    {preview.newKPIs.length > 1 ? "s" : ""}:{" "}
                    {preview.newKPIs.join(", ")}
                  </div>
                )}

                {preview.willAdd && (
                  <div className="text-green-700">
                    ➕ Will add {preview.newKPIs.length} new KPI
                    {preview.newKPIs.length > 1 ? "s" : ""} to existing
                    objective: {preview.newKPIs.join(", ")}
                  </div>
                )}
                {preview.willSkip && (
                  <div className="text-gray-700">
                    ⏭️ Will skip assignment: All KPIs already assigned to{" "}
                    {preview.assigneeName}
                  </div>
                )}

                {preview.hasWarnings && (
                  <div className="text-yellow-700">
                    ⚠️ Will skip {preview.existingSelectedKPIs.length} existing
                    KPI
                    {preview.existingSelectedKPIs.length > 1 ? "s" : ""}:{" "}
                    {preview.existingSelectedKPIs.join(", ")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

