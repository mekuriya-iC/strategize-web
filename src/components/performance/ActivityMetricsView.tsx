"use client";

import { useQuery } from "@apollo/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_CHECKINOUT_TASKS } from "@/lib/graphql/queries/checkins";
import { Target, ListChecks, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ActivityMetricsViewProps {
  employeeId: string;
  periodId?: string;
}

export default function ActivityMetricsView({
  employeeId,
  periodId,
}: ActivityMetricsViewProps) {
  const { data: objectivesData, loading: objectivesLoading } = useQuery(GET_OBJECTIVES, {
    variables: {
      page: 1,
      limit: 1000,
      assigneeId: employeeId,
      strategicPeriodId: periodId,
    },
    skip: !employeeId,
  });

  const { data: tasksData, loading: tasksLoading } = useQuery(GET_CHECKINOUT_TASKS, {
    variables: {
      page: 1,
      limit: 1000,
      ownerUserId: employeeId,
      strategicPeriodId: periodId,
    },
    skip: !employeeId,
  });

  const objectives = objectivesData?.objectives?.items || [];
  const tasks = tasksData?.checkinoutTasks?.items || [];

  // Calculate objective metrics
  const completedObjectives = objectives.filter(
    (obj: any) => obj.status === "COMPLETED"
  ).length;
  const inProgressObjectives = objectives.filter(
    (obj: any) => obj.status === "IN_PROGRESS" || obj.status === "ACTIVE"
  ).length;
  const notStartedObjectives = objectives.filter(
    (obj: any) => obj.status === "NOT_STARTED" || obj.status === "DRAFT"
  ).length;
  const objectiveCompletionRate = objectives.length > 0
    ? (completedObjectives / objectives.length) * 100
    : 0;

  // Calculate task metrics
  const completedTasks = tasks.filter(
    (task: any) => task.status === "COMPLETED" || task.taskStatus === "DONE"
  ).length;
  const pendingTasks = tasks.filter(
    (task: any) => task.status === "PENDING" || task.taskStatus === "NOT_DONE"
  ).length;
  const postponedTasks = tasks.filter(
    (task: any) => task.status === "POSTPONED" || task.taskStatus === "POSTPONED"
  ).length;
  const taskCompletionRate = tasks.length > 0
    ? (completedTasks / tasks.length) * 100
    : 0;

  // Combined activity score (50% objectives, 50% tasks)
  const combinedScore = (objectiveCompletionRate * 0.5) + (taskCompletionRate * 0.5);

  const loading = objectivesLoading || tasksLoading;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Activity Metrics Overview
          </CardTitle>
          <CardDescription>
            Combined performance score based on objectives and tasks completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="text-4xl font-bold text-primary">
              {combinedScore.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Combined Activity Score
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Objective Completion</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {objectiveCompletionRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={objectiveCompletionRate} className="h-2" />
              <p className="text-xs text-gray-500">
                {completedObjectives} of {objectives.length} completed
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Task Completion</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {taskCompletionRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={taskCompletionRate} className="h-2" />
              <p className="text-xs text-gray-500">
                {completedTasks} of {tasks.length} completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Objectives Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Objectives
            </CardTitle>
            <CardDescription>
              Status breakdown of all objectives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Completed</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  {completedObjectives}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">In Progress</span>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {inProgressObjectives}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Not Started</span>
                </div>
                <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
                  {notStartedObjectives}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Objectives</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {objectives.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Tasks
            </CardTitle>
            <CardDescription>
              Status breakdown of all tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Completed</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  {completedTasks}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Pending</span>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                  {pendingTasks}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Postponed</span>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {postponedTasks}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Tasks</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {tasks.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
