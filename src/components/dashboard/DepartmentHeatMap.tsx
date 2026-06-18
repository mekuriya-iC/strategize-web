"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users } from 'lucide-react';

interface Department {
  departmentId: string;
  name: string;
  averageScore: number;
  employeeCount: number;
}

interface Division {
  divisionId: string;
  name: string;
  averageScore: number;
  departments: Department[];
}

interface DepartmentHeatMapProps {
  divisions: Division[];
  loading?: boolean;
  onDepartmentClick?: (departmentId: string) => void;
}

export function DepartmentHeatMap({
  divisions,
  loading = false,
  onDepartmentClick,
}: DepartmentHeatMapProps) {
  // Returns opacity-based neutral class — no rainbow colors
  const getTileStyle = (score: number): React.CSSProperties => {
    // Darker bg = higher score — using opacity on a single slate color
    const opacity = Math.max(0.08, Math.min(score / 100, 1));
    return {
      backgroundColor: `rgba(71, 85, 105, ${opacity})`, // slate-600
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 70) return "text-slate-700 dark:text-slate-200";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getDivisionBadgeStyle = (score: number) => {
    if (score >= 85) return "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30";
    if (score >= 70) return "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800";
    if (score >= 60) return "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30";
    return "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/30";
  };

  if (loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Building2 className="h-4 w-4" />
            Department Performance Heat Map
          </CardTitle>
          <CardDescription className="text-xs">Visual overview of all units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (divisions.length === 0) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Building2 className="h-4 w-4" />
            Department Performance Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 dark:text-slate-500">No department data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Building2 className="h-4 w-4 text-slate-500" />
          Department Performance Heat Map
        </CardTitle>
        <CardDescription className="text-xs">Click any department to view details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {divisions.map((division) => (
            <div key={division.divisionId} className="space-y-2.5">
              {/* Division Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    {division.name}
                  </h4>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getDivisionBadgeStyle(division.averageScore)}`}>
                  {division.averageScore.toFixed(1)}%
                </span>
              </div>

              {/* Department Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {division.departments.map((dept) => (
                  <button
                    key={dept.departmentId}
                    onClick={() => onDepartmentClick?.(dept.departmentId)}
                    style={getTileStyle(dept.averageScore)}
                    className="relative p-2.5 rounded-lg text-slate-700 dark:text-slate-200 transition-all hover:opacity-80 hover:scale-[1.02] text-left border border-white/20 dark:border-slate-700/50"
                    title={`${dept.name}: ${dept.averageScore.toFixed(1)}% (${dept.employeeCount} employees)`}
                  >
                    <p className="text-xs font-semibold line-clamp-2 mb-1 leading-tight">
                      {dept.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold ${getScoreColor(dept.averageScore)}`}>
                        {dept.averageScore.toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                        <Users className="h-2.5 w-2.5" />
                        {dept.employeeCount}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">Performance Legend</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Exceptional (≥85%)", color: "text-emerald-600" },
              { label: "Good (70–84%)", color: "text-slate-600" },
              { label: "Fair (60–69%)", color: "text-amber-600" },
              { label: "Needs Support (<60%)", color: "text-red-600" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <div className={`w-2 h-2 rounded-full ${color.replace("text-", "bg-")}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
