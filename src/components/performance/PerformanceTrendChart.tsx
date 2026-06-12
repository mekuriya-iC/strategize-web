"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PerformanceTrendChartProps {
  data: Array<{
    period: string;
    averageScore: number;
    kpiScore: number;
    competencyScore: number;
  }>;
  showComponents?: boolean;
}

export function PerformanceTrendChart({ data, showComponents = false }: PerformanceTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trend</CardTitle>
        <CardDescription>
          Average performance scores over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
            <XAxis 
              dataKey="period" 
              className="text-xs"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              className="text-xs" 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(var(--background))',
                border: '1px solid rgb(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `${Number(value).toFixed(1)}%`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="averageScore" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Overall Score"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            {showComponents && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="kpiScore" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="KPI Score"
                  dot={{ r: 3 }}
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="competencyScore" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="360° Score"
                  dot={{ r: 3 }}
                  strokeDasharray="5 5"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
