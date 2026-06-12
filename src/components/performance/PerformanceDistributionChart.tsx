"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PerformanceDistributionChartProps {
  data: Array<{
    rating: string;
    count: number;
    percentage: number;
  }>;
}

const RATING_COLORS = {
  'Exceptional': '#10b981', // emerald-500
  'Exceeds Expectations': '#3b82f6', // blue-500
  'Meets Expectations': '#22c55e', // green-500
  'Needs Improvement': '#eab308', // yellow-500
  'Below Expectations': '#ef4444', // red-500
};

export function PerformanceDistributionChart({ data }: PerformanceDistributionChartProps) {
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Distribution</CardTitle>
        <CardDescription>
          Distribution of {totalCount} team members across performance ratings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
            <XAxis 
              dataKey="rating" 
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(var(--background))',
                border: '1px solid rgb(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: any, props: any) => [
                `${value} (${props.payload.percentage.toFixed(1)}%)`,
                'Count'
              ]}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={RATING_COLORS[entry.rating as keyof typeof RATING_COLORS] || '#6b7280'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {data.map((item) => (
            <div key={item.rating} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: RATING_COLORS[item.rating as keyof typeof RATING_COLORS] }}
              />
              <span className="text-xs text-muted-foreground">
                {item.rating}: {item.count} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
