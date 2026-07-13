"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OrganizationalHealthCardProps {
  title?: string;
  currentScore: number;
  previousScore?: number;
  trend?: number;
  teamMeetingExpectations?: number;
  totalEmployees?: number;
  loading?: boolean;
}

export function OrganizationalHealthCard({
  title = "Team performance",
  currentScore,
  previousScore,
  trend,
  teamMeetingExpectations = 0,
  totalEmployees = 0,
  loading = false,
}: OrganizationalHealthCardProps) {
  const router = useRouter();

  const getTrendIcon = () => {
    if (!trend || trend === 0) return <Minus className="h-3.5 w-3.5 text-slate-400" />;
    if (trend > 0) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
    return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  };

  const getTrendText = () => {
    if (!trend || trend === 0) return "No change";
    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend.toFixed(1)}%`;
  };

  const getTrendColor = () => {
    if (!trend || trend === 0) return "text-slate-400";
    return trend > 0 ? "text-emerald-600" : "text-red-600";
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 70) return "text-slate-800 dark:text-slate-100";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusInfo = () => {
    if (currentScore >= 85)
      return { text: "Exceptional performance in the current scope", icon: CheckCircle2, dot: "bg-emerald-500" };
    if (currentScore >= 70)
      return { text: `${teamMeetingExpectations.toFixed(0)}% of team meeting expectations`, icon: CheckCircle2, dot: "bg-slate-400" };
    if (currentScore >= 60)
      return { text: "Some team members need support", icon: AlertTriangle, dot: "bg-amber-500" };
    return { text: "Current scope performance needs attention", icon: AlertTriangle, dot: "bg-red-500" };
  };

  const status = getStatusInfo();

  if (loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400 animate-pulse" />
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</CardTitle>
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
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </CardTitle>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{getTrendText()}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {/* Main Score */}
        <div className="mb-5">
          <div className={`text-4xl font-bold tracking-tight ${getScoreColor(currentScore)}`}>
            {currentScore.toFixed(1)}%
          </div>
          {previousScore !== undefined && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Previous period: {previousScore.toFixed(1)}%
            </p>
          )}
        </div>

        {/* Progress Track */}
        <div className="mb-5">
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-700 dark:bg-slate-300 transition-all duration-500"
              style={{ width: `${Math.min(currentScore, 100)}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        <div className="flex items-center gap-2 mb-5">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
          <p className="text-xs text-slate-500 dark:text-slate-400">{status.text}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Team Size</span>
            </div>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{totalEmployees}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Meeting Goals</span>
            </div>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {teamMeetingExpectations.toFixed(0)}%
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => router.push('/dashboard/performance')}
        >
          View detailed breakdown
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
