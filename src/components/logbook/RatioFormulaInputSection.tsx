"use client";

import { Label } from "@/components/ui/label";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Target } from "lucide-react";
import { useMemo } from "react";

interface RatioFormulaInputSectionProps {
  numeratorValue: string;
  denominatorValue: string;
  numeratorLabel?: string | null;
  denominatorLabel?: string | null;
  onNumeratorChange: (value: string) => void;
  onDenominatorChange: (value: string) => void;
  multiplier?: number;
  unitType?: string;
  disabled?: boolean;
  targetValue?: number; // KPI target for achievement calculation
}

export function RatioFormulaInputSection({
  numeratorValue,
  denominatorValue,
  numeratorLabel,
  denominatorLabel,
  onNumeratorChange,
  onDenominatorChange,
  multiplier = 100,
  unitType,
  disabled = false,
  targetValue,
}: RatioFormulaInputSectionProps) {
  // Calculate live preview
  const calculatedResult = useMemo(() => {
    const num = parseFloat(numeratorValue || "0");
    const den = parseFloat(denominatorValue || "0");
    
    if (isNaN(num) || isNaN(den) || den === 0) {
      return null;
    }
    
    return (num / den) * multiplier;
  }, [numeratorValue, denominatorValue, multiplier]);

  // Calculate achievement percentage relative to target
  const achievementInfo = useMemo(() => {
    if (!targetValue || !calculatedResult || targetValue === 0) return null;

    const percentage = (calculatedResult / targetValue) * 100;
    let status: "success" | "warning" | "danger" = "danger";

    if (percentage >= 100) {
      status = "success";
    } else if (percentage >= 75) {
      status = "warning";
    }

    return {
      percentage,
      status,
      achieved: calculatedResult,
      target: targetValue,
    };
  }, [calculatedResult, targetValue]);

  const displayLabel = (label: string | null | undefined, fallback: string) => {
    return label || fallback;
  };

  const getStatusColor = (status: "success" | "warning" | "danger") => {
    switch (status) {
      case "success":
        return "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50";
      case "warning":
        return "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/50";
      case "danger":
        return "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Numerator Input */}
        <div className="space-y-2">
          <Label htmlFor="numerator" className="text-sm font-medium">
            {displayLabel(numeratorLabel, "Numerator")}
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <FormattedNumberInput
            id="numerator"
            value={numeratorValue}
            onValueChange={onNumeratorChange}
            placeholder="0"
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {numeratorLabel 
              ? `Enter ${numeratorLabel.toLowerCase()}`
              : "Enter the numerator value"}
          </p>
        </div>

        {/* Denominator Input */}
        <div className="space-y-2">
          <Label htmlFor="denominator" className="text-sm font-medium">
            {displayLabel(denominatorLabel, "Denominator")}
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <FormattedNumberInput
            id="denominator"
            value={denominatorValue}
            onValueChange={onDenominatorChange}
            placeholder="0"
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {denominatorLabel 
              ? `Enter ${denominatorLabel.toLowerCase()}`
              : "Enter the denominator value (cannot be zero)"}
          </p>
        </div>
      </div>

      {/* Live Calculation Preview */}
      {calculatedResult !== null && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">Calculated Result:</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {calculatedResult.toFixed(2)}
                  {unitType === "PERCENT" && "%"}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {numeratorValue || "0"} ÷ {denominatorValue || "0"} × {multiplier}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Progress Card */}
      {achievementInfo && (
        <Card className={`border ${getStatusColor(achievementInfo.status)}`}>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Achievement Progress</span>
                </div>
                <span className="text-lg font-bold">
                  {achievementInfo.percentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    achievementInfo.status === "success"
                      ? "bg-green-600"
                      : achievementInfo.status === "warning"
                      ? "bg-amber-600"
                      : "bg-red-600"
                  }`}
                  style={{ width: `${Math.min(achievementInfo.percentage, 100)}%` }}
                />
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                {achievementInfo.percentage >= 100
                  ? "🎉 Target achieved!"
                  : achievementInfo.percentage >= 75
                  ? "Keep going! You're almost there."
                  : "Continue working towards your target."}
              </p>

              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Achieved: {achievementInfo.achieved.toFixed(2)}</span>
                <span>Target: {achievementInfo.target.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message for zero denominator */}
      {denominatorValue && parseFloat(denominatorValue) === 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-800 dark:text-red-200 font-medium">
            ⚠️ Denominator cannot be zero. Please enter a valid value.
          </p>
        </div>
      )}

      {/* Helper text */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <span className="font-semibold">💡 Tip:</span> Enter both numerator and denominator values. 
          The result will be calculated automatically. For example, if you achieved 8 out of 10 tasks, 
          enter numerator = 8 and denominator = 10 to get 80%.
        </p>
      </div>
    </div>
  );
}
