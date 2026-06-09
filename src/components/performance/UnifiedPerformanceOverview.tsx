"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, Target, Award, Activity, AlertCircle } from "lucide-react";
import { GET_EMPLOYEE_PERFORMANCE } from "@/lib/graphql/queries/unified-performance";
import PerformanceOverviewCard from "./PerformanceOverviewCard";
import { IndividualScorecard } from "@/components/kpi-scorecard";
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

  const { data, loading, error } = useQuery(GET_EMPLOYEE_PERFORMANCE, {
    variables: {
      employeeId,
      organizationId,
      strategicPeriodId,
      departmentId,
      divisionId,
    },
    skip: !employeeId || !organizationId,
  });

  const performanceData = data?.employeePerformance;

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
            {performanceData.employee.department && ` • ${performanceData.employee.department.name}`}
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
            totalScore={performanceData.totalScore}
            maxPossibleScore={performanceData.maxPossibleScore}
            overallPercentage={performanceData.overallPercentage}
            rating={performanceData.rating}
            breakdown={performanceData.breakdown}
            calculatedAt={performanceData.calculatedAt}
          />
        </TabsContent>

        {/* KPI Scorecard Tab */}
        <TabsContent value="kpi" className="space-y-6">
          <IndividualScorecard />
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
