"use client";

import { useMemo } from "react";
import { type Activity } from "@/hooks/initiatives/useInitiatives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  Flag,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface InitiativeTimelineProps {
  activities: Activity[];
  initiativeStartDate?: string;
  initiativeDueDate?: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  NOT_DONE: <Circle className="h-4 w-4 text-gray-400" />,
  DONE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-red-400" />,
  POSTPONED: <Clock className="h-4 w-4 text-amber-400" />,
};

const statusColors: Record<string, string> = {
  NOT_DONE: "bg-gray-200 dark:bg-gray-700",
  DONE: "bg-green-500",
  CANCELLED: "bg-red-400",
  POSTPONED: "bg-amber-400",
};

export default function InitiativeTimeline({
  activities,
  initiativeStartDate,
  initiativeDueDate,
}: InitiativeTimelineProps) {
  const timelineData = useMemo(() => {
    if (!activities.length) return null;

    // Find the earliest and latest dates
    const dates = activities
      .flatMap((a) => [a.startDate, a.dueDate])
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime());

    if (initiativeStartDate) {
      dates.push(new Date(initiativeStartDate).getTime());
    }
    if (initiativeDueDate) {
      dates.push(new Date(initiativeDueDate).getTime());
    }

    if (!dates.length) return null;

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const totalDays = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Sort activities by start date
    const sortedActivities = [...activities]
      .filter((a) => a.startDate || a.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.startDate || a.dueDate!).getTime();
        const dateB = new Date(b.startDate || b.dueDate!).getTime();
        return dateA - dateB;
      });

    return {
      minDate,
      maxDate,
      totalDays,
      sortedActivities,
    };
  }, [activities, initiativeStartDate, initiativeDueDate]);

  if (!timelineData || timelineData.sortedActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Timeline View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              No activities with dates to display timeline
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { minDate, maxDate, totalDays, sortedActivities } = timelineData;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculatePosition = (date: string) => {
    const d = new Date(date);
    const daysSinceStart = Math.ceil(
      (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return (daysSinceStart / totalDays) * 100;
  };

  const calculateWidth = (startDate?: string, dueDate?: string) => {
    if (!startDate || !dueDate) return 2; // Minimum width for single-day events
    const start = new Date(startDate);
    const end = new Date(dueDate);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max((days / totalDays) * 100, 2);
  };

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate || status === "DONE" || status === "CANCELLED") return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Timeline View
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {formatDate(minDate)} — {formatDate(maxDate)} ({totalDays} days)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Timeline Header */}
          <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-between px-3 text-xs text-gray-600 dark:text-gray-400">
              <span>{formatDate(minDate)}</span>
              <span>{formatDate(maxDate)}</span>
            </div>
            {/* Today marker */}
            {(() => {
              const now = new Date();
              if (now >= minDate && now <= maxDate) {
                const position = calculatePosition(now.toISOString());
                return (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                    style={{ left: `${position}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Activities */}
          <div className="space-y-2">
            {sortedActivities.map((activity) => {
              const startPos = calculatePosition(
                activity.startDate || activity.dueDate!
              );
              const width = calculateWidth(activity.startDate, activity.dueDate);
              const overdue = isOverdue(activity.dueDate, activity.status);

              return (
                <div
                  key={activity.activityId}
                  className="relative group"
                >
                  {/* Activity Label */}
                  <div className="flex items-center gap-2 mb-1">
                    {statusIcons[activity.status]}
                    {activity.milestone && (
                      <Flag className="h-3 w-3 text-purple-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                      {activity.title}
                    </span>
                    {overdue && (
                      <Badge
                        variant="destructive"
                        className="text-xs px-1.5 py-0"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>

                  {/* Timeline Bar */}
                  <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-4 rounded transition-all ${
                        statusColors[activity.status]
                      } ${
                        overdue
                          ? "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-900"
                          : ""
                      }`}
                      style={{
                        left: `${startPos}%`,
                        width: `${width}%`,
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                          <p className="font-semibold">{activity.title}</p>
                          {activity.startDate && (
                            <p className="mt-1">
                              Start: {formatDate(new Date(activity.startDate))}
                            </p>
                          )}
                          {activity.dueDate && (
                            <p>
                              Due: {formatDate(new Date(activity.dueDate))}
                            </p>
                          )}
                          {activity.assignedTo && (
                            <p className="mt-1 text-gray-300 dark:text-gray-600">
                              Assigned: {activity.assignedTo.fullName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Date labels */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] text-gray-500 dark:text-gray-400 pointer-events-none">
                      {activity.startDate && (
                        <span>
                          {new Date(activity.startDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                      {activity.dueDate && (
                        <span>
                          {new Date(activity.dueDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
              <span className="text-gray-600 dark:text-gray-400">Not Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Postponed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Cancelled
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flag className="h-3 w-3 text-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Milestone
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
