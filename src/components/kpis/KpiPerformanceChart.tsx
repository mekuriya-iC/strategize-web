"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";

interface KpiUpdate {
  kpiUpdateId: string;
  achievedValue: number;
  progressPercentage: number;
  progressStatus: string;
  reportingDate: string;
}

interface KpiPerformanceChartProps {
  kpi: {
    kpiId: string;
    name: string;
    targetValue: number;
    baselineValue?: number;
    measurementUnit: string;
  };
  updates: KpiUpdate[];
}

export default function KpiPerformanceChart({ kpi, updates }: KpiPerformanceChartProps) {
  const chartData = useMemo(() => {
    if (updates.length === 0) return null;

    // Sort updates by date
    const sortedUpdates = [...updates].sort(
      (a, b) => new Date(a.reportingDate).getTime() - new Date(b.reportingDate).getTime()
    );

    const latestUpdate = sortedUpdates[sortedUpdates.length - 1];
    const firstUpdate = sortedUpdates[0];

    // Calculate trend
    const trend =
      sortedUpdates.length > 1
        ? latestUpdate.achievedValue - firstUpdate.achievedValue
        : 0;

    const trendPercentage =
      sortedUpdates.length > 1 && firstUpdate.achievedValue !== 0
        ? ((trend / firstUpdate.achievedValue) * 100).toFixed(1)
        : "0";

    // Calculate average progress
    const avgProgress =
      sortedUpdates.reduce((sum, u) => sum + u.progressPercentage, 0) /
      sortedUpdates.length;

    // Calculate velocity (progress per update)
    const velocity =
      sortedUpdates.length > 1
        ? (latestUpdate.progressPercentage - firstUpdate.progressPercentage) /
          (sortedUpdates.length - 1)
        : 0;

    return {
      latestUpdate,
      firstUpdate,
      trend,
      trendPercentage,
      avgProgress,
      velocity,
      sortedUpdates,
    };
  }, [updates]);

  if (!chartData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No performance data available
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Submit progress updates to see performance visualization
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { latestUpdate, trend, trendPercentage, avgProgress, velocity, sortedUpdates } =
    chartData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-50 border-green-200";
      case "ON_TRACK":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "AT_RISK":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "OFF_TRACK":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const maxValue = Math.max(
    kpi.targetValue,
    ...sortedUpdates.map((u) => u.achievedValue)
  );
  const minValue = Math.min(
    kpi.baselineValue || 0,
    ...sortedUpdates.map((u) => u.achievedValue)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-blue-600" />
          Performance Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Current</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {latestUpdate.achievedValue}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {kpi.measurementUnit}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 mb-1">Target</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {kpi.targetValue}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {kpi.measurementUnit}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Trend</p>
            <div className="flex items-center gap-2">
              {trend >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {trendPercentage}%
              </p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">
              Avg Progress
            </p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {avgProgress.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress Bar Chart */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Progress Over Time
            </h4>
            <Badge variant="outline" className={getStatusColor(latestUpdate.progressStatus)}>
              {latestUpdate.progressStatus.replace(/_/g, " ")}
            </Badge>
          </div>

          {/* Visual Chart */}
          <div className="space-y-2">
            {sortedUpdates.map((update, index) => {
              const percentage = ((update.achievedValue - minValue) / (maxValue - minValue)) * 100;
              const date = new Date(update.reportingDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div key={update.kpiUpdateId} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{date}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {update.achievedValue} {kpi.measurementUnit}
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    {/* Baseline marker */}
                    {kpi.baselineValue && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                        style={{
                          left: `${((kpi.baselineValue - minValue) / (maxValue - minValue)) * 100}%`,
                        }}
                      />
                    )}
                    {/* Target marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10"
                      style={{
                        left: `${((kpi.targetValue - minValue) / (maxValue - minValue)) * 100}%`,
                      }}
                    />
                    {/* Progress bar */}
                    <div
                      className={`h-full transition-all duration-500 ${
                        update.progressStatus === "COMPLETED"
                          ? "bg-gradient-to-r from-green-400 to-green-600"
                          : update.progressStatus === "ON_TRACK"
                          ? "bg-gradient-to-r from-blue-400 to-blue-600"
                          : update.progressStatus === "AT_RISK"
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                          : "bg-gradient-to-r from-red-400 to-red-600"
                      }`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="flex items-center justify-end h-full pr-2">
                        <span className="text-xs font-semibold text-white">
                          {update.progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-400 rounded-sm" />
              <span>Baseline</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span>Target</span>
            </div>
          </div>
        </div>

        {/* Velocity Indicator */}
        {velocity !== 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress Velocity
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Average progress per update
                </p>
              </div>
              <div className="flex items-center gap-2">
                {velocity > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {velocity > 0 ? "+" : ""}
                  {velocity.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Gap Analysis */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Gap Analysis
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Remaining</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {(kpi.targetValue - latestUpdate.achievedValue).toFixed(2)} {kpi.measurementUnit}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">To Target</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {(100 - latestUpdate.progressPercentage).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
