"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ApproveSubmissionDialog from "./ApproveSubmissionDialog";
import RejectSubmissionDialog from "./RejectSubmissionDialog";
// import ApproveObjectiveWithKPIsDialog from "./ApproveObjectiveWithKPIsDialog";
import { Kpi } from "@/types/graphql";

type KpiSubmission = {
  submissionId: string;
  type: "KPI";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
  submittedBy?: { fullName: string };
  kpi?: {
    kpiId: string;
    name?: string;
    weight?: number;
    baseline?: number | string;
  };
};

export type GroupedSubmission = {
  submissionId: string;
  type: "OBJECTIVE" | "KPI";
  level: "DEPARTMENT" | "DIVISION" | "PERSONNEL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
  submittedBy: {
    employeeId?: string;
    fullName: string;
  };
  objective?: {
    objectiveId: string;
    name?: string;
    type?: string;
    status?: string;
    parent?: { objectiveId: string; name?: string } | null;
    kpis?: Array<{
      kpiId: string;
      name: string;
      status: string;
      weight?: number;
      baseline?: number;
      weightType?: string;
    }>;
  } | null;
  kpi?: {
    kpiId: string;
    name?: string;
    status?: string;
    weight?: number;
    baseline?: number | string;
    objective?: {
      objectiveId: string;
      name?: string;
      type?: string;
    } | null;
  } | null;
  associatedKpiSubmissions?: KpiSubmission[];
  kpiSubmissionCount?: number;
};

interface SubmissionApprovalTableProps {
  submissions: GroupedSubmission[];
  selected: string[];
  onSelect: (submissionId: string) => void;
  onSelectAll: () => void;
  onApproveSubmission: (submissionId: string, reason: string) => Promise<void>;
  onRejectSubmission: (submissionId: string, reason: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  // Complete objective list to resolve parent/child relationships
  allObjectives?: Array<{
    objectiveId: string;
    name?: string;
    parent?: { objectiveId: string; name?: string } | null;
    kpis?: Array<{ kpiId: string; name: string }>;
  }>;
  // Optional: map of parent KPI yearly targets by child KPI id
  strategicTargetsById?: Record<string, Record<string, number>>;
  // All KPIs with targets for parent lookup
  allKpis?: Kpi[];
}

const statusMap = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-600" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-600" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

// type exported above

const SubmissionApprovalTable: React.FC<SubmissionApprovalTableProps> = ({
  submissions,
  selected,
  onSelect,
  onSelectAll,
  onApproveSubmission,
  onRejectSubmission,
  loading = false,
  error,
  allObjectives = [],
  strategicTargetsById = {},
  allKpis = [],
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  // All submissions are objective submissions with nested KPIs
  const objectiveSubmissions = submissions;

  // Debug logging
  console.log("SubmissionApprovalTable Debug:", {
    totalSubmissions: submissions.length,
    objectiveSubmissions: objectiveSubmissions.length,
    objectiveSubmissionsData: objectiveSubmissions,
    // Add more detailed debugging
    objectiveIds: objectiveSubmissions.map((obj) => obj.objective?.objectiveId),
  });

  // Helper function to get KPI submissions for a specific objective
  const getKPISubmissionsForObjective = (submission: GroupedSubmission) => {
    // Use the new associatedKpiSubmissions from the grouped data
    const kpiSubmissions = submission.associatedKpiSubmissions || [];

    console.log(
      `KPI submissions for objective ${submission.objective?.objectiveId}:`,
      {
        objectiveId: submission.objective?.objectiveId,
        foundKPISubmissions: kpiSubmissions.length,
        kpiSubmissionData: kpiSubmissions,
        submission: submission,
      }
    );

    return kpiSubmissions;
  };

  // Resolve strategic (parent) and child objective names for a submission
  const resolveObjectiveNames = (submission: GroupedSubmission) => {
    const childId = submission.objective?.objectiveId;
    const child = allObjectives?.find((o) => o.objectiveId === childId);
    const hasParent = !!child?.parent;
    const strategicName = hasParent
      ? child.parent?.name || "N/A"
      : submission.objective?.name || "N/A";
    const childName = hasParent
      ? submission.objective?.name || "N/A"
      : undefined;
    return { strategicName, childName, hasParent };
  };

  // Helper: aggregate targets into yearly totals
  const getYearlyTotals = (
    targets: Array<{ timeline: string; target: number }> = []
  ) => {
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

    const years = Object.keys(totals).sort(
      (a, b) =>
        parseInt(a.split("/")?.[0] || "0") - parseInt(b.split("/")?.[0] || "0")
    );
    return { years, totals } as const;
  };

  const getQuartersByYear = (
    targets: Array<{ timeline: string; target: number }> = []
  ) => {
    const map: Record<
      string,
      { q1?: number; q2?: number; q3?: number; q4?: number }
    > = {};
    targets.forEach((t) => {
      const [year, quarter] = (t.timeline as string).split("-");
      if (!map[year]) map[year] = {};
      if (quarter) {
        const qn = quarter.toUpperCase();
        if (qn === "Q1") map[year].q1 = Number(t.target || 0);
        if (qn === "Q2") map[year].q2 = Number(t.target || 0);
        if (qn === "Q3") map[year].q3 = Number(t.target || 0);
        if (qn === "Q4") map[year].q4 = Number(t.target || 0);
      }
    });
    const years = Object.keys(map).sort(
      (a, b) =>
        parseInt(a.split("/")?.[0] || "0") - parseInt(b.split("/")?.[0] || "0")
    );
    return { years, map } as const;
  };

  // Calculate if all objective submissions are selected
  const allSelected =
    objectiveSubmissions.length > 0 &&
    objectiveSubmissions.every((obj) => selected.includes(obj.submissionId));

  if (loading) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <p className="text-red-600">Error loading submissions: {error}</p>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <p className="text-gray-600">No submissions found for approval.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-gray-50">
            <TableHead className="px-6 py-4 w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Strategic Objective
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Division/Department/Personal Objective
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted By
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              KPI Submissions
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Level
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </TableHead>
            <TableHead className="px-6 py-4 w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectiveSubmissions.map((obj, idx) => {
            const kpiSubmissions = getKPISubmissionsForObjective(obj);
            // Fallback: if backend nested KPIs directly on objective submission
            const nestedKPIs = obj.objective?.kpis || [];

            const effectiveKpiSubmissions =
              kpiSubmissions.length > 0
                ? kpiSubmissions
                : nestedKPIs.map((k) => ({
                    // Mark as pseudo entries derived from objective.kpis
                    isPseudo: true,
                    submissionId: k.kpiId,
                    status: k.status || obj.status,
                    reason: obj.reason, // Pass the objective's rejection reason to pseudo KPI submissions
                    kpi: k,
                    submittedBy: obj.submittedBy,
                  }));

            const kpiCount = effectiveKpiSubmissions.length;
            const { strategicName, childName, hasParent } =
              resolveObjectiveNames(obj);

            return (
              <React.Fragment key={obj.submissionId}>
                <TableRow
                  className={`border-b border-gray-100 ${
                    selected.includes(obj.submissionId)
                      ? "bg-blue-50"
                      : idx % 2 === 1
                      ? "bg-white"
                      : "bg-[#ECECFF]"
                  } hover:bg-gray-50 transition-colors`}
                >
                  <TableCell
                    className="px-6 py-4 w-12"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.includes(obj.submissionId)}
                      onCheckedChange={() => onSelect(obj.submissionId)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                    <div className="truncate" title={strategicName}>
                      {strategicName}
                    </div>
                    {hasParent && (
                      <div className="text-xs text-gray-500 mt-1">
                        From: Corporate
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                    <div className="truncate" title={childName || "N/A"}>
                      {childName || (hasParent ? "N/A" : strategicName)}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {obj.submittedBy.fullName}
                  </TableCell>
                  <TableCell
                    className="px-6 py-4 text-gray-600 truncate"
                    title={obj.reason}
                  >
                    {obj.reason || "-"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {kpiCount} KPI Submission
                    {kpiCount !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-800 border-gray-200"
                    >
                      {obj.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      className={`${
                        statusMap[obj.status as keyof typeof statusMap]
                          ?.color || "bg-gray-100 text-gray-600"
                      } rounded-full px-3 py-1 text-xs font-medium border-0`}
                    >
                      {statusMap[obj.status as keyof typeof statusMap]?.label ||
                        obj.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {kpiCount > 0 ? (
                          <>
                            {/* TODO: Re-enable bulk objective + KPI approval when backend supports it */}
                            {/* <DropdownMenuItem asChild>
                              <ApproveObjectiveWithKPIsDialog
                                submission={obj}
                                associatedKPIs={nestedKPIs}
                                onApprove={onApproveSubmission}
                              >
                                <div className="text-green-600 hover:bg-green-50 cursor-pointer flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve Objective + KPIs
                                </div>
                              </ApproveObjectiveWithKPIsDialog>
                            </DropdownMenuItem> */}
                            <DropdownMenuItem asChild>
                              <ApproveSubmissionDialog
                                submission={{
                                  submissionId: obj.submissionId,
                                  type: "OBJECTIVE",
                                  level: obj.level,
                                  status: obj.status,
                                  reason: obj.reason || "",
                                  submittedBy: {
                                    employeeId:
                                      obj.submittedBy.employeeId || "",
                                    fullName: obj.submittedBy.fullName,
                                  },
                                  objective: obj.objective
                                    ? {
                                        objectiveId: obj.objective.objectiveId,
                                        name: obj.objective.name || "",
                                        type: obj.objective.type || "",
                                        status:
                                          obj.objective.status || obj.status,
                                      }
                                    : undefined,
                                  createdAt: new Date().toISOString(),
                                }}
                                onApprove={onApproveSubmission}
                              >
                                <div className="text-green-600 hover:bg-green-50 cursor-pointer flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve Objective
                                </div>
                              </ApproveSubmissionDialog>
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem asChild>
                            <ApproveSubmissionDialog
                              submission={{
                                submissionId: obj.submissionId,
                                type: "OBJECTIVE",
                                level: obj.level,
                                status: obj.status,
                                reason: obj.reason || "",
                                submittedBy: {
                                  employeeId: obj.submittedBy.employeeId || "",
                                  fullName: obj.submittedBy.fullName,
                                },
                                objective: obj.objective
                                  ? {
                                      objectiveId: obj.objective.objectiveId,
                                      name: obj.objective.name || "",
                                      type: obj.objective.type || "",
                                      status:
                                        obj.objective.status || obj.status,
                                    }
                                  : undefined,
                                createdAt: new Date().toISOString(),
                              }}
                              onApprove={onApproveSubmission}
                            >
                              <div className="text-green-600 hover:bg-green-50 cursor-pointer flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Objective
                              </div>
                            </ApproveSubmissionDialog>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <RejectSubmissionDialog
                            submission={{
                              submissionId: obj.submissionId,
                              type: "OBJECTIVE",
                              level: obj.level,
                              status: obj.status,
                              reason: obj.reason || "",
                              submittedBy: {
                                employeeId: obj.submittedBy.employeeId || "",
                                fullName: obj.submittedBy.fullName,
                              },
                              objective: obj.objective
                                ? {
                                    objectiveId: obj.objective.objectiveId,
                                    name: obj.objective.name || "",
                                    type: obj.objective.type || "",
                                    status: obj.objective.status || obj.status,
                                  }
                                : undefined,
                              createdAt: new Date().toISOString(),
                            }}
                            onReject={onRejectSubmission}
                          >
                            <div className="text-red-600 hover:bg-red-50 cursor-pointer flex items-center">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject Objective
                            </div>
                          </RejectSubmissionDialog>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="px-6 py-4 w-12">
                    {kpiCount > 0 && (
                      <button
                        onClick={() =>
                          setExpanded(
                            expanded === obj.submissionId
                              ? null
                              : obj.submissionId
                          )
                        }
                        className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                      >
                        {expanded === obj.submissionId ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </TableCell>
                </TableRow>

                {/* KPI Submissions Expanded Section */}
                {expanded === obj.submissionId &&
                  effectiveKpiSubmissions.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="px-0 py-0">
                        <div className="bg-gray-50 border-t border-gray-200">
                          <div className="px-6 py-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                              KPI Submissions
                            </h4>
                            <div className="bg-white rounded-lg border">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50">
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Strategic KPI
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Division/Department/Personal KPI
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Weight (%)
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Baseline
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Targets
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Submitted By
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Status
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Reason
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                      Actions
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {effectiveKpiSubmissions.map(
                                    (kpiSubmission, kpiIdx) => (
                                      <TableRow
                                        key={
                                          kpiSubmission.submissionId || kpiIdx
                                        }
                                        className="border-b"
                                      >
                                        <TableCell className="px-4 py-3 font-medium text-gray-900">
                                          {(() => {
                                            const child = allObjectives.find(
                                              (c) =>
                                                c.objectiveId ===
                                                obj.objective?.objectiveId
                                            );
                                            const parent = child?.parent
                                              ? allObjectives.find(
                                                  (o) =>
                                                    o.objectiveId ===
                                                    child.parent?.objectiveId
                                                )
                                              : undefined;
                                            const parentName =
                                              (parent?.kpis || [])[kpiIdx]
                                                ?.name ||
                                              kpiSubmission.kpi?.name ||
                                              "N/A";
                                            return (
                                              <div
                                                className="truncate"
                                                title={parentName}
                                              >
                                                {parentName}
                                                {parent && (
                                                  <div className="text-xs text-gray-500 mt-1">
                                                    From: Corporate
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 font-medium text-gray-900">
                                          <div
                                            className="truncate"
                                            title={
                                              kpiSubmission.kpi?.name || "N/A"
                                            }
                                          >
                                            {kpiSubmission.kpi?.name || "N/A"}
                                          </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600">
                                          {kpiSubmission.kpi?.weight ?? "N/A"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600">
                                          {kpiSubmission.kpi?.baseline || "N/A"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600">
                                          {(() => {
                                            const childId =
                                              kpiSubmission.kpi?.kpiId || "";
                                            const childKpi = allKpis.find(
                                              (k) => k.kpiId === childId
                                            );
                                            if (!childKpi)
                                              return (
                                                <span className="text-gray-400 italic">
                                                  No targets
                                                </span>
                                              );
                                            if (
                                              kpiSubmission.status ===
                                              "APPROVED"
                                            ) {
                                              const { years, totals } =
                                                getYearlyTotals(
                                                  childKpi.targets
                                                );
                                              if (years.length === 0)
                                                return (
                                                  <span className="text-gray-400 italic">
                                                    No targets
                                                  </span>
                                                );
                                              return (
                                                <div
                                                  className="inline-grid gap-x-6"
                                                  style={{
                                                    gridTemplateColumns: `repeat(${years.length}, minmax(64px, auto))`,
                                                  }}
                                                >
                                                  {years.map((y) => (
                                                    <span
                                                      key={`hdr-${y}`}
                                                      className="text-[10px] text-gray-500 uppercase tracking-wider"
                                                    >
                                                      {y}
                                                    </span>
                                                  ))}
                                                  {years.map((y) => (
                                                    <span
                                                      key={`val-${y}`}
                                                      className="text-gray-900 font-medium mt-1"
                                                    >
                                                      {totals[y]}
                                                    </span>
                                                  ))}
                                                </div>
                                              );
                                            }
                                            // Pending/Not approved: show corporate target and quarters
                                            const byYear =
                                              strategicTargetsById[childId] ||
                                              {};
                                            const { years, map } =
                                              getQuartersByYear(
                                                childKpi.targets
                                              );
                                            if (
                                              years.length === 0 &&
                                              Object.keys(byYear).length === 0
                                            ) {
                                              return (
                                                <span className="text-gray-400 italic">
                                                  No targets
                                                </span>
                                              );
                                            }
                                            const displayYears =
                                              years.length > 0
                                                ? years
                                                : Object.keys(byYear).sort(
                                                    (a, b) =>
                                                      parseInt(
                                                        a.split("/")?.[0] || "0"
                                                      ) -
                                                      parseInt(
                                                        b.split("/")?.[0] || "0"
                                                      )
                                                  );
                                            return (
                                              <div
                                                className="inline-grid gap-x-8"
                                                style={{
                                                  gridTemplateColumns: `repeat(${displayYears.length}, minmax(80px, auto))`,
                                                }}
                                              >
                                                {displayYears.map((y) => {
                                                  const q =
                                                    (
                                                      map as Record<
                                                        string,
                                                        {
                                                          q1?: number;
                                                          q2?: number;
                                                          q3?: number;
                                                          q4?: number;
                                                        }
                                                      >
                                                    )[y] || {};
                                                  const corporate = byYear[y];
                                                  return (
                                                    <div
                                                      key={`col-${y}`}
                                                      className="flex flex-col"
                                                    >
                                                      {/* Year header */}
                                                      <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                                                        {y}
                                                      </span>
                                                      {/* Corporate target */}
                                                      {corporate !==
                                                        undefined && (
                                                        <div className="text-[11px] text-gray-500 mb-2">
                                                          Target:{" "}
                                                          <span className="font-medium">
                                                            {corporate}
                                                          </span>
                                                        </div>
                                                      )}
                                                      {/* Quarters */}
                                                      <div className="flex flex-col gap-1">
                                                        {[
                                                          "Q1",
                                                          "Q2",
                                                          "Q3",
                                                          "Q4",
                                                        ].map((label, idx) => (
                                                          <div
                                                            key={label}
                                                            className="flex items-center justify-between text-xs"
                                                          >
                                                            <span className="text-gray-600 font-medium">
                                                              {label}:
                                                            </span>
                                                            <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700 ml-1">
                                                              {(
                                                                q as Record<
                                                                  string,
                                                                  number
                                                                >
                                                              )[
                                                                `q${idx + 1}`
                                                              ] ?? 0}
                                                            </span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })()}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600">
                                          {kpiSubmission.submittedBy
                                            ?.fullName ||
                                            obj.submittedBy.fullName}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                          <Badge
                                            className={`${
                                              statusMap[
                                                kpiSubmission.status as keyof typeof statusMap
                                              ]?.color ||
                                              "bg-gray-100 text-gray-600"
                                            } rounded-full px-2 py-1 text-xs font-medium border-0`}
                                          >
                                            {statusMap[
                                              kpiSubmission.status as keyof typeof statusMap
                                            ]?.label || kpiSubmission.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                          {kpiSubmission.status ===
                                          "REJECTED" ? (
                                            <div className="max-w-48">
                                              <span className="text-sm text-red-600">
                                                {kpiSubmission.reason?.trim() ||
                                                  "No reason provided"}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400 text-sm">
                                              -
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                          {kpiSubmission.status ===
                                            "APPROVED" ||
                                          kpiSubmission.status ===
                                            "REJECTED" ? (
                                            <div className="flex items-center gap-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled
                                                className="text-gray-400 border-gray-300 h-7 px-2 text-xs cursor-not-allowed"
                                              >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                {kpiSubmission.status ===
                                                "APPROVED"
                                                  ? "Approved"
                                                  : "Approve"}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled
                                                className="text-gray-400 border-gray-300 h-7 px-2 text-xs cursor-not-allowed"
                                              >
                                                <XCircle className="h-3 w-3 mr-1" />
                                                {kpiSubmission.status ===
                                                "REJECTED"
                                                  ? "Rejected"
                                                  : "Reject"}
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <ApproveSubmissionDialog
                                                submission={{
                                                  submissionId:
                                                    kpiSubmission.submissionId,
                                                  type: "KPI",
                                                  level: obj.level,
                                                  status:
                                                    kpiSubmission.status as
                                                      | "PENDING"
                                                      | "APPROVED"
                                                      | "REJECTED",
                                                  reason:
                                                    kpiSubmission.reason || "",
                                                  submittedBy: {
                                                    employeeId:
                                                      obj.submittedBy
                                                        .employeeId || "",
                                                    fullName:
                                                      kpiSubmission.submittedBy
                                                        ?.fullName ||
                                                      obj.submittedBy.fullName,
                                                  },
                                                  kpi: {
                                                    kpiId:
                                                      kpiSubmission.kpi
                                                        ?.kpiId || "",
                                                    name:
                                                      kpiSubmission.kpi?.name ||
                                                      "",
                                                    status:
                                                      kpiSubmission.status as string,
                                                    objective: obj.objective
                                                      ? {
                                                          objectiveId:
                                                            obj.objective
                                                              .objectiveId,
                                                          name:
                                                            obj.objective
                                                              .name || "",
                                                          type:
                                                            obj.objective
                                                              .type || "",
                                                        }
                                                      : undefined,
                                                  },
                                                  createdAt:
                                                    new Date().toISOString(),
                                                }}
                                                onApprove={onApproveSubmission}
                                              >
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="text-green-600 border-green-600 hover:bg-green-50 h-7 px-2 text-xs"
                                                >
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Approve
                                                </Button>
                                              </ApproveSubmissionDialog>
                                              <RejectSubmissionDialog
                                                submission={{
                                                  submissionId:
                                                    kpiSubmission.submissionId,
                                                  type: "KPI",
                                                  level: obj.level,
                                                  status:
                                                    kpiSubmission.status as
                                                      | "PENDING"
                                                      | "APPROVED"
                                                      | "REJECTED",
                                                  reason:
                                                    kpiSubmission.reason || "",
                                                  submittedBy: {
                                                    employeeId:
                                                      obj.submittedBy
                                                        .employeeId || "",
                                                    fullName:
                                                      kpiSubmission.submittedBy
                                                        ?.fullName ||
                                                      obj.submittedBy.fullName,
                                                  },
                                                  kpi: {
                                                    kpiId:
                                                      kpiSubmission.kpi
                                                        ?.kpiId || "",
                                                    name:
                                                      kpiSubmission.kpi?.name ||
                                                      "",
                                                    status:
                                                      kpiSubmission.status as string,
                                                    objective: obj.objective
                                                      ? {
                                                          objectiveId:
                                                            obj.objective
                                                              .objectiveId,
                                                          name:
                                                            obj.objective
                                                              .name || "",
                                                          type:
                                                            obj.objective
                                                              .type || "",
                                                        }
                                                      : undefined,
                                                  },
                                                  createdAt:
                                                    new Date().toISOString(),
                                                }}
                                                onReject={onRejectSubmission}
                                              >
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="text-red-600 border-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                                                >
                                                  <XCircle className="h-3 w-3 mr-1" />
                                                  Reject
                                                </Button>
                                              </RejectSubmissionDialog>
                                            </div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </div>
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
};

export default SubmissionApprovalTable;
