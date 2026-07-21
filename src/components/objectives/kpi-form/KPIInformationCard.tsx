"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type {
  KpiWeightType,
  Objective as GraphQLObjective,
} from "@/types/graphql";
import type { KPIFormData } from "@/hooks/objectives/useKPIFormState";

interface KPIInformationCardProps {
  formData: KPIFormData;
  parentId: string;
  candidateParentKPIs: Array<{ kpiId: string; name: string }>;
  objective?: GraphQLObjective;
  canEditStructure: boolean;
  kpiId?: string | null;
  onInputChange: (field: string, value: string) => void;
  onParentIdChange: (value: string) => void;
  mode?: "create" | "edit";
  hideParentSelector?: boolean;
}

export function KPIInformationCard({
  formData,
  parentId,
  candidateParentKPIs,
  objective,
  canEditStructure,
  kpiId,
  onInputChange,
  onParentIdChange,
  mode = "create",
  hideParentSelector = false,
}: KPIInformationCardProps) {
  const unitPlaceholder = (() => {
    switch (formData.unitType) {
      case "PERCENT":
        return "e.g., 75";
      case "CURRENCY":
        return "e.g., 283,654,789";
      case "HOUR":
        return "e.g., 300";
      case "RATIO":
        return "e.g., 1.5";
      case "COUNT":
        return "e.g., 100";
      case "NUMBER":
      default:
        return "e.g., 100";
    }
  })();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>KPI Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parent KPI Selector */}
        {!hideParentSelector && objective?.parent && (
          <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Label
                htmlFor="parent-kpi"
                className="text-gray-900 font-semibold"
              >
                Strategic KPI (Parent Reference)
              </Label>
              {objective.type !== "CORPORATE" && (
                <Badge variant="outline" className="text-[10px] bg-white">
                  Cascading Optional
                </Badge>
              )}
            </div>
            <Select
              value={parentId}
              onValueChange={onParentIdChange}
              disabled={!canEditStructure}
            >
              <SelectTrigger id="parent-kpi" className="bg-white">
                <SelectValue placeholder="Skip to create an independent KPI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none_standalone">
                  -- Create Independent KPI (No Parent) --
                </SelectItem>
                {candidateParentKPIs.map((pk) => (
                  <SelectItem key={pk.kpiId} value={pk.kpiId}>
                    {pk.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              {parentId
                ? "Linked to a higher-level goal. Baseline and weight are inherited."
                : "Creation of a new standalone KPI. You will define your own weight and baseline."}
            </p>
            {!canEditStructure && (
              <p className="text-xs text-orange-600 mt-1">
                Parent selection is locked after approval
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KPI Name */}
          <div>
            <Label htmlFor="name">KPI Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              placeholder="Enter KPI name"
              disabled={!canEditStructure}
            />
            {parentId && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Auto-populated from parent KPI
              </p>
            )}
            {!canEditStructure && (
              <p className="text-xs text-orange-600 mt-1">
                KPI name is locked after approval
              </p>
            )}
          </div>

          {/* Baseline Value */}
          <div>
            <Label htmlFor="baseline">Baseline Value (Optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <FormattedNumberInput
                id="baseline"
                step="0.01"
                value={formData.baseline}
                onValueChange={(value) => onInputChange("baseline", value)}
                currency={formData.unitType === "CURRENCY"}
                placeholder={unitPlaceholder}
                disabled={!canEditStructure}
              />
              <div>
                <Label className="sr-only" htmlFor="baseline-unit">
                  Unit Type
                </Label>
                <Select
                  key={`baseline-unit-${kpiId}-${formData.unitType}`}
                  value={formData.unitType}
                  onValueChange={(value: string) =>
                    onInputChange("unitType", value)
                  }
                  disabled={!canEditStructure}
                >
                  <SelectTrigger id="baseline-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMBER">Number (#)</SelectItem>
                    <SelectItem value="PERCENT">Percent (%)</SelectItem>
                    <SelectItem value="CURRENCY">Currency (ETB)</SelectItem>
                    <SelectItem value="HOUR">Hours (hrs)</SelectItem>
                    <SelectItem value="RATIO">Ratio (x:y)</SelectItem>
                    <SelectItem value="COUNT">Count (n)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Note: This unit type applies to baseline, weight, and targets
            </p>
            {parentId && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Auto-populated from parent KPI
              </p>
            )}
            {!canEditStructure && (
              <p className="text-xs text-orange-600 mt-1">
                Baseline and unit type are locked after approval
              </p>
            )}
          </div>

          {/* Weight */}
          <div>
            <Label htmlFor="weight">Weight (%)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              min="0"
              value={formData.weight}
              onChange={(e) => onInputChange("weight", e.target.value)}
              placeholder="Enter weight (decimal values allowed)"
              disabled={!canEditStructure}
            />
            {parentId && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Auto-populated from parent KPI
              </p>
            )}
            {!canEditStructure && (
              <p className="text-xs text-orange-600 mt-1">
                Weight is locked after approval
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
