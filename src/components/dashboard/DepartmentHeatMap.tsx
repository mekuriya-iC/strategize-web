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
            className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-violet-500/5 to-card px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="break-words text-base font-semibold">
                    {division.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {division.departments.length} department
                    {division.departments.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-xl font-semibold tabular-nums ${tone.text}`}
                >
                  {hasResults
                    ? `${division.averageScore.toFixed(1)}%`
                    : "Pending"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Division average
                </p>
              </div>
            </div>
            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {division.departments.map((dept) => {
                const available = dept.employeeCount > 0;
                const style = scoreStyle(dept.averageScore, available);
                return (
                  <button
                    key={dept.departmentId}
                    type="button"
                    onClick={() => onDepartmentClick?.(dept.departmentId)}
                    disabled={!onDepartmentClick}
                    className="group min-w-0 rounded-xl border border-border bg-card p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="min-w-0 break-words text-sm font-semibold leading-relaxed">
                        {dept.name}
                      </h4>
                      {onDepartmentClick && (
                        <ArrowUpRight className="size-4 shrink-0 text-primary/60 transition-colors group-hover:text-primary" />
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
                      <p
                        className={`text-2xl font-semibold tracking-tight tabular-nums ${style.text}`}
                      >
                        {available
                          ? `${dept.averageScore.toFixed(1)}%`
                          : "Pending"}
                      </p>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${style.surface} ${style.text}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <Progress
                      className="mt-3 h-1.5"
                      value={
                        available
                          ? Math.min(Math.max(dept.averageScore, 0), 100)
                          : 0
                      }
                      fillColor={style.fill}
                      trackColor={`${style.fill}18`}
                    />
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      {dept.employeeCount} employee result
                      {dept.employeeCount === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
              {division.departments.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">
                  No departments available in this division.
                </p>
              )}
            </div>
          </section>
        );
      })}
      <div
        className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground"
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
              className="size-2 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
