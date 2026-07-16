"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, User, GitMerge } from "lucide-react";

interface KpiModeSelectorProps {
  mode: string;
  onModeChange: (mode: string) => void;
  retentionPercent: string;
  onRetentionChange: (percent: string) => void;
  targetValue?: string;
}

export function KpiModeSelector({
  mode,
  onModeChange,
  retentionPercent,
  onRetentionChange,
  targetValue = "0",
}: KpiModeSelectorProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
      <div className="space-y-1">
        <Label className="text-base font-semibold">Performance Tracking Mode</Label>
        <p className="text-sm text-muted-foreground">
          Choose how achievement is calculated: DIRECT uses logs entered against this KPI,
          HYBRID combines direct work with child KPI results, and AGGREGATED uses child KPI
          results only.
        </p>
      </div>
      <RadioGroup value={mode} onValueChange={onModeChange}>
        <div className="space-y-3">
          {/* AGGREGATED */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <RadioGroupItem value="AGGREGATED" id="mode-aggregated" className="mt-1" />
            <label htmlFor="mode-aggregated" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Aggregated</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">Team Results</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Performance is calculated only from child KPIs. This mode requires child KPIs;
                direct achievement logs on this KPI are not used.
              </p>
            </label>
          </div>

          {/* DIRECT */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white dark:bg-slate-800 hover:border-green-300 dark:hover:border-green-700 transition-colors">
            <RadioGroupItem value="DIRECT" id="mode-direct" className="mt-1" />
            <label htmlFor="mode-direct" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-green-600" />
                <span className="font-medium">Direct</span>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">Personal Work</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Manager logs achievements directly. For personal responsibilities like partnerships or strategic work.
              </p>
            </label>
          </div>

          {/* HYBRID */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
            <RadioGroupItem value="HYBRID" id="mode-hybrid" className="mt-1" />
            <label htmlFor="mode-hybrid" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <GitMerge className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Hybrid</span>
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">Shared</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Both manager and subordinates contribute. Manager retains a portion for direct work.
              </p>
            </label>
          </div>
        </div>
      </RadioGroup>

      {mode === "AGGREGATED" && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950/20">
          <AlertDescription className="text-xs">
            Aggregated KPIs must have child KPIs contributing results. Do not use this mode
            when achievement will be logged directly against this KPI.
          </AlertDescription>
        </Alert>
      )}

      {/* Manager Retention Slider for HYBRID mode */}
      {mode === "HYBRID" && (
        <div className="mt-4 p-4 border rounded-lg bg-white dark:bg-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Manager Retention</Label>
            <span className="text-2xl font-bold text-purple-600">
              {retentionPercent || 30}%
            </span>
          </div>
          <Slider
            value={[parseFloat(retentionPercent) || 30]}
            onValueChange={([val]) => onRetentionChange(val.toString())}
            min={1}
            max={99}
            step={1}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/20">
              <div className="font-medium text-purple-700 dark:text-purple-300">Manager's Portion</div>
              <div className="text-xs text-muted-foreground">
                {retentionPercent || 30}% of {targetValue} = {((parseFloat(targetValue) || 0) * (parseFloat(retentionPercent) || 30) / 100).toFixed(2)}
              </div>
            </div>
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20">
              <div className="font-medium text-blue-700 dark:text-blue-300">Team's Portion</div>
              <div className="text-xs text-muted-foreground">
                {100 - (parseFloat(retentionPercent) || 30)}% of {targetValue} = {((parseFloat(targetValue) || 0) * (100 - (parseFloat(retentionPercent) || 30)) / 100).toFixed(2)}
              </div>
            </div>
          </div>
          <Alert>
            <AlertDescription className="text-xs">
              Manager will log achievements for their portion. The team portion cascades to subordinates.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

export default KpiModeSelector;
