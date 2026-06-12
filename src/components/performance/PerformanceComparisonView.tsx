"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users as UsersIcon,
  Activity,
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ComparisonEmployee {
  employeeId: string;
  fullName: string;
  title?: string;
  picture?: string;
  overallPercentage: number;
  rating: string;
  breakdown: {
    kpiScore: { percentageAchieved: number };
    competencyScore: { percentageAchieved: number };
    activityScore: { percentageAchieved: number };
  };
}

interface PerformanceComparisonViewProps {
  employees: ComparisonEmployee[];
  teamAverage?: number;
}

export function PerformanceComparisonView({
  employees,
  teamAverage = 0,
}: PerformanceComparisonViewProps) {
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

  const getDeltaIcon = (score: number, average: number) => {
    if (score > average) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (score < average) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getDelta = (score: number, average: number) => {
    const delta = score - average;
    return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
  };

  // Prepare radar chart data
  const radarData = [
    {
      metric: 'KPI',
      ...employees.reduce((acc, emp, idx) => ({
        ...acc,
        [`Employee${idx + 1}`]: emp.breakdown.kpiScore.percentageAchieved,
      }), {}),
    },
    {
      metric: '360°',
      ...employees.reduce((acc, emp, idx) => ({
        ...acc,
        [`Employee${idx + 1}`]: emp.breakdown.competencyScore.percentageAchieved,
      }), {}),
    },
    {
      metric: 'Activity',
      ...employees.reduce((acc, emp, idx) => ({
        ...acc,
        [`Employee${idx + 1}`]: emp.breakdown.activityScore.percentageAchieved,
      }), {}),
    },
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>No employees selected for comparison</p>
            <p className="text-sm mt-1">Select employees from the table to compare</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Radar Chart Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              {employees.map((emp, idx) => (
                <Radar
                  key={emp.employeeId}
                  name={emp.fullName}
                  dataKey={`Employee${idx + 1}`}
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((employee, idx) => (
          <Card key={employee.employeeId} className="border-t-4" style={{ borderTopColor: colors[idx % colors.length] }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={employee.picture}
                  alt={employee.fullName}
                  fallbackText={employee.fullName}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{employee.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{employee.title || 'No title'}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Overall Score</p>
                <div className={`text-3xl font-bold ${getScoreColor(employee.overallPercentage)}`}>
                  {employee.overallPercentage.toFixed(1)}%
                </div>
                <Badge className={`mt-2 ${getScoreBadge(employee.overallPercentage)}`}>
                  {employee.rating}
                </Badge>
                {teamAverage > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs">
                    {getDeltaIcon(employee.overallPercentage, teamAverage)}
                    <span>{getDelta(employee.overallPercentage, teamAverage)}% vs avg</span>
                  </div>
                )}
              </div>

              {/* KPI Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    <span>KPI</span>
                  </div>
                  <span className={`text-sm font-semibold ${getScoreColor(employee.breakdown.kpiScore.percentageAchieved)}`}>
                    {employee.breakdown.kpiScore.percentageAchieved.toFixed(0)}%
                  </span>
                </div>
                <Progress value={employee.breakdown.kpiScore.percentageAchieved} className="h-2" />
              </div>

              {/* 360° Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-xs">
                    <UsersIcon className="h-3 w-3" />
                    <span>360°</span>
                  </div>
                  <span className={`text-sm font-semibold ${getScoreColor(employee.breakdown.competencyScore.percentageAchieved)}`}>
                    {employee.breakdown.competencyScore.percentageAchieved.toFixed(0)}%
                  </span>
                </div>
                <Progress value={employee.breakdown.competencyScore.percentageAchieved} className="h-2" />
              </div>

              {/* Activity Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-xs">
                    <Activity className="h-3 w-3" />
                    <span>Activity</span>
                  </div>
                  <span className={`text-sm font-semibold ${getScoreColor(employee.breakdown.activityScore.percentageAchieved)}`}>
                    {employee.breakdown.activityScore.percentageAchieved.toFixed(0)}%
                  </span>
                </div>
                <Progress value={employee.breakdown.activityScore.percentageAchieved} className="h-2" />
              </div>

              {/* Strengths & Weaknesses */}
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-2">Key Insight</p>
                {employee.breakdown.kpiScore.percentageAchieved >= 
                  Math.max(
                    employee.breakdown.competencyScore.percentageAchieved,
                    employee.breakdown.activityScore.percentageAchieved
                  ) ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 font-medium">Strong</span> in KPI performance
                  </p>
                ) : employee.breakdown.competencyScore.percentageAchieved >= 
                  Math.max(
                    employee.breakdown.kpiScore.percentageAchieved,
                    employee.breakdown.activityScore.percentageAchieved
                  ) ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-blue-600 font-medium">Excellent</span> 360° ratings
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-orange-600 font-medium">Active</span> engagement
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
