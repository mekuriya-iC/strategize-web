"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  FlaskConical,
  Minus,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  localCalendarDate,
  projectDelivery,
  weeklyBaseline,
} from "./projections";
import type {
  TaskCompletionAnalyticsFilters,
  TaskCompletionAnalyticsResult,
} from "./types";

const tooltipStyle = {
  background: "var(--card)",
  color: "var(--foreground)",
  border: "1px solid var(--border)",
  borderRadius: 12,
};
const format = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 1 });

export function TaskCompletionInsights({
  result,
  filters,
  simulation = false,
}: {
  result: TaskCompletionAnalyticsResult;
  filters: TaskCompletionAnalyticsFilters;
  simulation?: boolean;
}) {
  const series = result.series ?? [];
  const baseline =
    filters.periodType === "WEEKLY" && !filters.status
      ? weeklyBaseline(series, localCalendarDate())
      : null;
  const [rate, setRate] = useState(
    baseline ? baseline.completionRate.toFixed(2) : "",
  );
  const [volume, setVolume] = useState(
    baseline ? baseline.weeklyVolume.toFixed(2) : "",
  );
  const [horizon, setHorizon] = useState("4");
  const projection =
    rate !== "" && volume !== "" && horizon !== ""
      ? projectDelivery(Number(volume), Number(rate), Number(horizon))
      : null;
  const change = baseline?.change;
  const ChangeIcon =
    change == null || change === 0
      ? Minus
      : change > 0
        ? ArrowUpRight
        : ArrowDownRight;
  if (simulation) {
    return (
      <section
        className="overflow-hidden rounded-2xl border border-primary/20 bg-card"
        aria-labelledby="delivery-simulation-title"
      >
        <div className="border-b bg-primary/5 p-5">
          <h2
            id="delivery-simulation-title"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <FlaskConical className="size-5 text-primary" />
            Delivery scenario lab
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What-if planning, not a guaranteed forecast. Nothing here changes
            tasks, targets, or approvals.
          </p>
        </div>
        {!baseline ? (
          <p className="p-6 text-sm text-muted-foreground">
            Choose Weekly, All statuses, and a range with at least two complete
            past Monday–Sunday weeks and some approved tasks. Current, partial,
            and future weeks are excluded from the baseline.
          </p>
        ) : (
          <div className="space-y-5 p-5">
            <p className="text-sm text-muted-foreground">
              Observed baseline: {baseline.weeks} complete weeks ·{" "}
              {baseline.completed}/{baseline.total} tasks completed ·{" "}
              {format(baseline.completionRate)}% completion ·{" "}
              {format(baseline.weeklyVolume)} approved tasks/week. Zero-volume
              weeks are included in throughput. This uses today’s task outcomes,
              not historical status snapshots.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-medium">
                Expected approved tasks/week
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Assumed completion rate (%)
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Future weeks (1–52)
                <Input
                  type="number"
                  min="1"
                  max="52"
                  step="1"
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                />
              </label>
            </div>
            {projection && Number.isInteger(Number(horizon)) ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric
                    label="Expected completed"
                    value={format(projection.completed)}
                    tone="text-emerald-600 dark:text-emerald-400"
                  />
                  <Metric
                    label="Expected not completed"
                    value={format(projection.unfinished)}
                    tone="text-amber-600 dark:text-amber-400"
                  />
                  <Metric
                    label="Change vs observed pace"
                    value={`${format(projection.completed - (baseline.weeklyVolume * Number(horizon) * baseline.completionRate) / 100)} tasks`}
                    tone="text-primary"
                  />
                </div>
                <div
                  className="h-64 min-w-0"
                  role="img"
                  aria-label="Cumulative future task completion: observed pace versus your scenario"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={Array.from(
                        { length: Number(horizon) + 1 },
                        (_, week) => ({
                          week,
                          observed:
                            (baseline.weeklyVolume *
                              week *
                              baseline.completionRate) /
                            100,
                          scenario:
                            (Number(volume) * week * Number(rate)) / 100,
                        }),
                      )}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="week"
                        tickFormatter={(v) => `+${v}w`}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v) => format(Number(v))}
                        labelFormatter={(v) => `Future week ${v}`}
                      />
                      <Legend />
                      <Line
                        type="linear"
                        dataKey="observed"
                        isAnimationActive={false}
                        name="Observed pace continued"
                        stroke="#94a3b8"
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line
                        type="linear"
                        dataKey="scenario"
                        isAnimationActive={false}
                        name="Your scenario"
                        stroke="#6d4aff"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground">
                  Expected values may be fractional. Completed = weekly volume ×
                  weeks × completion rate. This models new work only; it does
                  not assume backlog recovery or convert tasks to corporate KPI
                  achievement.
                </p>
              </>
            ) : (
              <p role="alert" className="text-sm text-destructive">
                Enter a non-negative volume, a rate between 0–100%, and a whole
                number of weeks from 1–52.
              </p>
            )}
          </div>
        )}
      </section>
    );
  }
  return (
    <section className="space-y-4" aria-labelledby="task-delivery-trend-title">
      <div className="rounded-2xl border bg-card p-5">
        <h2
          id="task-delivery-trend-title"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <TrendingUp className="size-5 text-primary" />
          Delivery rhythm
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Full-scope totals before pagination. Due-date cohorts show current
          outcomes; they are not an on-time completion measure.
        </p>
        {result.summary.totalTasks === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No approved official tasks in this scope and date range. Try a wider
            range or check task-plan approval. No data is not 0% performance.
          </p>
        ) : (
          <div
            className="mt-5 h-80 min-w-0"
            role="img"
            aria-label="Task outcomes and weighted completion rate by reporting period"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={series.map((row) => ({
                  ...row,
                  rate: row.totalTasks ? row.completionRate : null,
                }))}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="periodStart"
                  tickFormatter={(v: string) => v.slice(5)}
                  minTickGap={25}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="count"
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  width={40}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  width={45}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar
                  yAxisId="count"
                  dataKey="completedTasks"
                  isAnimationActive={false}
                  name="Completed"
                  stackId="outcomes"
                  fill="#10b981"
                  maxBarSize={42}
                />
                <Bar
                  yAxisId="count"
                  dataKey="notDoneTasks"
                  isAnimationActive={false}
                  name="Not done"
                  stackId="outcomes"
                  fill="#f43f5e"
                />
                <Bar
                  yAxisId="count"
                  dataKey="postponedTasks"
                  isAnimationActive={false}
                  name="Postponed"
                  stackId="outcomes"
                  fill="#f59e0b"
                />
                <Bar
                  yAxisId="count"
                  dataKey="cancelledTasks"
                  isAnimationActive={false}
                  name="Cancelled"
                  stackId="outcomes"
                  fill="#94a3b8"
                />
                <Line
                  yAxisId="rate"
                  isAnimationActive={false}
                  type="linear"
                  dataKey="rate"
                  name="Completion %"
                  stroke="#6d4aff"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={series.length < 16}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric
          label="Not done + postponed"
          value={format(
            result.summary.notDoneTasks + result.summary.postponedTasks,
          )}
          detail="Recorded unfinished work in this range; not necessarily overdue."
          tone="text-amber-600 dark:text-amber-400"
        />
        <Metric
          label="Completed per past full week"
          value={baseline ? format(baseline.completed / baseline.weeks) : "—"}
          detail={
            baseline
              ? `${baseline.weeks} complete weeks; includes zero-volume weeks.`
              : "Weekly view, all statuses and 2+ past full weeks required."
          }
          tone="text-primary"
        />
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Recent half vs earlier half
          </p>
          <p
            className={`mt-2 flex items-center gap-2 text-2xl font-semibold ${change == null ? "" : change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
          >
            <ChangeIcon className="size-5" />
            {change == null
              ? "—"
              : `${change > 0 ? "+" : ""}${format(change)} pp`}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Task-weighted rates across complete weeks, not an average of
            employee percentages.
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone}`}>
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
