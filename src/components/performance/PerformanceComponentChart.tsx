"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PerformanceComponentChartProps {
  kpiWeight: number;
  competencyWeight: number;
  activityWeight: number;
  kpiAverage: number;
  competencyAverage: number;
  activityAverage: number;
}

const COLORS = {
  kpi: '#10b981',
  competency: '#3b82f6',
  activity: '#f59e0b',
};

export function PerformanceComponentChart({
  kpiWeight,
  competencyWeight,
  activityWeight,
  kpiAverage,
  competencyAverage,
  activityAverage,
}: PerformanceComponentChartProps) {
  const weightData = [
    { name: 'KPI', value: kpiWeight, color: COLORS.kpi },
    { name: '360° Evaluation', value: competencyWeight, color: COLORS.competency },
    { name: 'Activity', value: activityWeight, color: COLORS.activity },
  ];

  const performanceData = [
    { name: 'KPI', value: kpiAverage, color: COLORS.kpi },
    { name: '360° Evaluation', value: competencyAverage, color: COLORS.competency },
    { name: 'Activity', value: activityAverage, color: COLORS.activity },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Components</CardTitle>
        <CardDescription>
          Weight allocation and average scores by component
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weight Allocation */}
          <div>
            <h4 className="text-sm font-semibold text-center mb-4">Weight Allocation</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={weightData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {weightData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Average Performance */}
          <div>
            <h4 className="text-sm font-semibold text-center mb-4">Average Performance</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <p className="text-xs text-muted-foreground mb-1">KPI</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {kpiAverage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Weight: {kpiWeight}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <p className="text-xs text-muted-foreground mb-1">360° Eval</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {competencyAverage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Weight: {competencyWeight}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
            <p className="text-xs text-muted-foreground mb-1">Activity</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {activityAverage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Weight: {activityWeight}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
