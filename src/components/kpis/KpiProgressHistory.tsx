"use client";

import { useQuery } from "@apollo/client";
import { GET_KPI_UPDATES } from "@/lib/graphql/queries/kpis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  ExternalLink,
  Calendar,
  User,
} from "lucide-react";
import { format } from "date-fns";

interface KpiProgressHistoryProps {
  kpiId: string;
  kpiName: string;
  targetValue: number;
  measurementUnit: string;
  strategicPeriodId?: string;
}

export default function KpiProgressHistory({
  kpiId,
  kpiName,
  targetValue,
  measurementUnit,
  strategicPeriodId,
}: KpiProgressHistoryProps) {
  const { data, loading, error } = useQuery(GET_KPI_UPDATES, {
    variables: {
      kpiId,
      page: 1,
      limit: 100,
      strategicPeriodId,
    },
  });

  const updates = data?.kpiUpdates?.items || [];

  const getProgressStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "ON_TRACK":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "AT_RISK":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "OFF_TRACK":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getProgressIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "ON_TRACK":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "AT_RISK":
        return <Minus className="w-4 h-4 text-yellow-600" />;
      case "OFF_TRACK":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading progress history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-red-600">Error loading progress history</p>
        </CardContent>
      </Card>
    );
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Progress History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No progress updates yet
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Start tracking progress by submitting your first update
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate latest progress
  const latestUpdate = updates[0];
  const progressPercentage = latestUpdate?.progressPercentage || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Progress History
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {updates.length} update{updates.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Progress Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Current Progress
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-blue-700 dark:text-blue-300">
              {latestUpdate?.achievedValue} / {targetValue} {measurementUnit}
            </span>
            <Badge
              variant="outline"
              className={getProgressStatusColor(latestUpdate?.progressStatus)}
            >
              {latestUpdate?.progressStatus.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Update Timeline
          </h4>
          <div className="space-y-4">
            {updates.map((update: any, index: number) => (
              <div
                key={update.kpiUpdateId}
                className="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-blue-500 flex items-center justify-center">
                  {index === 0 && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getProgressIcon(update.progressStatus)}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {update.achievedValue} {measurementUnit}
                      </span>
                      <Badge
                        variant="outline"
                        className={getProgressStatusColor(update.progressStatus)}
                      >
                        {update.progressPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    {index === 0 && (
                      <Badge className="bg-blue-600 text-white">Latest</Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(update.reportingDate), "MMM dd, yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{update.reportedBy?.fullName || "Unknown"}</span>
                    </div>

                    {update.notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {update.notes}
                        </p>
                      </div>
                    )}

                    {update.evidenceUrl && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(update.evidenceUrl, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Evidence
                        </Button>
                      </div>
                    )}

                    {update.approvedAt && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs">
                            Approved by {update.approvedBy?.fullName} on{" "}
                            {format(new Date(update.approvedAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
