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
      title: "Submitted tasks",
      value: summary.totalTasks.toLocaleString(),
      detail: "Official tasks included",
      icon: ClipboardList,
    },
    {
      title: "Completed",
      value: summary.completedTasks.toLocaleString(),
      detail: "Submitted tasks completed",
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
    <section className="space-y-4" aria-labelledby="task-completion-summary-title">
      <div className="sr-only" id="task-completion-summary-title">
        Task completion summary
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, detail, icon: Icon }) => (
          <Card key={title} className="gap-3 py-5">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}

        <Card className="gap-3 py-5">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
            <Activity className="size-5 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
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
          <CardTitle className="text-base">Submitted task components</CardTitle>
          <p className="text-sm text-muted-foreground">
            Only submitted official tasks count in these analytics. Draft or
            unsubmitted work is not included.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}
