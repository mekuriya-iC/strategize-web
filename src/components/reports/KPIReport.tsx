"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
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
import { Download, Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface KPIReportProps {
  onExport?: (data: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ON_TRACK: "#10b981",
  AT_RISK: "#f59e0b",
  OFF_TRACK: "#ef4444",
  COMPLETED: "#3b82f6",
  NOT_STARTED: "#6b7280",
};

export default function KPIReport({ onExport }: KPIReportProps) {
  const [period, setPeriod] = useState("current");
  const [levelFilter, setLevelFilter] = useState("all");

  const { data: kpisData, loading } = useQuery(GET_KPIS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  const kpis = kpisData?.kpis?.items || [];

  // Calculate KPI metrics
  const totalKPIs = kpis.length;
  const completedKPIs = kpis.filter((k: any) => k.status === "COMPLETED").length;
  const onTrackKPIs = kpis.filter((k: any) => k.status === "ON_TRACK").length;
  const atRiskKPIs = kpis.filter((k: any) => k.status === "AT_RISK").length;
  const offTrackKPIs = kpis.filter((k: any) => k.status === "OFF_TRACK").length;

  const avgProgress =
    kpis.length > 0
      ? kpis.reduce((sum: number, k: any) => sum + (k.progress || 0), 0) / kpis.length
      : 0;

  // Status distribution
  const statusDistribution = [
    { name: "On Track", value: onTrackKPIs, color: STATUS_COLORS.ON_TRACK },
    { name: "At Risk", value: atRiskKPIs, color: STATUS_COLORS.AT_RISK },
    { name: "Off Track", value: offTrackKPIs, color: STATUS_COLORS.OFF_TRACK },
    { name: "Completed", value: completedKPIs, color: STATUS_COLORS.COMPLETED },
  ].filter((item) => item.value > 0);

  const totalStatus = statusDistribution.reduce((sum, item) => sum + item.value, 0);

  // KPIs by level
  const kpisByLevel = [
    {
      level: "Corporate",
      count: kpis.filter((k: any) => k.level === "CORPORATE").length,
    },
    {
      level: "Division",
      count: kpis.filter((k: any) => k.level === "DIVISION").length,
    },
    {
      level: "Department",
      count: kpis.filter((k: any) => k.level === "DEPARTMENT").length,
    },
    {
      level: "Employee",
      count: kpis.filter((k: any) => k.level === "EMPLOYEE").length,
    },
  ].filter((item) => item.count > 0);

  const maxLevelCount = kpisByLevel.length > 0 ? Math.max(...kpisByLevel.map(l => l.count)) : 1;

  // Top performing KPIs
  const topKPIs = [...kpis]
    .filter((k: any) => k.progress !== null && k.progress !== undefined)
    .sort((a: any, b: any) => b.progress - a.progress)
    .slice(0, 10)
    .map((k: any) => ({
      name: k.name.length > 30 ? k.name.substring(0, 30) + "..." : k.name,
      progress: k.progress,
      target: k.targetValue || 100,
    }));

  const handleExport = () => {
    const reportData = {
      period,
      totalKPIs,
      completedKPIs,
      onTrackKPIs,
      atRiskKPIs,
      offTrackKPIs,
      avgProgress: avgProgress.toFixed(2),
      statusDistribution,
      kpisByLevel,
      topKPIs,
      generatedAt: new Date().toISOString(),
    };
    onExport?.(reportData);
  };

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
              <SelectItem value="q1">Q1 2026</SelectItem>
              <SelectItem value="q2">Q2 2026</SelectItem>
              <SelectItem value="q3">Q3 2026</SelectItem>
              <SelectItem value="q4">Q4 2026</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="CORPORATE">Corporate</SelectItem>
              <SelectItem value="DIVISION">Division</SelectItem>
              <SelectItem value="DEPARTMENT">Department</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKPIs}</div>
            <p className="text-xs text-muted-foreground">Active KPIs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onTrackKPIs}</div>
            <p className="text-xs text-muted-foreground">
              {totalKPIs > 0 ? `${((onTrackKPIs / totalKPIs) * 100).toFixed(1)}%` : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{atRiskKPIs}</div>
            <p className="text-xs text-muted-foreground">
              {totalKPIs > 0 ? `${((atRiskKPIs / totalKPIs) * 100).toFixed(1)}%` : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Off Track</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{offTrackKPIs}</div>
            <p className="text-xs text-muted-foreground">
              {totalKPIs > 0 ? `${((offTrackKPIs / totalKPIs) * 100).toFixed(1)}%` : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>KPI Status Distribution</CardTitle>
            <CardDescription>Current status of all KPIs</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <div className="space-y-4">
                {statusDistribution.map((item, index) => {
                  const percentage = totalStatus > 0 ? (item.value / totalStatus) * 100 : 0;
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
                No KPI data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPIs by Level */}
        <Card>
          <CardHeader>
            <CardTitle>KPIs by Organizational Level</CardTitle>
            <CardDescription>Distribution across hierarchy</CardDescription>
          </CardHeader>
          <CardContent>
            {kpisByLevel.length > 0 ? (
              <div className="space-y-4">
                {kpisByLevel.map((item, index) => {
                  const percentage = (item.count / maxLevelCount) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.level}</span>
                        <span className="text-muted-foreground">{item.count}</span>
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
                No KPI data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing KPIs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Performing KPIs</CardTitle>
            <CardDescription>KPIs with highest progress</CardDescription>
          </CardHeader>
          <CardContent>
            {topKPIs.length > 0 ? (
              <div className="space-y-3">
                {topKPIs.map((kpi, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[300px]">{kpi.name}</span>
                      <span className="text-muted-foreground ml-2">{kpi.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500 transition-all"
                        style={{ width: `${kpi.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                No KPI progress data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
