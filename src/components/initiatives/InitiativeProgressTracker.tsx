"use client";

import { useMemo } from "react";
import { type Activity } from "@/hooks/initiatives/useInitiatives";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface InitiativeProgressTrackerProps {
  activities: Activity[];
  currentProgress: number;
  onProgressUpdate?: (newProgress: number) => void;
}

export default function InitiativeProgressTracker({
  activities,
  currentProgress,
}: InitiativeProgressTrackerProps) {
  const stats = useMemo(() => {
    const total = activities.length;
    const done = activities.filter((a) => a.status === "DONE").length;
    const notDone = activities.filter((a) => a.status === "NOT_DONE").length;
    const postponed = activities.filter((a) => a.status === "POSTPONED").length;
    const cancelled = activities.filter((a) => a.status === "CANCELLED").length;
    const milestones = activities.filter((a) => a.milestone).length;
    const completedMilestones = activities.filter(
      (a) => a.milestone && a.status === "DONE"
    ).length;

    // Calculate auto progress based on activities
    const autoProgress = total > 0 ? Math.round((done / total) * 100) : 0;

    // Check for overdue activities
    const now = new Date();
    const overdue = activities.filter((a) => {
      if (a.status === "DONE" || a.status === "CANCELLED") return false;
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < now;
    }).length;

    return {
      total,
      done,
      notDone,
      postponed,
      cancelled,
      milestones,
      completedMilestones,
      autoProgress,
      overdue,
    };
  }, [activities]);

  const progressDiff = stats.autoProgress - currentProgress;
  const isProgressAccurate = Math.abs(progressDiff) <= 5; // Within 5% tolerance

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Overall Progress</span>
            <span className="text-2xl font-bold text-blue-600">
              {currentProgress}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={currentProgress} className="h-3" />

          {/* Auto-calculated progress comparison */}
          {!isProgressAccurate && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Progress Mismatch
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                  Based on activities: {stats.autoProgress}% (
                  {progressDiff > 0 ? "+" : ""}
                  {progressDiff}% difference)
                </p>
              </div>
            </div>
          )}

          {/* Activity Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Done
                </p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  {stats.done}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Circle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Not Done
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.notDone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Postponed
                </p>
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                  {stats.postponed}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Cancelled
                </p>
                <p className="text-lg font-bold text-red-900 dark:text-red-100">
                  {stats.cancelled}
                </p>
              </div>
            </div>
          </div>

          {/* Milestones Progress */}
          {stats.milestones > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Milestones
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {stats.completedMilestones} / {stats.milestones}
                </span>
              </div>
              <Progress
                value={(stats.completedMilestones / stats.milestones) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* Overdue Warning */}
          {stats.overdue > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                <span className="font-semibold">{stats.overdue}</span>{" "}
                {stats.overdue === 1 ? "activity is" : "activities are"} overdue
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Activity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Total Activities
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {stats.total}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Completion Rate
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {stats.total > 0
                  ? Math.round((stats.done / stats.total) * 100)
                  : 0}
                %
              </span>
            </div>
            {stats.milestones > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Milestone Progress
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {Math.round(
                    (stats.completedMilestones / stats.milestones) * 100
                  )}
                  %
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
