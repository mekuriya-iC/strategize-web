"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Target, Activity, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PerformanceComponentScore {
  rawScore: number;
  maxScore: number;
  percentageAchieved: number;
  weight: number;
  weightedScore: number;
  source: string;
  lastUpdated?: string;
}

interface PerformanceBreakdown {
  kpiScore: PerformanceComponentScore;
  competencyScore: PerformanceComponentScore;
  activityScore: PerformanceComponentScore;
}

interface PerformanceOverviewCardProps {
  totalScore: number;
  maxPossibleScore: number;
  overallPercentage: number;
  rating: string;
  breakdown: PerformanceBreakdown;
  calculatedAt?: string;
}

function getRatingColor(rating: string) {
  switch (rating) {
    case "Exceptional":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "Exceeds Expectations":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "Meets Expectations":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800";
    case "Needs Improvement":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
    case "Below Expectations":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800";
  }
}

function getScoreColor(percentage: number) {
  if (percentage >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (percentage >= 80) return "text-blue-600 dark:text-blue-400";
  if (percentage >= 70) return "text-green-600 dark:text-green-400";
  if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getProgressColor(percentage: number) {
  if (percentage >= 90) return "bg-emerald-500";
  if (percentage >= 80) return "bg-blue-500";
  if (percentage >= 70) return "bg-green-500";
  if (percentage >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function ComponentScoreCard({
  score,
  icon: Icon,
}: {
  score: PerformanceComponentScore;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {score.source}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Weight: {score.weight}%
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <p>Raw Score: {score.rawScore.toFixed(2)} / {score.maxScore.toFixed(2)}</p>
                <p>Achievement: {score.percentageAchieved.toFixed(1)}%</p>
                <p>Weighted Score: {score.weightedScore.toFixed(2)}</p>
                {score.lastUpdated && (
                  <p className="text-gray-400">
                    Updated: {new Date(score.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Achievement</span>
          <span className={`font-semibold ${getScoreColor(score.percentageAchieved)}`}>
            {score.percentageAchieved.toFixed(1)}%
          </span>
        </div>
        <Progress
          value={score.percentageAchieved}
          className="h-2"
          fillColor={getProgressColor(score.percentageAchieved)}
        />
      </div>

      <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100 dark:border-gray-800">
        <span className="text-gray-600 dark:text-gray-400">Weighted Contribution</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">
          {score.weightedScore.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default function PerformanceOverviewCard({
  totalScore,
  maxPossibleScore,
  overallPercentage,
  rating,
  breakdown,
  calculatedAt,
}: PerformanceOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Unified Performance Score
            </CardTitle>
            <CardDescription>
              Combined performance across all metrics
            </CardDescription>
          </div>
          <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold ${getRatingColor(rating)}`}>
            {rating}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-2 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            <span className={`text-5xl font-bold ${getScoreColor(overallPercentage)}`}>
              {overallPercentage.toFixed(1)}
            </span>
            <span className="text-2xl font-semibold text-gray-500">%</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalScore.toFixed(2)} out of {maxPossibleScore.toFixed(2)} points
          </p>
          {calculatedAt && (
            <p className="text-xs text-gray-500">
              Last calculated: {new Date(calculatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
            <span className={`font-bold ${getScoreColor(overallPercentage)}`}>
              {overallPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={overallPercentage}
            className="h-3"
            fillColor={getProgressColor(overallPercentage)}
          />
        </div>

        {/* Component Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Performance Breakdown
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardContent className="pt-6">
                <ComponentScoreCard score={breakdown.kpiScore} icon={Target} />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <ComponentScoreCard score={breakdown.competencyScore} icon={Award} />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <ComponentScoreCard score={breakdown.activityScore} icon={Activity} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weight Summary */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Weighting Configuration
          </h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">KPI Scorecard</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.kpiScore.weight}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">360° Evaluation</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.competencyScore.weight}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Activity Metrics</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.activityScore.weight}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-800">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Total Weight</span>
            <span className="font-bold text-primary">
              {(breakdown.kpiScore.weight + breakdown.competencyScore.weight + breakdown.activityScore.weight).toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
