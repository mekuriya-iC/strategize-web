"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  TrendingUp,
  Award,
  Users,
  Target,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Save,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import {
  GET_ALL_SEMI_ANNUAL_RESULTS,
  GET_SEMI_ANNUAL_CONFIG,
  GET_SHARED_KPIS_WITH_DIVISIONS,
  SYNC_DIVISIONS_TO_SHARED_KPIS,
  CREATE_OR_UPDATE_CONFIG,
  ASSIGN_SHARED_KPI,
  UPDATE_SHARED_KPI_SCORE,
} from "@/lib/graphql/queries/semiAnnualPerformance";
import UserAvatar from "@/components/UserAvatar";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function SemiAnnualReportPage() {
  const user = useAuthStore((state) => state.user);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [ownPerformanceWeight, setOwnPerformanceWeight] = useState(70);
  const [divisionAchievements, setDivisionAchievements] = useState<Record<string, number>>({});
  const [employeeAssignments, setEmployeeAssignments] = useState<Record<string, Record<string, number>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const fullAccessRoles = ["SUPER_ADMIN", "HR"];
  const hasFullAccess = fullAccessRoles.includes(user?.role as string);

  // Fetch strategic periods
  const { data: periodsData } = useQuery(gql`
    query GetStrategicPeriods($organizationId: ID!) {
      strategicPeriods(organizationId: $organizationId) {
        items {
          strategicPeriodId
          name
          periodType
          startDate
          endDate
          status
        }
      }
    }
  `, {
    variables: { organizationId: user?.organizationId },
    skip: !user?.organizationId,
  });

  const periods = periodsData?.strategicPeriods?.items || [];

  // Auto-select first period
  useEffect(() => {
    if (!selectedPeriodId && periods.length > 0) {
      setSelectedPeriodId(periods[0].strategicPeriodId);
    }
  }, [periods, selectedPeriodId]);

  // Fetch configuration
  const { data: configData } = useQuery(GET_SEMI_ANNUAL_CONFIG, {
    variables: {
      semiAnnualPeriodId: selectedPeriodId,
      organizationId: user?.organizationId,
    },
    skip: !selectedPeriodId || !user?.organizationId,
  });

  const config = configData?.semiAnnualPerformanceConfig;

  // Update local ownPerformanceWeight when config loads
  useEffect(() => {
    if (config) {
      setOwnPerformanceWeight(config.ownPerformanceWeight || 70);
    }
  }, [config]);

  // Fetch divisions and their SharedKPIs
  // Important: We use strategicPeriodId from dropdown, backend will find/create semi-annual period
  const { data: divisionsData, refetch: refetchDivisions, loading: divisionsLoading } = useQuery(
    GET_SHARED_KPIS_WITH_DIVISIONS,
    {
      variables: {
        semiAnnualPeriodId: selectedPeriodId, // This is strategicPeriodId, backend handles conversion
        organizationId: user?.organizationId,
      },
      skip: !selectedPeriodId || !user?.organizationId || !hasFullAccess,
      fetchPolicy: "network-only", // Always fetch fresh data
      onCompleted: (data) => {
        console.log('Divisions data received:', data);
        // Initialize division achievements from fetched data
        const achievements: Record<string, number> = {};
        data.sharedKPIsWithDivisions.forEach((kpi: any) => {
          if (kpi.division) {
            achievements[kpi.division.divisionId] = kpi.achievementScore || 0;
          }
        });
        setDivisionAchievements(achievements);
        
        // If no divisions synced yet, auto-sync them
        if (data.sharedKPIsWithDivisions.length === 0 && selectedPeriodId && user?.organizationId) {
          console.log('No divisions found, auto-syncing...');
          handleSyncDivisions();
        }
      },
      onError: (error) => {
        console.error('Error fetching divisions:', error);
      },
    }
  );

  const divisions = divisionsData?.sharedKPIsWithDivisions || [];

  // Sync divisions mutation
  const [syncDivisions, { loading: syncing }] = useMutation(SYNC_DIVISIONS_TO_SHARED_KPIS, {
    onCompleted: () => {
      toast.success("Divisions synced successfully");
      refetchDivisions();
    },
    onError: (error) => {
      toast.error(`Failed to sync divisions: ${error.message}`);
    },
  });

  // Update division achievement score
  const [updateDivisionScore] = useMutation(gql`
    mutation UpdateSharedKPIScore($sharedKpiId: String!, $achievementScore: Float!) {
      updateSharedKPIScore(
        sharedKpiId: $sharedKpiId
        achievementScore: $achievementScore
      ) {
        sharedKpiId
        achievementScore
      }
    }
  `);

  // Update config mutation
  const [updateConfig] = useMutation(CREATE_OR_UPDATE_CONFIG);

  // Assign shared KPI mutation
  const [assignSharedKPI] = useMutation(gql`
    mutation AssignSharedKPI($input: AssignSharedKPIInput!) {
      assignSharedKPI(input: $input) {
        assignmentId
        assignedWeight
      }
    }
  `);

  // Fetch all results
  const { data: resultsData, loading: resultsLoading, refetch: refetchResults } = useQuery(
    GET_ALL_SEMI_ANNUAL_RESULTS,
    {
      variables: {
        semiAnnualPeriodId: selectedPeriodId,
        organizationId: user?.organizationId,
      },
      skip: !selectedPeriodId || !user?.organizationId || !hasFullAccess,
      fetchPolicy: "cache-and-network",
    }
  );

  const results = resultsData?.allSemiAnnualPerformanceResults || [];

  // Fetch all employees
  const { data: employeesData } = useQuery(gql`
    query GetAllEmployees {
      employees(page: 1, limit: 1000) {
        items {
          employeeId
          fullName
          title
          picture
          departments {
            departmentId
            name
          }
        }
      }
    }
  `, {
    skip: !user?.organizationId || !hasFullAccess,
  });

  const allEmployees = employeesData?.employees?.items || [];

  // Merge employees with results
  const employeeRows = useMemo(() => {
    return allEmployees.map((employee: any) => {
      const result = results.find((r: any) => r.employee?.employeeId === employee.employeeId);
      return {
        employee,
        result: result || {
          kpiScore: 0,
          evaluation360Score: 0,
          baseScore: 0,
          ownPerformanceScore: 0,
          sharedKPIScores: [],
          totalSharedKPIScore: 0,
          finalScore: 0,
          rating: '-',
          isFinalized: false,
        },
      };
    });
  }, [allEmployees, results]);

  // Filter results by search term
  const filteredResults = useMemo(() => {
    if (!searchTerm) return employeeRows;
    const term = searchTerm.toLowerCase();
    return employeeRows.filter((row: any) =>
      row.employee.fullName.toLowerCase().includes(term) ||
      row.employee.title?.toLowerCase().includes(term) ||
      row.employee.departments?.[0]?.name?.toLowerCase().includes(term)
    );
  }, [employeeRows, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredResults.length) {
      return {
        totalEmployees: 0,
        avgScore: 0,
        highestScore: 0,
        excellenceRate: 0,
      };
    }

    const total = filteredResults.length;
    const avgScore =
      filteredResults.reduce((sum: number, row: any) => sum + row.result.finalScore, 0) / total;
    const highestScore = Math.max(
      ...filteredResults.map((row: any) => row.result.finalScore)
    );
    const excellenceCount = filteredResults.filter(
      (row: any) => row.result.finalScore >= 90
    ).length;

    return {
      totalEmployees: total,
      avgScore,
      highestScore,
      excellenceRate: (excellenceCount / total) * 100,
    };
  }, [filteredResults]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRatingBadge = (rating: string) => {
    const variants: any = {
      Exceptional: "bg-emerald-100 text-emerald-700",
      "Exceeds Expectations": "bg-blue-100 text-blue-700",
      "Meets Expectations": "bg-green-100 text-green-700",
      "Needs Improvement": "bg-yellow-100 text-yellow-700",
      "Below Expectations": "bg-red-100 text-red-700",
    };
    return variants[rating] || "bg-gray-100 text-gray-700";
  };

  const handleSyncDivisions = async () => {
    if (!selectedPeriodId || !user?.organizationId) return;
    
    try {
      await syncDivisions({
        variables: {
          semiAnnualPeriodId: selectedPeriodId,
          organizationId: user.organizationId,
        },
      });
    } catch (error) {
      // Error already handled in mutation onError
      console.error('Sync divisions error:', error);
    }
  };

  const handleDivisionAchievementChange = (divisionId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setDivisionAchievements(prev => ({
      ...prev,
      [divisionId]: numValue,
    }));
    setHasChanges(true);
  };

  const handleEmployeeAssignmentChange = (employeeId: string, divisionId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEmployeeAssignments(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [divisionId]: numValue,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      // First, save Own Performance % config
      if (config) {
        await updateConfig({
          variables: {
            input: {
              semiAnnualPeriodId: selectedPeriodId,
              organizationId: user?.organizationId,
              ownPerformanceWeight: ownPerformanceWeight,
              createdBy: user?.employeeId,
            },
          },
        });
      }

      // Save division achievement scores
      for (const division of divisions) {
        if (division.division && divisionAchievements[division.division.divisionId] !== undefined) {
          await updateDivisionScore({
            variables: {
              sharedKpiId: division.sharedKpiId,
              achievementScore: divisionAchievements[division.division.divisionId],
            },
          });
        }
      }

      // Save employee assignments
      for (const employeeId in employeeAssignments) {
        for (const divisionId in employeeAssignments[employeeId]) {
          const division = divisions.find((d: any) => d.division?.divisionId === divisionId);
          if (division) {
            await assignSharedKPI({
              variables: {
                input: {
                  employeeId,
                  sharedKpiId: division.sharedKpiId,
                  semiAnnualPeriodId: selectedPeriodId,
                  organizationId: user?.organizationId,
                  assignedWeight: employeeAssignments[employeeId][divisionId],
                  assignedBy: user?.employeeId,
                },
              },
            });
          }
        }
      }

      setHasChanges(false);
      toast.success("Changes saved successfully");
      refetchResults();
    } catch (error: any) {
      toast.error(`Failed to save changes: ${error.message}`);
    }
  };

  const handleExport = () => {
    if (!filteredResults.length) return;

    const exportData = filteredResults.map((row: any, index: number) => {
      const baseData: any = {
        NO: index + 1,
        Name: row.employee.fullName,
        Title: row.employee.title || "",
        Department: row.employee.departments?.[0]?.name || "",
        "Own KPI (75%)": row.result.kpiScore.toFixed(2),
        "360 Evaluation (25%)": row.result.evaluation360Score.toFixed(2),
        "Total Value (100%)": row.result.baseScore.toFixed(2),
        "Own Performance %": config?.ownPerformanceWeight?.toFixed(2) || "0.00",
        "Own Performance Value": row.result.ownPerformanceScore.toFixed(2),
      };

      // Add division columns
      divisions.forEach((division: any) => {
        if (division.division) {
          const assignment = employeeAssignments[row.employee.employeeId]?.[division.division.divisionId] || 0;
          const value = (division.achievementScore / 100) * assignment;
          baseData[`${division.division.name} (%)`] = assignment.toFixed(2);
          baseData[`${division.division.name} (Value)`] = value.toFixed(2);
        }
      });

      baseData["Total Shared KPI"] = row.result.totalSharedKPIScore.toFixed(2);
      baseData["Final Result"] = row.result.finalScore.toFixed(2);
      baseData["Rating"] = row.result.rating;

      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Semi-Annual Report");

    const periodName = periods.find((p: any) => p.strategicPeriodId === selectedPeriodId)?.name || "Report";
    XLSX.writeFile(workbook, `Semi_Annual_Report_${periodName}.xlsx`);
  };

  if (!hasFullAccess) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You do not have permission to view semi-annual performance reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Semi-Annual Performance Report
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive performance summary with shared division contributions
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSaveChanges} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}
          <Button
            onClick={handleExport}
            disabled={!filteredResults.length}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Select Period</CardTitle>
            </div>
            <Button
              onClick={handleSyncDivisions}
              disabled={syncing || !selectedPeriodId}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Divisions
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period: any) => (
                <SelectItem key={period.strategicPeriodId} value={period.strategicPeriodId}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Own Performance % Configuration */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <label className="text-sm font-medium">Own Performance %:</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={ownPerformanceWeight}
              onChange={(e) => {
                setOwnPerformanceWeight(parseFloat(e.target.value) || 0);
                setHasChanges(true);
              }}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">
              (Shared: {100 - ownPerformanceWeight}%)
            </span>
            {divisionsLoading ? (
              <span className="text-sm text-muted-foreground">Loading divisions...</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {divisions.length} division(s)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedPeriodId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Period Selected</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please select a strategic period above to view employee performance data
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Statistics Cards */}
          {employeeRows.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Employees
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalEmployees}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Score
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(stats.avgScore)}`}>
                    {stats.avgScore.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Highest Score
                    </CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(stats.highestScore)}`}>
                    {stats.highestScore.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Excellence Rate
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">
                    {stats.excellenceRate.toFixed(0)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Division Achievement Scores */}
          {divisionsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground mb-4 animate-spin" />
                <p className="text-lg font-medium">Loading Divisions...</p>
              </CardContent>
            </Card>
          ) : divisions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Division Achievement Scores</CardTitle>
                <CardDescription>
                  Set the performance achievement score for each division (0-100%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {divisions.map((division: any) => (
                    division.division && (
                      <div key={division.division.divisionId} className="flex items-center gap-2">
                        <label className="text-sm font-medium min-w-[100px]">
                          {division.division.name}:
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={divisionAchievements[division.division.divisionId] || 0}
                          onChange={(e) => handleDivisionAchievementChange(division.division.divisionId, e.target.value)}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Divisions Found</p>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  Click "Sync Divisions" to load divisions from your organization structure
                </p>
                <Button onClick={handleSyncDivisions} disabled={syncing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Divisions Now
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Results</CardTitle>
              <CardDescription>
                All employees with division-based shared performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {resultsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No employees found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead rowSpan={2}>NO</TableHead>
                        <TableHead rowSpan={2}>Employee</TableHead>
                        <TableHead rowSpan={2} className="text-right">KPI (75%)</TableHead>
                        <TableHead rowSpan={2} className="text-right">360° (25%)</TableHead>
                        <TableHead rowSpan={2} className="text-right">Base (100%)</TableHead>
                        <TableHead colSpan={2} className="text-center border-x">Own Performance</TableHead>
                        {divisions.map((division: any) => (
                          division.division && (
                            <TableHead key={division.division.divisionId} colSpan={2} className="text-center border-x">
                              {division.division.name}
                            </TableHead>
                          )
                        ))}
                        <TableHead rowSpan={2} className="text-right">Final Score</TableHead>
                        <TableHead rowSpan={2}>Rating</TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="text-right border-l">%</TableHead>
                        <TableHead className="text-right border-r">Value</TableHead>
                        {divisions.map((division: any) => (
                          division.division && (
                            <React.Fragment key={`sub-${division.division.divisionId}`}>
                              <TableHead className="text-right border-l">%</TableHead>
                              <TableHead className="text-right border-r">Value</TableHead>
                            </React.Fragment>
                          )
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((row: any, index: number) => (
                        <TableRow key={row.employee.employeeId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                src={row.employee.picture}
                                alt={row.employee.fullName}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">{row.employee.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {row.employee.title || '-'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {row.result.kpiScore?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.result.evaluation360Score?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {row.result.baseScore?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right border-l">
                            {config?.ownPerformanceWeight || 0}%
                          </TableCell>
                          <TableCell className="text-right border-r">
                            {row.result.ownPerformanceScore?.toFixed(2) || '0.00'}
                          </TableCell>
                          {divisions.map((division: any) => {
                            if (!division.division) return null;
                            
                            const assignment = employeeAssignments[row.employee.employeeId]?.[division.division.divisionId] || 0;
                            const achievement = divisionAchievements[division.division.divisionId] || 0;
                            const value = (achievement / 100) * assignment;
                            
                            return (
                              <React.Fragment key={`val-${division.division.divisionId}`}>
                                <TableCell className="border-l p-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={assignment}
                                    onChange={(e) => handleEmployeeAssignmentChange(
                                      row.employee.employeeId,
                                      division.division.divisionId,
                                      e.target.value
                                    )}
                                    className="w-16 h-8 text-right text-xs"
                                  />
                                </TableCell>
                                <TableCell className="text-right border-r text-xs">
                                  {value.toFixed(2)}
                                </TableCell>
                              </React.Fragment>
                            );
                          })}
                          <TableCell className="text-right">
                            <span
                              className={`text-lg font-bold ${getScoreColor(row.result.finalScore || 0)}`}
                            >
                              {row.result.finalScore?.toFixed(2) || '0.00'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRatingBadge(row.result.rating || '-')}>
                              {row.result.rating || '-'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
