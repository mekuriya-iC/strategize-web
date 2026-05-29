"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_EMPLOYEES,
  GET_DIRECT_REPORTS,
} from "@/lib/graphql/queries/employees";
import { GET_KPIS, GET_MY_KPIS } from "@/lib/graphql/queries/kpis";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import {
  GET_CHECKINOUT_SESSIONS,
  GET_CHECKINOUT_TASKS,
} from "@/lib/graphql/queries/checkins";
import { GET_LOGBOOK_ENTRIES } from "@/lib/graphql/queries/logbook";
import { GET_AGGREGATE_PERFORMANCE_RESULTS } from "@/lib/graphql/queries/performance";
import { useAuthStore } from "@/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Download,
  ListChecks,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

interface PerformanceReportProps {
  onExport?: (data: unknown) => void;
}

type UnknownRecord = Record<string, unknown>;

type EmployeeLike = UnknownRecord & {
  employeeId?: string;
  id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  title?: string;
};

type MetricDistribution = {
  name: string;
  value: number;
  color: string;
};

type TeamMetric = {
  employeeId: string;
  name: string;
  title?: string;
  aggregateScore: number;
  kpiCompletion: number;
  taskCompletion: number;
  logbookApproval: number;
  objectives: number;
  atRiskKpis: number;
  pendingLogbooks: number;
};

const FULL_ACCESS_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
const MANAGER_ROLES = new Set(["DIRECTOR", "MANAGER"]);
const COMPLETED_OBJECTIVE_STATUSES = new Set([
  "COMPLETED",
  "DONE",
  "ACHIEVED",
  "CLOSED",
]);
const IN_PROGRESS_OBJECTIVE_STATUSES = new Set([
  "IN_PROGRESS",
  "ACTIVE",
  "APPROVED",
  "SUBMITTED",
]);
const COMPLETED_TASK_STATUSES = new Set(["DONE", "COMPLETED"]);
const PENDING_TASK_STATUSES = new Set(["NOT_DONE", "PENDING", "TODO"]);
const POSTPONED_TASK_STATUSES = new Set(["POSTPONED", "DEFERRED"]);
const APPROVED_LOGBOOK_STATUSES = new Set(["APPROVED"]);
const PENDING_LOGBOOK_STATUSES = new Set(["SUBMITTED", "PENDING", "DRAFT"]);
const REJECTED_LOGBOOK_STATUSES = new Set(["REJECTED"]);
const GOOD_KPI_STATUSES = new Set([
  "ON_TRACK",
  "ACHIEVED",
  "COMPLETED",
  "ACTIVE",
  "APPROVED",
]);
const RISK_KPI_STATUSES = new Set([
  "AT_RISK",
  "BEHIND",
  "OFF_TRACK",
  "MISSED",
  "OVERDUE",
]);

const COLORS = {
  green: "#10b981",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ef4444",
  gray: "#6b7280",
  purple: "#8b5cf6",
};

function asArray<T = UnknownRecord>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeStatus(value?: string | null) {
  return (value || "UNKNOWN").toUpperCase();
}

function getEmployeeId(user?: EmployeeLike | null) {
  return user?.employeeId || user?.id || user?.userId;
}

function safePercentage(numerator: number, denominator: number) {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

function average(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value));
  return validValues.length > 0
    ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    : 0;
}

function getNestedRecord(value: unknown, key: string) {
  if (!value || typeof value !== "object") return undefined;
  const nested = (value as UnknownRecord)[key];
  return nested && typeof nested === "object"
    ? (nested as UnknownRecord)
    : undefined;
}

function getString(value: unknown, key: string) {
  if (!value || typeof value !== "object") return undefined;
  const nested = (value as UnknownRecord)[key];
  return typeof nested === "string" ? nested : undefined;
}

function getKpiCompletion(kpi: UnknownRecord) {
  const latestUpdate = getNestedRecord(kpi, "latestUpdate");
  const explicitProgress = Number(
    kpi.progressPercentage ??
      kpi.completionRate ??
      kpi.completionPercent ??
      latestUpdate?.progressPercentage,
  );

  if (Number.isFinite(explicitProgress)) {
    return Math.max(0, Math.min(100, explicitProgress));
  }

  const status = normalizeStatus(
    getString(kpi, "targetStatus") || getString(kpi, "status"),
  );
  if (GOOD_KPI_STATUSES.has(status)) return 100;
  if (RISK_KPI_STATUSES.has(status)) return 40;
  if (status === "NOT_STARTED" || status === "DRAFT") return 0;
  return 50;
}

function isInCurrentPeriod(date?: string | null) {
  if (!date) return true;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return true;

  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    Math.floor(value.getMonth() / 3) === Math.floor(now.getMonth() / 3)
  );
}

function isInLastQuarter(date?: string | null) {
  if (!date) return true;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return true;

  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
  const year = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();

  return (
    value.getFullYear() === year &&
    Math.floor(value.getMonth() / 3) === lastQuarter
  );
}

function isInLastYear(date?: string | null) {
  if (!date) return true;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return true;
  return value.getFullYear() === new Date().getFullYear() - 1;
}

function filterByPeriod<T extends UnknownRecord>(items: T[], period: string) {
  if (period === "all-time") return items;

  return items.filter((item) => {
    const date =
      getString(item, "createdAt") ||
      getString(item, "updatedAt") ||
      getString(item, "entryDate") ||
      getString(item, "weekStartDate") ||
      getString(item, "dueDate") ||
      getString(item, "computedAt");

    if (period === "current") return isInCurrentPeriod(date);
    if (period === "last-quarter") return isInLastQuarter(date);
    if (period === "last-year") return isInLastYear(date);
    return true;
  });
}

function filterByStrategicPeriod<T extends UnknownRecord>(
  items: T[],
  strategicPeriodId: string,
) {
  if (strategicPeriodId === "all") return items;
  return items.filter(
    (item) =>
      getString(
        getNestedRecord(item, "strategicPeriod"),
        "strategicPeriodId",
      ) === strategicPeriodId,
  );
}

function getRelatedEmployeeId(item: unknown, relation: string) {
  return getString(getNestedRecord(item, relation), "employeeId");
}

function getEmployeeKey(item: unknown) {
  return (
    getRelatedEmployeeId(item, "employee") ||
    getRelatedEmployeeId(item, "owner") ||
    getRelatedEmployeeId(item, "user") ||
    getRelatedEmployeeId(item, "createdBy") ||
    getRelatedEmployeeId(item, "reportedBy") ||
    getString(item, "employeeId") ||
    "unknown"
  );
}

function DistributionBars({
  items,
  emptyLabel,
}: {
  items: MetricDistribution[];
  emptyLabel: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const visibleItems = items.filter((item) => item.value > 0);

  if (visibleItems.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleItems.map((item) => {
        const percentage = safePercentage(item.value, total);
        return (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <span className="text-muted-foreground">
                {item.value} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${percentage}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function PerformanceReport({
  onExport,
}: PerformanceReportProps) {
  const [period, setPeriod] = useState("current");
  const [strategicPeriodId, setStrategicPeriodId] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const user = useAuthStore((state) => state.user);

  const role = user?.role as string | undefined;
  const currentEmployeeId = getEmployeeId(user as unknown as EmployeeLike);
  const hasFullAccess = !!role && FULL_ACCESS_ROLES.has(role);
  const isManager = !!role && MANAGER_ROLES.has(role);
  const canViewTeam = hasFullAccess || isManager;

  const { data: employeesData, loading: employeesLoading } = useQuery(
    GET_EMPLOYEES,
    {
      variables: { page: 1, limit: 1000 },
      fetchPolicy: "cache-and-network",
      skip: !hasFullAccess,
    },
  );

  const { data: directReportsData, loading: directReportsLoading } = useQuery(
    GET_DIRECT_REPORTS,
    {
      variables: { managerId: currentEmployeeId },
      fetchPolicy: "cache-and-network",
      skip: !isManager || !currentEmployeeId,
    },
  );

  const { data: kpisData, loading: kpisLoading } = useQuery(
    hasFullAccess || isManager ? GET_KPIS : GET_MY_KPIS,
    {
      variables:
        hasFullAccess || isManager
          ? { page: 1, limit: 1000 }
          : {
              page: 1,
              limit: 1000,
              strategicPeriodId:
                strategicPeriodId !== "all" ? strategicPeriodId : undefined,
            },
      fetchPolicy: "cache-and-network",
      skip: !currentEmployeeId,
    },
  );

  const { data: objectivesData, loading: objectivesLoading } = useQuery(
    GET_OBJECTIVES,
    {
      variables: {
        page: 1,
        limit: 1000,
        assigneeId: !canViewTeam ? currentEmployeeId : undefined,
        organizationId: hasFullAccess ? user?.organizationId : undefined,
      },
      fetchPolicy: "cache-and-network",
      skip: !currentEmployeeId,
    },
  );

  const { data: sessionsData, loading: sessionsLoading } = useQuery(
    GET_CHECKINOUT_SESSIONS,
    {
      variables: {
        page: 1,
        limit: 1000,
        strategicPeriodId:
          strategicPeriodId !== "all" ? strategicPeriodId : undefined,
        employeeUserId: !canViewTeam ? currentEmployeeId : undefined,
        supervisorUserId: isManager ? currentEmployeeId : undefined,
      },
      fetchPolicy: "cache-and-network",
      skip: !currentEmployeeId,
    },
  );

  const { data: tasksData, loading: tasksLoading } = useQuery(
    GET_CHECKINOUT_TASKS,
    {
      variables: { page: 1, limit: 1000 },
      fetchPolicy: "cache-and-network",
      skip: !currentEmployeeId,
    },
  );

  const { data: logbookData, loading: logbookLoading } = useQuery(
    GET_LOGBOOK_ENTRIES,
    {
      variables: {
        page: 1,
        limit: 1000,
        strategicPeriodId:
          strategicPeriodId !== "all" ? strategicPeriodId : undefined,
        ownerUserId: !canViewTeam ? currentEmployeeId : undefined,
      },
      fetchPolicy: "cache-and-network",
      skip: !currentEmployeeId,
    },
  );

  const { data: aggregateData, loading: aggregateLoading } = useQuery(
    GET_AGGREGATE_PERFORMANCE_RESULTS,
    {
      variables: {
        page: 1,
        limit: 1000,
        strategicPeriodId:
          strategicPeriodId !== "all" ? strategicPeriodId : undefined,
        userId: !canViewTeam ? currentEmployeeId : undefined,
      },
      fetchPolicy: "cache-and-network",
      skip: !currentEmployeeId,
    },
  );

  const rawEmployees = useMemo<EmployeeLike[]>(() => {
    if (hasFullAccess)
      return asArray<EmployeeLike>(employeesData?.employees?.items);
    if (isManager)
      return asArray<EmployeeLike>(directReportsData?.directReports);
    return user ? [user as unknown as EmployeeLike] : [];
  }, [directReportsData, employeesData, hasFullAccess, isManager, user]);

  const reportData = useMemo(() => {
    const kpis = filterByStrategicPeriod(
      filterByPeriod(
        asArray(kpisData?.kpis?.items || kpisData?.myKpis?.items),
        period,
      ),
      strategicPeriodId,
    );
    const objectives = filterByStrategicPeriod(
      filterByPeriod(asArray(objectivesData?.objectives?.items), period),
      strategicPeriodId,
    );
    const sessions = filterByStrategicPeriod(
      filterByPeriod(asArray(sessionsData?.checkinoutSessions?.items), period),
      strategicPeriodId,
    );
    const tasks = filterByPeriod(
      asArray(tasksData?.checkinoutTasks?.items),
      period,
    );
    const logbookEntries = filterByStrategicPeriod(
      filterByPeriod(asArray(logbookData?.logbookEntries?.items), period),
      strategicPeriodId,
    );
    const aggregateResults = filterByStrategicPeriod(
      filterByPeriod(
        asArray(aggregateData?.aggregatePerformanceResults?.items),
        period,
      ),
      strategicPeriodId,
    );

    const selectedEmployeeId = employeeFilter !== "all" ? employeeFilter : null;
    const employeeScoped = (item: UnknownRecord) =>
      !selectedEmployeeId || getEmployeeKey(item) === selectedEmployeeId;

    const scopedKpis = kpis.filter((kpi) => {
      if (!selectedEmployeeId) return true;
      return (
        getString(kpi, "assigneeId") === selectedEmployeeId ||
        getRelatedEmployeeId(kpi, "createdBy") === selectedEmployeeId ||
        getRelatedEmployeeId(kpi, "employee") === selectedEmployeeId
      );
    });
    const scopedObjectives = objectives.filter((objective) => {
      if (!selectedEmployeeId) return true;
      return (
        getString(objective, "assigneeId") === selectedEmployeeId ||
        getRelatedEmployeeId(objective, "ownerUser") === selectedEmployeeId ||
        getRelatedEmployeeId(objective, "createdBy") === selectedEmployeeId
      );
    });
    const scopedSessions = sessions.filter(employeeScoped);
    const scopedTasks = tasks.filter(employeeScoped);
    const scopedLogbookEntries = logbookEntries.filter(employeeScoped);
    const scopedAggregateResults = aggregateResults.filter(employeeScoped);

    const kpiCompletionValues = scopedKpis.map(getKpiCompletion);
    const averageKpiCompletion = average(kpiCompletionValues);
    const kpisOnTrack = scopedKpis.filter((kpi) => {
      const status = normalizeStatus(
        getString(kpi, "targetStatus") || getString(kpi, "status"),
      );
      return GOOD_KPI_STATUSES.has(status) || getKpiCompletion(kpi) >= 100;
    }).length;
    const kpisAtRisk = scopedKpis.filter((kpi) => {
      const status = normalizeStatus(
        getString(kpi, "targetStatus") || getString(kpi, "status"),
      );
      return RISK_KPI_STATUSES.has(status) || getKpiCompletion(kpi) < 50;
    }).length;

    const objectiveStatusCounts = scopedObjectives.reduce<{
      completed: number;
      inProgress: number;
      notStarted: number;
    }>(
      (acc, objective) => {
        const status = normalizeStatus(getString(objective, "status"));
        if (COMPLETED_OBJECTIVE_STATUSES.has(status)) acc.completed += 1;
        else if (IN_PROGRESS_OBJECTIVE_STATUSES.has(status))
          acc.inProgress += 1;
        else acc.notStarted += 1;
        return acc;
      },
      { completed: 0, inProgress: 0, notStarted: 0 },
    );

    const taskStatusCounts = scopedTasks.reduce<{
      completed: number;
      pending: number;
      postponed: number;
      other: number;
      midWeek: number;
    }>(
      (acc, task) => {
        const status = normalizeStatus(getString(task, "taskStatus"));
        if (COMPLETED_TASK_STATUSES.has(status)) acc.completed += 1;
        else if (POSTPONED_TASK_STATUSES.has(status)) acc.postponed += 1;
        else if (PENDING_TASK_STATUSES.has(status)) acc.pending += 1;
        else acc.other += 1;
        if (Boolean(task.isMidWeekTask)) acc.midWeek += 1;
        return acc;
      },
      { completed: 0, pending: 0, postponed: 0, other: 0, midWeek: 0 },
    );

    const logbookStatusCounts = scopedLogbookEntries.reduce<{
      approved: number;
      pending: number;
      rejected: number;
      other: number;
    }>(
      (acc, entry) => {
        const status = normalizeStatus(getString(entry, "entryStatus"));
        if (APPROVED_LOGBOOK_STATUSES.has(status)) acc.approved += 1;
        else if (REJECTED_LOGBOOK_STATUSES.has(status)) acc.rejected += 1;
        else if (PENDING_LOGBOOK_STATUSES.has(status)) acc.pending += 1;
        else acc.other += 1;
        return acc;
      },
      { approved: 0, pending: 0, rejected: 0, other: 0 },
    );

    const strategicPeriodOptions = new Map<string, string>();
    [
      ...objectives,
      ...sessions,
      ...logbookEntries,
      ...aggregateResults,
    ].forEach((item) => {
      const strategicPeriod = getNestedRecord(item, "strategicPeriod");
      const id = getString(strategicPeriod, "strategicPeriodId");
      const name = getString(strategicPeriod, "name");
      if (id && name) strategicPeriodOptions.set(id, name);
    });

    const employeesById = new Map<string, TeamMetric>();
    rawEmployees.forEach((employee) => {
      const employeeId = getEmployeeId(employee);
      if (!employeeId) return;
      employeesById.set(employeeId, {
        employeeId,
        name: employee.fullName || employee.email || "Unnamed employee",
        title: employee.title,
        aggregateScore: 0,
        kpiCompletion: 0,
        taskCompletion: 0,
        logbookApproval: 0,
        objectives: 0,
        atRiskKpis: 0,
        pendingLogbooks: 0,
      });
    });

    aggregateResults.forEach((result) => {
      const resultUser = getNestedRecord(result, "user");
      const employeeId = getString(resultUser, "employeeId");
      if (!employeeId) return;
      const existing = employeesById.get(employeeId) || {
        employeeId,
        name: getString(resultUser, "fullName") || "Unnamed employee",
        title: getString(resultUser, "title"),
        aggregateScore: 0,
        kpiCompletion: 0,
        taskCompletion: 0,
        logbookApproval: 0,
        objectives: 0,
        atRiskKpis: 0,
        pendingLogbooks: 0,
      };
      existing.aggregateScore = Number(result.aggregateScore) || 0;
      existing.kpiCompletion = Number(result.individualKpiScore) || 0;
      employeesById.set(employeeId, existing);
    });

    for (const [employeeId, metric] of employeesById.entries()) {
      const employeeTasks = tasks.filter(
        (task) => getEmployeeKey(task) === employeeId,
      );
      const employeeLogbooks = logbookEntries.filter(
        (entry) => getEmployeeKey(entry) === employeeId,
      );
      const employeeObjectives = objectives.filter(
        (objective) =>
          getString(objective, "assigneeId") === employeeId ||
          getRelatedEmployeeId(objective, "ownerUser") === employeeId ||
          getRelatedEmployeeId(objective, "createdBy") === employeeId,
      );
      const employeeKpis = kpis.filter(
        (kpi) =>
          getString(kpi, "assigneeId") === employeeId ||
          getRelatedEmployeeId(kpi, "createdBy") === employeeId ||
          getRelatedEmployeeId(kpi, "employee") === employeeId,
      );

      const completedTasks = employeeTasks.filter((task) =>
        COMPLETED_TASK_STATUSES.has(
          normalizeStatus(getString(task, "taskStatus")),
        ),
      ).length;
      const approvedLogbooks = employeeLogbooks.filter((entry) =>
        APPROVED_LOGBOOK_STATUSES.has(
          normalizeStatus(getString(entry, "entryStatus")),
        ),
      ).length;

      metric.taskCompletion = safePercentage(
        completedTasks,
        employeeTasks.length,
      );
      metric.logbookApproval = safePercentage(
        approvedLogbooks,
        employeeLogbooks.length,
      );
      metric.objectives = employeeObjectives.length;
      metric.atRiskKpis = employeeKpis.filter((kpi) => {
        const status = normalizeStatus(
          getString(kpi, "targetStatus") || getString(kpi, "status"),
        );
        return RISK_KPI_STATUSES.has(status) || getKpiCompletion(kpi) < 50;
      }).length;
      metric.pendingLogbooks = employeeLogbooks.filter((entry) =>
        PENDING_LOGBOOK_STATUSES.has(
          normalizeStatus(getString(entry, "entryStatus")),
        ),
      ).length;
    }

    const teamMetrics = Array.from(employeesById.values()).sort(
      (a, b) => b.aggregateScore - a.aggregateScore,
    );

    return {
      employees: rawEmployees,
      kpis: scopedKpis,
      objectives: scopedObjectives,
      sessions: scopedSessions,
      tasks: scopedTasks,
      logbookEntries: scopedLogbookEntries,
      aggregateResults: scopedAggregateResults,
      strategicPeriodOptions: Array.from(strategicPeriodOptions.entries()).map(
        ([id, name]) => ({ id, name }),
      ),
      totals: {
        employees: rawEmployees.length,
        kpis: scopedKpis.length,
        objectives: scopedObjectives.length,
        sessions: scopedSessions.length,
        tasks: scopedTasks.length,
        logbookEntries: scopedLogbookEntries.length,
      },
      kpiMetrics: {
        onTrack: kpisOnTrack,
        atRisk: kpisAtRisk,
        averageCompletion: averageKpiCompletion,
        distribution: [
          { name: "On Track", value: kpisOnTrack, color: COLORS.green },
          { name: "At Risk", value: kpisAtRisk, color: COLORS.red },
          {
            name: "Other",
            value: Math.max(0, scopedKpis.length - kpisOnTrack - kpisAtRisk),
            color: COLORS.gray,
          },
        ],
      },
      objectiveMetrics: {
        completionRate: safePercentage(
          objectiveStatusCounts.completed,
          scopedObjectives.length,
        ),
        distribution: [
          {
            name: "Completed",
            value: objectiveStatusCounts.completed,
            color: COLORS.green,
          },
          {
            name: "In Progress",
            value: objectiveStatusCounts.inProgress,
            color: COLORS.blue,
          },
          {
            name: "Not Started",
            value: objectiveStatusCounts.notStarted,
            color: COLORS.gray,
          },
        ],
        byType: Object.values(
          scopedObjectives.reduce<Record<string, MetricDistribution>>(
            (acc, objective) => {
              const type =
                getString(objective, "type") ||
                getString(objective, "level") ||
                "Unspecified";
              if (!acc[type])
                acc[type] = { name: type, value: 0, color: COLORS.purple };
              acc[type].value += 1;
              return acc;
            },
            {},
          ),
        ),
      },
      taskMetrics: {
        completionRate: safePercentage(
          taskStatusCounts.completed,
          scopedTasks.length,
        ),
        midWeekTasks: taskStatusCounts.midWeek,
        distribution: [
          {
            name: "Done",
            value: taskStatusCounts.completed,
            color: COLORS.green,
          },
          {
            name: "Pending",
            value: taskStatusCounts.pending,
            color: COLORS.amber,
          },
          {
            name: "Postponed",
            value: taskStatusCounts.postponed,
            color: COLORS.blue,
          },
          { name: "Other", value: taskStatusCounts.other, color: COLORS.gray },
        ],
      },
      logbookMetrics: {
        approvalRate: safePercentage(
          logbookStatusCounts.approved,
          scopedLogbookEntries.length,
        ),
        pending: logbookStatusCounts.pending,
        distribution: [
          {
            name: "Approved",
            value: logbookStatusCounts.approved,
            color: COLORS.green,
          },
          {
            name: "Pending",
            value: logbookStatusCounts.pending,
            color: COLORS.amber,
          },
          {
            name: "Rejected",
            value: logbookStatusCounts.rejected,
            color: COLORS.red,
          },
          {
            name: "Other",
            value: logbookStatusCounts.other,
            color: COLORS.gray,
          },
        ],
      },
      topPerformers: teamMetrics
        .filter(
          (metric) =>
            metric.aggregateScore > 0 ||
            metric.kpiCompletion > 0 ||
            metric.taskCompletion > 0 ||
            metric.logbookApproval > 0,
        )
        .slice(0, 5),
      improvementAreas: teamMetrics
        .filter((metric) => metric.atRiskKpis > 0 || metric.pendingLogbooks > 0)
        .slice(0, 5),
      teamMetrics,
    };
  }, [
    aggregateData,
    employeeFilter,
    kpisData,
    logbookData,
    objectivesData,
    period,
    rawEmployees,
    sessionsData,
    strategicPeriodId,
    tasksData,
  ]);

  const loading =
    employeesLoading ||
    directReportsLoading ||
    kpisLoading ||
    objectivesLoading ||
    sessionsLoading ||
    tasksLoading ||
    logbookLoading ||
    aggregateLoading;

  const handleExport = () => {
    onExport?.({
      role,
      period,
      strategicPeriodId,
      employeeFilter,
      overview: reportData.totals,
      kpiMetrics: reportData.kpiMetrics,
      objectiveMetrics: reportData.objectiveMetrics,
      taskMetrics: reportData.taskMetrics,
      logbookMetrics: reportData.logbookMetrics,
      teamMetrics: reportData.teamMetrics,
      topPerformers: reportData.topPerformers,
      improvementAreas: reportData.improvementAreas,
      generatedAt: new Date().toISOString(),
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="mb-4 h-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="last-quarter">Last Quarter</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={strategicPeriodId}
            onValueChange={setStrategicPeriodId}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Strategic period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategic Periods</SelectItem>
              {reportData.strategicPeriodOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canViewTeam && reportData.employees.length > 0 && (
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {reportData.employees.map((employee) => {
                  const employeeId = getEmployeeId(employee);
                  if (!employeeId) return null;
                  return (
                    <SelectItem key={employeeId} value={employeeId}>
                      {employee.fullName || employee.email}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {hasFullAccess ? "Organization" : isManager ? "Team" : "Personal"}{" "}
            view
          </Badge>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title={canViewTeam ? "Employees" : "Profile"}
          value={canViewTeam ? reportData.totals.employees : 1}
          description={
            canViewTeam ? "Included in this view" : "Personal metrics only"
          }
          icon={Users}
        />
        <MetricCard
          title="KPI Completion"
          value={`${reportData.kpiMetrics.averageCompletion.toFixed(1)}%`}
          description={`${reportData.kpiMetrics.onTrack} on track, ${reportData.kpiMetrics.atRisk} at risk`}
          icon={Target}
        />
        <MetricCard
          title="Objective Progress"
          value={`${reportData.objectiveMetrics.completionRate.toFixed(1)}%`}
          description={`${reportData.totals.objectives} objectives tracked`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Task Completion"
          value={`${reportData.taskMetrics.completionRate.toFixed(1)}%`}
          description={`${reportData.taskMetrics.midWeekTasks} mid-week tasks`}
          icon={ListChecks}
        />
        <MetricCard
          title="Logbook Approval"
          value={`${reportData.logbookMetrics.approvalRate.toFixed(1)}%`}
          description={`${reportData.logbookMetrics.pending} pending entries`}
          icon={BookOpenCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>KPI Status Distribution</CardTitle>
            <CardDescription>
              Completion health based on KPI target/status data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionBars
              items={reportData.kpiMetrics.distribution}
              emptyLabel="No KPI data available"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objective Status Distribution</CardTitle>
            <CardDescription>
              Completion progress across corporate, division, department, and
              personnel objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionBars
              items={reportData.objectiveMetrics.distribution}
              emptyLabel="No objective data available"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-In Task Distribution</CardTitle>
            <CardDescription>
              Done, pending, postponed, and other task statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionBars
              items={reportData.taskMetrics.distribution}
              emptyLabel="No check-in task data available"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logbook Status Distribution</CardTitle>
            <CardDescription>
              Approval rate and pending/rejected entry breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionBars
              items={reportData.logbookMetrics.distribution}
              emptyLabel="No logbook data available"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Highest aggregate and execution metrics in this view
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.topPerformers.length > 0 ? (
              <div className="space-y-4">
                {reportData.topPerformers.map((performer) => {
                  const score = Math.max(
                    performer.aggregateScore,
                    performer.kpiCompletion,
                    performer.taskCompletion,
                    performer.logbookApproval,
                  );
                  return (
                    <div key={performer.employeeId} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          {performer.title && (
                            <p className="text-xs text-muted-foreground">
                              {performer.title}
                            </p>
                          )}
                        </div>
                        <Badge>{score.toFixed(1)}%</Badge>
                      </div>
                      <Progress value={score} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                No performer data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              At-risk KPIs and pending logbook activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.improvementAreas.length > 0 ? (
              <div className="space-y-4">
                {reportData.improvementAreas.map((item) => (
                  <div
                    key={item.employeeId}
                    className="rounded-lg border p-3 text-sm dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.title && (
                          <p className="text-xs text-muted-foreground">
                            {item.title}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {item.atRiskKpis > 0 && (
                          <Badge variant="destructive">
                            {item.atRiskKpis} KPI risk
                          </Badge>
                        )}
                        {item.pendingLogbooks > 0 && (
                          <Badge variant="outline">
                            {item.pendingLogbooks} pending logbooks
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                No improvement areas found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canViewTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Performance
            </CardTitle>
            <CardDescription>
              Employee-level KPI, task, objective, and logbook metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.teamMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Aggregate</TableHead>
                      <TableHead>KPI</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Logbooks</TableHead>
                      <TableHead>Objectives</TableHead>
                      <TableHead>Risks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.teamMetrics.map((member) => (
                      <TableRow key={member.employeeId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            {member.title && (
                              <p className="text-xs text-muted-foreground">
                                {member.title}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.aggregateScore.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {member.kpiCompletion.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {member.taskCompletion.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {member.logbookApproval.toFixed(1)}%
                        </TableCell>
                        <TableCell>{member.objectives}</TableCell>
                        <TableCell>
                          {member.atRiskKpis > 0 ||
                          member.pendingLogbooks > 0 ? (
                            <Badge variant="outline">
                              {member.atRiskKpis} KPI / {member.pendingLogbooks}{" "}
                              logbook
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Clear
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                No team performance data available
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
