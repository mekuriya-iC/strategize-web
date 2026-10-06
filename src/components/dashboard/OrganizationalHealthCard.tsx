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
      <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/90">
        <CardHeader className="p-0 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400 animate-pulse" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="animate-pulse space-y-3">
            <div className="h-14 bg-slate-100 dark:bg-zinc-800 rounded-xl" />
            <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-md dark:border-white/[0.08] dark:bg-zinc-900/90">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Building2 className="h-3.5 w-3.5" />
          </span>
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {title}
          </CardTitle>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{getTrendText()}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        {/* Main Score */}
        <div>
          <div className={`text-4xl font-extrabold tracking-tight tabular-nums ${getScoreColor(currentScore)}`}>
            {currentScore.toFixed(1)}%
          </div>
          {previousScore !== undefined && (
            <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-zinc-500">
              Previous period: {previousScore.toFixed(1)}%
            </p>
          )}
        </div>

        {/* Progress Track */}
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-500"
              style={{ width: `${Math.min(currentScore, 100)}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-3 flex items-center gap-2">
          <div className={`h-2 w-2 flex-shrink-0 rounded-full ${status.dot}`} />
          <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">{status.text}</p>
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Team Size</span>
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-zinc-100">{totalEmployees}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Meeting Goals</span>
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-zinc-100">
              {teamMeetingExpectations.toFixed(0)}%
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border-slate-200/80 bg-slate-50/80 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
          onClick={() => router.push('/dashboard/performance')}
        >
          <span>View detailed breakdown</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

