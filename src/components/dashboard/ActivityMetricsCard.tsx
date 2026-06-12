"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, ArrowRight, CheckCircle, ListTodo, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActivityMetricsCardProps {
  objectivesCompletion: number;
  tasksCompletion: number;
  checkinFrequency: number;
  loading?: boolean;
}

export function ActivityMetricsCard({
  objectivesCompletion,
  tasksCompletion,
  checkinFrequency,
  loading = false,
}: ActivityMetricsCardProps) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const averageActivity = (objectivesCompletion + tasksCompletion + checkinFrequency) / 3;

  if (loading) {
    return (
      <Card className="border-2 border-orange-200 dark:border-orange-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-pulse" />
            <CardTitle className="text-base">Activity Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-900/40 hover:shadow-lg transition-all">
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <CardTitle className="text-base">Activity Metrics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Main Score Display */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getScoreColor(averageActivity)} mb-2`}>
            {averageActivity.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">Overall Engagement</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={averageActivity} className="h-3" />
        </div>

        {/* Metrics Breakdown */}
        <div className="space-y-4 mb-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Objectives
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={objectivesCompletion} className="w-20 h-2" />
              <span className={`text-lg font-bold ${getScoreColor(objectivesCompletion)}`}>
                {objectivesCompletion.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tasks
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={tasksCompletion} className="w-20 h-2" />
              <span className={`text-lg font-bold ${getScoreColor(tasksCompletion)}`}>
                {tasksCompletion.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Check-ins
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={checkinFrequency} className="w-20 h-2" />
              <span className={`text-lg font-bold ${getScoreColor(checkinFrequency)}`}>
                {checkinFrequency.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/dashboard/objectives')}
        >
          <span>View activity details</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
