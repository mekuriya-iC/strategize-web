"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useQuery } from "@apollo/client";
import { AlertCircle, BarChart3, Info, User, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  GET_HIERARCHY_TASK_COMPLETION_ANALYTICS,
  GET_PERSONAL_TASK_COMPLETION_ANALYTICS,
} from "@/lib/graphql/queries/task-completion";
import { useAuthStore } from "@/stores";
import {
  buildHierarchyTaskCompletionVariables,
  buildPersonalTaskCompletionVariables,
  canViewTeamTaskCompletion,
  createDefaultTaskCompletionFilters,
  getTaskCompletionDateRangeError,
} from "./analytics";
import { TaskCompletionFilters } from "./TaskCompletionFilters";
import { TaskCompletionSummary } from "./TaskCompletionSummary";
import { TaskCompletionTable } from "./TaskCompletionTable";
import type {
  HierarchyTaskCompletionAnalyticsData,
  HierarchyTaskCompletionAnalyticsVariables,
  PersonalTaskCompletionAnalyticsData,
  PersonalTaskCompletionAnalyticsVariables,
  TaskCompletionAnalyticsFilters,
  TaskCompletionAnalyticsResult,
  TaskCompletionView,
} from "./types";

const subscribeToClientReady = () => () => undefined;
const getClientReadySnapshot = () => true;
const getServerReadySnapshot = () => false;

export function TaskCompletionDashboard() {
  const clientReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );

  if (!clientReady) return <DashboardSkeleton />;
  return <TaskCompletionDashboardContent />;
}

function TaskCompletionDashboardContent() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const [activeView, setActiveView] =
    useState<TaskCompletionView>("personal");
  const [draftFilters, setDraftFilters] =
    useState<TaskCompletionAnalyticsFilters>(() =>
      createDefaultTaskCompletionFilters(),
    );
  const [appliedFilters, setAppliedFilters] =
    useState<TaskCompletionAnalyticsFilters>(() =>
      createDefaultTaskCompletionFilters(),
    );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const canViewTeam = canViewTeamTaskCompletion(user?.role);
  const visibleView: TaskCompletionView =
    activeView === "team" && canViewTeam ? "team" : "personal";
  const effectiveFilters = appliedFilters;
  const personalVariables = useMemo(
    () => buildPersonalTaskCompletionVariables(effectiveFilters),
    [effectiveFilters],
  );
  const hierarchyVariables = useMemo(
    () => buildHierarchyTaskCompletionVariables(effectiveFilters),
    [effectiveFilters],
  );
  const queryReady = !authLoading && !!user;

  // NOTE: personalTaskCompletionAnalytics and hierarchyTaskCompletionAnalytics
  // are not yet implemented on the backend. Both queries are skipped until
  // the backend supports PersonalTaskCompletionAnalyticsInput and the
  // corresponding query resolvers.
  const personalQuery = useQuery<
    PersonalTaskCompletionAnalyticsData,
    PersonalTaskCompletionAnalyticsVariables
  >(GET_PERSONAL_TASK_COMPLETION_ANALYTICS, {
    variables: personalVariables,
    skip: true,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const hierarchyQuery = useQuery<
    HierarchyTaskCompletionAnalyticsData,
    HierarchyTaskCompletionAnalyticsVariables
  >(GET_HIERARCHY_TASK_COMPLETION_ANALYTICS, {
    variables: hierarchyVariables,
    skip: true,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  if (authLoading) return <DashboardSkeleton />;

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Unable to load analytics</AlertTitle>
        <AlertDescription>
          Your current user profile is not available. Refresh the page or sign in
          again.
        </AlertDescription>
      </Alert>
    );
  }

  const activeQuery = visibleView === "team" ? hierarchyQuery : personalQuery;
  const result: TaskCompletionAnalyticsResult | undefined =
    visibleView === "team"
      ? hierarchyQuery.data?.hierarchyTaskCompletionAnalytics
      : personalQuery.data?.personalTaskCompletionAnalytics;
  const dateRangeError = getTaskCompletionDateRangeError(draftFilters);
  const errorMessage = activeQuery.error?.message;

  const applyFilters = () => {
    const error = getTaskCompletionDateRangeError(draftFilters);
    setValidationMessage(error);
    if (error) return;
    setAppliedFilters({ ...draftFilters, page: 1 });
  };

  const resetFilters = () => {
    const defaults = createDefaultTaskCompletionFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setValidationMessage(null);
  };

  const changePage = (page: number) => {
    setAppliedFilters((current) => ({
      ...current,
      page: Math.max(1, page),
    }));
    setDraftFilters((current) => ({
      ...current,
      page: Math.max(1, page),
    }));
  };

  const changeView = (view: string) => {
    const nextView = view as TaskCompletionView;
    if (nextView === "team" && !canViewTeam) return;
    setActiveView(nextView);
    setAppliedFilters((current) => ({ ...current, page: 1 }));
    setDraftFilters((current) => ({ ...current, page: 1 }));
    setValidationMessage(null);
  };

  const analyticsContent = (
    <div className="space-y-6 pt-4">
      <TaskCompletionFilters
        view={visibleView}
        filters={draftFilters}
        dateRangeError={validationMessage ?? dateRangeError}
        loading={activeQuery.loading}
        onChange={(filters) => {
          setDraftFilters(filters);
          setValidationMessage(null);
        }}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Task completion analytics could not be loaded</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{errorMessage}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void activeQuery.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {result && !errorMessage && (
        <TaskCompletionSummary
          summary={result.summary}
          teamView={visibleView === "team"}
        />
      )}

      {!errorMessage && (
        <TaskCompletionTable
          result={result}
          view={visibleView}
          loading={activeQuery.loading}
          onPageChange={changePage}
        />
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <BarChart3 className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Task completion analytics
            </h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Review completion of submitted official tasks by day, week, or month.
            Draft and unsubmitted tasks are excluded.
          </p>
        </div>
      </header>

      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
        <Info className="size-4 text-blue-700 dark:text-blue-300" />
        <AlertTitle>How the rate is calculated</AlertTitle>
        <AlertDescription>
          Completion rate is calculated from completed submitted tasks divided by
          all submitted official tasks. Team summary rates come directly from the
          server and are never averaged from employee percentages in this page.
          “No data” means no official tasks were submitted and is not a critical
          result.
        </AlertDescription>
      </Alert>

      <Tabs value={visibleView} onValueChange={changeView}>
        <TabsList aria-label="Task completion analytics view">
          <TabsTrigger value="personal">
            <User aria-hidden="true" />
            Personal
          </TabsTrigger>
          {canViewTeam && (
            <TabsTrigger value="team">
              <Users aria-hidden="true" />
              Team
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="personal">
          {visibleView === "personal" && analyticsContent}
        </TabsContent>
        {canViewTeam && (
          <TabsContent value="team">
            {visibleView === "team" && analyticsContent}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-label="Loading task completion analytics">
      <div className="space-y-2">
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-9 w-52" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
