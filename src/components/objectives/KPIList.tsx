"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteKpiDialog from "./DeleteKpiDialog";
import SubmitDialog from "../submissions/SubmitDialog";
import { Kpi } from "@/types/graphql";

interface KPIListProps {
  kpis: Kpi[];
  onEdit: (kpiId: string) => void;
  onRefresh: () => void;
  selected?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  showBulkActions?: boolean;
  strategicKpiNameById?: Record<string, string>;
  // Optional: corporate/parent yearly target by child KPI id and year
  strategicTargetsById?: Record<string, Record<string, number>>;
  // Optional: rejection reasons by KPI id
  kpiRejectionReasons?: Record<string, string>;
  // Optional: child quarters per parent KPI id and year (used at corporate level)
  childQuartersByParentId?: Record<
    string,
    Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>
  >;
}

export default function KPIList({
  kpis,
  onEdit,
  onRefresh,
  selected = [],
  onSelect,
  onSelectAll,
  showBulkActions = false,
  strategicKpiNameById,
  strategicTargetsById,
  kpiRejectionReasons,
  childQuartersByParentId,
}: KPIListProps) {
  const statusColors = {
    NOT_SUBMITTED: "bg-pink-100 text-pink-600",
    PENDING: "bg-yellow-100 text-yellow-600",
    APPROVED: "bg-green-100 text-green-600",
    REJECTED: "bg-red-100 text-red-600",
  };

  const weightTypeLabels = {
    NUMBER: "Number",
    PERCENT: "Percent",
  };

  // Determine if all KPIs belong to a corporate objective
  const isCorporateObjective =
    kpis.length > 0 && kpis.every((kpi) => kpi.objective?.type === "CORPORATE");

  // Show level-specific column only when the objective is NOT corporate
  const showLevelSpecificColumn = !isCorporateObjective;

  // Show reason column only if there are rejected items and not corporate level
  const showReasonColumn =
    !isCorporateObjective && kpis.some((kpi) => kpi.status === "REJECTED");

  // Calculate if all KPIs are selected
  const allSelected =
    showBulkActions &&
    kpis.length > 0 &&
    kpis.every((kpi) => selected.includes(kpi.kpiId));

  // Helper: aggregate targets into yearly totals
  const getYearlyTotals = (targets: Kpi["targets"]) => {
    const totals: Record<string, number> = {};
    const quarterlySums: Record<string, number> = {};
    const yearsWithExplicitTotal: Set<string> = new Set();

    // First, find explicit yearly totals
    for (const t of targets) {
      if (!t.timeline.includes("-")) {
        const year = t.timeline;
        totals[year] = Number(t.target || 0);
        yearsWithExplicitTotal.add(year);
      }
    }

    // Then, sum quarters for years that DON'T have an explicit total
    for (const t of targets) {
      const [year, quarter] = t.timeline.split("-");
      if (quarter && !yearsWithExplicitTotal.has(year)) {
        quarterlySums[year] =
          (quarterlySums[year] || 0) + Number(t.target || 0);
      }
    }

    // Merge the quarterly sums into the main totals object
    for (const year in quarterlySums) {
      if (!totals[year]) {
        totals[year] = quarterlySums[year];
      }
    }

    const years = Object.keys(totals).sort((a, b) => {
      const aNum = parseInt(a.split("/")?.[0] || "0", 10);
      const bNum = parseInt(b.split("/")?.[0] || "0", 10);
      return aNum - bNum;
    });

    return { years, totals } as const;
  };

  // Helper: map quarters per year
  const getQuartersByYear = (targets: Kpi["targets"]) => {
    const qByYear: Record<
      string,
      { q1?: number; q2?: number; q3?: number; q4?: number }
    > = {};
    for (const t of targets) {
      const [year, quarter] = t.timeline.split("-");
      if (!qByYear[year]) qByYear[year] = {};
      if (quarter) {
        const qn = quarter.toUpperCase();
        if (qn === "Q1") qByYear[year].q1 = Number(t.target || 0);
        if (qn === "Q2") qByYear[year].q2 = Number(t.target || 0);
        if (qn === "Q3") qByYear[year].q3 = Number(t.target || 0);
        if (qn === "Q4") qByYear[year].q4 = Number(t.target || 0);
      }
    }
    const years = Object.keys(qByYear).sort((a, b) => {
      const aNum = parseInt(a.split("/")?.[0] || "0", 10);
      const bNum = parseInt(b.split("/")?.[0] || "0", 10);
      return aNum - bNum;
    });
    return { years, qByYear } as const;
  };

  if (kpis.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No KPIs found for this objective.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            {showBulkActions && (
              <TableHead className="px-6 py-3 w-12">
                {onSelectAll && (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onSelectAll}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                )}
              </TableHead>
            )}
            {showLevelSpecificColumn ? (
              <>
                <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Strategic KPI
                </TableHead>
                <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Division/Department/Personal KPI
                </TableHead>
              </>
            ) : (
              <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
                KPI Name
              </TableHead>
            )}
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              Baseline
            </TableHead>
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              Weight (%)
            </TableHead>
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              Targets
            </TableHead>
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              Status
            </TableHead>
            {showReasonColumn && (
              <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
                Reason
              </TableHead>
            )}
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3 w-16">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kpis.map((kpi, idx) => (
            <TableRow
              key={kpi.kpiId}
              className={`border-b border-gray-100 ${
                showBulkActions && selected.includes(kpi.kpiId)
                  ? "bg-blue-50"
                  : idx % 2 === 1
                  ? "bg-white"
                  : "bg-[#ECECFF]"
              } hover:bg-gray-50 transition-colors`}
            >
              {showBulkActions && (
                <TableCell
                  className="px-6 py-4 w-12"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onSelect && (
                    <Checkbox
                      checked={selected.includes(kpi.kpiId)}
                      onCheckedChange={() => onSelect(kpi.kpiId)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  )}
                </TableCell>
              )}
              {showLevelSpecificColumn ? (
                <>
                  <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                    <div
                      className="truncate"
                      title={strategicKpiNameById?.[kpi.kpiId] || kpi.name}
                    >
                      {strategicKpiNameById?.[kpi.kpiId] || kpi.name}
                    </div>
                    {kpi.objective?.type !== "CORPORATE" && (
                      <div className="text-xs text-gray-500 mt-1">
                        From: Department
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                    <div className="truncate" title={kpi.name}>
                      {kpi.name}
                    </div>
                  </TableCell>
                </>
              ) : (
                <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                  <div className="truncate" title={kpi.name}>
                    {kpi.name}
                  </div>
                </TableCell>
              )}

              <TableCell className="px-6 py-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <span>{kpi.baseline}</span>
                  <Badge variant="outline" className="text-xs">
                    {weightTypeLabels[kpi.weightType]}
                  </Badge>
                </div>
              </TableCell>

              <TableCell className="px-6 py-4 text-gray-600">
                {kpi.weight}
              </TableCell>

              <TableCell className="px-6 py-4 text-gray-600">
                {kpi.targets.length > 0 ? (
                  (() => {
                    if (kpi.status === "APPROVED") {
                      // Prefer child quarters from children when viewing corporate parent
                      const corporate = kpi.objective?.type === "CORPORATE";
                      const childQuarters = corporate
                        ? childQuartersByParentId?.[kpi.kpiId] || {}
                        : undefined;
                      const hasChildQuarters =
                        childQuarters && Object.keys(childQuarters).length > 0;
                      const { years, totals } = hasChildQuarters
                        ? (() => {
                            const yrs = Object.keys(childQuarters).sort(
                              (a, b) =>
                                parseInt(a.split("/")?.[0] || "0") -
                                parseInt(b.split("/")?.[0] || "0")
                            );
                            const t: Record<string, number> = {};
                            yrs.forEach((y) => {
                              const q =
                                (
                                  childQuarters as Record<
                                    string,
                                    {
                                      q1?: number;
                                      q2?: number;
                                      q3?: number;
                                      q4?: number;
                                    }
                                  >
                                )[y] || {};
                              t[y] =
                                (q.q1 || 0) +
                                (q.q2 || 0) +
                                (q.q3 || 0) +
                                (q.q4 || 0);
                            });
                            return { years: yrs, totals: t } as const;
                          })()
                        : getYearlyTotals(kpi.targets);
                      const qByYear = hasChildQuarters
                        ? childQuarters
                        : getQuartersByYear(kpi.targets).qByYear;
                      const qYears = Object.keys(qByYear || {});
                      return (
                        <div
                          className="inline-grid gap-x-8"
                          style={{
                            gridTemplateColumns: `repeat(${years.length}, minmax(80px, auto))`,
                          }}
                        >
                          {years.map((y) => {
                            const q =
                              (
                                qByYear as Record<
                                  string,
                                  {
                                    q1?: number;
                                    q2?: number;
                                    q3?: number;
                                    q4?: number;
                                  }
                                >
                              )[y] || {};
                            return (
                              <div key={`col-${y}`} className="flex flex-col">
                                {/* Year header */}
                                <span className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">
                                  {y}
                                </span>
                                {/* Year total */}
                                <span className="text-gray-900 font-medium mb-2">
                                  {totals[y]}
                                </span>
                                {/* Quarters */}
                                {qYears.includes(y) && (
                                  <div className="flex flex-col gap-1">
                                    {(["Q1", "Q2", "Q3", "Q4"] as const).map(
                                      (label, idx) => (
                                        <div
                                          key={label}
                                          className="flex items-center justify-between text-xs"
                                        >
                                          <span className="text-gray-600 font-medium">
                                            {label}:
                                          </span>
                                          <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700 ml-1">
                                            {(q as Record<string, number>)[
                                              `q${idx + 1}`
                                            ] ?? 0}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    // Pending/not-submitted: show quarterly breakdown per year (no aggregation yet)
                    const { years: quarterYears, qByYear } = getQuartersByYear(
                      kpi.targets
                    );
                    const { years: yearlyYears, totals } = getYearlyTotals(
                      kpi.targets
                    );

                    // Check if this KPI has quarterly breakdown or yearly totals
                    const hasQuarters = quarterYears.length > 0;
                    const hasYearly = yearlyYears.length > 0;

                    if (hasQuarters) {
                      // Show quarterly breakdown for inherited KPIs
                      return (
                        <div
                          className="inline-grid gap-x-8"
                          style={{
                            gridTemplateColumns: `repeat(${quarterYears.length}, minmax(160px, auto))`,
                          }}
                        >
                          {quarterYears.map((y) => (
                            <span
                              key={`hdr-${y}`}
                              className="text-gray-400 text-xs font-medium tracking-wider uppercase"
                            >
                              {y}
                            </span>
                          ))}
                          {quarterYears.map((y) => {
                            const q = qByYear[y] || {};
                            const chips = [
                              { label: "Q1", value: q.q1 ?? 0 },
                              { label: "Q2", value: q.q2 ?? 0 },
                              { label: "Q3", value: q.q3 ?? 0 },
                              { label: "Q4", value: q.q4 ?? 0 },
                            ];
                            const corporate =
                              strategicTargetsById?.[kpi.kpiId]?.[y];
                            return (
                              <div
                                key={`val-${y}`}
                                className="mt-1 flex flex-col gap-1.5"
                              >
                                {corporate !== undefined && (
                                  <div className="text-[11px] text-gray-500">
                                    Target:{" "}
                                    <span className="font-medium">
                                      {corporate}
                                    </span>
                                  </div>
                                )}
                                {chips.map((c) => (
                                  <span
                                    key={c.label}
                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                                  >
                                    {c.label}: {c.value}
                                  </span>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else if (hasYearly) {
                      // Show simple yearly targets for corporate KPIs
                      return (
                        <div className="flex flex-wrap gap-2">
                          {yearlyYears.map((y) => (
                            <span
                              key={y}
                              className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700"
                            >
                              {y}: {totals[y]}
                            </span>
                          ))}
                        </div>
                      );
                    } else {
                      // Fallback for edge cases
                      return (
                        <span className="text-gray-400 italic">
                          No targets configured
                        </span>
                      );
                    }
                  })()
                ) : (
                  <span className="text-gray-400 italic">No targets set</span>
                )}
              </TableCell>

              <TableCell className="px-6 py-4">
                <Badge
                  className={`${
                    statusColors[kpi.status]
                  } rounded-full px-3 py-1 text-xs font-medium border-0`}
                >
                  {kpi.status.replace("_", " ")}
                </Badge>
              </TableCell>

              {showReasonColumn && (
                <TableCell className="px-6 py-4">
                  {kpi.status === "REJECTED" ? (
                    <div className="max-w-48">
                      <span className="text-sm text-red-600 italic">
                        {kpiRejectionReasons?.[kpi.kpiId] ||
                          "No reason provided"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
              )}

              <TableCell className="px-6 py-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit(kpi.kpiId)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {/* Submit option - only show if KPI is not already submitted and not for a corporate objective */}
                    {kpi.status === "NOT_SUBMITTED" &&
                      kpi.objective &&
                      kpi.objective.type !== "CORPORATE" && (
                        <>
                          <DropdownMenuSeparator />
                          <SubmitDialog
                            itemId={kpi.kpiId}
                            itemName={kpi.name}
                            objectiveType={kpi.objective.type}
                            itemType="kpi"
                            onSubmitSuccess={() => {
                              console.log(
                                "🔄 KPI submission success callback triggered for KPI:",
                                {
                                  kpiId: kpi.kpiId,
                                  kpiName: kpi.name,
                                  objective: kpi.objective,
                                  status: kpi.status,
                                }
                              );
                              onRefresh();
                            }}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                              Submit for Approval
                            </DropdownMenuItem>
                          </SubmitDialog>
                        </>
                      )}
                    <DropdownMenuSeparator />
                    <DeleteKpiDialog
                      kpiId={kpi.kpiId}
                      kpiName={kpi.name}
                      onDeleteSuccess={onRefresh}
                    >
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 hover:text-red-700"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DeleteKpiDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
