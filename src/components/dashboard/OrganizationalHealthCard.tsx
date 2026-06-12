"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  currentScore: number;
  previousScore?: number;
  trend?: number;
  teamMeetingExpectations?: number;
  totalEmployees?: number;
  loading?: boolean;
}

export function OrganizationalHealthCard({
  currentScore,
  previousScore,
  trend,
  teamMeetingExpectations = 0,
  totalEmployees = 0,
  loading = false,
}: OrganizationalHealthCardProps) {
  const router = useRouter();

  const getTrendIcon = () => {
    if (!trend || trend === 0) return <Minus className="h-4 w-4 text-gray-400" />;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendText = () => {
    if (!trend || trend === 0) return "No change";
    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend.toFixed(1)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusMessage = () => {
    if (currentScore >= 90)
      return { text: "Exceptional organizational performance", icon: CheckCircle2, color: "text-emerald-600" };
    if (currentScore >= 80)
      return { text: `${teamMeetingExpectations.toFixed(0)}% of team exceeding expectations`, icon: CheckCircle2, color: "text-blue-600" };
    if (currentScore >= 70)
      return { text: `${teamMeetingExpectations.toFixed(0)}% of team meeting expectations`, icon: CheckCircle2, color: "text-green-600" };
    if (currentScore >= 60)
      return { text: "Some team members need support", icon: AlertTriangle, color: "text-yellow-600" };
    return { text: "Organizational performance needs attention", icon: AlertTriangle, color: "text-red-600" };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  if (loading) {
    return (
      <Card className="border-2 border-blue-200 dark:border-blue-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <CardTitle className="text-base">Organizational Performance</CardTitle>
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
    <Card className="border-2 border-blue-200 dark:border-blue-900/40 hover:shadow-lg transition-all">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base">Organizational Performance</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold">
            {getTrendIcon()}
            <span className={trend && trend > 0 ? "text-green-600" : trend && trend < 0 ? "text-red-600" : "text-gray-400"}>
              {getTrendText()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Main Score Display */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getScoreColor(currentScore)} mb-2`}>
            {currentScore.toFixed(1)}%
          </div>
          {previousScore !== undefined && (
            <p className="text-xs text-muted-foreground">
              Previous period: {previousScore.toFixed(1)}%
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={currentScore} className="h-3" />
        </div>

        {/* Status Message */}
        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 mb-4 ${status.color}`}>
          <StatusIcon className="h-5 w-5" />
          <p className="text-sm font-medium">{status.text}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Team Size</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalEmployees}</p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Meeting Goals</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {teamMeetingExpectations.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/dashboard/performance')}
        >
          <span>View detailed breakdown</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
