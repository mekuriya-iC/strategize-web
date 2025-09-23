"use client";
import React, { useState } from "react";
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
import {
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import { useUser } from "@/context/UserContext";

interface KPIListProps {
  kpis: Kpi[];
  onEdit: (kpiId: string) => void;
  onRefresh: () => void;
  selected?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  showBulkActions?: boolean;
  // Optional: corporate/parent yearly target by child KPI id and year
  strategicTargetsById?: Record<string, Record<string, number>>;
  // Optional: rejection reasons by KPI id
  kpiRejectionReasons?: Record<string, string>;
  // Optional: child quarters per parent KPI id and year (used at corporate level)
  childQuartersByParentId?: Record<
    string,
    Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>
  >;
  // Optional: current objective for determining column headers
  currentObjective?: {
    type: string;
    parent?: {
      type: string;
      name: string;
    } | null;
  } | null;
  // Optional: all KPIs for finding child KPIs in expandable structure
  allKpis?: Kpi[];
}

export default function KPIList({
  kpis,
  onEdit,
  onRefresh,
  selected = [],
  onSelect,
  onSelectAll,
  showBulkActions = false,
  strategicTargetsById,
  kpiRejectionReasons,
  childQuartersByParentId,
  currentObjective,
  allKpis = kpis,
}: KPIListProps) {
  console.log("🚀 KPIList component received:", {
    kpisCount: kpis.length,
    strategicTargetsById,
    hasStrategicTargets: !!strategicTargetsById,
    strategicTargetsKeys: strategicTargetsById
      ? Object.keys(strategicTargetsById)
      : [],
  });
  const { user } = useUser();
  const [expandedKPIs, setExpandedKPIs] = useState<Set<string>>(new Set());

  const toggleExpanded = (kpiId: string) => {
    setExpandedKPIs((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(kpiId)) {
        newSet.delete(kpiId);
      } else {
        newSet.add(kpiId);
      }
      return newSet;
    });
  };

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

  console.log(kpis);
  console.log("KPIList Debug - First KPI parent:", kpis[0]?.parent);
  console.log(
    "KPIList Debug - All KPIs parent fields:",
    kpis.map((k) => ({ kpiId: k.kpiId, name: k.name, parent: k.parent }))
  );

  // Function to determine column headers based on organizational level
  const getColumnHeaders = () => {
    // Check if all KPIs belong to a corporate objective
    const allCorporate =
      kpis.length > 0 &&
      kpis.every((kpi) => kpi.objective?.type === "CORPORATE");

    // For corporate level (admin/super admin), hide second column
    if (
      allCorporate ||
      user?.role === "ADMIN" ||
      user?.role === "SUPER_ADMIN"
    ) {
      return {
        firstColumn: "CORPORATE KPI",
        secondColumn: null, // Hidden for corporate level
        showSecondColumn: false,
      };
    }

    // Check if we have mixed levels or specific levels
    const hasDivision = kpis.some((kpi) => kpi.objective?.type === "DIVISION");
    const hasDepartment = kpis.some(
      (kpi) => kpi.objective?.type === "DEPARTMENT"
    );
    const hasPersonnel = kpis.some(
      (kpi) => kpi.objective?.type === "PERSONNEL"
    );

    if (hasDivision && !hasDepartment && !hasPersonnel) {
      return {
        firstColumn: "CORPORATE KPI",
        secondColumn: "DIVISION KPI",
        showSecondColumn: true,
      };
    }

    if (hasDepartment && !hasPersonnel) {
      // Use current objective information to determine parent type
      if (currentObjective?.parent?.type === "DIVISION") {
        return {
          firstColumn: "DIVISION KPI",
          secondColumn: "DEPARTMENT KPI",
          showSecondColumn: true,
        };
      } else {
        return {
          firstColumn: "CORPORATE KPI",
          secondColumn: "DEPARTMENT KPI",
          showSecondColumn: true,
        };
      }
    }

    if (hasPersonnel) {
      return {
        firstColumn: "DEPARTMENT KPI",
        secondColumn: "PERSONAL KPI",
        showSecondColumn: true,
      };
    }

    // Default fallback
    return {
      firstColumn: "STRATEGIC KPI",
      secondColumn: "DIVISION/DEPARTMENT/PERSONAL KPI",
      showSecondColumn: true,
    };
  };

  const columnHeaders = getColumnHeaders();

  // Function to get content for first column based on KPI type and column header
  const getFirstColumnContent = (kpi: Kpi) => {
    // First priority: show parent KPI name if available (for child KPIs)
    if (kpi.parent) {
      return kpi.parent.name;
    }

    // Second priority: show KPI name if no parent (standalone KPIs)
    if (!kpi.name || kpi.name.trim() === "") {
      return "Please add name";
    }

    return kpi.name;
  };

  // Function to get content for second column based on KPI type and column header
  const getSecondColumnContent = (kpi: Kpi) => {
    // If it's a standalone corporate KPI (no parent), show "N/A"
    if (kpi.objective?.type === "CORPORATE" && !kpi.parent) {
      return "N/A";
    }

    // For all other KPIs (including assigned ones), show the KPI name
    if (!kpi.name || kpi.name.trim() === "") {
      return "Please add name";
    }

    return kpi.name;
  };

  // Function to get "From:" text for first column
  const getFromText = (kpi: Kpi) => {
    if (kpi.objective?.type === "CORPORATE") {
      return null; // No "From:" text for corporate KPIs
    }

    // Fallback based on current objective type
    if (kpi.objective?.type) {
      switch (kpi.objective.type) {
        case "DIVISION":
          return "From: Corporate";
        case "DEPARTMENT":
          return "From: Division";
        case "PERSONNEL":
          return "From: Department";
        default:
          return null;
      }
    }

    return null;
  };

  // Determine if all KPIs belong to a corporate objective
  const isCorporateObjective =
    kpis.length > 0 && kpis.every((kpi) => kpi.objective?.type === "CORPORATE");

  // Show level-specific column only when the objective is NOT corporate and user is not admin/super admin
  const showLevelSpecificColumn =
    !isCorporateObjective &&
    columnHeaders.showSecondColumn &&
    user?.role !== "ADMIN" &&
    user?.role !== "SUPER_ADMIN";

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

  // Helper: calculate remaining target allocation for division KPIs sharing the same parent
  const getRemainingTargets = (currentKpi: Kpi) => {
    // Only calculate for division KPIs that have a parent
    if (
      currentKpi.objective?.type !== "DIVISION" ||
      !currentKpi.parent?.kpiId
    ) {
      return null;
    }

    const parentKpiId = currentKpi.parent.kpiId;

    // Get parent KPI's total targets
    const parentTargets = strategicTargetsById?.[parentKpiId] || {};

    if (Object.keys(parentTargets).length === 0) {
      return null;
    }

    // Find all division KPIs from the SAME DIVISION that share the same parent
    // This ensures each division gets the full target independently
    const currentDivisionId = currentKpi.objective?.objectiveId;
    const sameDivisionSiblingKPIs = kpis.filter(
      (kpi) =>
        kpi.parent?.kpiId === parentKpiId &&
        kpi.objective?.type === "DIVISION" &&
        kpi.objective?.objectiveId === currentDivisionId
    );

    // Calculate total allocated by siblings from the SAME DIVISION only
    const totalAllocated: Record<string, number> = {};
    sameDivisionSiblingKPIs.forEach((siblingKpi) => {
      const siblingTargets = getYearlyTotals(siblingKpi.targets).totals;
      Object.keys(siblingTargets).forEach((year) => {
        totalAllocated[year] =
          (totalAllocated[year] || 0) + siblingTargets[year];
      });
    });

    // Debug logging for target allocation
    console.log("🎯 Target Allocation Debug:", {
      currentKpiId: currentKpi.kpiId,
      currentKpiName: currentKpi.name,
      currentDivisionId,
      parentKpiId,
      parentTargets,
      sameDivisionSiblingKPIs: sameDivisionSiblingKPIs.map((k) => ({
        id: k.kpiId,
        name: k.name,
      })),
      totalAllocated,
    });

    // Calculate remaining targets (parent target minus total allocated by same division siblings)
    const remainingTargets: Record<string, number> = {};
    Object.keys(parentTargets).forEach((year) => {
      const parentTarget = parentTargets[year] || 0;
      const allocated = totalAllocated[year] || 0;
      remainingTargets[year] = Math.max(0, parentTarget - allocated);
    });

    return remainingTargets;
  };

  // Helper: get current KPI's allocated targets
  const getCurrentKpiAllocation = (currentKpi: Kpi) => {
    if (
      currentKpi.objective?.type !== "DIVISION" ||
      !currentKpi.parent?.kpiId
    ) {
      return null;
    }

    return getYearlyTotals(currentKpi.targets).totals;
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
                  {columnHeaders.firstColumn}
                </TableHead>
                <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
                  {columnHeaders.secondColumn}
                </TableHead>
              </>
            ) : (
              <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
                {columnHeaders.firstColumn}
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
          {kpis.map((kpi, idx) => {
            const isExpanded = expandedKPIs.has(kpi.kpiId);
            const childKPIs =
              kpi.objective?.type === "CORPORATE"
                ? allKpis.filter(
                    (k) =>
                      k.parent?.kpiId === kpi.kpiId &&
                      k.objective?.type === "DIVISION"
                  )
                : kpi.objective?.type === "DIVISION"
                ? allKpis.filter(
                    (k) =>
                      k.parent?.kpiId === kpi.kpiId &&
                      k.objective?.type === "DEPARTMENT"
                  )
                : kpi.objective?.type === "DEPARTMENT"
                ? allKpis.filter(
                    (k) =>
                      k.parent?.kpiId === kpi.kpiId &&
                      k.objective?.type === "PERSONNEL"
                  )
                : [];

            // Debug logging for expandable KPIs
            if (
              kpi.objective?.type === "CORPORATE" ||
              kpi.objective?.type === "DIVISION" ||
              kpi.objective?.type === "DEPARTMENT"
            ) {
              console.log(`🔍 ${kpi.objective?.type} KPI Debug:`, {
                kpiId: kpi.kpiId,
                kpiName: kpi.name,
                childKPIsCount: childKPIs.length,
                allKpisCount: allKpis.length,
                childKPIs: childKPIs.map((c) => ({
                  id: c.kpiId,
                  name: c.name,
                  type: c.objective?.type,
                })),
              });
            }

            return (
              <React.Fragment key={kpi.kpiId}>
                <TableRow
                  className={`border-b border-gray-100 ${
                    showBulkActions && selected.includes(kpi.kpiId)
                      ? "bg-blue-50"
                      : idx % 2 === 1
                      ? "bg-white"
                      : "bg-[#ECECFF]"
                  } hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => onEdit(kpi.kpiId)}
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
                          title={getFirstColumnContent(kpi)}
                        >
                          {getFirstColumnContent(kpi)}
                        </div>
                        {getFromText(kpi) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {getFromText(kpi)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                        <div
                          className="truncate"
                          title={getSecondColumnContent(kpi)}
                        >
                          {getSecondColumnContent(kpi) === "N/A" ? (
                            <span className="text-gray-400 italic text-sm">
                              N/A
                            </span>
                          ) : (
                            getSecondColumnContent(kpi)
                          )}
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                      <div
                        className="truncate"
                        title={getFirstColumnContent(kpi)}
                      >
                        {getFirstColumnContent(kpi)}
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>{kpi.baseline}</span>
                      <Badge variant="outline" className="text-xs">
                        {weightTypeLabels[kpi.unitType]}
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
                          // For corporate KPIs, always show their own targets
                          // For child KPIs, show child quarters if available
                          const corporate = kpi.objective?.type === "CORPORATE";
                          const childQuarters = !corporate
                            ? childQuartersByParentId?.[kpi.kpiId] || {}
                            : undefined;
                          const hasChildQuarters =
                            childQuarters &&
                            Object.keys(childQuarters).length > 0;
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
                                  <div
                                    key={`col-${y}`}
                                    className="flex flex-col"
                                  >
                                    {/* Year header */}
                                    <span className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-1">
                                      {y}
                                    </span>
                                    {/* Year total */}
                                    <div className="flex flex-col gap-1 mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-900 font-medium">
                                          {Number(totals[y]).toFixed(1)}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {weightTypeLabels[kpi.unitType]}
                                        </Badge>
                                      </div>
                                      {/* Show corporate target reference for division KPIs */}
                                      {(() => {
                                        const isDivision =
                                          kpi.objective?.type === "DIVISION";
                                        const hasParentKpiId =
                                          kpi.parent?.kpiId;

                                        console.log(
                                          "🔍 Checking corporate target condition:",
                                          {
                                            kpiName: kpi.name,
                                            objectiveType: kpi.objective?.type,
                                            hasParent: !!kpi.parent,
                                            parentKpiId: hasParentKpiId || null,
                                            isDivision,
                                            hasParentKpiId: !!hasParentKpiId,
                                          }
                                        );
                                        return isDivision && hasParentKpiId;
                                      })() &&
                                        (() => {
                                          const corporateTarget = kpi.parent
                                            ?.kpiId
                                            ? strategicTargetsById?.[
                                                kpi.parent.kpiId
                                              ]?.[y]
                                            : undefined;

                                          console.log(
                                            "🔍 Corporate target debug:",
                                            {
                                              kpiName: kpi.name,
                                              kpiId: kpi.kpiId,
                                              parentKpiId: kpi.parent?.kpiId,
                                              year: y,
                                              strategicTargetsById:
                                                strategicTargetsById,
                                              corporateTarget,
                                              isDefined:
                                                corporateTarget !== undefined,
                                            }
                                          );

                                          // Removed Corporate Target display to clean up the table
                                          // if (corporateTarget !== undefined) {
                                          //   return (
                                          //     <div className="text-[11px] text-gray-500">
                                          //       <span className="text-gray-400">
                                          //         Corporate Target:
                                          //       </span>{" "}
                                          //       <span className="font-medium text-purple-600">
                                          //         {corporateTarget}
                                          //       </span>
                                          //     </div>
                                          //   );
                                          // }
                                          return null;
                                        })()}
                                      {/* Show sum of child targets for corporate KPIs */}
                                      {kpi.objective?.type === "CORPORATE" &&
                                        (() => {
                                          console.log(
                                            "🔍 Calculating child sum for:",
                                            {
                                              kpiId: kpi.kpiId,
                                              kpiName: kpi.name,
                                              year: y,
                                              childQuartersByParentId:
                                                childQuartersByParentId?.[
                                                  kpi.kpiId
                                                ]?.[y],
                                              allKpis: kpis.map((k) => ({
                                                kpiId: k.kpiId,
                                                name: k.name,
                                                parentId: k.parent?.kpiId,
                                                objectiveType:
                                                  k.objective?.type,
                                                targets: k.targets,
                                              })),
                                            }
                                          );

                                          // Calculate total child sum for this year
                                          let childSum = 0;

                                          // Find all child KPIs for this corporate KPI
                                          const childKPIs = allKpis.filter(
                                            (k) =>
                                              k.parent?.kpiId === kpi.kpiId &&
                                              k.objective?.type !== "CORPORATE"
                                          );

                                          console.log(
                                            "👥 Found child KPIs for corporate KPI:",
                                            {
                                              corporateKpiId: kpi.kpiId,
                                              corporateKpiName: kpi.name,
                                              year: y,
                                              childKPIs: childKPIs.map((k) => ({
                                                kpiId: k.kpiId,
                                                name: k.name,
                                                targets: k.targets,
                                              })),
                                            }
                                          );

                                          // Sum up all child KPI targets for this year
                                          childKPIs.forEach((childKpi) => {
                                            childKpi.targets.forEach(
                                              (target) => {
                                                if (target.timeline === y) {
                                                  const targetValue = Number(
                                                    target.target || 0
                                                  );
                                                  childSum += targetValue;
                                                  console.log(
                                                    "📈 Added child target:",
                                                    {
                                                      childKpiName:
                                                        childKpi.name,
                                                      target: target.timeline,
                                                      value: targetValue,
                                                      runningSum: childSum,
                                                    }
                                                  );
                                                }
                                              }
                                            );
                                          });

                                          console.log(
                                            "🎯 Final child sum for year",
                                            y,
                                            ":",
                                            childSum
                                          );

                                          if (childSum > 0) {
                                            return (
                                              <div className="text-[11px] text-gray-500">
                                                <span className="text-gray-400">
                                                  Child Sum:
                                                </span>{" "}
                                                <span className="font-medium text-blue-600">
                                                  {childSum}
                                                </span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                    </div>
                                    {/* Quarters - only show for non-corporate KPIs */}
                                    {qYears.includes(y) &&
                                      kpi.objective?.type !== "CORPORATE" && (
                                        <div className="flex flex-col gap-1">
                                          {/* Calculate quarterly sum */}
                                          {(() => {
                                            const q1 =
                                              (q as Record<string, number>)[
                                                "q1"
                                              ] ?? 0;
                                            const q2 =
                                              (q as Record<string, number>)[
                                                "q2"
                                              ] ?? 0;
                                            const q3 =
                                              (q as Record<string, number>)[
                                                "q3"
                                              ] ?? 0;
                                            const q4 =
                                              (q as Record<string, number>)[
                                                "q4"
                                              ] ?? 0;
                                            const quarterlySum =
                                              q1 + q2 + q3 + q4;

                                            return (
                                              <>
                                                {/* Quarterly sum display */}
                                                <div className="flex items-center gap-1 mb-1">
                                                  <span className="text-gray-600 font-medium text-xs">
                                                    Sum:
                                                  </span>
                                                  <div className="flex items-center gap-1">
                                                    <span className="inline-flex items-center rounded-md bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-medium text-green-700">
                                                      {quarterlySum}
                                                    </span>
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      {
                                                        weightTypeLabels[
                                                          kpi.unitType
                                                        ]
                                                      }
                                                    </Badge>
                                                  </div>
                                                </div>
                                                {/* Individual quarters - horizontal display */}
                                                <div className="flex flex-wrap gap-1">
                                                  {q1 > 0 && (
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                      Q1: {q1}
                                                    </span>
                                                  )}
                                                  {q2 > 0 && (
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                      Q2: {q2}
                                                    </span>
                                                  )}
                                                  {q3 > 0 && (
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                      Q3: {q3}
                                                    </span>
                                                  )}
                                                  {q4 > 0 && (
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                      Q4: {q4}
                                                    </span>
                                                  )}
                                                </div>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        // Pending/not-submitted: show quarterly breakdown per year (no aggregation yet)
                        const { years: quarterYears, qByYear } =
                          getQuartersByYear(kpi.targets);
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
                                  {
                                    label: "Q1",
                                    value: Number(q.q1 ?? 0).toFixed(1),
                                  },
                                  {
                                    label: "Q2",
                                    value: Number(q.q2 ?? 0).toFixed(1),
                                  },
                                  {
                                    label: "Q3",
                                    value: Number(q.q3 ?? 0).toFixed(1),
                                  },
                                  {
                                    label: "Q4",
                                    value: Number(q.q4 ?? 0).toFixed(1),
                                  },
                                ];
                                // Removed unused corporate variable
                                return (
                                  <div
                                    key={`val-${y}`}
                                    className="mt-1 flex flex-col gap-1.5"
                                  >
                                    {/* Removed Corporate Target display to clean up the table */}
                                    {/* Show allocation status for division KPIs sharing the same parent */}
                                    {(() => {
                                      const remainingTargets =
                                        getRemainingTargets(kpi);
                                      const currentAllocation =
                                        getCurrentKpiAllocation(kpi);

                                      if (
                                        remainingTargets &&
                                        currentAllocation
                                      ) {
                                        const year = y;
                                        const remaining =
                                          remainingTargets[year];
                                        const allocated =
                                          currentAllocation[year] || 0;

                                        if (remaining !== undefined) {
                                          return (
                                            <div className="flex flex-col gap-1">
                                              {allocated > 0 && (
                                                <div className="text-[11px] text-blue-600 font-medium">
                                                  Allocated: {allocated}
                                                </div>
                                              )}
                                              {remaining > 0 ? (
                                                <div className="text-[11px] text-green-600 font-medium">
                                                  Available: {remaining}
                                                </div>
                                              ) : (
                                                <div className="text-[11px] text-orange-600 font-medium">
                                                  Fully allocated
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                    <div className="flex flex-wrap gap-1">
                                      {chips.map((c) => (
                                        <span
                                          key={c.label}
                                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                                        >
                                          {c.label}: {c.value}
                                        </span>
                                      ))}
                                    </div>
                                    {/* Show sum of quarters */}
                                    {(() => {
                                      const q1 = q.q1 ?? 0;
                                      const q2 = q.q2 ?? 0;
                                      const q3 = q.q3 ?? 0;
                                      const q4 = q.q4 ?? 0;
                                      const quarterlySum = q1 + q2 + q3 + q4;

                                      if (quarterlySum > 0) {
                                        return (
                                          <div className="text-[11px] text-gray-500">
                                            <span className="text-gray-400">
                                              Sum:
                                            </span>{" "}
                                            <span className="font-medium text-green-600">
                                              {Number(quarterlySum).toFixed(1)}
                                            </span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        } else if (hasYearly) {
                          // Show simple yearly targets for corporate KPIs
                          return (
                            <div className="flex flex-wrap gap-2">
                              {yearlyYears.map((y) => {
                                const remainingTargets =
                                  getRemainingTargets(kpi);
                                const remaining = remainingTargets?.[y];
                                return (
                                  <div key={y} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700">
                                        {y}: {Number(totals[y]).toFixed(1)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {weightTypeLabels[
                                          kpi.unitType as keyof typeof weightTypeLabels
                                        ] || "Unknown"}
                                      </Badge>
                                    </div>
                                    {/* Show corporate target reference for division KPIs */}
                                    {/* Removed Corporate Target display to clean up the table */}
                                    {/* Show allocation status for division KPIs sharing the same parent */}
                                    {(() => {
                                      const remainingTargets =
                                        getRemainingTargets(kpi);
                                      const currentAllocation =
                                        getCurrentKpiAllocation(kpi);

                                      if (
                                        remainingTargets &&
                                        currentAllocation
                                      ) {
                                        const allocated =
                                          currentAllocation[y] || 0;

                                        if (remaining !== undefined) {
                                          return (
                                            <div className="flex flex-col gap-1">
                                              {allocated > 0 && (
                                                <div className="text-[11px] text-blue-600 font-medium">
                                                  Allocated:{" "}
                                                  {Number(allocated).toFixed(1)}
                                                </div>
                                              )}
                                              {remaining > 0 ? (
                                                <div className="text-[11px] text-green-600 font-medium">
                                                  Available:{" "}
                                                  {Number(remaining).toFixed(1)}
                                                </div>
                                              ) : (
                                                <div className="text-[11px] text-orange-600 font-medium">
                                                  Fully allocated
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                );
                              })}
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
                      <span className="text-gray-400 italic">
                        No targets set
                      </span>
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

                  <TableCell
                    className="px-6 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      {/* Expand/Collapse button for corporate, division, and department KPIs */}
                      {(kpi.objective?.type === "CORPORATE" ||
                        kpi.objective?.type === "DIVISION" ||
                        kpi.objective?.type === "DEPARTMENT") &&
                        (childKPIs.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(kpi.kpiId);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No children
                          </span>
                        ))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded child KPIs */}
                {isExpanded && childKPIs.length > 0 && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={8} className="px-6 py-4">
                      <div className="bg-white rounded-lg p-4 border ml-8">
                        <h4 className="font-medium mb-3 text-gray-900">
                          {kpi.objective?.type === "CORPORATE"
                            ? "Division KPIs"
                            : kpi.objective?.type === "DIVISION"
                            ? "Department KPIs"
                            : "Personal KPIs"}
                        </h4>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  {kpi.objective?.type === "CORPORATE"
                                    ? "Division KPI"
                                    : kpi.objective?.type === "DIVISION"
                                    ? "Department KPI"
                                    : "Personal KPI"}
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Weight
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Baseline
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Targets
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {childKPIs.map((childKpi, childIdx) => {
                                // Find department KPIs that are children of this division KPI (only if parent is corporate)
                                // or personal KPIs that are children of this department KPI (only if parent is division)
                                const nestedChildKPIs =
                                  kpi.objective?.type === "CORPORATE"
                                    ? allKpis.filter(
                                        (k) =>
                                          k.objective?.type === "DEPARTMENT" &&
                                          k.parent?.kpiId === childKpi.kpiId
                                      )
                                    : kpi.objective?.type === "DIVISION"
                                    ? allKpis.filter(
                                        (k) =>
                                          k.objective?.type === "PERSONNEL" &&
                                          k.parent?.kpiId === childKpi.kpiId
                                      )
                                    : [];

                                const isExpanded = expandedKPIs.has(
                                  childKpi.kpiId
                                );

                                return (
                                  <React.Fragment key={childKpi.kpiId}>
                                    <tr
                                      className={
                                        childIdx % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-50"
                                      }
                                    >
                                      <td className="py-2 px-3 font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                          {kpi.objective?.type ===
                                            "CORPORATE" &&
                                            nestedChildKPIs.length > 0 && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() =>
                                                  toggleExpanded(childKpi.kpiId)
                                                }
                                              >
                                                {isExpanded ? (
                                                  <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                  <ChevronRight className="h-4 w-4" />
                                                )}
                                              </Button>
                                            )}
                                          {childKpi.name}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <span>{childKpi.weight}</span>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {weightTypeLabels[
                                              childKpi.unitType as keyof typeof weightTypeLabels
                                            ] || "Unknown"}
                                          </Badge>
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <span>{childKpi.baseline}</span>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {weightTypeLabels[
                                              childKpi.unitType as keyof typeof weightTypeLabels
                                            ] || "Unknown"}
                                          </Badge>
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-gray-600">
                                        {childKpi.targets &&
                                        childKpi.targets.length > 0 ? (
                                          <div className="flex flex-col gap-1">
                                            {/* Calculate and show quarterly sum */}
                                            {(() => {
                                              // Group targets by year and calculate quarterly sums
                                              const targetsByYear: Record<
                                                string,
                                                {
                                                  q1: number;
                                                  q2: number;
                                                  q3: number;
                                                  q4: number;
                                                }
                                              > = {};

                                              childKpi.targets.forEach(
                                                (target) => {
                                                  // Check if this is a quarterly target
                                                  if (
                                                    target.timeline.includes(
                                                      "-Q"
                                                    )
                                                  ) {
                                                    const [yearPart, quarter] =
                                                      target.timeline.split(
                                                        "-Q"
                                                      );
                                                    const quarterNum =
                                                      parseInt(quarter);

                                                    if (
                                                      quarterNum >= 1 &&
                                                      quarterNum <= 4
                                                    ) {
                                                      // Initialize the year object if it doesn't exist
                                                      if (
                                                        !targetsByYear[yearPart]
                                                      ) {
                                                        targetsByYear[
                                                          yearPart
                                                        ] = {
                                                          q1: 0,
                                                          q2: 0,
                                                          q3: 0,
                                                          q4: 0,
                                                        };
                                                      }

                                                      // Set the quarter value
                                                      targetsByYear[yearPart][
                                                        `q${quarterNum}` as keyof (typeof targetsByYear)[typeof yearPart]
                                                      ] = Number(
                                                        target.target || 0
                                                      );
                                                    }
                                                  }
                                                }
                                              );

                                              return Object.entries(
                                                targetsByYear
                                              ).map(([year, quarters]) => {
                                                const quarterlySum =
                                                  quarters.q1 +
                                                  quarters.q2 +
                                                  quarters.q3 +
                                                  quarters.q4;

                                                return (
                                                  <div
                                                    key={year}
                                                    className="flex flex-col gap-1"
                                                  >
                                                    {/* Quarterly sum */}
                                                    <div className="flex items-center gap-1">
                                                      <div className="flex items-center gap-1">
                                                        <span className="inline-flex items-center rounded-md bg-green-50 border border-green-200 px-2 py-1 text-xs font-medium text-green-700">
                                                          Sum: {quarterlySum}
                                                        </span>
                                                        <Badge
                                                          variant="outline"
                                                          className="text-xs"
                                                        >
                                                          {weightTypeLabels[
                                                            childKpi.unitType as keyof typeof weightTypeLabels
                                                          ] || "Unknown"}
                                                        </Badge>
                                                      </div>
                                                    </div>
                                                    {/* Individual quarters */}
                                                    <div className="flex flex-wrap gap-1">
                                                      {quarters.q1 > 0 && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                          {year}-Q1:{" "}
                                                          {quarters.q1}
                                                        </span>
                                                      )}
                                                      {quarters.q2 > 0 && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                          {year}-Q2:{" "}
                                                          {quarters.q2}
                                                        </span>
                                                      )}
                                                      {quarters.q3 > 0 && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                          {year}-Q3:{" "}
                                                          {quarters.q3}
                                                        </span>
                                                      )}
                                                      {quarters.q4 > 0 && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                          {year}-Q4:{" "}
                                                          {quarters.q4}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              });
                                            })()}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 italic text-xs">
                                            No targets
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3">
                                        <Badge
                                          className={`${
                                            statusColors[childKpi.status]
                                          } rounded-full px-2 py-1 text-xs font-medium border-0`}
                                        >
                                          {childKpi.status.replace("_", " ")}
                                        </Badge>
                                      </td>
                                    </tr>

                                    {/* Expanded nested child KPIs - show for division KPIs under corporate or department KPIs under division */}
                                    {(kpi.objective?.type === "CORPORATE" ||
                                      kpi.objective?.type === "DIVISION") &&
                                      isExpanded &&
                                      nestedChildKPIs.length > 0 && (
                                        <tr className="bg-gray-50">
                                          <td colSpan={4} className="px-6 py-4">
                                            <div className="bg-white rounded-lg p-4 border ml-8">
                                              <h5 className="font-medium mb-3 text-gray-900">
                                                {kpi.objective?.type ===
                                                "CORPORATE"
                                                  ? "Department KPIs"
                                                  : "Personal KPIs"}
                                              </h5>
                                              <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                  <thead>
                                                    <tr className="border-b">
                                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                                        {kpi.objective?.type ===
                                                        "CORPORATE"
                                                          ? "Department KPI"
                                                          : "Personal KPI"}
                                                      </th>
                                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                                        Weight
                                                      </th>
                                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                                        Baseline
                                                      </th>
                                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                                        Targets
                                                      </th>
                                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                                        Status
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {nestedChildKPIs.map(
                                                      (
                                                        nestedKpi,
                                                        nestedIdx
                                                      ) => (
                                                        <tr
                                                          key={nestedKpi.kpiId}
                                                          className={
                                                            nestedIdx % 2 === 0
                                                              ? "bg-white"
                                                              : "bg-gray-50"
                                                          }
                                                        >
                                                          <td className="py-2 px-3 font-medium text-gray-900">
                                                            {nestedKpi.name}
                                                          </td>
                                                          <td className="py-2 px-3 text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                              <span>
                                                                {
                                                                  nestedKpi.weight
                                                                }
                                                              </span>
                                                              <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                              >
                                                                {weightTypeLabels[
                                                                  nestedKpi.unitType as keyof typeof weightTypeLabels
                                                                ] || "Unknown"}
                                                              </Badge>
                                                            </div>
                                                          </td>
                                                          <td className="py-2 px-3 text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                              <span>
                                                                {
                                                                  nestedKpi.baseline
                                                                }
                                                              </span>
                                                              <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                              >
                                                                {weightTypeLabels[
                                                                  nestedKpi.unitType as keyof typeof weightTypeLabels
                                                                ] || "Unknown"}
                                                              </Badge>
                                                            </div>
                                                          </td>
                                                          <td className="py-2 px-3 text-gray-600">
                                                            {nestedKpi.targets &&
                                                            nestedKpi.targets
                                                              .length > 0 ? (
                                                              <div className="flex flex-col gap-1">
                                                                {/* Calculate and show quarterly sum */}
                                                                {(() => {
                                                                  // Group targets by year and calculate quarterly sums
                                                                  const targetsByYear: Record<
                                                                    string,
                                                                    {
                                                                      q1: number;
                                                                      q2: number;
                                                                      q3: number;
                                                                      q4: number;
                                                                    }
                                                                  > = {};

                                                                  nestedKpi.targets.forEach(
                                                                    (
                                                                      target
                                                                    ) => {
                                                                      // Check if this is a quarterly target
                                                                      if (
                                                                        target.timeline.includes(
                                                                          "-Q"
                                                                        )
                                                                      ) {
                                                                        const [
                                                                          yearPart,
                                                                          quarter,
                                                                        ] =
                                                                          target.timeline.split(
                                                                            "-Q"
                                                                          );
                                                                        const quarterNum =
                                                                          parseInt(
                                                                            quarter
                                                                          );

                                                                        if (
                                                                          quarterNum >=
                                                                            1 &&
                                                                          quarterNum <=
                                                                            4
                                                                        ) {
                                                                          // Initialize the year object if it doesn't exist
                                                                          if (
                                                                            !targetsByYear[
                                                                              yearPart
                                                                            ]
                                                                          ) {
                                                                            targetsByYear[
                                                                              yearPart
                                                                            ] =
                                                                              {
                                                                                q1: 0,
                                                                                q2: 0,
                                                                                q3: 0,
                                                                                q4: 0,
                                                                              };
                                                                          }

                                                                          // Set the quarter value
                                                                          targetsByYear[
                                                                            yearPart
                                                                          ][
                                                                            `q${quarterNum}` as keyof (typeof targetsByYear)[typeof yearPart]
                                                                          ] =
                                                                            Number(
                                                                              target.target ||
                                                                                0
                                                                            );
                                                                        }
                                                                      }
                                                                    }
                                                                  );

                                                                  return Object.entries(
                                                                    targetsByYear
                                                                  ).map(
                                                                    ([
                                                                      year,
                                                                      quarters,
                                                                    ]) => {
                                                                      const quarterlySum =
                                                                        quarters.q1 +
                                                                        quarters.q2 +
                                                                        quarters.q3 +
                                                                        quarters.q4;

                                                                      return (
                                                                        <div
                                                                          key={
                                                                            year
                                                                          }
                                                                          className="flex flex-col gap-1"
                                                                        >
                                                                          {/* Quarterly sum */}
                                                                          <div className="flex items-center gap-1">
                                                                            <div className="flex items-center gap-1">
                                                                              <span className="inline-flex items-center rounded-md bg-green-50 border border-green-200 px-2 py-1 text-xs font-medium text-green-700">
                                                                                Sum:{" "}
                                                                                {
                                                                                  quarterlySum
                                                                                }
                                                                              </span>
                                                                              <Badge
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                              >
                                                                                {weightTypeLabels[
                                                                                  nestedKpi.unitType as keyof typeof weightTypeLabels
                                                                                ] ||
                                                                                  "Unknown"}
                                                                              </Badge>
                                                                            </div>
                                                                          </div>
                                                                          {/* Individual quarters */}
                                                                          <div className="flex flex-wrap gap-1">
                                                                            {quarters.q1 >
                                                                              0 && (
                                                                              <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                                                {
                                                                                  year
                                                                                }
                                                                                -Q1:{" "}
                                                                                {
                                                                                  quarters.q1
                                                                                }
                                                                              </span>
                                                                            )}
                                                                            {quarters.q2 >
                                                                              0 && (
                                                                              <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                                                {
                                                                                  year
                                                                                }
                                                                                -Q2:{" "}
                                                                                {
                                                                                  quarters.q2
                                                                                }
                                                                              </span>
                                                                            )}
                                                                            {quarters.q3 >
                                                                              0 && (
                                                                              <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                                                {
                                                                                  year
                                                                                }
                                                                                -Q3:{" "}
                                                                                {
                                                                                  quarters.q3
                                                                                }
                                                                              </span>
                                                                            )}
                                                                            {quarters.q4 >
                                                                              0 && (
                                                                              <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700">
                                                                                {
                                                                                  year
                                                                                }
                                                                                -Q4:{" "}
                                                                                {
                                                                                  quarters.q4
                                                                                }
                                                                              </span>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                      );
                                                                    }
                                                                  );
                                                                })()}
                                                              </div>
                                                            ) : (
                                                              <span className="text-gray-400 italic text-xs">
                                                                No targets
                                                              </span>
                                                            )}
                                                          </td>
                                                          <td className="py-2 px-3">
                                                            <Badge
                                                              className={`${
                                                                statusColors[
                                                                  nestedKpi
                                                                    .status
                                                                ]
                                                              } rounded-full px-2 py-1 text-xs font-medium border-0`}
                                                            >
                                                              {nestedKpi.status.replace(
                                                                "_",
                                                                " "
                                                              )}
                                                            </Badge>
                                                          </td>
                                                        </tr>
                                                      )
                                                    )}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
