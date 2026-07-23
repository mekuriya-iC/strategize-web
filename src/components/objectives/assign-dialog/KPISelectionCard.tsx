"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KpiModeBadge } from "@/components/kpis/KpiModeBadge";

import { useAssignmentContext } from "@/context/AssignmentContext";

export function KPISelectionCard() {
  const {
    availableKPIs: kpis,
    selectedKPIs,
    toggleKPI,
    selectAllKPIs,
  } = useAssignmentContext();

  const assignableKPIs = kpis.filter(
    (kpi) => (kpi.kpiMode || "AGGREGATED") !== "DIRECT",
  );
  const allAssignableSelected =
    assignableKPIs.length > 0 &&
    assignableKPIs.every((kpi) => selectedKPIs.includes(kpi.kpiId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select KPIs to Assign</span>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allAssignableSelected}
              disabled={assignableKPIs.length === 0}
              onCheckedChange={selectAllKPIs}
            />
            <Label className="text-sm">Select All</Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {kpis.map((kpi) => {
            const mode = kpi.kpiMode || "AGGREGATED";
            const isDirect = mode === "DIRECT";

            return (
              <div
                key={kpi.kpiId}
                className={`flex items-center space-x-3 p-3 border rounded-lg ${isDirect ? "bg-gray-50 opacity-70" : ""}`}
              >
                <Checkbox
                  checked={selectedKPIs.includes(kpi.kpiId)}
                  disabled={isDirect}
                  onCheckedChange={(checked) =>
                    toggleKPI(kpi.kpiId, checked as boolean)
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{kpi.name}</h4>
                    <KpiModeBadge mode={mode} size="sm" />
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Baseline: {kpi.baseline || "N/A"}</span>
                    <span>Weight: {kpi.weight}%</span>
                    <span>Targets: {kpi.targets?.length || 0}</span>
                    {mode === "HYBRID" && kpi.managerRetentionPercent && (
                      <span>
                        Cascade portion: {100 - kpi.managerRetentionPercent}%
                      </span>
                    )}
                    {kpi.calculationBasisSource === "DIRECT_VALUE" && (
                      <span>Approved denominator allocation required</span>
                    )}
                    {kpi.calculationBasisSource === "LINKED_KPI" && (
                      <span className="text-blue-700">
                        Requires linked denominator KPI:{" "}
                        {kpis.find(
                          (candidate) =>
                            candidate.kpiId === kpi.weightingBasisKpiId,
                        )?.name || "not available in this objective"}
                      </span>
                    )}
                    {isDirect && <span>Direct KPI: not cascaded</span>}
                  </div>
                </div>
                <Badge
                  variant={kpi.status === "APPROVED" ? "default" : "secondary"}
                >
                  {kpi.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
