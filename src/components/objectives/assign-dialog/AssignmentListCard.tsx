"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import type { Kpi } from "@/types/graphql";

interface Assignment {
  assigneeId: string;
  assigneeType: "DIVISION" | "DEPARTMENT" | "PERSONNEL";
  assigneeName: string;
  kpis: string[];
}

interface AssignmentListCardProps {
  assignments: Assignment[];
  kpis: Kpi[];
  onRemoveAssignment: (index: number) => void;
}

export function AssignmentListCard({
  assignments,
  kpis,
  onRemoveAssignment,
}: AssignmentListCardProps) {
  if (assignments.length === 0) {
    return null;
  }

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          Assignment List ({assignments.length} assignments)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-60 overflow-y-auto space-y-2">
          {assignments.map((assignment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-300"
                  >
                    {assignment.assigneeType}
                  </Badge>
                  <h4 className="font-medium">{assignment.assigneeName}</h4>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {assignment.kpis.length} KPI
                  {assignment.kpis.length > 1 ? "s" : ""}:{" "}
                  {assignment.kpis
                    .map((kpiId) => {
                      const kpi = kpis.find((k) => k.kpiId === kpiId);
                      return kpi?.name;
                    })
                    .join(", ")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveAssignment(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

