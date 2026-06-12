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
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    return "text-green-600 dark:text-green-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 95)
      return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
    if (score >= 90)
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top Performers
          </CardTitle>
          <CardDescription>Outstanding team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (performers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top Performers
          </CardTitle>
          <CardDescription>Outstanding team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No performance data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayPerformers = performers.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Top Performers
            </CardTitle>
            <CardDescription>Outstanding achievements this period</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/performance')}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayPerformers.map((performer, index) => (
            <div
              key={performer.employeeId}
              className={`
                p-4 rounded-lg transition-all cursor-pointer
                ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-900/40' :
                  'bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800'}
                hover:shadow-md
              `}
              onClick={() => router.push(`/dashboard/employees/${performer.employeeId}`)}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg
                  ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                    'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
                `}>
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <UserAvatar
                  src={performer.picture}
                  alt={performer.fullName}
                  fallbackText={performer.fullName}
                  size="md"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {performer.fullName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {performer.title || 'No title'}
                    {performer.achievements && performer.achievements > 0 && (
                      <span className="ml-2">• {performer.achievements} achievements</span>
                    )}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(performer.overallScore)}`}>
                    {performer.overallScore.toFixed(1)}%
                  </div>
                  <Badge className={`text-xs ${getScoreBadge(performer.overallScore)}`}>
                    {performer.rating}
                  </Badge>
                </div>

                {/* Trending Icon */}
                {index === 0 && (
                  <TrendingUp className="h-5 w-5 text-yellow-600 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recognition Message */}
        {displayPerformers.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Celebrate these outstanding achievements! Consider recognition or rewards.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
