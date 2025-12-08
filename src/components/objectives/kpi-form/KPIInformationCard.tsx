"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  KpiWeightType,
  Objective as GraphQLObjective,
} from "@/types/graphql";
import type { KPIFormData } from "@/hooks/useKPIFormState";

interface KPIInformationCardProps {
  formData: KPIFormData;
  parentId: string;
  candidateParentKPIs: Array<{ kpiId: string; name: string }>;
  objective?: GraphQLObjective;
  canEditStructure: boolean;
  kpiId?: string | null;
  onInputChange: (field: string, value: string) => void;
  onParentIdChange: (value: string) => void;
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
}: KPIInformationCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>KPI Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parent KPI Selector */}
        {objective?.parent && (
          <div>
            <Label htmlFor="parent-kpi">Strategic KPI (Parent)</Label>
            <Select
              value={parentId}
              onValueChange={onParentIdChange}
              disabled={!canEditStructure}
            >
              <SelectTrigger id="parent-kpi">
                <SelectValue placeholder="Select strategic KPI (optional)" />
              </SelectTrigger>
              <SelectContent>
                {candidateParentKPIs.map((pk) => (
                  <SelectItem key={pk.kpiId} value={pk.kpiId}>
                    {pk.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Link this KPI to a corporate KPI. You can create multiple child
              KPIs for the same strategic KPI.
            </p>
            {parentId && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Auto-populated from parent KPI
              </p>
            )}
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
            <Label htmlFor="baseline">Baseline Value</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="baseline"
                type="number"
                step="0.01"
                value={formData.baseline}
                onChange={(e) => onInputChange("baseline", e.target.value)}
                placeholder="Enter baseline value"
                disabled={!canEditStructure}
              />
              <div>
                <Label className="sr-only" htmlFor="baseline-unit">
                  Unit Type
                </Label>
                <Select
                  key={`baseline-unit-${kpiId}-${formData.weightType}`}
                  value={formData.weightType}
                  onValueChange={(value: KpiWeightType) =>
                    onInputChange("weightType", value)
                  }
                  disabled={!canEditStructure}
                >
                  <SelectTrigger id="baseline-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMBER">Number</SelectItem>
                    <SelectItem value="PERCENT">Percent</SelectItem>
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

