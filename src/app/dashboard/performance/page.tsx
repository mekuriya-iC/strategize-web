"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Users,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  LineChart,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import { GET_TEAM_PERFORMANCE } from "@/lib/graphql/queries/unified-performance";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import UnifiedPerformanceOverview from "@/components/performance/UnifiedPerformanceOverview";
import { PerformanceDistributionChart } from "@/components/performance/PerformanceDistributionChart";
import { PerformanceTrendChart } from "@/components/performance/PerformanceTrendChart";
import { PerformanceComponentChart } from "@/components/performance/PerformanceComponentChart";
import { PerformanceFilters, PerformanceFilterState } from "@/components/performance/PerformanceFilters";
import { PerformanceExportDialog } from "@/components/performance/PerformanceExportDialog";
import { EmployeePerformanceDetail } from "@/components/performance/EmployeePerformanceDetail";
import { PerformanceExportData, getRatingFromScore } from "@/lib/utils/performance-export";
import { gql } from "@apollo/client";

const GET_DIVISIONS = gql`
  query GetDivisions($organizationId: ID!) {
    divisions(organizationId: $organizationId, limit: 100) {
      items {
        divisionId
        name
      }
    }
  }
`;

const GET_DEPARTMENTS = gql`
  query GetDepartments($organizationId: ID!, $divisionId: ID) {
    departments(organizationId: $organizationId, divisionId: $divisionId, limit: 100) {
      items {
        departmentId
        name
      }
    }
  }
`;

const GET_WEIGHT_CONFIG = gql`
  query GetPerformanceWeightConfig($organizationId: ID!, $strategicPeriodId: ID) {
    performanceWeightConfig(organizationId: $organizationId, strategicPeriodId: $strategicPeriodId) {
      kpiWeight
      competencyWeight
      activityWeight
    }
  }
`;

export default function PerformancePage() {
  const user = useAuthStore((state) => state.user);
  const selectedPeriod = useStrategicPeriodStore((state) => state.selectedPeriod);
  const userRole = user?.role as string | undefined;
  
  // Filter state
  const [filters, setFilters] = useState<PerformanceFilterState>({
    search: '',
    sortBy: 'score',
    sortOrder: 'desc',
  });

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const hasTeamView =
    !!userRole &&
    ["SUPER_ADMIN", "ADMIN", "HR", "CEO", "DIRECTOR", "MANAGER"].includes(
      userRole,
    );

  const isAdmin = !!userRole && ["SUPER_ADMIN", "ADMIN", "HR", "CEO"].includes(userRole);

  // Default to team performance for managers/admins, my performance for employees
  const [activeView, setActiveView] = useState<
    "my-performance" | "team-performance"
  >(hasTeamView ? "team-performance" : "my-performance");

  // Fetch strategic periods for filter
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 20, organizationId: user?.organizationId },
    skip: !user?.organizationId,
  });
  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((period: any) => period.status === "ACTIVE");

  // Fetch divisions
  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { organizationId: user?.organizationId },
    skip: !user?.organizationId || !isAdmin,
  });
  const divisions = divisionsData?.divisions?.items || [];

  // Fetch departments
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { 
      organizationId: user?.organizationId,
      divisionId: filters.divisionId || undefined,
    },
    skip: !user?.organizationId,
  });
  const departments = departmentsData?.departments?.items || [];

  // Fetch weight config
  const { data: weightData } = useQuery(GET_WEIGHT_CONFIG, {
    variables: {
      organizationId: user?.organizationId,
      strategicPeriodId: filters.periodId,
    },
    skip: !user?.organizationId || !filters.periodId,
  });
  const weightConfig = weightData?.performanceWeightConfig || {
    kpiWeight: 50,
    competencyWeight: 30,
    activityWeight: 20,
  };

  useEffect(() => {
    const periodId = selectedPeriod?.strategicPeriodId || activePeriod?.strategicPeriodId;
    if (periodId && filters.periodId !== periodId) {
      setFilters((prev) => ({ ...prev, periodId }));
    }
  }, [selectedPeriod?.strategicPeriodId, activePeriod?.strategicPeriodId, filters.periodId]);

  // Fetch team performance if viewing team
  const { data: teamData, loading: teamLoading } = useQuery(
    GET_TEAM_PERFORMANCE,
    {
      variables: {
        organizationId: user?.organizationId,
        strategicPeriodId: filters.periodId,
        divisionId: filters.divisionId,
        departmentId: filters.departmentId,
        includeInactive: false,
      },
      skip: !user?.organizationId || activeView !== "team-performance",
    },
  );

  const teamPerformance = teamData?.teamPerformance;
  const teamResults = teamPerformance?.results || [];

  // Process and filter results
  const processedResults = useMemo(() => {
    let results = [...teamResults];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter((result: any) =>
        result.employee.fullName.toLowerCase().includes(searchLower) ||
        result.employee.title?.toLowerCase().includes(searchLower) ||
        result.employee.departments?.[0]?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (filters.role) {
      results = results.filter((result: any) => result.employee.role === filters.role);
    }

    // Apply rating filter
    if (filters.rating) {
      results = results.filter((result: any) => {
        const score = result.overallPercentage;
        switch (filters.rating) {
          case 'exceptional': return score >= 90;
          case 'exceeds': return score >= 80 && score < 90;
          case 'meets': return score >= 70 && score < 80;
          case 'needs': return score >= 60 && score < 70;
          case 'below': return score < 60;
          default: return true;
        }
      });
    }

    // Apply sorting (create new sorted array instead of mutating)
    const sortedResults = [...results].sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.employee.fullName.toLowerCase();
          bValue = b.employee.fullName.toLowerCase();
          break;
        case 'score':
          aValue = a.overallPercentage;
          bValue = b.overallPercentage;
          break;
        case 'kpi':
          aValue = a.breakdown.kpiScore.percentageAchieved;
          bValue = b.breakdown.kpiScore.percentageAchieved;
          break;
        case 'competency':
          aValue = a.breakdown.competencyScore.percentageAchieved;
          bValue = b.breakdown.competencyScore.percentageAchieved;
          break;
        case 'activity':
          aValue = a.breakdown.activityScore.percentageAchieved;
          bValue = b.breakdown.activityScore.percentageAchieved;
          break;
        default:
          aValue = a.overallPercentage;
          bValue = b.overallPercentage;
      }

      if (typeof aValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return sortedResults;
  }, [teamResults, filters]);

  // Calculate distribution data
  const distributionData = useMemo(() => {
    const ratings = {
      'Exceptional': { count: 0, min: 90 },
      'Exceeds Expectations': { count: 0, min: 80, max: 89.99 },
      'Meets Expectations': { count: 0, min: 70, max: 79.99 },
      'Needs Improvement': { count: 0, min: 60, max: 69.99 },
      'Below Expectations': { count: 0, max: 59.99 },
    };

    processedResults.forEach((result: any) => {
      const score = result.overallPercentage;
      if (score >= 90) ratings['Exceptional'].count++;
      else if (score >= 80) ratings['Exceeds Expectations'].count++;
      else if (score >= 70) ratings['Meets Expectations'].count++;
      else if (score >= 60) ratings['Needs Improvement'].count++;
      else ratings['Below Expectations'].count++;
    });

    const total = processedResults.length || 1;
    return Object.entries(ratings).map(([rating, data]) => ({
      rating,
      count: data.count,
      percentage: (data.count / total) * 100,
    }));
  }, [processedResults]);

  // Calculate component averages
  const componentAverages = useMemo(() => {
    if (processedResults.length === 0) {
      return { kpi: 0, competency: 0, activity: 0 };
    }

    const totals = processedResults.reduce((acc: any, result: any) => ({
      kpi: acc.kpi + result.breakdown.kpiScore.percentageAchieved,
      competency: acc.competency + result.breakdown.competencyScore.percentageAchieved,
      activity: acc.activity + result.breakdown.activityScore.percentageAchieved,
    }), { kpi: 0, competency: 0, activity: 0 });

    return {
      kpi: totals.kpi / processedResults.length,
      competency: totals.competency / processedResults.length,
      activity: totals.activity / processedResults.length,
    };
  }, [processedResults]);

  // Mock trend data (in real implementation, fetch from backend)
  const trendData = useMemo(() => {
    // This would come from a real API in production
    return [
      { period: 'Q1 2026', averageScore: 75, kpiScore: 72, competencyScore: 78 },
      { period: 'Q2 2026', averageScore: teamPerformance?.averageScore || 0, kpiScore: componentAverages.kpi, competencyScore: componentAverages.competency },
    ];
  }, [teamPerformance, componentAverages]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90)
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (percentage >= 80)
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (percentage >= 70)
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (percentage >= 60)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const handleFiltersChange = (newFilters: Partial<PerformanceFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      sortBy: 'score',
      sortOrder: 'desc',
    });
  };

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee);
    setDetailModalOpen(true);
  };

  // Convert team results to export format
  const exportData: PerformanceExportData[] = processedResults.map((result: any) => ({
    employeeId: result.employeeId,
    fullName: result.employee.fullName,
    title: result.employee.title,
    department: result.employee.departments?.[0]?.name,
    role: result.employee.role,
    kpiScore: result.breakdown.kpiScore.percentageAchieved,
    competencyScore: result.breakdown.competencyScore.percentageAchieved,
    activityScore: result.breakdown.activityScore.percentageAchieved,
    overallScore: result.overallPercentage,
    rating: getRatingFromScore(result.overallPercentage),
  }));

  // Calculate summary stats for export
  const summaryStats = teamPerformance ? {
    teamSize: processedResults.length,
    averageScore: teamPerformance.averageScore,
    topScore: teamPerformance.highestScore,
    excellenceRate: processedResults.length > 0
      ? (processedResults.filter((r: any) => r.overallPercentage >= 90).length / processedResults.length) * 100
      : 0,
  } : undefined;

  if (teamLoading && activeView === "team-performance") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading team performance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Unified Performance System
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Combined performance metrics from KPIs, 360° evaluations, and activity
          data
        </p>
      </div>

      {/* View Toggle */}
      {hasTeamView ? (
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as any)}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-performance">My Performance</TabsTrigger>
            <TabsTrigger value="team-performance">Team Performance</TabsTrigger>
          </TabsList>

          {/* My Performance View */}
          <TabsContent value="my-performance" className="space-y-6">
            {user?.employeeId && user?.organizationId && (
              <UnifiedPerformanceOverview
                employeeId={user.employeeId}
                organizationId={user.organizationId}
                strategicPeriodId={
                  filters.periodId !== "all" ? filters.periodId : undefined
                }
              />
            )}
          </TabsContent>

          {/* Team Performance View */}
          <TabsContent value="team-performance" className="space-y-6">
            {/* Advanced Filters */}
            <PerformanceFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
              onExport={handleExport}
              periods={periods}
              divisions={divisions}
              departments={departments}
              showDivisionFilter={isAdmin}
              showDepartmentFilter={isAdmin}
              showRoleFilter={isAdmin}
              isLoading={teamLoading}
            />

            {/* Executive Summary Cards */}
            {teamPerformance && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Team Size
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {processedResults.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {processedResults.length !== teamResults.length && (
                        <span className="text-blue-600">
                          ({teamResults.length} total)
                        </span>
                      )}
                      {processedResults.length === teamResults.length && "Active members"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Score
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(teamPerformance.averageScore)}`}
                    >
                      {teamPerformance.averageScore.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {getTrendIcon(teamPerformance.averageScore, 75)}
                      Team average
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Excellence Rate
                    </CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                      {processedResults.length > 0
                        ? (
                            (processedResults.filter(
                              (r: any) => r.overallPercentage >= 90,
                            ).length /
                              processedResults.length) *
                            100
                          ).toFixed(0)
                        : 0}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {processedResults.filter((r: any) => r.overallPercentage >= 90).length} of{" "}
                      {processedResults.length} ≥ 90%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      At Risk
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {processedResults.filter((r: any) => r.overallPercentage < 60).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Below 60% threshold
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Top Score
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(teamPerformance.highestScore)}`}
                    >
                      {teamPerformance.highestScore.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best performer
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Top Performer Highlight */}
            {teamPerformance?.topPerformer && (
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white">
                      🏆
                    </div>
                    Top Performer
                  </CardTitle>
                  <CardDescription>Outstanding performance this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                    <UserAvatar
                      src={teamPerformance.topPerformer.employee.picture}
                      alt={teamPerformance.topPerformer.employee.fullName}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-xl">
                        {teamPerformance.topPerformer.employee.fullName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {teamPerformance.topPerformer.employee.title || "No title"}
                        {teamPerformance.topPerformer.employee.departments?.[0] &&
                          ` • ${teamPerformance.topPerformer.employee.departments[0].name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-4xl font-bold ${getScoreColor(teamPerformance.topPerformer.overallPercentage)}`}
                      >
                        {teamPerformance.topPerformer.overallPercentage.toFixed(1)}%
                      </div>
                      <Badge className={getScoreBadge(teamPerformance.topPerformer.overallPercentage)}>
                        {teamPerformance.topPerformer.rating}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visualization Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Visual insights into team performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="distribution" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="distribution" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Distribution
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Trends
                    </TabsTrigger>
                    <TabsTrigger value="components" className="flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4" />
                      Components
                    </TabsTrigger>
                    <TabsTrigger value="table" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Table
                    </TabsTrigger>
                  </TabsList>

                  {/* Distribution Chart Tab */}
                  <TabsContent value="distribution" className="space-y-4 mt-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Performance Distribution</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Distribution of team members across rating categories
                      </p>
                      <PerformanceDistributionChart data={distributionData} />
                    </div>
                  </TabsContent>

                  {/* Trend Chart Tab */}
                  <TabsContent value="trends" className="space-y-4 mt-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Performance Trends</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Track performance changes over time
                      </p>
                      <PerformanceTrendChart data={trendData} />
                    </div>
                  </TabsContent>

                  {/* Component Breakdown Tab */}
                  <TabsContent value="components" className="space-y-4 mt-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Component Breakdown</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Average scores by performance component
                      </p>
                      <PerformanceComponentChart
                        kpiWeight={weightConfig.kpiWeight}
                        competencyWeight={weightConfig.competencyWeight}
                        activityWeight={weightConfig.activityWeight}
                        kpiAverage={componentAverages.kpi}
                        competencyAverage={componentAverages.competency}
                        activityAverage={componentAverages.activity}
                      />
                    </div>
                  </TabsContent>

                  {/* Data Table Tab */}
                  <TabsContent value="table" className="space-y-4 mt-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Team Performance Details ({processedResults.length})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Detailed performance breakdown for all team members
                      </p>
                      
                      {processedResults.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            No results found
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Try adjusting your filters to see more results
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {processedResults.map((result: any) => (
                            <div
                              key={result.employeeId}
                              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                              onClick={() => handleEmployeeClick(result)}
                            >
                              <UserAvatar
                                src={result.employee.picture}
                                alt={result.employee.fullName}
                                fallbackText={result.employee.fullName}
                                size="md"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                                  {result.employee.fullName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {result.employee.title || "No title"}
                                  {result.employee.departments?.[0] &&
                                    ` • ${result.employee.departments[0].name}`}
                                </p>
                              </div>
                              <div className="grid grid-cols-4 gap-4 text-center">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">KPI</p>
                                  <p
                                    className={`font-semibold ${getScoreColor(result.breakdown.kpiScore.percentageAchieved)}`}
                                  >
                                    {result.breakdown.kpiScore.percentageAchieved.toFixed(0)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">360°</p>
                                  <p
                                    className={`font-semibold ${getScoreColor(result.breakdown.competencyScore.percentageAchieved)}`}
                                  >
                                    {result.breakdown.competencyScore.percentageAchieved.toFixed(0)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Activity</p>
                                  <p
                                    className={`font-semibold ${getScoreColor(result.breakdown.activityScore.percentageAchieved)}`}
                                  >
                                    {result.breakdown.activityScore.percentageAchieved.toFixed(0)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Overall</p>
                                  <Badge
                                    className={getScoreBadge(result.overallPercentage)}
                                  >
                                    {result.overallPercentage.toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Non-manager/admin view - only my performance
        <div className="space-y-6">
          {!user?.employeeId || !user?.organizationId ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading user data...
              </p>
            </div>
          ) : (
            <UnifiedPerformanceOverview
              employeeId={user.employeeId}
              organizationId={user.organizationId}
              strategicPeriodId={
                filters.periodId !== "all" ? filters.periodId : undefined
              }
            />
          )}
        </div>
      )}
      
      {/* Export Dialog */}
      {teamPerformance && (
        <PerformanceExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          data={exportData}
          summaryStats={summaryStats}
          periodName={periods.find((p: any) => p.strategicPeriodId === filters.periodId)?.name || activePeriod?.name}
          organizationName="Organization"
        />
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeePerformanceDetail
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          employee={selectedEmployee.employee}
          performance={selectedEmployee}
        />
      )}
    </div>
  );
}
