"use client";

import { Label } from "@/components/ui/label";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface DirectValueInputSectionProps {
  value: string;
  onChange: (value: string) => void;
  targetValue?: number;
  unitType?: string;
  measurementUnit?: string;
  disabled?: boolean;
  label?: string;
}

export function DirectValueInputSection({
  value,
  onChange,
  targetValue,
  unitType,
  measurementUnit,
  disabled = false,
  label,
}: DirectValueInputSectionProps) {
  // Calculate achievement percentage relative to target
  const achievementInfo = useMemo(() => {
    if (!targetValue || !value) return null;

    const actual = parseFloat(value);
    if (isNaN(actual)) return null;

    const percentage = (actual / targetValue) * 100;
    const status = 
      percentage >= 100 ? "success" : 
      percentage >= 75 ? "warning" : 
      "danger";

    return { percentage, status, actual };
  }, [value, targetValue]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
      case "warning":
        return "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800";
      case "danger":
        return "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
      default:
        return "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800";
    }
  };

  const displayUnit = measurementUnit || (unitType === "PERCENT" ? "%" : "");

  return (
    <div className="space-y-4">
      {/* Achievement Value Input */}
      <div className="space-y-2">
        <Label htmlFor="achievementValue" className="text-sm font-medium">
          {label || "Achievement Value"}
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <FormattedNumberInput
          id="achievementValue"
          value={value}
          onValueChange={onChange}
          placeholder="0"
          disabled={disabled}
          className="w-full text-lg"
        />
        <p className="text-xs text-muted-foreground">
          Enter your actual achievement{displayUnit && ` in ${displayUnit}`}
        </p>
      </div>

      {/* Target Reference Card */}
      {targetValue !== undefined && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">Your Target:</span>
              </div>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {targetValue.toFixed(2)}{unitType === "PERCENT" ? "%" : ""}
                {displayUnit && unitType !== "PERCENT" && ` ${displayUnit}`}
              </span>
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
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Progress:</span>
                </div>
                <span className="text-lg font-bold">
                  {achievementInfo.percentage.toFixed(1)}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helper Text */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <span className="font-semibold">💡 Tip:</span> Enter the actual value you achieved for this period.
          {targetValue && (
            <>
              {" "}Your target is {targetValue}{unitType === "PERCENT" ? "%" : ""}{displayUnit && unitType !== "PERCENT" && ` ${displayUnit}`}.
            </>
          )}
          {unitType === "PERCENT" 
            ? " For percentages, enter the numeric value (e.g., enter 85 for 85%)."
            : " Make sure to use the correct unit of measurement."}
        </p>
      </div>
    </div>
  );
}
