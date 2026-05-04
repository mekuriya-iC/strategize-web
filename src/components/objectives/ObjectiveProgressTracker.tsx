"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, CheckCircle2, Clock } from "lucide-react";

interface KPI {
  kpiId: string;
  name: string;
  status: string;
  targetValue?: number;
  baseline?: number;
  weight?: number;
}

interface ObjectiveProgressTrackerProps {
  objective: {
    objectiveId: string;
    title: string;
    status: string;
    weight?: number;
    kpis?: KPI[];
  };
  kpis: KPI[];
  compact?: boolean;
}

export default function ObjectiveProgressTracker({
  objective,
  kpis,
  compact = false,
}: ObjectiveProgressTrackerProps) {
  // Calculate progress metrics
  const metrics = useMemo(() => {
    const objectiveKPIs = kpis.filter(
      (k) => k.kpiId && objective.kpis?.some((ok) => ok.kpiId === k.kpiId)
    );

    const totalKPIs = objectiveKPIs.length;
    const approvedKPIs = objectiveKPIs.filter((k) => k.status === "APPROVED").length;
    const pendingKPIs = objectiveKPIs.filter((k) => k.status === "PENDING").length;
    const rejectedKPIs = objectiveKPIs.filter((k) => k.status === "REJECTED").length;
    const notSubmittedKPIs = objectiveKPIs.filter((k) => k.status === "NOT_SUBMITTED").length;

    const completionPercentage = totalKPIs > 0 ? (approvedKPIs / totalKPIs) * 100 : 0;

    // Calculate weighted progress
    const totalWeight = objectiveKPIs.reduce((sum, k) => sum + (k.weight || 0), 0);
    const approvedWeight = objectiveKPIs
      .filter((k) => k.status === "APPROVED")
      .reduce((sum, k) => sum + (k.weight || 0), 0);
    const weightedProgress = totalWeight > 0 ? (approvedWeight / totalWeight) * 100 : 0;

    return {
      totalKPIs,
      approvedKPIs,
      pendingKPIs,
      rejectedKPIs,
      notSubmittedKPIs,
      completionPercentage,
      weightedProgress,
      totalWeight,
      approvedWeight,
    };
  }, [objective, kpis]);

  // Determine status color
  const getStatusColor = () => {
    if (objective.status === "APPROVED") return "text-green-600";
    if (objective.status === "REJECTED") return "text-red-600";
    if (objective.status === "PENDING") return "text-yellow-600";
    return "text-gray-600";
  };

  const getProgressColor = () => {
    if (metrics.completionPercentage >= 80) return "bg-green-500";
    if (metrics.completionPercentage >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Progress
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {metrics.completionPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={metrics.completionPercentage} className="h-2" />
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-green-600 font-medium">
            ✓ {metrics.approvedKPIs}
          </span>
          <span className="text-yellow-600 font-medium">
            ⏳ {metrics.pendingKPIs}
          </span>
          <span className="text-gray-400">
            / {metrics.totalKPIs} KPIs
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Objective Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Completion
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {metrics.completionPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={metrics.completionPercentage} className="h-3" />
          <p className="text-xs text-gray-500">
            {metrics.approvedKPIs} of {metrics.totalKPIs} KPIs approved
          </p>
        </div>

        {/* Weighted Progress */}
        {metrics.totalWeight > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Weighted Progress
              </span>
              <span className="text-lg font-bold text-blue-600">
                {metrics.weightedProgress.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.weightedProgress} className="h-3" />
            <p className="text-xs text-gray-500">
              {metrics.approvedWeight.toFixed(1)} of {metrics.totalWeight.toFixed(1)} weight points approved
            </p>
          </div>
        )}

        {/* KPI Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 mb-1" />
            <span className="text-2xl font-bold text-green-700 dark:text-green-400">
              {metrics.approvedKPIs}
            </span>
            <span className="text-xs text-green-600 dark:text-green-500">Approved</span>
          </div>

          <div className="flex flex-col items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600 mb-1" />
            <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {metrics.pendingKPIs}
            </span>
            <span className="text-xs text-yellow-600 dark:text-yellow-500">Pending</span>
          </div>

          <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 mb-1" />
            <span className="text-2xl font-bold text-red-700 dark:text-red-400">
              {metrics.rejectedKPIs}
            </span>
            <span className="text-xs text-red-600 dark:text-red-500">Rejected</span>
          </div>

          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Target className="w-5 h-5 text-gray-600 mb-1" />
            <span className="text-2xl font-bold text-gray-700 dark:text-gray-400">
              {metrics.notSubmittedKPIs}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-500">Draft</span>
          </div>
        </div>

        {/* Objective Status */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Objective Status
            </span>
            <span className={`text-sm font-bold ${getStatusColor()}`}>
              {objective.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Import missing icon
import { XCircle } from "lucide-react";
