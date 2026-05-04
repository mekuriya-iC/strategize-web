"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_COMPETENCY_ASSESSMENTS } from "@/lib/graphql/queries/evaluations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, Award, Target } from "lucide-react";

interface PerformanceReportProps {
  onExport?: (data: any) => void;
}

const COLORS = ["#10b981", "#3b82f6", "#6b7280"];

export default function PerformanceReport({ onExport }: PerformanceReportProps) {
  const [period, setPeriod] = useState("current");

  const { data: employeesData, loading: empLoading } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  const { data: assessmentsData, loading: assessLoading } = useQuery(GET_COMPETENCY_ASSESSMENTS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  const employees = employeesData?.employees?.items || [];
  const assessments = assessmentsData?.competencyAssessments?.items || [];

  // Calculate performance metrics
  const totalEmployees = employees.length;
  const completedAssessments = assessments.filter(
    (a: any) => a.status === "SUBMITTED"
  ).length;
  
  const avgCompletionRate =
    employees.length > 0
      ? (completedAssessments / employees.length) * 100
      : 0;

  // Performance distribution based on assessment status
  const performanceDistribution = [
    {
      name: "Completed",
      value: assessments.filter((a: any) => a.status === "SUBMITTED").length,
      color: "#10b981",
    },
    {
      name: "In Progress",
      value: assessments.filter((a: any) => a.status === "DRAFT").length,
      color: "#3b82f6",
    },
    {
      name: "Not Started",
      value: Math.max(0, employees.length - assessments.length),
      color: "#6b7280",
    },
  ].filter((item) => item.value > 0);

  const totalDistribution = performanceDistribution.reduce((sum, item) => sum + item.value, 0);

  // Top assessed employees (by number of assessments received)
  const assessmentsByEmployee = assessments.reduce((acc: any, a: any) => {
    const empId = a.evaluatee?.employeeId;
    if (empId) {
      acc[empId] = acc[empId] || { name: a.evaluatee.fullName, count: 0 };
      acc[empId].count++;
    }
    return acc;
  }, {});

  const topPerformers = Object.values(assessmentsByEmployee)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10)
    .map((e: any) => ({
      name: e.name,
      score: e.count,
    }));

  const maxScore = topPerformers.length > 0 ? Math.max(...topPerformers.map(p => p.score)) : 1;

  const handleExport = () => {
    const reportData = {
      period,
      totalEmployees,
      completedAssessments,
      avgCompletionRate: avgCompletionRate.toFixed(2),
      performanceDistribution,
      topPerformers,
      generatedAt: new Date().toISOString(),
    };
    onExport?.(reportData);
  };

  const loading = empLoading || assessLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="last-quarter">Last Quarter</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Assessments
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {totalEmployees > 0
                ? `${((completedAssessments / totalEmployees) * 100).toFixed(1)}% completion`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPerformers.length}</div>
            <p className="text-xs text-muted-foreground">Tracked this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Status Distribution</CardTitle>
            <CardDescription>
              Distribution of employee assessment statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceDistribution.length > 0 ? (
              <div className="space-y-4">
                {performanceDistribution.map((item, index) => {
                  const percentage = totalDistribution > 0 ? (item.value / totalDistribution) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {item.value} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                No assessment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Most Assessed Employees</CardTitle>
            <CardDescription>Employees with most assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((performer, index) => {
                  const percentage = (performer.score / maxScore) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[200px]">
                          {performer.name}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {performer.score}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                No assessment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
