"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, Target, Award, Activity, AlertCircle } from "lucide-react";
import { GET_EMPLOYEE_PERFORMANCE } from "@/lib/graphql/queries/unified-performance";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_CHECKINOUT_TASKS } from "@/lib/graphql/queries/checkins";
import { getRatingFromScore } from "@/lib/utils/performance-export";
import PerformanceOverviewCard from "./PerformanceOverviewCard";
import IndividualScorecard from "@/components/kpi-scorecard/IndividualScorecard";
import Employee360Results from "@/components/evaluations/Employee360Results";
import ActivityMetricsView from "./ActivityMetricsView";

interface UnifiedPerformanceOverviewProps {
  employeeId: string;
  organizationId: string;
  strategicPeriodId?: string;
  departmentId?: string;
  divisionId?: string;
}

export default function UnifiedPerformanceOverview({
  employeeId,
  organizationId,
  strategicPeriodId,
  departmentId,
  divisionId,
}: UnifiedPerformanceOverviewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  console.log('UnifiedPerformanceOverview props:', {
    employeeId,
    organizationId,
    strategicPeriodId,
    departmentId,
    divisionId,
  });

  const { data, loading, error } = useQuery(GET_EMPLOYEE_PERFORMANCE, {
    variables: {
      employeeId,
      organizationId,
      strategicPeriodId,
      departmentId,
      divisionId,
    },
    skip: !employeeId || !organizationId,
    fetchPolicy: 'network-only', // Force fresh data
    onError: (err) => {
      console.error('GET_EMPLOYEE_PERFORMANCE error:', err);
    },
    onCompleted: (data) => {
      console.log('GET_EMPLOYEE_PERFORMANCE data:', data);
    },
  });

  const performanceData = data?.employeePerformance;

  // Keep the overview activity card aligned with the Activity Metrics tab.
  const { data: objectivesData } = useQuery(GET_OBJECTIVES, {
    variables: {
      page: 1,
      limit: 1000,
      assigneeId: employeeId,
      strategicPeriodId,
    },
    skip: !employeeId,
  });

  const { data: tasksData } = useQuery(GET_CHECKINOUT_TASKS, {
    variables: {
      page: 1,
      limit: 1000,
      ownerUserId: employeeId,
      strategicPeriodId,
    },
    skip: !employeeId,
  });

  const overviewPerformanceData = useMemo(() => {
    if (!performanceData) return performanceData;

    const objectives = objectivesData?.objectives?.items || [];
    const tasks = tasksData?.checkinoutTasks?.items || [];

    const completedObjectives = objectives.filter(
      (obj: any) => obj.status === "COMPLETED",
    ).length;
    const objectiveCompletionRate =
      objectives.length > 0 ? (completedObjectives / objectives.length) * 100 : 0;

    const completedTasks = tasks.filter(
      (task: any) =>
        task.status === "COMPLETED" || task.taskStatus === "DONE",
    ).length;
    const taskCompletionRate =
      tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    const combinedActivityScore =
      objectiveCompletionRate * 0.5 + taskCompletionRate * 0.5;

    const activityWeight = performanceData.breakdown.activityScore.weight || 0;
    const activityWeightedScore = (combinedActivityScore / 100) * activityWeight;

    const nextBreakdown = {
      ...performanceData.breakdown,
      activityScore: {
        ...performanceData.breakdown.activityScore,
        rawScore: combinedActivityScore,
        maxScore: 100,
        percentageAchieved: combinedActivityScore,
        weightedScore: activityWeightedScore,
      },
    };

    const totalScore =
      nextBreakdown.kpiScore.weightedScore +
      nextBreakdown.competencyScore.weightedScore +
      nextBreakdown.activityScore.weightedScore;

    const maxPossibleScore =
      performanceData.maxPossibleScore ||
      nextBreakdown.kpiScore.weight +
        nextBreakdown.competencyScore.weight +
        nextBreakdown.activityScore.weight;

    const overallPercentage =
      maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      ...performanceData,
      totalScore,
      overallPercentage,
      rating: getRatingFromScore(overallPercentage),
      breakdown: nextBreakdown,
    };
  }, [objectivesData, performanceData, tasksData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading performance data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load performance data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!performanceData) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Performance Data Available
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Performance data will appear here once you have KPI achievements, competency evaluations, 
                or completed objectives and tasks in the selected period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {performanceData.employee.fullName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {performanceData.employee.title || "No title"} 
            {performanceData.employee.departments?.[0] && ` • ${performanceData.employee.departments[0].name}`}
          </p>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="kpi" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            KPI Scorecard
          </TabsTrigger>
          <TabsTrigger value="competency" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            360° Evaluation
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity Metrics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <PerformanceOverviewCard
            totalScore={overviewPerformanceData.totalScore}
            maxPossibleScore={overviewPerformanceData.maxPossibleScore}
            overallPercentage={overviewPerformanceData.overallPercentage}
            rating={overviewPerformanceData.rating}
            breakdown={overviewPerformanceData.breakdown}
            calculatedAt={overviewPerformanceData.calculatedAt}
          />
        </TabsContent>

        {/* KPI Scorecard Tab */}
        <TabsContent value="kpi" className="space-y-6">
          <IndividualScorecard strategicPeriodId={strategicPeriodId} />
        </TabsContent>

        {/* 360° Evaluation Tab */}
        <TabsContent value="competency" className="space-y-6">
          <Employee360Results />
        </TabsContent>

        {/* Activity Metrics Tab */}
        <TabsContent value="activity" className="space-y-6">
          <ActivityMetricsView
            employeeId={employeeId}
            periodId={strategicPeriodId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
