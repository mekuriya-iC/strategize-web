"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

  const getStatusColor = (pct: number) => {
    if (pct >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 75) return "text-blue-600 dark:text-blue-400";
    if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <Card className="border-2 border-purple-200 dark:border-purple-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-pulse" />
            <CardTitle className="text-base">360° Evaluation Coverage</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-900/40 hover:shadow-lg transition-all">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-base">360° Evaluation Coverage</CardTitle>
          </div>
          {upcomingDeadlines > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Clock className="h-3 w-3" />
              {upcomingDeadlines} Due
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Main Percentage Display */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getStatusColor(percentage)} mb-2`}>
            {percentage.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={percentage} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Completed</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completed}</p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pending}</p>
          </div>
        </div>

        {/* Status Message */}
        {upcomingDeadlines > 0 && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-xs font-medium text-red-700 dark:text-red-300">
                {upcomingDeadlines} evaluation{upcomingDeadlines > 1 ? 's' : ''} due soon
              </p>
            </div>
          </div>
        )}

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/dashboard/360-evaluation')}
        >
          <span>Manage evaluations</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
