"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EvaluationCoverageCardProps {
  completed: number;
  pending: number;
  percentage: number;
  upcomingDeadlines?: number;
  loading?: boolean;
}

export function EvaluationCoverageCard({
  completed,
  pending,
  percentage,
  upcomingDeadlines = 0,
  loading = false,
}: EvaluationCoverageCardProps) {
  const router = useRouter();

  const getScoreColor = (pct: number) => {
    if (pct >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 70) return "text-slate-800 dark:text-slate-100";
    if (pct >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400 animate-pulse" />
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">360° Evaluation Coverage</CardTitle>
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
            <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              360° Evaluation Coverage
            </CardTitle>
          </div>
          {upcomingDeadlines > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3" />
              <span>{upcomingDeadlines} Due</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {/* Main Score */}
        <div className="mb-5">
          <div className={`text-4xl font-bold tracking-tight ${getScoreColor(percentage)}`}>
            {percentage.toFixed(0)}%
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Completion Rate</p>
        </div>

        {/* Progress Track */}
        <div className="mb-5">
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-700 dark:bg-slate-300 transition-all duration-500"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Completed</span>
            </div>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{completed}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Pending</span>
            </div>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{pending}</p>
          </div>
        </div>

        {/* Deadline Warning */}
        {upcomingDeadlines > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {upcomingDeadlines} evaluation{upcomingDeadlines > 1 ? 's' : ''} due soon
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => router.push('/dashboard/360-evaluation')}
        >
          Manage evaluations
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
