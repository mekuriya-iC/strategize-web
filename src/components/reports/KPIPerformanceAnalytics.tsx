"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
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
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Target,
  TrendingUp,
  AlertCircle,
  Building2,
  Users,
  User,
  ChevronRight,
  ArrowUpRight,
  Layers,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/stores";

// GraphQL Queries for real-time scorecards
const GET_CORPORATE_SCORECARD = gql`
  query GetCorporateScorecard($organizationId: ID!, $periodId: ID!, $capFinalScore: Boolean) {
    realtimeCorporateScorecard(
      organizationId: $organizationId
      periodId: $periodId
      capFinalScore: $capFinalScore
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        kpi {
          kpiId
          name
          measurementUnit
        }
        actualValue
        targetValue
        score
        weight
        achievementRate
      }
    }
  }
`;

// Query to get division assignments with parent weights
const GET_DIVISION_ASSIGNMENTS = gql`
  query GetDivisionAssignments($divisionId: ID!, $periodId: ID!) {
    kpiAssignmentsDivision(
      divisionId: $divisionId
      strategicPeriodId: $periodId
      page: 1
      limit: 100
    ) {
      items {
        kpiAssignmentDivisionId
        weight
        parentWeightAllocation
        kpi {
          kpiId
          name
        }
      }
    }
  }
`;

// Query to get department assignments with parent weights
const GET_DEPARTMENT_ASSIGNMENTS = gql`
  query GetDepartmentAssignments($departmentId: ID!, $periodId: ID!) {
    kpiAssignmentsDepartment(
      departmentId: $departmentId
      strategicPeriodId: $periodId
      page: 1
      limit: 100
    ) {
      items {
        kpiAssignmentDepartmentId
        weight
        parentWeightAllocation
        kpi {
          kpiId
          name
        }
      }
    }
  }
`;

const GET_DIVISIONS = gql`
  query GetDivisions {
    divisions {
      items {
        divisionId
        name
        description
      }
    }
  }
`;

const GET_DIVISION_SCORECARD = gql`
  query GetDivisionScorecard($divisionId: ID!, $periodId: ID!, $capFinalScore: Boolean) {
    realtimeDivisionScorecard(
      divisionId: $divisionId
      periodId: $periodId
      capFinalScore: $capFinalScore
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        kpi {
          kpiId
          name
          measurementUnit
        }
        actualValue
        targetValue
        score
        weight
        achievementRate
      }
    }
  }
`;

const GET_DEPARTMENTS = gql`
  query GetDepartments($divisionId: ID) {
    departments(divisionId: $divisionId) {
      items {
        departmentId
        name
        description
        division {
          divisionId
          name
        }
      }
    }
  }
`;

const GET_DEPARTMENT_SCORECARD = gql`
  query GetDepartmentScorecard($departmentId: ID!, $periodId: ID!, $capFinalScore: Boolean) {
    realtimeDepartmentScorecard(
      departmentId: $departmentId
      periodId: $periodId
      capFinalScore: $capFinalScore
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        kpi {
          kpiId
          name
          measurementUnit
        }
        actualValue
        targetValue
        score
        weight
        achievementRate
      }
    }
  }
`;

const GET_PERIODS = gql`
  query GetStrategicPeriods {
    strategicPeriods {
      items {
        strategicPeriodId
        name
        periodType
        startDate
        endDate
      }
    }
  }
`;

const GET_EMPLOYEES = gql`
  query GetEmployees($page: Int, $limit: Int, $search: String) {
    employees(page: $page, limit: $limit, search: $search) {
      items {
        employeeId
        fullName
        email
        title
      }
    }
  }
`;

const GET_EMPLOYEE_KPI_PERFORMANCE = gql`
  query GetEmployeeKpiPerformance($filters: UnifiedPerformanceFilters!) {
    unifiedEmployeePerformance(filters: $filters) {
      employeeId
      employee {
        employeeId
        fullName
        email
        title
      }
      strategicPeriodId
      totalScore
      maxPossibleScore
      overallPercentage
      rating
      breakdown {
        kpiScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
        }
        competencyScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
        }
        activityScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
        }
      }
    }
  }
`;

interface KPIPerformanceAnalyticsProps {
  onExport?: (data: any) => void;
}

export default function KPIPerformanceAnalytics({ onExport }: KPIPerformanceAnalyticsProps) {
  const user = useAuthStore((state) => state.user);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("all");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");

  // Check if user has full access
  const fullAccessRoles = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
  const hasFullAccess = !!user?.role && fullAccessRoles.has(user.role as string);

  // Fetch periods
  const { data: periodsData } = useQuery(GET_PERIODS);
  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((p: any) => {
    // Check if period is currently active based on dates
    const now = new Date();
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

  // Auto-select active period (only once)
  if (!selectedPeriodId && activePeriod && activePeriod.strategicPeriodId) {
    setSelectedPeriodId(activePeriod.strategicPeriodId);
  }

  // Fetch corporate scorecard
  const { data: corporateData, loading: corporateLoading } = useQuery(GET_CORPORATE_SCORECARD, {
    variables: {
      organizationId: user?.organizationId,
      periodId: selectedPeriodId,
      capFinalScore: false,
    },
    skip: !user?.organizationId || !selectedPeriodId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch divisions
  const { data: divisionsData } = useQuery(GET_DIVISIONS);
  const divisions = divisionsData?.divisions?.items || [];

  // Fetch division scorecard
  const { data: divisionData, loading: divisionLoading } = useQuery(GET_DIVISION_SCORECARD, {
    variables: {
      divisionId: selectedDivisionId,
      periodId: selectedPeriodId,
      capFinalScore: false,
    },
    skip: selectedDivisionId === "all" || !selectedPeriodId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch division assignments for parent weights
  const { data: divisionAssignmentsData } = useQuery(GET_DIVISION_ASSIGNMENTS, {
    variables: {
      divisionId: selectedDivisionId,
      periodId: selectedPeriodId,
    },
    skip: selectedDivisionId === "all" || !selectedPeriodId,
  });

  // Fetch departments
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: {
      divisionId: selectedDivisionId !== "all" ? selectedDivisionId : undefined,
    },
  });
  const departments = departmentsData?.departments?.items || [];

  // Fetch employees (for full access users)
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: {
      page: 1,
      limit: 500,
    },
    skip: !hasFullAccess,
  });
  const employees = employeesData?.employees?.items || [];

  // Fetch individual employee KPI performance
  const { data: employeeKpiData, loading: employeeKpiLoading } = useQuery(GET_EMPLOYEE_KPI_PERFORMANCE, {
    variables: {
      filters: {
        employeeId: selectedEmployeeId,
        strategicPeriodId: selectedPeriodId,
        organizationId: user?.organizationId,
      },
    },
    skip: selectedEmployeeId === "all" || !selectedPeriodId || !hasFullAccess,
    fetchPolicy: "cache-and-network",
  });

  // Fetch department scorecard
  const { data: departmentData, loading: departmentLoading } = useQuery(GET_DEPARTMENT_SCORECARD, {
    variables: {
      departmentId: selectedDepartmentId,
      periodId: selectedPeriodId,
      capFinalScore: false,
    },
    skip: selectedDepartmentId === "all" || !selectedPeriodId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch department assignments for parent weights
  const { data: departmentAssignmentsData } = useQuery(GET_DEPARTMENT_ASSIGNMENTS, {
    variables: {
      departmentId: selectedDepartmentId,
      periodId: selectedPeriodId,
    },
    skip: selectedDepartmentId === "all" || !selectedPeriodId,
  });

  const corporateScorecard = corporateData?.realtimeCorporateScorecard;
  const divisionScorecard = divisionData?.realtimeDivisionScorecard;
  const departmentScorecard = departmentData?.realtimeDepartmentScorecard;
  const employeePerformance = employeeKpiData?.unifiedEmployeePerformance;

  // Create maps for assignments
  const divisionAssignmentMap = new Map(
    (divisionAssignmentsData?.kpiAssignmentsDivision?.items || []).map((a: any) => [
      a.kpi.kpiId,
      a,
    ])
  );

  const departmentAssignmentMap = new Map(
    (departmentAssignmentsData?.kpiAssignmentsDepartment?.items || []).map((a: any) => [
      a.kpi.kpiId,
      a,
    ])
  );

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (percentage >= 70) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 90) return { label: "Exceptional", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (percentage >= 70) return { label: "On Track", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (percentage >= 50) return { label: "Needs Attention", color: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "Critical", color: "bg-rose-100 text-rose-700 border-rose-200" };
  };

  const handleExport = () => {
    const reportData = {
      period: periods.find((p: any) => p.strategicPeriodId === selectedPeriodId)?.name,
      corporate: corporateScorecard,
      division: divisionScorecard,
      department: departmentScorecard,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.fullName,
    };
    onExport?.(reportData);
  };

  // Show loading only on initial load, not when period changes
  if (corporateLoading && !corporateScorecard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading KPI performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPeriodId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">
          Please select a period to view KPI performance data.
        </p>
      </div>
    );
  }

  if (!corporateScorecard) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">
          No KPI performance data available for the selected period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-[200px]">
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

          <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map((div: any) => (
                <SelectItem key={div.divisionId} value={div.divisionId}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDepartmentId}
            onValueChange={(val) => {
              setSelectedDepartmentId(val);
              setSelectedEmployeeId("all"); // Reset employee when department changes
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept: any) => (
                <SelectItem key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Employee Selector - Only for full access users */}
          {hasFullAccess && (
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp: any) => (
                  <SelectItem key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Corporate Level Performance */}
      {corporateScorecard && (
        <Card className="border-2 border-blue-200 dark:border-blue-900/40 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Corporate Level Performance</CardTitle>
                  <CardDescription>Organization-wide KPI achievement</CardDescription>
                </div>
              </div>
              <Badge className={`text-lg py-1 px-4 ${getPerformanceStatus(corporateScorecard.percentageAchieved).color}`}>
                {getPerformanceStatus(corporateScorecard.percentageAchieved).label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Overall Score */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Achievement</span>
                <span className={`text-4xl font-bold ${getPerformanceColor(corporateScorecard.percentageAchieved)}`}>
                  {corporateScorecard.percentageAchieved.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={corporateScorecard.percentageAchieved} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Score: {corporateScorecard.totalScore.toFixed(2)}</span>
                <span>Max: {corporateScorecard.maxPossibleScore.toFixed(2)}</span>
              </div>
            </div>

            {/* KPI Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Corporate KPIs Breakdown
              </h4>
              <div className="grid gap-3">
                {corporateScorecard.kpiScores.map((kpiScore: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                          {kpiScore.kpi.name}
                        </h5>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <span>Weight: {kpiScore.weight.toFixed(1)}%</span>
                          <span>Target: {kpiScore.targetValue} {kpiScore.kpi.measurementUnit}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Actual: {kpiScore.actualValue.toFixed(2)} {kpiScore.kpi.measurementUnit}
                          </span>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${getPerformanceColor((kpiScore.achievementRate * 100))}`}>
                        {(kpiScore.achievementRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={kpiScore.achievementRate * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Division Level Performance */}
      {selectedDivisionId !== "all" && divisionScorecard && (
        <Card className="border-2 border-purple-200 dark:border-purple-900/40">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Division Level Performance</CardTitle>
                  <CardDescription>
                    {divisions.find((d: any) => d.divisionId === selectedDivisionId)?.name || "Selected Division"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Contributing to Corporate</span>
                <Badge className={`text-lg py-1 px-4 ${getPerformanceStatus(divisionScorecard.percentageAchieved).color}`}>
                  {divisionScorecard.percentageAchieved.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4">
              <Progress value={divisionScorecard.percentageAchieved} className="h-3" />
            </div>
            <div className="grid gap-2">
              {divisionScorecard.kpiScores.map((kpiScore: any, index: number) => {
                const assignment = divisionAssignmentMap.get(kpiScore.kpi.kpiId);
                const hasParentWeight =
                  assignment &&
                  assignment.parentWeightAllocation !== null &&
                  assignment.parentWeightAllocation !== assignment.weight;

                return (
                  <div key={index} className="p-3 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{kpiScore.kpi.name}</span>
                      <span className={`font-bold ${getPerformanceColor((kpiScore.achievementRate * 100))}`}>
                        {(kpiScore.achievementRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {kpiScore.actualValue.toFixed(2)} / {kpiScore.targetValue} {kpiScore.kpi.measurementUnit}
                    </div>
                    {hasParentWeight && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {assignment.weight.toFixed(1)}% Local
                        </Badge>
                        <ArrowUpRight className="w-3 h-3 text-purple-500" />
                        <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {assignment.parentWeightAllocation.toFixed(1)}% to Corporate
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Level Performance */}
      {selectedDepartmentId !== "all" && departmentScorecard && (
        <Card className="border-2 border-amber-200 dark:border-amber-900/40">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Department Level Performance</CardTitle>
                  <CardDescription>
                    {departments.find((d: any) => d.departmentId === selectedDepartmentId)?.name || "Selected Department"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Contributing to Division</span>
                <Badge className={`text-lg py-1 px-4 ${getPerformanceStatus(departmentScorecard.percentageAchieved).color}`}>
                  {departmentScorecard.percentageAchieved.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4">
              <Progress value={departmentScorecard.percentageAchieved} className="h-3" />
            </div>
            <div className="grid gap-2">
              {departmentScorecard.kpiScores.map((kpiScore: any, index: number) => {
                const assignment = departmentAssignmentMap.get(kpiScore.kpi.kpiId);
                const hasParentWeight =
                  assignment &&
                  assignment.parentWeightAllocation !== null &&
                  assignment.parentWeightAllocation !== assignment.weight;

                return (
                  <div key={index} className="p-3 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{kpiScore.kpi.name}</span>
                      <span className={`font-bold ${getPerformanceColor((kpiScore.achievementRate * 100))}`}>
                        {(kpiScore.achievementRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {kpiScore.actualValue.toFixed(2)} / {kpiScore.targetValue} {kpiScore.kpi.measurementUnit}
                    </div>
                    {hasParentWeight && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {assignment.weight.toFixed(1)}% Local
                        </Badge>
                        <ArrowUpRight className="w-3 h-3 text-amber-500" />
                        <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          {assignment.parentWeightAllocation.toFixed(1)}% to Division
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Employee KPI Performance */}
      {hasFullAccess && selectedEmployeeId !== "all" && employeePerformance && (
        <Card className="border-2 border-indigo-200 dark:border-indigo-900/40 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-b border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Individual Employee Performance</CardTitle>
                  <CardDescription>
                    {employeePerformance.employee.fullName} • {employeePerformance.employee.title}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Contributing to Department</span>
                <Badge className={`text-lg py-1 px-4 ${getPerformanceStatus(employeePerformance.overallPercentage).color}`}>
                  {employeePerformance.rating}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Overall Score */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Performance Score
                </span>
                <span className={`text-4xl font-bold ${getPerformanceColor(employeePerformance.overallPercentage)}`}>
                  {employeePerformance.overallPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={employeePerformance.overallPercentage} className="h-3 mb-2" />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Score: {employeePerformance.totalScore.toFixed(2)}</span>
                <span>Max: {employeePerformance.maxPossibleScore.toFixed(2)}</span>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* KPI Score */}
              <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">KPI Performance</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {employeePerformance.breakdown.kpiScore.percentageAchieved.toFixed(1)}%
                </div>
                <Progress value={employeePerformance.breakdown.kpiScore.percentageAchieved} className="h-2 mb-1" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Weight: {employeePerformance.breakdown.kpiScore.weight}%
                </div>
              </div>

              {/* Competency Score */}
              <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-950/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Competency (360°)</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {employeePerformance.breakdown.competencyScore.percentageAchieved.toFixed(1)}%
                </div>
                <Progress value={employeePerformance.breakdown.competencyScore.percentageAchieved} className="h-2 mb-1" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Weight: {employeePerformance.breakdown.competencyScore.weight}%
                </div>
              </div>

              {/* Activity Score */}
              <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Activity Metrics</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {employeePerformance.breakdown.activityScore.percentageAchieved.toFixed(1)}%
                </div>
                <Progress value={employeePerformance.breakdown.activityScore.percentageAchieved} className="h-2 mb-1" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Weight: {employeePerformance.breakdown.activityScore.weight}%
                </div>
              </div>
            </div>

            {/* Cascade Visualization */}
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                KPI Cascade Contribution
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <User className="h-3 w-3" />
                  <span>Individual Achievement</span>
                  <ArrowUpRight className="h-3 w-3 ml-auto text-indigo-500" />
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 pl-4">
                  <Users className="h-3 w-3" />
                  <span>Aggregates to Department KPIs</span>
                  <ArrowUpRight className="h-3 w-3 ml-auto text-amber-500" />
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 pl-8">
                  <Layers className="h-3 w-3" />
                  <span>Contributes to Division Goals</span>
                  <ArrowUpRight className="h-3 w-3 ml-auto text-purple-500" />
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 pl-12">
                  <Building2 className="h-3 w-3" />
                  <span>Impacts Corporate Objectives</span>
                  <TrendingUp className="h-3 w-3 ml-auto text-blue-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Insights */}
      {corporateScorecard && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Key takeaways from current performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total KPIs</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {corporateScorecard.kpiScores.length}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">On Target (&gt;70%)</div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {corporateScorecard.kpiScores.filter((k: any) => (k.achievementRate * 100) >= 70).length}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Needs Attention (&lt;70%)</div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {corporateScorecard.kpiScores.filter((k: any) => (k.achievementRate * 100) < 70).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
