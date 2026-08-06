"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Layers3,
  Minus,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildOrganizationComparison,
  type DivisionComparisonGroup,
  type OrganizationComparisonUnit,
  type PerformanceStatus,
} from "@/lib/dashboard/dashboardAnalytics";
import type { KpiQuarterPerformanceReport } from "@/types/graphql";

interface Props {
  report: KpiQuarterPerformanceReport;
}

const statusColors: Record<PerformanceStatus, string> = {
  "On track": "#10b981",
  "Close to target": "#f59e0b",
  "Needs attention": "#f43f5e",
};

const statusSoftColors: Record<PerformanceStatus, string> = {
  "On track": "#10b98122",
  "Close to target": "#f59e0b22",
  "Needs attention": "#f43f5e22",
};

function formatPts(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} pts`;
}

function DeltaChip({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.05) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />
        At corporate
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
      }`}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {formatPts(delta)}
    </span>
  );
}

function CorporateGauge({
  achievement,
  kpiCount,
  finalCount,
  provisionalCount,
  pendingCount,
}: {
  achievement: number;
  kpiCount: number;
  finalCount: number;
  provisionalCount: number;
  pendingCount: number;
}) {
  const status =
    achievement >= 100
      ? ("On track" as const)
      : achievement >= 75
        ? ("Close to target" as const)
        : ("Needs attention" as const);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(achievement, 0), 100) / 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Target className="h-4 w-4 text-muted-foreground" />
          Corporate achievement
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-4">
        <div className="relative h-[148px] w-[148px]">
          <svg viewBox="0 0 148 148" className="h-full w-full -rotate-90">
            <circle
              cx="74"
              cy="74"
              r={radius}
              fill="none"
              strokeWidth="11"
              className="stroke-muted"
            />
            <circle
              cx="74"
              cy="74"
              r={radius}
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              stroke={statusColors[status]}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {achievement.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              of annual target
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className="border-transparent"
          style={{
            color: statusColors[status],
            backgroundColor: statusSoftColors[status],
          }}
        >
          {status}
        </Badge>

        <div className="grid w-full grid-cols-3 gap-2 text-center">
          {[
            { label: "KPIs", value: kpiCount },
            { label: "Final", value: finalCount },
            {
              label: "In progress",
              value: provisionalCount + pendingCount,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-muted/50 px-2 py-2">
              <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChartDatum extends OrganizationComparisonUnit {
  kind: "Division" | "Department";
}

function ComparisonTooltip({
  active,
  payload,
  corporateAchievement,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  corporateAchievement: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2.5 text-popover-foreground shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{item.kind}</p>
      <p className="text-sm font-semibold">{item.name}</p>
      <div className="mt-2 space-y-1 text-xs tabular-nums">
        <p className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Achievement</span>
          <span className="font-semibold">{item.achievement.toFixed(1)}%</span>
        </p>
        <p className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Corporate</span>
          <span>{corporateAchievement.toFixed(1)}%</span>
        </p>
        <p className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Difference</span>
          <span
            className={
              item.delta >= 0
                ? "font-medium text-emerald-600 dark:text-emerald-400"
                : "font-medium text-rose-600 dark:text-rose-400"
            }
          >
            {formatPts(item.delta)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">KPIs</span>
          <span>{item.kpiCount}</span>
        </p>
      </div>
    </div>
  );
}

function ComparisonChart({
  data,
  corporateAchievement,
}: {
  data: ChartDatum[];
  corporateAchievement: number;
}) {
  const maxValue = Math.max(
    100,
    corporateAchievement,
    ...data.map((item) => item.achievement),
  );

  return (
    <div style={{ height: Math.max(220, data.length * 42 + 30) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="currentColor"
            className="text-border"
            opacity={0.6}
          />
          <XAxis
            type="number"
            domain={[0, Math.ceil(maxValue / 10) * 10]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={132}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={
              <ComparisonTooltip corporateAchievement={corporateAchievement} />
            }
            cursor={{ fill: "currentColor", opacity: 0.06 }}
          />
          <ReferenceLine
            x={corporateAchievement}
            stroke="#64748b"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            label={{
              value: `Corporate ${corporateAchievement.toFixed(1)}%`,
              position: "top",
              fontSize: 10,
              fill: "#64748b",
            }}
          />
          <Bar dataKey="achievement" radius={[4, 6, 6, 4]} barSize={20}>
            {data.map((item) => (
              <Cell key={item.id} fill={statusColors[item.status]} fillOpacity={0.9} />
            ))}
            <LabelList
              dataKey="achievement"
              position="right"
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              style={{ fontSize: 11, fontWeight: 600 }}
              className="fill-foreground"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DepartmentRow({
  department,
}: {
  department: OrganizationComparisonUnit;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium">{department.name}</p>
          <span className="shrink-0 text-xs font-semibold tabular-nums">
            {department.achievement.toFixed(1)}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.min(Math.max(department.achievement, 0), 100)}%`,
              backgroundColor: statusColors[department.status],
            }}
          />
        </div>
      </div>
      <div className="w-[86px] shrink-0 text-right">
        <DeltaChip delta={department.delta} />
      </div>
    </div>
  );
}

function DivisionGroupCard({
  division,
  corporateAchievement,
}: {
  division: DivisionComparisonGroup;
  corporateAchievement: number;
}) {
  const clamped = Math.min(Math.max(division.achievement, 0), 100);
  const corporateMark = Math.min(Math.max(corporateAchievement, 0), 100);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{division.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {division.kpiCount} KPI{division.kpiCount === 1 ? "" : "s"}
            {division.pendingCount > 0
              ? ` · ${division.pendingCount} awaiting final results`
              : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="text-xl font-bold tabular-nums tracking-tight"
            style={{ color: statusColors[division.status] }}
          >
            {division.achievement.toFixed(1)}%
          </p>
          <DeltaChip delta={division.delta} />
        </div>
      </div>

      {/* Division progress with corporate benchmark tick */}
      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${clamped}%`,
            backgroundColor: statusColors[division.status],
          }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-500 dark:bg-slate-300"
          style={{ left: `${corporateMark}%` }}
          title={`Corporate ${corporateAchievement.toFixed(1)}%`}
        />
      </div>

      {division.departments.length > 0 && (
        <div className="mt-4 space-y-3 border-t pt-3">
          {division.departments.map((department) => (
            <DepartmentRow key={department.id} department={department} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminOrganizationPerformance({ report }: Props) {
  const comparison = buildOrganizationComparison(report);
  const { corporateAchievement, divisions, ungroupedDepartments } = comparison;

  if (divisions.length === 0 && ungroupedDepartments.length === 0) return null;

  const chartData: ChartDatum[] = [
    ...divisions.map((division) => ({
      ...division,
      kind: "Division" as const,
    })),
    ...ungroupedDepartments.map((department) => ({
      ...department,
      kind: "Department" as const,
    })),
  ];

  return (
    <section
      className="space-y-4"
      aria-labelledby="organization-rollup-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3
            id="organization-rollup-heading"
            className="text-base font-semibold"
          >
            Organization achievement
          </h3>
          <p className="text-sm text-muted-foreground">
            Every division and department measured side by side against the
            corporate result.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {(
            [
              ["On track", "≥100%"],
              ["Close to target", "75–99%"],
              ["Needs attention", "<75%"],
            ] as Array<[PerformanceStatus, string]>
          ).map(([status, range]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: statusColors[status] }}
              />
              {status} {range}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CorporateGauge
          achievement={corporateAchievement}
          kpiCount={report.summary.kpiCount}
          finalCount={report.summary.finalCount}
          provisionalCount={report.summary.provisionalCount}
          pendingCount={report.summary.pendingResultCount}
        />

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Layers3 className="h-4 w-4 text-muted-foreground" />
              Divisions vs corporate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No division rollups are available yet.
              </p>
            ) : (
              <div className="max-h-[430px] overflow-y-auto pr-1">
                <ComparisonChart
                  data={chartData}
                  corporateAchievement={corporateAchievement}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(divisions.length > 0 || ungroupedDepartments.length > 0) && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">
              Division and department breakdown
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {divisions.map((division) => (
              <DivisionGroupCard
                key={division.id}
                division={division}
                corporateAchievement={corporateAchievement}
              />
            ))}
            {ungroupedDepartments.length > 0 && (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold">Other departments</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Departments without a division-level rollup.
                </p>
                <div className="mt-4 space-y-3">
                  {ungroupedDepartments.map((department) => (
                    <DepartmentRow
                      key={department.id}
                      department={department}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
