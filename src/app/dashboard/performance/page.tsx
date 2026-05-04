"use client";

import { useState } from "react";
import { useAggregatePerformanceResults } from "@/hooks/performance/usePerformance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Award, Target, Users } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { useQuery } from "@apollo/client";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";

export default function PerformancePage() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // Fetch strategic periods for filter
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 20 },
  });
  const periods = periodsData?.strategicPeriods?.items || [];

  const { results, loading } = useAggregatePerformanceResults({
    page: 1,
    limit: 100,
    strategicPeriodId: periodFilter !== "all" ? periodFilter : undefined,
  });

  // Filter by search
  const filteredResults = results.filter((result) =>
    result.user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate statistics
  const avgScore = results.length > 0
    ? results.reduce((sum, r) => sum + r.aggregateScore, 0) / results.length
    : 0;

  const topPerformers = [...results]
    .sort((a, b) => b.aggregateScore - a.aggregateScore)
    .slice(0, 5);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 75) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Performance Aggregation
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Comprehensive performance metrics across competencies and KPIs
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            {periods.map((period: any) => (
              <SelectItem key={period.strategicPeriodId} value={period.strategicPeriodId}>
                {period.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
            <p className="text-xs text-muted-foreground">With performance data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPerformers.length}</div>
            <p className="text-xs text-muted-foreground">Highest scores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excellence Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {results.length > 0
                ? ((results.filter((r) => r.aggregateScore >= 90).length / results.length) * 100).toFixed(0)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Score ≥ 90</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Performers</CardTitle>
            <CardDescription>Employees with highest aggregate scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((result, index) => (
                <div
                  key={result.aggregatePerformanceResultId}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <UserAvatar
                    user={{
                      fullName: result.user.fullName,
                      picture: result.user.picture,
                    }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {result.user.fullName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {result.user.title || "No title"} • {result.user.department?.name || "No department"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(result.aggregateScore)}`}>
                      {result.aggregateScore.toFixed(1)}
                    </div>
                    <p className="text-xs text-gray-500">Aggregate Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Results */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Results ({filteredResults.length})</CardTitle>
          <CardDescription>Detailed breakdown of all employee performance scores</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No performance data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Performance results will appear here once they are calculated
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((result) => (
                <div
                  key={result.aggregatePerformanceResultId}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  <UserAvatar
                    user={{
                      fullName: result.user.fullName,
                      picture: result.user.picture,
                    }}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {result.user.fullName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.user.title || "No title"} • {result.strategicPeriod.name}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Competency</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {result.competencyScore?.toFixed(1) || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Individual KPI</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {result.individualKpiScore?.toFixed(1) || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Shared KPI</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {result.sharedKpiScore?.toFixed(1) || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Aggregate</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getScoreBadge(result.aggregateScore)}`}>
                        {result.aggregateScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
