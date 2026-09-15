import {
  Activity,
  Ban,
  CircleCheckBig,
  CircleX,
  ClipboardList,
  Clock3,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCompletionStatusBadge } from "./TaskCompletionStatusBadge";
import type { TaskCompletionAnalyticsSummary } from "./types";

interface TaskCompletionSummaryProps {
  summary: TaskCompletionAnalyticsSummary;
  teamView: boolean;
}

export function TaskCompletionSummary({
  summary,
  teamView,
}: TaskCompletionSummaryProps) {
  const noData = summary.status === "NO_DATA";

  const cards = [
    {
      title: "Approved official tasks",
      value: summary.totalTasks.toLocaleString(),
      detail: "Official tasks included",
      icon: ClipboardList,
    },
    {
      title: "Completed",
      value: summary.completedTasks.toLocaleString(),
      detail: "Current outcome: done",
      icon: CircleCheckBig,
    },
    {
      title: "Completion rate",
      value: noData ? "—" : `${summary.completionRate.toFixed(1)}%`,
      detail: noData ? "No submitted tasks" : "Server-calculated rate",
      icon: Percent,
    },
  ];

  return (
    <section
      className="space-y-4"
      aria-labelledby="task-completion-summary-title"
    >
      <div className="sr-only" id="task-completion-summary-title">
        Task completion summary
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ title, value, detail, icon: Icon }) => (
          <Card
            key={title}
            className="gap-3 border-primary/15 bg-gradient-to-br from-primary/5 to-card py-5"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className="size-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent className="px-4">
              <div className="text-2xl font-bold tabular-nums sm:text-3xl">{value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}

        <Card className="gap-3 py-5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
            <Activity
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent className="px-4">
            <TaskCompletionStatusBadge status={summary.status} />
            <p className="mt-3 text-xs text-muted-foreground">
              {teamView
                ? `${summary.employeeCount.toLocaleString()} employees across ${summary.periodCount.toLocaleString()} periods`
                : `${summary.periodCount.toLocaleString()} reporting periods`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-4 py-5">
        <CardHeader>
          <CardTitle className="text-base">Outcome breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Approved official tasks only. Pending approval, rejected and draft
            work is excluded.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ComponentCount
              label="Completed"
              value={summary.completedTasks}
              icon={CircleCheckBig}
            />
            <ComponentCount
              label="Not done"
              value={summary.notDoneTasks}
              icon={CircleX}
            />
            <ComponentCount
              label="Postponed"
              value={summary.postponedTasks}
              icon={Clock3}
            />
            <ComponentCount
              label="Cancelled"
              value={summary.cancelledTasks}
              icon={Ban}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ComponentCount({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CircleCheckBig;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </div>
      <span className="font-semibold tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
