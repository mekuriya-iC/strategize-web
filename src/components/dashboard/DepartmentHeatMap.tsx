"use client";

import { ArrowUpRight, Building2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Department {
  departmentId: string;
  name: string;
  averageScore: number;
  employeeCount: number;
}
interface Division {
  divisionId: string;
  name: string;
  averageScore: number;
  departments: Department[];
}
interface DepartmentHeatMapProps {
  divisions: Division[];
  loading?: boolean;
  onDepartmentClick?: (departmentId: string) => void;
}

function scoreStyle(score: number, hasResults = true) {
  if (!hasResults)
    return {
      label: "Awaiting data",
      text: "text-muted-foreground",
      fill: "#94a3b8",
      surface: "bg-muted/30",
    };
  if (score >= 85)
    return {
      label: "Exceptional",
      text: "text-emerald-700 dark:text-emerald-300",
      fill: "#10b981",
      surface: "bg-emerald-500/10",
    };
  if (score >= 70)
    return {
      label: "Good",
      text: "text-primary",
      fill: "#6366f1",
      surface: "bg-primary/10",
    };
  if (score >= 60)
    return {
      label: "Fair",
      text: "text-amber-700 dark:text-amber-300",
      fill: "#f59e0b",
      surface: "bg-amber-500/10",
    };
  return {
    label: "Needs support",
    text: "text-red-700 dark:text-red-300",
    fill: "#ef4444",
    surface: "bg-red-500/10",
  };
}

export function DepartmentHeatMap({
  divisions,
  loading = false,
  onDepartmentClick,
}: DepartmentHeatMapProps) {
  if (loading)
    return (
      <div
        role="status"
        className="space-y-4 rounded-xl border border-primary/15 bg-card p-5"
      >
        <p className="text-sm text-muted-foreground">
          Loading department performance…
        </p>
        <div className="grid animate-pulse gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-36 rounded-xl bg-primary/10" />
          ))}
        </div>
      </div>
    );
  if (divisions.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-10 text-center">
        <Building2 className="mx-auto mb-3 size-8 text-primary" />
        <p className="font-medium">No department data available</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Department results will appear here when available in your scope.
        </p>
      </div>
    );
  return (
    <div className="space-y-5 text-foreground [--muted-foreground:#526175] dark:[--muted-foreground:#a8b4c5] dark:[--primary:#a5a5ff]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Select a department to explore its people and performance.
        </p>
        <Badge
          variant="outline"
          className="border-primary/20 bg-primary/5 text-primary"
        >
          {divisions.length} division{divisions.length === 1 ? "" : "s"}
        </Badge>
      </div>
      {divisions.map((division) => {
        const hasResults = division.departments.some(
          (dept) => dept.employeeCount > 0,
        );
        const tone = scoreStyle(division.averageScore, hasResults);
        return (
          <section
            key={division.divisionId}
            aria-label={division.name}
            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/90"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="break-words text-base font-bold text-slate-900 dark:text-zinc-100">
                    {division.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                    {division.departments.length} department
                    {division.departments.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-extrabold tabular-nums ${tone.text}`}
                >
                  {hasResults
                    ? `${division.averageScore.toFixed(1)}%`
                    : "Pending"}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Division average
                </p>
              </div>
            </div>
            <div className="grid gap-3.5 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              {division.departments.map((dept) => {
                const available = dept.employeeCount > 0;
                const style = scoreStyle(dept.averageScore, available);
                return (
                  <button
                    key={dept.departmentId}
                    type="button"
                    onClick={() => onDepartmentClick?.(dept.departmentId)}
                    disabled={!onDepartmentClick}
                    className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4.5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md dark:border-white/[0.06] dark:bg-zinc-900/80 dark:hover:border-indigo-400/40 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="min-w-0 break-words text-sm font-bold leading-snug text-slate-900 dark:text-zinc-100">
                        {dept.name}
                      </h4>
                      {onDepartmentClick && (
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600 dark:text-zinc-500 dark:group-hover:text-indigo-400" />
                      )}
                    </div>
                    <div className="mt-3.5 flex flex-wrap items-end justify-between gap-2">
                      <p
                        className={`text-2xl font-extrabold tracking-tight tabular-nums ${style.text}`}
                      >
                        {available
                          ? `${dept.averageScore.toFixed(1)}%`
                          : "Pending"}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.surface} ${style.text}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <Progress
                      className="mt-3 h-1.5 rounded-full"
                      value={
                        available
                          ? Math.min(Math.max(dept.averageScore, 0), 100)
                          : 0
                      }
                      fillColor={style.fill}
                      trackColor={`${style.fill}18`}
                    />
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
                      <Users className="h-3.5 w-3.5" />
                      {dept.employeeCount} employee result
                      {dept.employeeCount === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
              {division.departments.length === 0 && (
                <p className="py-6 text-center text-sm font-medium text-slate-500 dark:text-zinc-400 sm:col-span-2 xl:col-span-3">
                  No departments available in this division.
                </p>
              )}
            </div>
          </section>
        );
      })}
      <div
        className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-3 text-xs font-medium text-slate-600 dark:border-white/[0.08] dark:bg-zinc-900/60 dark:text-zinc-400"
        aria-label="People performance legend"
      >
        {[
          { label: "Exceptional ≥85%", fill: "#10b981" },
          { label: "Good 70–84%", fill: "#6366f1" },
          { label: "Fair 60–69%", fill: "#f59e0b" },
          { label: "Needs support <60%", fill: "#ef4444" },
          { label: "Awaiting data", fill: "#94a3b8" },
        ].map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shadow-xs"
              style={{ backgroundColor: item.fill }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

