"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
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
import { Download, Building2, Users, Briefcase } from "lucide-react";

interface DepartmentReportProps {
  onExport?: (data: any) => void;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DepartmentReport({ onExport }: DepartmentReportProps) {
  const [viewType, setViewType] = useState<"department" | "division">("department");

  const { data: deptsData, loading: deptsLoading } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  const { data: divsData, loading: divsLoading } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  const { data: empsData, loading: empsLoading } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  const departments = deptsData?.departments?.items || [];
  const divisions = divsData?.divisions?.items || [];
  const employees = empsData?.employees?.items || [];

  // Calculate department metrics
  const totalDepartments = departments.length;
  const totalDivisions = divisions.length;
  const totalEmployees = employees.length;

  // Employees by department
  const employeesByDept = departments.map((dept: any) => ({
    name: dept.name,
    employees: employees.filter((emp: any) => emp.department?.departmentId === dept.departmentId).length,
  })).sort((a, b) => b.employees - a.employees);

  // Employees by division
  const employeesByDiv = divisions.map((div: any) => ({
    name: div.name,
    employees: employees.filter((emp: any) => emp.division?.divisionId === div.divisionId).length,
  })).sort((a, b) => b.employees - a.employees);

  const maxEmployees = Math.max(
    ...employeesByDept.map(d => d.employees),
    ...employeesByDiv.map(d => d.employees),
    1
  );

  // Department size distribution
  const deptSizeDistribution = [
    { name: "Small (1-10)", value: employeesByDept.filter(d => d.employees <= 10).length, color: COLORS[0] },
    { name: "Medium (11-30)", value: employeesByDept.filter(d => d.employees > 10 && d.employees <= 30).length, color: COLORS[1] },
    { name: "Large (31-50)", value: employeesByDept.filter(d => d.employees > 30 && d.employees <= 50).length, color: COLORS[2] },
    { name: "Very Large (50+)", value: employeesByDept.filter(d => d.employees > 50).length, color: COLORS[3] },
  ].filter(item => item.value > 0);

  const totalDeptSize = deptSizeDistribution.reduce((sum, item) => sum + item.value, 0);

  const handleExport = () => {
    const reportData = {
      viewType,
      totalDepartments,
      totalDivisions,
      totalEmployees,
      employeesByDept,
      employeesByDiv,
      deptSizeDistribution,
      generatedAt: new Date().toISOString(),
    };
    onExport?.(reportData);
  };

  const loading = deptsLoading || divsLoading || empsLoading;

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
          <Select value={viewType} onValueChange={(v: any) => setViewType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">By Department</SelectItem>
              <SelectItem value="division">By Division</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Divisions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDivisions}</div>
            <p className="text-xs text-muted-foreground">Active divisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Avg {totalDepartments > 0 ? (totalEmployees / totalDepartments).toFixed(1) : 0} per dept
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Employees by Department/Division */}
        <Card>
          <CardHeader>
            <CardTitle>
              Employees by {viewType === "department" ? "Department" : "Division"}
            </CardTitle>
            <CardDescription>
              Distribution of employees across organizational units
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(viewType === "department" ? employeesByDept : employeesByDiv).length > 0 ? (
              <div className="space-y-3">
                {(viewType === "department" ? employeesByDept : employeesByDiv).slice(0, 15).map((item, index) => {
                  const percentage = (item.employees / maxEmployees) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[300px]">{item.name}</span>
                        <span className="text-muted-foreground ml-2">{item.employees}</span>
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
                No organizational data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Size Distribution */}
        {viewType === "department" && deptSizeDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Department Size Distribution</CardTitle>
              <CardDescription>
                Number of departments by employee count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deptSizeDistribution.map((item, index) => {
                  const percentage = totalDeptSize > 0 ? (item.value / totalDeptSize) * 100 : 0;
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Detailed {viewType === "department" ? "Department" : "Division"} Breakdown
          </CardTitle>
          <CardDescription>
            Complete list with employee counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-right py-3 px-4 font-semibold">Employees</th>
                  <th className="text-right py-3 px-4 font-semibold">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {(viewType === "department" ? employeesByDept : employeesByDiv).map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="text-right py-3 px-4">{item.employees}</td>
                    <td className="text-right py-3 px-4">
                      {totalEmployees > 0
                        ? `${((item.employees / totalEmployees) * 100).toFixed(1)}%`
                        : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
