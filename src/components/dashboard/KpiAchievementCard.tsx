"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, ArrowRight, TrendingUp } from 'lucide-react';
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
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <Card className="border-2 border-green-200 dark:border-green-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600 dark:text-green-400 animate-pulse" />
            <CardTitle className="text-base">KPI Achievement Rate</CardTitle>
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
    <Card className="border-2 border-green-200 dark:border-green-900/40 hover:shadow-lg transition-all">
      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-base">KPI Achievement Rate</CardTitle>
          </div>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Weighted Avg
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Main Score Display */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getScoreColor(overallRate)} mb-2`}>
            {overallRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Overall Achievement</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={overallRate} className="h-3" />
        </div>

        {/* Level Breakdown */}
        {byLevel && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Corporate</span>
              <div className="flex items-center gap-2">
                <Progress value={byLevel.corporate} className="w-24 h-2" />
                <span className={`font-semibold w-12 text-right ${getScoreColor(byLevel.corporate)}`}>
                  {byLevel.corporate.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Division</span>
              <div className="flex items-center gap-2">
                <Progress value={byLevel.division} className="w-24 h-2" />
                <span className={`font-semibold w-12 text-right ${getScoreColor(byLevel.division)}`}>
                  {byLevel.division.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Department</span>
              <div className="flex items-center gap-2">
                <Progress value={byLevel.department} className="w-24 h-2" />
                <span className={`font-semibold w-12 text-right ${getScoreColor(byLevel.department)}`}>
                  {byLevel.department.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Personnel</span>
              <div className="flex items-center gap-2">
                <Progress value={byLevel.personnel} className="w-24 h-2" />
                <span className={`font-semibold w-12 text-right ${getScoreColor(byLevel.personnel)}`}>
                  {byLevel.personnel.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/dashboard/kpi-weight')}
        >
          <span>View KPI details</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
