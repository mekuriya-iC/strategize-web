"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';

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
  const getColorClass = (score: number) => {
    if (score >= 85) return "bg-emerald-500 hover:bg-emerald-600";
    if (score >= 70) return "bg-green-500 hover:bg-green-600";
    if (score >= 60) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getTextColorClass = (score: number) => {
    if (score >= 85) return "text-emerald-700 dark:text-emerald-300";
    if (score >= 70) return "text-green-700 dark:text-green-300";
    if (score >= 60) return "text-yellow-700 dark:text-yellow-300";
    return "text-red-700 dark:text-red-300";
  };

  const getStatusIcon = (score: number) => {
    if (score >= 85) return <TrendingUp className="h-4 w-4" />;
    if (score >= 60) return <Users className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Performance Heat Map
          </CardTitle>
          <CardDescription>Visual overview of all units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (divisions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Performance Heat Map
          </CardTitle>
          <CardDescription>Visual overview of all units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No department data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Department Performance Heat Map
        </CardTitle>
        <CardDescription>
          Click any department to view details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {divisions.map((division) => (
            <div key={division.divisionId} className="space-y-3">
              {/* Division Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {division.name}
                  </h4>
                </div>
                <Badge className={getTextColorClass(division.averageScore)}>
                  {division.averageScore.toFixed(1)}%
                </Badge>
              </div>

              {/* Department Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {division.departments.map((dept) => (
                  <button
                    key={dept.departmentId}
                    onClick={() => onDepartmentClick?.(dept.departmentId)}
                    className={`
                      relative p-3 rounded-lg text-white transition-all
                      ${getColorClass(dept.averageScore)}
                      transform hover:scale-105 hover:shadow-lg
                    `}
                    title={`${dept.name}: ${dept.averageScore.toFixed(1)}% (${dept.employeeCount} employees)`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-bold text-left line-clamp-2">
                        {dept.name}
                      </p>
                      <div className="flex-shrink-0 ml-1">
                        {getStatusIcon(dept.averageScore)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{dept.averageScore.toFixed(0)}%</span>
                      <span className="flex items-center gap-1 opacity-90">
                        <Users className="h-3 w-3" />
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
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Performance Legend:
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-gray-700 dark:text-gray-300">Exceptional (≥85%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-gray-700 dark:text-gray-300">Good (70-84%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">Fair (60-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-gray-700 dark:text-gray-300">Needs Support (&lt;60%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
