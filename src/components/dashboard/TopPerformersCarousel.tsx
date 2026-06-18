"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, TrendingUp, ArrowRight, Trophy } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { useRouter } from 'next/navigation';

interface TopPerformer {
  employeeId: string;
  fullName: string;
  title?: string;
  picture?: string;
  overallScore: number;
  rating: string;
  achievements?: number;
}

interface TopPerformersCarouselProps {
  performers: TopPerformer[];
  loading?: boolean;
  limit?: number;
}

export function TopPerformersCarousel({
  performers,
  loading = false,
  limit = 5,
}: TopPerformersCarouselProps) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 70) return "text-slate-800 dark:text-slate-100";
    return "text-slate-500 dark:text-slate-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85)
      return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
    return "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Trophy className="h-4 w-4 text-slate-400" />
            Top Performers
          </CardTitle>
          <CardDescription className="text-xs">Outstanding team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (performers.length === 0) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Trophy className="h-4 w-4 text-slate-400" />
            Top Performers
          </CardTitle>
          <CardDescription className="text-xs">Outstanding team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Award className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 dark:text-slate-500">No performance data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayPerformers = performers.slice(0, limit);

  return (
    <Card className="border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Trophy className="h-4 w-4 text-slate-500" />
              Top Performers
            </CardTitle>
            <CardDescription className="text-xs">Outstanding achievements this period</CardDescription>
          </div>
          <Button
            variant="ghost"
            className="h-8 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            onClick={() => router.push('/dashboard/performance')}
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {displayPerformers.map((performer, index) => (
            <div
              key={performer.employeeId}
              className={`
                p-3 rounded-lg transition-all cursor-pointer border
                ${index === 0 ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800' :
                  'bg-white dark:bg-slate-950/20 border-slate-100 dark:border-slate-900'}
                hover:border-slate-300 dark:hover:border-slate-700
              `}
              onClick={() => router.push(`/dashboard/employees/${performer.employeeId}`)}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm
                  ${index === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100' :
                    index === 1 ? 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400' :
                    index === 2 ? 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400' :
                    'text-slate-400 dark:text-slate-600'}
                `}>
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <UserAvatar
                  src={performer.picture}
                  alt={performer.fullName}
                  fallbackText={performer.fullName}
                  size="sm"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {performer.fullName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {performer.title || 'No title'}
                    {performer.achievements && performer.achievements > 0 && (
                      <span className="ml-2">• {performer.achievements} achievements</span>
                    )}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className={`text-base font-bold ${getScoreColor(performer.overallScore)}`}>
                    {performer.overallScore.toFixed(1)}%
                  </div>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${getScoreBadge(performer.overallScore)}`}>
                    {performer.rating}
                  </Badge>
                </div>

                {/* Trending Icon */}
                {index === 0 && (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recognition Message */}
        {displayPerformers.length > 0 && (
          <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Award className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Celebrate these outstanding achievements! Consider recognition or rewards.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
