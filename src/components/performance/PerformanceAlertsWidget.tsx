"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  TrendingDown,
  Award,
  Target,
  Mail,
  Calendar,
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

interface PerformanceAlert {
  type: 'critical' | 'warning' | 'opportunity' | 'info';
  employeeId: string;
  fullName: string;
  picture?: string;
  title?: string;
  score: number;
  message: string;
  action?: string;
}

interface PerformanceAlertsWidgetProps {
  teamResults: Array<{
    employeeId: string;
    employee: {
      fullName: string;
      title?: string;
      picture?: string;
    };
    overallPercentage: number;
  }>;
  onEmployeeClick?: (employeeId: string) => void;
}

export function PerformanceAlertsWidget({
  teamResults,
  onEmployeeClick,
}: PerformanceAlertsWidgetProps) {
  const alerts = useMemo<PerformanceAlert[]>(() => {
    const generatedAlerts: PerformanceAlert[] = [];

    teamResults.forEach((result) => {
      const score = result.overallPercentage;

      // Critical: Score < 60%
      if (score < 60) {
        generatedAlerts.push({
          type: 'critical',
          employeeId: result.employeeId,
          fullName: result.employee.fullName,
          picture: result.employee.picture,
          title: result.employee.title,
          score,
          message: `Performance below expectations (${score.toFixed(0)}%)`,
          action: 'Schedule intervention meeting',
        });
      }
      // Warning: Score 60-69% (needs improvement)
      else if (score >= 60 && score < 70) {
        generatedAlerts.push({
          type: 'warning',
          employeeId: result.employeeId,
          fullName: result.employee.fullName,
          picture: result.employee.picture,
          title: result.employee.title,
          score,
          message: `Needs improvement (${score.toFixed(0)}%)`,
          action: 'Provide coaching support',
        });
      }
      // Opportunity: Score >= 90% (exceptional)
      else if (score >= 90) {
        generatedAlerts.push({
          type: 'opportunity',
          employeeId: result.employeeId,
          fullName: result.employee.fullName,
          picture: result.employee.picture,
          title: result.employee.title,
          score,
          message: `Exceptional performance (${score.toFixed(0)}%)`,
          action: 'Consider for advancement',
        });
      }
    });

    // Sort: critical first, then warning, then opportunity
    return generatedAlerts.sort((a, b) => {
      const priority = { critical: 0, warning: 1, opportunity: 2, info: 3 };
      return priority[a.type] - priority[b.type];
    });
  }, [teamResults]);

  const getAlertConfig = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'critical':
        return {
          icon: AlertTriangle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        };
      case 'warning':
        return {
          icon: TrendingDown,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        };
      case 'opportunity':
        return {
          icon: Award,
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        };
      default:
        return {
          icon: Target,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        };
    }
  };

  const criticalCount = alerts.filter((a) => a.type === 'critical').length;
  const warningCount = alerts.filter((a) => a.type === 'warning').length;
  const opportunityCount = alerts.filter((a) => a.type === 'opportunity').length;

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">
              <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              All Good!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No critical alerts at this time
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Performance Alerts
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">
                {warningCount} Warning
              </Badge>
            )}
            {opportunityCount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                {opportunityCount} Opportunity
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {alerts.map((alert) => {
            const config = getAlertConfig(alert.type);
            const Icon = config.icon;

            return (
              <div
                key={alert.employeeId}
                className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} cursor-pointer hover:shadow-md transition-all`}
                onClick={() => onEmployeeClick?.(alert.employeeId)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <UserAvatar
                        src={alert.picture}
                        alt={alert.fullName}
                        fallbackText={alert.fullName}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {alert.fullName}
                        </p>
                        {alert.title && (
                          <p className="text-xs text-muted-foreground truncate">
                            {alert.title}
                          </p>
                        )}
                      </div>
                      <Badge className={config.badge}>
                        {alert.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {alert.message}
                    </p>
                    {alert.action && (
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          {alert.action}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
