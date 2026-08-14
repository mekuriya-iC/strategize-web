"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { AlertCircle, User, Users, TrendingDown, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GET_MY_FLAGGED_KPIS, GET_TEAM_FLAGGED_KPIS } from "@/lib/graphql/queries/kpi-performance";
import { format } from "date-fns";
import { useAuthStore } from "@/stores";

/**
 * Flagged KPIs Page
 * 
 * Unified view showing:
 * 1. My Flagged KPIs - Employee's own flagged KPIs
 * 2. Team Flagged KPIs - Flagged KPIs across team (for supervisors/session creators)
 * 
 * Phase 2: Medium Complexity Enhancement
 */
export default function FlaggedKpisPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");

  const { data: myData, loading: myLoading, error: myError } = useQuery(GET_MY_FLAGGED_KPIS, {
    fetchPolicy: "network-only",
  });

  const { data: teamData, loading: teamLoading, error: teamError } = useQuery(GET_TEAM_FLAGGED_KPIS, {
    fetchPolicy: "network-only",
  });

  const myFlaggedKpis = myData?.myFlaggedKpis || [];
  const teamFlaggedKpis = teamData?.teamFlaggedKpis || [];

  if (myLoading && teamLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold">KPIs Requiring Attention</h1>
        </div>
        <p className="text-muted-foreground">
          Monitor KPIs that have been unmet for 5 or more consecutive weeks
        </p>
      </div>

      {/* Tabs for My KPIs vs Team KPIs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "my" | "team")}>
        <TabsList className="mb-6">
          <TabsTrigger value="my" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Flagged KPIs
            {myFlaggedKpis.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {myFlaggedKpis.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Flagged KPIs
            {teamFlaggedKpis.length > 0 && (
              <Badge variant="outline" className="ml-2 border-orange-500 text-orange-600">
                {teamFlaggedKpis.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* My Flagged KPIs Tab */}
        <TabsContent value="my">
          {myError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Your Flagged KPIs</AlertTitle>
              <AlertDescription>{myError.message}</AlertDescription>
            </Alert>
          )}

          {myFlaggedKpis.length === 0 && !myError && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-green-100 p-4 mb-4">
                  <svg
                    className="h-12 w-12 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Great Job! 🎉</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  You don't have any flagged KPIs. All your KPIs are on track or have been resolved.
                </p>
              </CardContent>
            </Card>
          )}

          {myFlaggedKpis.length > 0 && (
            <div className="space-y-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Performance Alert</AlertTitle>
                <AlertDescription>
                  You have <strong>{myFlaggedKpis.length}</strong> KPI
                  {myFlaggedKpis.length > 1 ? "s" : ""} flagged for consecutive unmet weeks. 
                  Please create tasks to fulfill these KPIs.
                </AlertDescription>
              </Alert>

              {myFlaggedKpis.map((tracker: any) => (
                <FlaggedKpiCard key={tracker.trackerId} tracker={tracker} showEmployee={false} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Team Flagged KPIs Tab */}
        <TabsContent value="team">
          {teamError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Team Flagged KPIs</AlertTitle>
              <AlertDescription>{teamError.message}</AlertDescription>
            </Alert>
          )}

          {teamFlaggedKpis.length === 0 && !teamError && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-green-100 p-4 mb-4">
                  <svg
                    className="h-12 w-12 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Excellent Team Performance! 🎉</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Your team has no flagged KPIs. All team members' KPIs are on track.
                </p>
              </CardContent>
            </Card>
          )}

          {teamFlaggedKpis.length > 0 && (
            <div className="space-y-6">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-900">Team Performance Alert</AlertTitle>
                <AlertDescription className="text-orange-800">
                  Your team has <strong>{teamFlaggedKpis.length}</strong> flagged KPI
                  {teamFlaggedKpis.length > 1 ? "s" : ""} across team members.
                  Review and provide support to help resolve these performance issues.
                </AlertDescription>
              </Alert>

              {teamFlaggedKpis.map((tracker: any) => (
                <FlaggedKpiCard key={tracker.trackerId} tracker={tracker} showEmployee={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Individual Flagged KPI Card
 */
function FlaggedKpiCard({ tracker, showEmployee = false }: { tracker: any; showEmployee?: boolean }) {
  const { kpi, employee, consecutiveUnmetWeeks, firstUnmetDate, flaggedAt, lastUnmetSession } =
    tracker;

  // Calculate severity based on weeks unmet
  const getSeverity = (weeks: number) => {
    if (weeks >= 10) return { color: "bg-red-600", label: "Critical", icon: "🔴" };
    if (weeks >= 8) return { color: "bg-red-500", label: "Severe", icon: "🟠" };
    if (weeks >= 5) return { color: "bg-orange-500", label: "Warning", icon: "🟡" };
    return { color: "bg-yellow-500", label: "Monitor", icon: "🟢" };
  };

  const severity = getSeverity(consecutiveUnmetWeeks);

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {showEmployee && employee && (
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <User className="h-3 w-3 mr-1" />
                  {employee.fullName}
                </Badge>
                {employee.title && (
                  <span className="text-sm text-muted-foreground">
                    {employee.title}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{kpi.name}</CardTitle>
              <Badge variant="destructive" className={severity.color}>
                {severity.icon} {severity.label}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {kpi.description || "No description provided"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Consecutive Weeks */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-50 p-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consecutive Unmet Weeks</p>
              <p className="text-2xl font-bold text-red-600">{consecutiveUnmetWeeks}</p>
            </div>
          </div>

          {/* First Unmet Date */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-50 p-2">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">First Unmet</p>
              <p className="text-base font-semibold">
                {firstUnmetDate ? format(new Date(firstUnmetDate), "MMM d, yyyy") : "Unknown"}
              </p>
            </div>
          </div>

          {/* Flagged Date */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-yellow-50 p-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Flagged On</p>
              <p className="text-base font-semibold">
                {flaggedAt ? format(new Date(flaggedAt), "MMM d, yyyy") : "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Details */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Target Value</p>
              <p className="font-semibold">{kpi.targetValue || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Weight</p>
              <p className="font-semibold">{kpi.weight ? `${kpi.weight}%` : "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Aggregation</p>
              <p className="font-semibold">{kpi.aggregationMethod || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Last Unmet Session */}
        {lastUnmetSession && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-1">Last Unmet Session</p>
            <p className="text-sm text-muted-foreground">
              Week of{" "}
              {format(new Date(lastUnmetSession.weekStartDate), "MMM d")} -{" "}
              {format(new Date(lastUnmetSession.weekEndDate), "MMM d, yyyy")}
              {lastUnmetSession.overallStatus && ` • Status: ${lastUnmetSession.overallStatus}`}
            </p>
          </div>
        )}

        {/* Action Prompt */}
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            {showEmployee 
              ? `Work with ${employee?.fullName || 'this employee'} to create a KPI_FULFILLED task to resolve this flag.`
              : 'Create a KPI_FULFILLED task in your next check-in to resolve this flag.'
            } Once completed, the counter will reset to 0.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <Skeleton className="h-10 w-96 mb-2" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-7 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
