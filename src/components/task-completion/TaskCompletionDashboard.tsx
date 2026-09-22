"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useQuery } from "@apollo/client";
import { AlertCircle, BarChart3, Info, User, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GET_HIERARCHY_TASK_COMPLETION_ANALYTICS,
  GET_PERSONAL_TASK_COMPLETION_ANALYTICS,
} from "@/lib/graphql/queries/task-completion";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import { TaskCompletionInsights } from "./TaskCompletionInsights";
import { CorporateTargetScenario } from "./CorporateTargetScenario";
import { localCalendarDate } from "./projections";
import styles from "./TaskCompletionDashboard.module.css";
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
  const userId = useAuthStore((state) => state.user?.employeeId);
  const periodId = useStrategicPeriodStore(
    (state) => state.selectedPeriod?.strategicPeriodId,
  );
  const validated = useStrategicPeriodStore(
    (state) => state.selectionValidated,
  );
  const clientReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );

  if (!clientReady || !validated) return <DashboardSkeleton />;
  return <TaskCompletionDashboardContent key={`${userId}-${periodId}`} />;
}

function TaskCompletionDashboardContent() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const selectedPeriod = useStrategicPeriodStore(
    (state) => state.selectedPeriod,
  );
  const defaults = () => {
    const filters = createDefaultTaskCompletionFilters();
    const now = localCalendarDate();
    const endDate = selectedPeriod
      ? [now, selectedPeriod.endDate.slice(0, 10)].sort()[0]
      : now;
    const end =
      selectedPeriod && endDate < selectedPeriod.startDate.slice(0, 10)
        ? selectedPeriod.startDate.slice(0, 10)
        : endDate;
    const start = new Date(`${end}T12:00:00`);
    start.setDate(start.getDate() - 56);
    const startDate = localCalendarDate(start);
    return {
      ...filters,
      startDate: selectedPeriod
        ? [startDate, selectedPeriod.startDate.slice(0, 10)].sort().at(-1)!
        : startDate,
      endDate: end,
      strategicPeriodId: selectedPeriod?.strategicPeriodId,
    };
  };
  const [activeView, setActiveView] = useState<TaskCompletionView>(() =>
    canViewTeamTaskCompletion(user?.role) ? "team" : "personal",
  );
  const [section, setSection] = useState("overview");
  const [draftFilters, setDraftFilters] =
    useState<TaskCompletionAnalyticsFilters>(() => defaults());
  const [appliedFilters, setAppliedFilters] =
    useState<TaskCompletionAnalyticsFilters>(() => defaults());
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  // Role labels alone do not identify unit heads or session supervisors.
  // Every authenticated user can request their server-authorized hierarchy.
  const canViewTeam = !!user;
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

  const personalQuery = useQuery<
    PersonalTaskCompletionAnalyticsData,
    PersonalTaskCompletionAnalyticsVariables
  >(GET_PERSONAL_TASK_COMPLETION_ANALYTICS, {
    variables: personalVariables,
    skip: !queryReady || visibleView !== "personal",
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const hierarchyQuery = useQuery<
    HierarchyTaskCompletionAnalyticsData,
    HierarchyTaskCompletionAnalyticsVariables
  >(GET_HIERARCHY_TASK_COMPLETION_ANALYTICS, {
    variables: hierarchyVariables,
    skip: !queryReady || visibleView !== "team",
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  if (authLoading) return <DashboardSkeleton />;

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Unable to load analytics</AlertTitle>
        <AlertDescription>
          Your current user profile is not available. Refresh the page or sign
          in again.
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
    const reset = defaults();
    setDraftFilters(reset);
    setAppliedFilters(reset);
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
        availableFilters={result?.availableFilters}
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

      {activeQuery.loading && (
        <p role="status" className="text-sm text-primary">
          Updating live analytics…
        </p>
      )}
      {result && !errorMessage && !activeQuery.loading && (
        <>
          <p className="text-xs text-muted-foreground">
            Showing {appliedFilters.startDate} – {appliedFilters.endDate} ·{" "}
            {visibleView === "team"
              ? "My authorized hierarchy (including me)"
              : "My tasks"}
            {appliedFilters.status
              ? ` · ${appliedFilters.status} employee-period rows only`
              : " · All completion statuses"}
          </p>
          <Tabs value={section} onValueChange={setSection}>
            <TabsList
              className={styles.sections}
              aria-label="Analysis section"
            >
              <TabsTrigger value="overview">Delivery overview</TabsTrigger>
              <TabsTrigger value="detail">Employee & period detail</TabsTrigger>
              <TabsTrigger value="scenarios">Scenario lab</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-5 pt-3">
              <TaskCompletionSummary
                summary={result.summary}
                teamView={visibleView === "team"}
              />
              <TaskCompletionInsights
                result={result}
                filters={appliedFilters}
              />
            </TabsContent>
            <TabsContent value="detail" className="pt-3">
              <TaskCompletionTable
                result={result}
                view={visibleView}
                loading={activeQuery.loading}
                onPageChange={changePage}
              />
            </TabsContent>
            <TabsContent value="scenarios" className="space-y-5 pt-3">
              <TaskCompletionInsights
                key={JSON.stringify([appliedFilters, visibleView])}
                result={result}
                filters={appliedFilters}
                simulation
              />
              <CorporateTargetScenario
                periodId={appliedFilters.strategicPeriodId}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
      {!activeQuery.loading && !result && !errorMessage && (
        <Alert>
          <AlertTitle>No response received</AlertTitle>
          <AlertDescription>
            Analytics did not return a result. Refresh to retry; this is not a
            zero-task result.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className={`${styles.dashboard} mx-auto max-w-7xl space-y-6`}>
      <header className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-violet-500/10 p-6 sm:flex-row sm:items-start sm:justify-between">
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
            Understand delivery, find pressure points, and explore what comes
            next. Live official-task outcomes within your authorized hierarchy.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={activeQuery.loading}
          onClick={() => void activeQuery.refetch()}
        >
          Refresh data
        </Button>
      </header>

      <details className="rounded-xl border bg-card px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">
          What counts, and what doesn’t?
        </summary>
        <Alert className="mt-3 border-0 bg-transparent">
          <Info className="size-4 text-blue-700 dark:text-blue-300" />
          <AlertTitle>How the rate is calculated</AlertTitle>
          <AlertDescription>
            Completion rate is completed approved official tasks divided by all
            approved official tasks (including cancelled tasks). Drafts, pending
            approval and rejected submissions are excluded. Completion is the
            current task outcome, not proof of on-time delivery or approved KPI
            achievement. Team summary rates come directly from the server and
            are never averaged from employee percentages in this page. “No data”
            means no official tasks were submitted and is not a critical result.
          </AlertDescription>
        </Alert>
      </details>

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
    <div
      className="mx-auto max-w-7xl space-y-6"
      aria-label="Loading task completion analytics"
    >
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
