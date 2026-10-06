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
  Area,
  AreaChart,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  FlaskConical,
  Minus,
  TrendingUp,
  Activity,
  Zap,
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
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 16,
  padding: "12px 16px",
  boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.2)",
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
    <section className="space-y-6" aria-labelledby="task-delivery-trend-title">
      {/* Main Chart Card */}
      <div className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
        {/* Subtle gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-violet-500/[0.02]" />
        
        <div className="relative p-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2
                id="task-delivery-trend-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Latest results
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Full-scope totals before pagination
              </p>
            </div>
            <button className="group/btn rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground">
              <svg className="size-5 transition-transform group-hover/btn:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          {result.summary.totalTasks === 0 ? (
            <div className="my-20 text-center">
              <div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30">
                <Activity className="size-12 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-foreground">
                No approved official tasks in this scope
              </p>
              <p className="mt-2 text-sm text-muted-foreground/70">
                Try a wider date range or check task-plan approval
              </p>
            </div>
          ) : (
            <>
              {/* Enhanced Legend */}
              <div className="mb-6 flex flex-wrap items-center gap-6">
                <div className="group/legend flex items-center gap-2.5 transition-opacity hover:opacity-70">
                  <div className="relative size-3">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-[#6d4aff]/30 blur-sm" />
                    <div className="relative size-3 rounded-full bg-gradient-to-br from-[#6d4aff] to-[#5838d4]" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Completed</span>
                </div>
                <div className="group/legend flex items-center gap-2.5 transition-opacity hover:opacity-70">
                  <div className="relative size-3">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-[#ff9f43]/30 blur-sm" />
                    <div className="relative size-3 rounded-full bg-gradient-to-br from-[#ff9f43] to-[#ff8c2e]" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Not done</span>
                </div>
                <div className="group/legend flex items-center gap-2.5 transition-opacity hover:opacity-70">
                  <div className="relative size-3">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-[#ffc107]/30 blur-sm" />
                    <div className="relative size-3 rounded-full bg-gradient-to-br from-[#ffc107] to-[#f0b400]" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Postponed</span>
                </div>
                <div className="group/legend flex items-center gap-2.5 transition-opacity hover:opacity-70">
                  <div className="size-3 rounded-full bg-gradient-to-br from-border to-muted" />
                  <span className="text-sm font-medium text-muted-foreground">Cancelled</span>
                </div>
              </div>

              {/* Enhanced Chart */}
              <div
                className="h-80 min-w-0 rounded-2xl bg-gradient-to-br from-background/80 to-muted/20 p-6 backdrop-blur-sm"
                role="img"
                aria-label="Task outcomes by reporting period"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={series.map((row) => ({
                      ...row,
                      rate: row.totalTasks ? row.completionRate : null,
                    }))}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      {/* Enhanced gradients with multiple stops */}
                      <linearGradient id="completedBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6d4aff" stopOpacity={1} />
                        <stop offset="50%" stopColor="#5e3ce6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#5838d4" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="notDoneBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff9f43" stopOpacity={1} />
                        <stop offset="50%" stopColor="#ff9538" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#ff8c2e" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="postponedBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffc107" stopOpacity={1} />
                        <stop offset="50%" stopColor="#f5b800" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#f0b400" stopOpacity={0.9} />
                      </linearGradient>
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
                      </filter>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="0"
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      dataKey="periodStart"
                      tickFormatter={(v: string) => v.slice(5)}
                      minTickGap={30}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="count"
                      allowDecimals={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <YAxis
                      yAxisId="rate"
                      orientation="right"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip 
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.05, radius: 8 }}
                    />
                    <Bar
                      yAxisId="count"
                      dataKey="completedTasks"
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                      name="Completed"
                      stackId="outcomes"
                      fill="url(#completedBar)"
                      maxBarSize={36}
                      radius={[10, 10, 0, 0]}
                    />
                    <Bar
                      yAxisId="count"
                      dataKey="notDoneTasks"
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                      name="Not done"
                      stackId="outcomes"
                      fill="url(#notDoneBar)"
                      radius={[10, 10, 0, 0]}
                    />
                    <Bar
                      yAxisId="count"
                      dataKey="postponedTasks"
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                      name="Postponed"
                      stackId="outcomes"
                      fill="url(#postponedBar)"
                      radius={[10, 10, 0, 0]}
                    />
                    <Bar
                      yAxisId="count"
                      dataKey="cancelledTasks"
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                      name="Cancelled"
                      stackId="outcomes"
                      fill="hsl(var(--muted))"
                      fillOpacity={0.6}
                      radius={[10, 10, 0, 0]}
                    />
                    <Line
                      yAxisId="rate"
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-in-out"
                      type="monotone"
                      dataKey="rate"
                      name="Completion %"
                      stroke="#6d4aff"
                      strokeWidth={3}
                      connectNulls={false}
                      dot={false}
                      activeDot={{ 
                        r: 6, 
                        fill: "#6d4aff",
                        stroke: "#fff",
                        strokeWidth: 2.5,
                        filter: "url(#shadow)"
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Enhanced Stats Cards with Premium Circular Progress */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Card 1: Not done + postponed */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#ff9f43]/20">
          {/* Subtle gradient background */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ff9f43]/[0.02] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-muted-foreground">Latest results</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Not done + postponed
              </p>
              <p className="mt-5 text-4xl font-bold tracking-tight text-foreground transition-transform duration-300 group-hover:scale-105">
                {format(
                  result.summary.notDoneTasks + result.summary.postponedTasks,
                )}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Unfinished tasks
              </p>
            </div>
            <div className="relative flex size-24 flex-shrink-0 items-center justify-center">
              {/* Glow effect */}
              <div className="absolute inset-0 animate-pulse rounded-full bg-[#ff9f43]/10 blur-xl" />
              
              {/* Progress ring */}
              <svg className="size-24 -rotate-90 transform transition-transform duration-300 group-hover:rotate-[-85deg]">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="hsl(var(--muted))"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#orangeGradient)"
                  strokeWidth="7"
                  fill="none"
                  strokeDasharray={`${((result.summary.notDoneTasks + result.summary.postponedTasks) / Math.max(result.summary.totalTasks, 1)) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(255, 159, 67, 0.3))'
                  }}
                />
                <defs>
                  <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff9f43" />
                    <stop offset="100%" stopColor="#ff8c2e" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-foreground">
                  {Math.round(
                    ((result.summary.notDoneTasks + result.summary.postponedTasks) /
                      Math.max(result.summary.totalTasks, 1)) *
                      100,
                  )}
                  <span className="text-xs">%</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Completed per week */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#ffc107]/20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ffc107]/[0.02] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-muted-foreground">Latest results</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {baseline ? "Per full week" : "Baseline"}
              </p>
              <p className="mt-5 text-4xl font-bold tracking-tight text-foreground transition-transform duration-300 group-hover:scale-105">
                {baseline ? format(baseline.completed / baseline.weeks) : "—"}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {baseline
                  ? `${baseline.weeks} complete weeks`
                  : "Need weekly view"}
              </p>
            </div>
            <div className="relative flex size-24 flex-shrink-0 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-[#ffc107]/10 blur-xl" />
              
              <svg className="size-24 -rotate-90 transform transition-transform duration-300 group-hover:rotate-[-85deg]">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="hsl(var(--muted))"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#yellowGradient)"
                  strokeWidth="7"
                  fill="none"
                  strokeDasharray={`${baseline ? (baseline.completionRate / 100) * 251.2 : 0} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(255, 193, 7, 0.3))'
                  }}
                />
                <defs>
                  <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffc107" />
                    <stop offset="100%" stopColor="#f0b400" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-foreground">
                  {baseline ? `${Math.round(baseline.completionRate)}` : "—"}
                  {baseline && <span className="text-xs">%</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-muted-foreground">Latest results</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Recent vs earlier
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div
                  className={`flex size-12 items-center justify-center rounded-xl transition-all duration-300 ${
                    change == null
                      ? "bg-muted"
                      : change >= 0
                        ? "bg-emerald-500/10 group-hover:bg-emerald-500/15"
                        : "bg-rose-500/10 group-hover:bg-rose-500/15"
                  }`}
                >
                  <ChangeIcon
                    className={`size-6 transition-transform duration-300 group-hover:scale-110 ${
                      change == null
                        ? "text-muted-foreground"
                        : change >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                    }`}
                  />
                </div>
                <p
                  className={`text-2xl font-bold transition-all duration-300 group-hover:scale-105 ${
                    change == null
                      ? "text-foreground"
                      : change >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {change == null
                    ? "—"
                    : `${change > 0 ? "+" : ""}${format(change)}`}
                  {change != null && <span className="text-sm">pp</span>}
                </p>
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Task-weighted rates
              </p>
            </div>
            <div className="relative flex size-24 flex-shrink-0 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
              
              <svg className="size-24 -rotate-90 transform transition-transform duration-300 group-hover:rotate-[-85deg]">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="hsl(var(--muted))"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#purpleGradient)"
                  strokeWidth="7"
                  fill="none"
                  strokeDasharray={`${result.summary.completionRate * 2.512} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(109, 74, 255, 0.3))'
                  }}
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6d4aff" />
                    <stop offset="100%" stopColor="#5838d4" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-foreground">
                  {Math.round(result.summary.completionRate)}
                  <span className="text-xs">%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: "amber" | "primary";
  icon?: React.ReactNode;
}) {
  const toneClasses = {
    amber: {
      bg: "from-amber-500/10 to-orange-500/10",
      border: "border-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/20",
    },
    primary: {
      bg: "from-primary/10 to-violet-500/10",
      border: "border-primary/20",
      text: "text-primary",
      iconBg: "bg-primary/20",
    },
  };

  const colors = toneClasses[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-5 shadow-sm transition-all duration-300 hover:shadow-md`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {icon && <span className={`flex size-7 items-center justify-center rounded-lg ${colors.iconBg}`}>{icon}</span>}
          {label}
        </p>
        <p className={`mt-3 text-3xl font-bold tabular-nums transition-colors duration-300 ${colors.text}`}>
          {value}
        </p>
        {detail && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{detail}</p>
        )}
      </div>
    </div>
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
