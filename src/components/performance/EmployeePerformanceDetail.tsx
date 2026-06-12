"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Target,
  Users as UsersIcon,
  Activity,
  TrendingUp,
  FileText,
  Mail,
  Calendar,
  Award,
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

interface EmployeePerformanceDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    employeeId: string;
    fullName: string;
    title?: string;
    department?: string;
    picture?: string;
    role: string;
  };
  performance: {
    overallPercentage: number;
    rating: string;
    breakdown: {
      kpiScore: {
        percentageAchieved: number;
        weightedScore: number;
      };
      competencyScore: {
        percentageAchieved: number;
        weightedScore: number;
      };
      activityScore: {
        percentageAchieved: number;
        weightedScore: number;
      };
    };
  };
}

export function EmployeePerformanceDetail({
  open,
  onOpenChange,
  employee,
  performance,
}: EmployeePerformanceDetailProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90)
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (percentage >= 80)
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (percentage >= 70)
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (percentage >= 60)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <UserAvatar
              src={employee.picture}
              alt={employee.fullName}
              fallbackText={employee.fullName}
              size="lg"
            />
            <div className="flex-1">
              <DialogTitle className="text-2xl">{employee.fullName}</DialogTitle>
              <DialogDescription className="text-base">
                {employee.title || 'No title'}
                {employee.department && ` • ${employee.department}`}
              </DialogDescription>
            </div>
            <Badge className={getScoreBadge(performance.overallPercentage)} variant="secondary">
              <Award className="h-4 w-4 mr-1" />
              {performance.rating}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kpi">KPI Performance</TabsTrigger>
            <TabsTrigger value="competency">360° Evaluation</TabsTrigger>
            <TabsTrigger value="activity">Activity Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Overall Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className={`text-6xl font-bold ${getScoreColor(performance.overallPercentage)}`}>
                    {performance.overallPercentage.toFixed(1)}%
                  </div>
                  <p className="text-lg text-muted-foreground mt-2">{performance.rating}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* KPI Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    KPI Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(performance.breakdown.kpiScore.percentageAchieved)}`}>
                    {performance.breakdown.kpiScore.percentageAchieved.toFixed(1)}%
                  </div>
                  <Progress
                    value={performance.breakdown.kpiScore.percentageAchieved}
                    className="mt-3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Weighted: {performance.breakdown.kpiScore.weightedScore.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              {/* 360° Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    360° Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(performance.breakdown.competencyScore.percentageAchieved)}`}>
                    {performance.breakdown.competencyScore.percentageAchieved.toFixed(1)}%
                  </div>
                  <Progress
                    value={performance.breakdown.competencyScore.percentageAchieved}
                    className="mt-3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Weighted: {performance.breakdown.competencyScore.weightedScore.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              {/* Activity Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(performance.breakdown.activityScore.percentageAchieved)}`}>
                    {performance.breakdown.activityScore.percentageAchieved.toFixed(1)}%
                  </div>
                  <Progress
                    value={performance.breakdown.activityScore.percentageAchieved}
                    className="mt-3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Weighted: {performance.breakdown.activityScore.weightedScore.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Feedback
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Review
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPI Performance Tab */}
          <TabsContent value="kpi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KPI Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Achievement Score</span>
                      <span className={`text-sm font-bold ${getScoreColor(performance.breakdown.kpiScore.percentageAchieved)}`}>
                        {performance.breakdown.kpiScore.percentageAchieved.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={performance.breakdown.kpiScore.percentageAchieved}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                    <div>
                      <p className="text-xs text-muted-foreground">Raw Score</p>
                      <p className="text-lg font-semibold">
                        {performance.breakdown.kpiScore.percentageAchieved.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weighted Score</p>
                      <p className="text-lg font-semibold">
                        {performance.breakdown.kpiScore.weightedScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Detailed KPI breakdown will be displayed here</p>
                    <p className="text-sm">Individual KPI scores, targets, and achievements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 360° Evaluation Tab */}
          <TabsContent value="competency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>360° Evaluation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Competency Score</span>
                      <span className={`text-sm font-bold ${getScoreColor(performance.breakdown.competencyScore.percentageAchieved)}`}>
                        {performance.breakdown.competencyScore.percentageAchieved.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={performance.breakdown.competencyScore.percentageAchieved}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                    <div>
                      <p className="text-xs text-muted-foreground">Raw Score</p>
                      <p className="text-lg font-semibold">
                        {performance.breakdown.competencyScore.percentageAchieved.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weighted Score</p>
                      <p className="text-lg font-semibold">
                        {performance.breakdown.competencyScore.weightedScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="text-center py-8 text-muted-foreground">
                    <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Detailed competency breakdown will be displayed here</p>
                    <p className="text-sm">Individual competency ratings and feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Metrics Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Metrics Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Activity Score</span>
                      <span className={`text-sm font-bold ${getScoreColor(performance.breakdown.activityScore.percentageAchieved)}`}>
                        {performance.breakdown.activityScore.percentageAchieved.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={performance.breakdown.activityScore.percentageAchieved}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                    <div>
                      <p className="text-xs text-muted-foreground">Raw Score</p>
                      <p className="text-lg font-semibold">
                        {performance.breakdown.activityScore.percentageAchieved.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weighted Score</p>
                      <p className="text-lg font-semibold">
                        {performance.breakdown.activityScore.weightedScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Detailed activity metrics will be displayed here</p>
                    <p className="text-sm">Check-in frequency, quality scores, and engagement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
