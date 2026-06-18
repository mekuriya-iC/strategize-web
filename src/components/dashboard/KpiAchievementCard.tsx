"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface KpiAchievementCardProps {
  overallRate: number;
  byLevel?: {
    corporate: number;
    division: number;
    department: number;
    personnel: number;
  };
  loading?: boolean;
}

export function KpiAchievementCard({
  overallRate,
  byLevel,
  loading = false,
}: KpiAchievementCardProps) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 70) return "text-slate-800 dark:text-slate-100";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const levels = byLevel
    ? [
        { label: "Corporate", value: byLevel.corporate },
        { label: "Division",  value: byLevel.division },
        { label: "Department", value: byLevel.department },
        { label: "Personnel", value: byLevel.personnel },
      ]
    : [];

  if (loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-400 animate-pulse" />
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">KPI Achievement Rate</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-shadow">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              KPI Achievement Rate
            </CardTitle>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            Weighted Avg
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {/* Main Score */}
        <div className="mb-5">
          <div className={`text-4xl font-bold tracking-tight ${getScoreColor(overallRate)}`}>
            {overallRate.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Overall Achievement</p>
        </div>

        {/* Progress Track */}
        <div className="mb-5">
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-700 dark:bg-slate-300 transition-all duration-500"
              style={{ width: `${Math.min(overallRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Level Breakdown */}
        {levels.length > 0 && (
          <div className="space-y-2.5 mb-4">
            {levels.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-20">{label}</span>
                <div className="flex items-center gap-2 flex-1 ml-2">
                  <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-500 dark:bg-slate-400 transition-all duration-500"
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-9 text-right ${getScoreColor(value)}`}>
                    {value.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => router.push('/dashboard/kpi-weight')}
        >
          View KPI details
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
