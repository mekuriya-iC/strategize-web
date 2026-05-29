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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Search,
  Layers,
  ArrowUpRight,
  Info
} from "lucide-react";

interface KPIReportProps {
  onExport?: (data: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#10b981", // Emerald/Green
  ON_TRACK: "#3b82f6",  // Blue
  AT_RISK: "#f59e0b",   // Amber/Yellow
  OFF_TRACK: "#ef4444",  // Red
  NOT_STARTED: "#6b7280", // Gray
};

export default function KPIReport({ onExport }: KPIReportProps) {
  const [period, setPeriod] = useState("current");
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: kpisData, loading } = useQuery(GET_KPIS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  const rawKpis = kpisData?.kpis?.items || [];

  // Helper functions for progress calculation
  const getKpiCompletion = (kpi: any) => {
    const latestUpdate = kpi.latestUpdate;
    const explicitProgress = Number(
      kpi.progressPercentage ??
        latestUpdate?.progressPercentage
    );

    if (Number.isFinite(explicitProgress)) {
      return Math.max(0, Math.min(100, explicitProgress));
    }

    const status = (kpi.targetStatus || kpi.status || "UNKNOWN").toUpperCase();
    if (status === "APPROVED" || status === "COMPLETED") return 100;
    return 0;
  };

  const getKpiProgressStatus = (kpi: any) => {
    const latestUpdate = kpi.latestUpdate;
    if (latestUpdate?.progressStatus) {
      return latestUpdate.progressStatus.toUpperCase();
    }
    const status = (kpi.targetStatus || kpi.status || "NOT_STARTED").toUpperCase();
    if (status === "APPROVED") return "COMPLETED";
    return status;
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "ON_TRACK":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "AT_RISK":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      case "OFF_TRACK":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Completed";
      case "ON_TRACK":
        return "On Track";
      case "AT_RISK":
        return "At Risk";
      case "OFF_TRACK":
        return "Off Track";
      default:
        return "Not Started";
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500 dark:bg-emerald-600";
      case "ON_TRACK":
        return "bg-blue-500 dark:bg-blue-600";
      case "AT_RISK":
        return "bg-amber-500 dark:bg-amber-600";
      case "OFF_TRACK":
        return "bg-rose-500 dark:bg-rose-600";
      default:
        return "bg-gray-300 dark:bg-gray-700";
    }
  };

  // Filter KPIs
  const filteredKpis = rawKpis.filter((kpi: any) => {
    if (kpi.isDeleted) return false;
    
    // Level filter
    if (levelFilter !== "all" && kpi.objective?.level !== levelFilter) {
      return false;
    }
    // Search query filter
    if (
      searchQuery &&
      !kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !kpi.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !kpi.objective?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Calculate KPI metrics based on filtered list
  const totalKPIs = filteredKpis.length;
  const completedKPIs = filteredKpis.filter((k: any) => getKpiProgressStatus(k) === "COMPLETED").length;
  const onTrackKPIs = filteredKpis.filter((k: any) => getKpiProgressStatus(k) === "ON_TRACK").length;
  const atRiskKPIs = filteredKpis.filter((k: any) => getKpiProgressStatus(k) === "AT_RISK").length;
  const offTrackKPIs = filteredKpis.filter((k: any) => getKpiProgressStatus(k) === "OFF_TRACK").length;
  const notStartedKPIs = filteredKpis.filter((k: any) => getKpiProgressStatus(k) === "NOT_STARTED").length;

  const avgProgress =
    filteredKpis.length > 0
      ? filteredKpis.reduce((sum: number, k: any) => sum + getKpiCompletion(k), 0) / filteredKpis.length
      : 0;

  // Status distribution
  const statusDistribution = [
    { name: "Completed", value: completedKPIs, color: STATUS_COLORS.COMPLETED },
    { name: "On Track", value: onTrackKPIs, color: STATUS_COLORS.ON_TRACK },
    { name: "At Risk", value: atRiskKPIs, color: STATUS_COLORS.AT_RISK },
    { name: "Off Track", value: offTrackKPIs, color: STATUS_COLORS.OFF_TRACK },
    { name: "Not Started", value: notStartedKPIs, color: STATUS_COLORS.NOT_STARTED },
  ].filter((item) => item.value > 0);

  const totalStatus = statusDistribution.reduce((sum, item) => sum + item.value, 0);

  // KPIs by level
  const kpisByLevel = [
    {
      level: "Corporate",
      count: filteredKpis.filter((k: any) => k.objective?.level === "CORPORATE").length,
    },
    {
      level: "Division",
      count: filteredKpis.filter((k: any) => k.objective?.level === "DIVISION").length,
    },
    {
      level: "Department",
      count: filteredKpis.filter((k: any) => k.objective?.level === "DEPARTMENT").length,
    },
    {
      level: "Employee",
      count: filteredKpis.filter((k: any) => k.objective?.level === "EMPLOYEE").length,
    },
  ].filter((item) => item.count > 0);

  const maxLevelCount = kpisByLevel.length > 0 ? Math.max(...kpisByLevel.map(l => l.count)) : 1;

  // Top performing KPIs
  const topKPIs = [...filteredKpis]
    .map((k: any) => ({
      ...k,
      computedProgress: getKpiCompletion(k)
    }))
    .sort((a: any, b: any) => b.computedProgress - a.computedProgress)
    .slice(0, 10)
    .map((k: any) => ({
      name: k.name.length > 30 ? k.name.substring(0, 30) + "..." : k.name,
      progress: k.computedProgress,
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
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 items-center">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="kpi-search"
              placeholder="Search KPIs by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] h-10">
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
            <SelectTrigger className="w-[160px] h-10">
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

        <Button onClick={handleExport} variant="outline" className="h-10">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKPIs}</div>
            <p className="text-xs text-muted-foreground">Active in selection</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {onTrackKPIs + completedKPIs}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalKPIs > 0 ? `${(((onTrackKPIs + completedKPIs) / totalKPIs) * 100).toFixed(1)}%` : "0.0%"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{atRiskKPIs}</div>
            <p className="text-xs text-muted-foreground">
              {totalKPIs > 0 ? `${((atRiskKPIs / totalKPIs) * 100).toFixed(1)}%` : "0.0%"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Off Track</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{offTrackKPIs}</div>
            <p className="text-xs text-muted-foreground">
              {totalKPIs > 0 ? `${((offTrackKPIs / totalKPIs) * 100).toFixed(1)}%` : "0.0%"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader>
            <CardTitle>KPI Status Distribution</CardTitle>
            <CardDescription>Current progress status of all filtered KPIs</CardDescription>
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
                        <span className="text-muted-foreground font-semibold">
                          {item.value} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
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
                No KPI status data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPIs by Level */}
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader>
            <CardTitle>KPIs by Organizational Level</CardTitle>
            <CardDescription>Distribution across organizational hierarchy</CardDescription>
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
                        <span className="text-muted-foreground font-semibold">{item.count} KPI{item.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                No KPI level data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing KPIs */}
        <Card className="lg:col-span-2 hover:shadow-sm transition-shadow">
          <CardHeader>
            <CardTitle>Top Performing KPIs</CardTitle>
            <CardDescription>KPIs with the highest overall progress</CardDescription>
          </CardHeader>
          <CardContent>
            {topKPIs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topKPIs.map((kpi, index) => (
                  <div key={index} className="space-y-1.5 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[220px]" title={kpi.name}>{kpi.name}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 ml-2">{kpi.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
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

      {/* Detailed KPI Progress Breakdown */}
      <Card className="hover:shadow-sm transition-shadow border-[#E2E8F0] dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Detailed KPI Performance Analysis</CardTitle>
              <CardDescription>
                Progress metrics, parent alignments, achieved values, and remaining targets
              </CardDescription>
            </div>
            <Badge variant="outline" className="self-start sm:self-center bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200/50">
              Showing {filteredKpis.length} of {rawKpis.length} KPIs
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredKpis.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredKpis.map((kpi: any) => {
                const completion = getKpiCompletion(kpi);
                const progressStatus = getKpiProgressStatus(kpi);
                const latestUpdate = kpi.latestUpdate;
                const achieved = latestUpdate?.achievedValue || kpi.baselineValue || 0;
                const target = kpi.targetValue;
                const baseline = kpi.baselineValue || 0;
                
                // Calculate remaining target
                let remaining = target - achieved;
                if (remaining < 0) remaining = 0;

                return (
                  <div
                    key={kpi.kpiId}
                    className="p-5 rounded-xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#18181b] shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-900/40 group"
                  >
                    {/* Top Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {kpi.name}
                          </h3>
                          {kpi.objective?.level && (
                            <Badge className="text-[10px] py-0.5 px-1.5 uppercase font-bold tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-none">
                              {kpi.objective.level}
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${getStatusBadgeStyles(progressStatus)}`}>
                            {getStatusLabel(progressStatus)}
                          </Badge>
                        </div>
                        {kpi.objective?.title && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Layers className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate max-w-[400px]">
                              Objective: <strong className="text-gray-700 dark:text-gray-300 font-semibold">{kpi.objective.title}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right-aligned Progress Percent */}
                      <div className="flex items-baseline gap-1 text-right self-start sm:self-center">
                        <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                          {completion.toFixed(1)}
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground">%</span>
                      </div>
                    </div>

                    {/* Description */}
                    {kpi.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                        {kpi.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full mb-5">
                      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(progressStatus)}`}
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/60 mb-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Baseline</span>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {baseline} <span className="text-xs font-normal text-muted-foreground">{kpi.measurementUnit}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 border-l border-gray-100 dark:border-gray-800 pl-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Target</span>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {target} <span className="text-xs font-normal text-muted-foreground">{kpi.measurementUnit}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 border-l border-gray-100 dark:border-gray-800 pl-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Achieved</span>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {achieved} <span className="text-xs font-normal text-muted-foreground">{kpi.measurementUnit}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 border-l border-gray-100 dark:border-gray-800 pl-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remaining</span>
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {remaining === 0 ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/25 border-none py-0 px-2 h-5 text-[11px] font-black">
                              Done
                            </Badge>
                          ) : (
                            <>
                              {remaining.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">{kpi.measurementUnit}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Parent Alignment Connection Card */}
                    {kpi.parent && (
                      <div className="mb-4 p-3 rounded-lg border border-dashed border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/5 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Aligned to Parent Target: <strong className="text-gray-800 dark:text-gray-200 font-semibold">{kpi.parent.name}</strong>
                          </span>
                        </div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0">
                          Parent Target: {kpi.parent.targetValue || "Defined"}
                        </div>
                      </div>
                    )}

                    {/* Owner & Latest update Info Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-3 border-t border-gray-100 dark:border-gray-800/80">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          {kpi.createdBy?.fullName?.charAt(0) || "U"}
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          Created by {kpi.createdBy?.fullName || "System Admin"}
                        </span>
                      </div>

                      {latestUpdate ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground italic">
                          <Info className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            Latest update: <strong className="text-gray-700 dark:text-gray-300 font-semibold not-italic">
                              {latestUpdate.achievedValue} {kpi.measurementUnit}
                            </strong> on {latestUpdate.reportingDate}
                            {latestUpdate.notes && ` - "${latestUpdate.notes}"`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No progress updates submitted for this period</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">No KPIs Found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                No active KPIs matched the search criteria or filters. Try adjusting your filters or query.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
