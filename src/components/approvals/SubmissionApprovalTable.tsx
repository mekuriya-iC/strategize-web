"use client";

import React, { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Target,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApproveSubmissionDialog from "./ApproveSubmissionDialog";
import RejectSubmissionDialog from "./RejectSubmissionDialog";
import ApproveObjectiveWithKPIsDialog from "./ApproveObjectiveWithKPIsDialog";
import { Kpi } from "@/types/graphql";
import { useAuthStore } from "@/stores";
import { useQuery } from "@apollo/client";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import usePermissions from "@/hooks/permissions/usePermissions";
import { canUserApproveSubmission } from "@/lib/objectives/cascadeApproval";

type KpiSubmission = {
  submissionId: string;
  type: "KPI";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
  submittedBy?: { fullName: string };
  objective?: {
    objectiveId: string;
    title?: string; // Backend uses 'title'
    name?: string; // Backward compatibility
    type?: string;
  } | null;
  kpi?: {
    kpiId: string;
    name?: string;
    weight?: number;
    baseline?: number | string;
    targetValue?: number | string;
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
    title?: string; // Backend uses 'title'
    name?: string; // Backward compatibility
    type?: string;
    status?: string;
    assigneeId?: string | null;
    assigneeType?: string | null;
    parent?: { objectiveId: string; title?: string; name?: string } | null;
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
    targetValue?: number | string;
    objective?: {
      objectiveId: string;
      title?: string; // Backend uses 'title'
      name?: string; // Backward compatibility
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
  onApproveSubmission: (submissionId: string, reason: string, selectedKPIs?: string[]) => Promise<void>;
  onRejectSubmission: (submissionId: string, reason: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  // Complete objective list to resolve parent/child relationships
  allObjectives?: Array<{
    objectiveId: string;
    name?: string;
    title?: string;
    parent?: { objectiveId: string; name?: string; title?: string } | null;
    kpis?: Array<{ kpiId: string; name: string }>;
  }>;
  // Optional: map of parent KPI yearly targets by child KPI id
  strategicTargetsById?: Record<string, Record<string, number>>;
  // All KPIs with targets for parent lookup
  allKpis?: Kpi[];
  /** Track-only view: no approve/reject or row selection */
  readOnly?: boolean;
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
  onApproveSubmission,
  onRejectSubmission,
  loading = false,
  error,
  allObjectives = [],
  strategicTargetsById = {},
  allKpis = [],
  readOnly = false,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("division");
  const user = useAuthStore((state) => state.user);
  const { scope, role: userRole } = usePermissions();
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
  });
  const departments = departmentsData?.departments?.items ?? [];

  const canApproveGroupedSubmission = (obj: GroupedSubmission) =>
    canUserApproveSubmission(userRole, scope, obj, departments);

  // Check if user is at corporate level (ADMIN or SUPER_ADMIN)
  const isCorporateLevel =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Filter submissions based on active tab for corporate level users
  const filteredSubmissions = useMemo(() => {
    if (!isCorporateLevel) {
      return submissions; // Return all submissions for non-corporate users
    }

    if (activeTab === "division") {
      return submissions.filter(
        (submission) => submission.level === "DIVISION"
      );
    } else if (activeTab === "department") {
      return submissions.filter(
        (submission) => submission.level === "DEPARTMENT"
      );
    } else if (activeTab === "personnel") {
      return submissions.filter(
        (submission) => submission.level === "PERSONNEL"
      );
    }

    return submissions;
  }, [submissions, activeTab, isCorporateLevel]);

  // All submissions are objective submissions with nested KPIs
  const objectiveSubmissions = filteredSubmissions;

  // Helper function to get KPI submissions for a specific objective
  const getKPISubmissionsForObjective = (submission: GroupedSubmission) => {
    // Use the new associatedKpiSubmissions from the grouped data
    const kpiSubmissions = submission.associatedKpiSubmissions || [];

    return kpiSubmissions;
  };

  // Resolve strategic (parent) and child objective names for a submission
  const resolveObjectiveNames = (submission: GroupedSubmission) => {
    const childId = submission.objective?.objectiveId;
    const child = allObjectives?.find((o) => o.objectiveId === childId);
    const hasParent = !!child?.parent;
    const strategicName = hasParent
      ? child.parent?.title || child.parent?.name || "N/A"
      : submission.objective?.title || submission.objective?.name || "N/A";
    const childName = hasParent
      ? submission.objective?.name || undefined
      : undefined;
    return { strategicName, childName, hasParent };
  };

  // Function to get conditional column headers based on objective type
  const getColumnHeaders = (objectiveType?: string) => {
    if (!objectiveType) {
      return {
        firstColumn: "STRATEGIC KPI",
        secondColumn: "DIVISION/DEPARTMENT/PERSONAL KPI",
        showSecondColumn: true,
      };
    }

    switch (objectiveType) {
      case "CORPORATE":
        return {
          firstColumn: "CORPORATE KPI",
          secondColumn: "N/A",
          showSecondColumn: false,
        };
      case "DIVISION":
        return {
          firstColumn: "STRATEGIC KPI",
          secondColumn: "DIVISION KPI",
          showSecondColumn: true,
        };
      case "DEPARTMENT":
        return {
          firstColumn: "DIVISION KPI",
          secondColumn: "DEPARTMENT KPI",
          showSecondColumn: true,
        };
      case "PERSONNEL":
        return {
          firstColumn: "DEPARTMENT KPI",
          secondColumn: "PERSONAL KPI",
          showSecondColumn: true,
        };
      default:
        return {
          firstColumn: "STRATEGIC KPI",
          secondColumn: "DIVISION/DEPARTMENT/PERSONAL KPI",
          showSecondColumn: true,
        };
    }
  };

  // Function to get conditional column headers for objectives
  const getObjectiveColumnHeaders = (objectiveType?: string) => {
    if (!objectiveType) {
      return {
        firstColumn: "STRATEGIC OBJECTIVE",
        secondColumn: "DIVISION/DEPARTMENT/PERSONAL OBJECTIVE",
        showSecondColumn: true,
      };
    }

    switch (objectiveType) {
      case "CORPORATE":
        return {
          firstColumn: "CORPORATE OBJECTIVE",
          secondColumn: "N/A",
          showSecondColumn: false,
        };
      case "DIVISION":
        return {
          firstColumn: "STRATEGIC OBJECTIVE",
          secondColumn: "DIVISION OBJECTIVE",
          showSecondColumn: true,
        };
      case "DEPARTMENT":
        return {
          firstColumn: "DIVISION OBJECTIVE",
          secondColumn: "DEPARTMENT OBJECTIVE",
          showSecondColumn: true,
        };
      case "PERSONNEL":
        return {
          firstColumn: "DEPARTMENT OBJECTIVE",
          secondColumn: "PERSONAL OBJECTIVE",
          showSecondColumn: true,
        };
      default:
        return {
          firstColumn: "STRATEGIC OBJECTIVE",
          secondColumn: "DIVISION/DEPARTMENT/PERSONAL OBJECTIVE",
          showSecondColumn: true,
        };
    }
  };

  // Removed unused getTargetLabel function

  // Removed unused getReviewerTargetLabel function

  // Removed unused getTargetLabelByActiveTab function

  // Removed unused getTargetLabelByObjectiveType function

  // Helper: aggregate targets into yearly totals
  const getYearlyTotals = (
    targets: Array<{ timeline: string; target: number }> = [],
    unitType?: string
  ) => {
    const totals: Record<string, number> = {};
    const quarterlySums: Record<string, number> = {};
    const quarterlyCounts: Record<string, number> = {};
    const yearsWithExplicitTotal: Set<string> = new Set();

    // First, find explicit yearly totals
    for (const t of targets) {
      if (!t.timeline.includes("-")) {
        const year = t.timeline;
        totals[year] = Number(t.target || 0);
        yearsWithExplicitTotal.add(year);
      }
    }

    // Then, sum/count quarters for years that DON'T have an explicit total
    for (const t of targets) {
      const [year, quarter] = t.timeline.split("-");
      if (quarter && !yearsWithExplicitTotal.has(year)) {
        quarterlySums[year] =
          (quarterlySums[year] || 0) + Number(t.target || 0);
        quarterlyCounts[year] = (quarterlyCounts[year] || 0) + 1;
      }
    }

    // Merge the quarterly values into the main totals object
    // For PERCENT and RATIO, use average; for others, use sum
    const isAverageable = unitType === "PERCENT" || unitType === "RATIO";
    for (const year in quarterlySums) {
      if (!totals[year]) {
        const total = isAverageable && quarterlyCounts[year] > 0
          ? quarterlySums[year] / quarterlyCounts[year]
          : quarterlySums[year];
        totals[year] = Math.round(total * 100) / 100;
      }
    }

    // Also round explicit totals to 2 decimal places
    for (const year in totals) {
      totals[year] = Math.round(totals[year] * 100) / 100;
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
  const selectableSubmissions = objectiveSubmissions.filter(
    (obj) => obj.level !== "DIVISION" || obj.status !== "PENDING"
  );

  const allSelected =
    selectableSubmissions.length > 0 &&
    selectableSubmissions.every((obj) => selected.includes(obj.submissionId));

  // Custom onSelectAll handler for filtered submissions
  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all selectable submissions
      selectableSubmissions.forEach((obj) => {
        if (selected.includes(obj.submissionId)) {
          onSelect(obj.submissionId);
        }
      });
    } else {
      // Select all selectable submissions
      selectableSubmissions.forEach((obj) => {
        if (!selected.includes(obj.submissionId)) {
          onSelect(obj.submissionId);
        }
      });
    }
  };

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

  // If no filtered submissions but there are submissions, show empty state for current tab
  if (filteredSubmissions.length === 0 && submissions.length > 0) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        {isCorporateLevel && (
          <div className="p-4 border-b border-gray-200">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="division">Division Objectives</TabsTrigger>
                <TabsTrigger value="department">
                  Department Objectives
                </TabsTrigger>
                <TabsTrigger value="personnel">
                  Personnel Objectives
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        <div className="p-8 text-center">
          <p className="text-gray-600">
            No {activeTab === "division" ? "division" : "department"}{" "}
            submissions found for approval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
      {isCorporateLevel && (
        <div className="p-4 border-b border-gray-200">
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {filteredSubmissions.length} of {submissions.length}{" "}
                objective submissions
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>
                  Division:{" "}
                  {submissions.filter((s) => s.level === "DIVISION").length}
                </span>
                <span>
                  Department:{" "}
                  {submissions.filter((s) => s.level === "DEPARTMENT").length}
                </span>
                <span>
                  Personnel:{" "}
                  {submissions.filter((s) => s.level === "PERSONNEL").length}
                </span>
              </div>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="division">Division Objectives</TabsTrigger>
              <TabsTrigger value="department">
                Department Objectives
              </TabsTrigger>
              <TabsTrigger value="personnel">
                Personnel Objectives
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-gray-50">
            <TableHead className="px-6 py-4 w-12">
              {!readOnly && (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              )}
            </TableHead>
            {(() => {
              // Get the most common objective type from the submissions to determine column headers
              const objectiveTypes = objectiveSubmissions
                .map((s) => s.objective?.type)
                .filter(Boolean);
              const mostCommonType =
                objectiveTypes.length > 0 ? objectiveTypes[0] : undefined;
              const columnHeaders = getObjectiveColumnHeaders(mostCommonType);

              return (
                <>
                  <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {columnHeaders.firstColumn}
                  </TableHead>
                  {columnHeaders.showSecondColumn && (
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {columnHeaders.secondColumn}
                    </TableHead>
                  )}
                </>
              );
            })()}
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
            {!readOnly && (
              <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </TableHead>
            )}
            <TableHead className="px-6 py-4 w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectiveSubmissions.map((obj, idx) => {
            const kpiSubmissions = getKPISubmissionsForObjective(obj);

            // Debug: Log what we're getting for objective ${obj.objective?.objectiveId}
            // Real KPI submissions: ${kpiSubmissions.length}
            // Real KPI IDs: ${kpiSubmissions.map((k) => k.kpi?.kpiId).join(', ')}

            // Use only real KPI submissions - no more pseudo KPIs
            const effectiveKpiSubmissions = kpiSubmissions;

            const kpiCount = effectiveKpiSubmissions.length;

            // Debug: Log the final KPI count
            // Final KPI count for objective ${obj.objective?.objectiveId}: ${kpiCount}
            // Effective KPI submissions: ${effectiveKpiSubmissions.length}
            const { strategicName, childName, hasParent } =
              resolveObjectiveNames(obj);

            return (
              <React.Fragment key={obj.submissionId}>
                <TableRow
                  className={`border-b border-gray-100 ${selected.includes(obj.submissionId)
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
                    {readOnly ? null : obj.level === "DIVISION" &&
                      obj.status === "PENDING" ? (
                      <div
                        className="flex items-center justify-center"
                        title="Manual Strategic Review Required"
                      >
                        <ShieldCheck className="h-4 w-4 text-blue-500/50" />
                      </div>
                    ) : (
                      <Checkbox
                        checked={selected.includes(obj.submissionId)}
                        onCheckedChange={() => onSelect(obj.submissionId)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    )}
                  </TableCell>
                  {(() => {
                    const columnHeaders = getObjectiveColumnHeaders(
                      obj.objective?.type
                    );

                    // For corporate objectives, show objective name in first column only
                    if (obj.objective?.type === "CORPORATE") {
                      return (
                        <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                          <div className="truncate" title={strategicName}>
                            {strategicName}
                          </div>
                        </TableCell>
                      );
                    }

                    // For other objectives, show parent in first column and child in second column
                    return (
                      <>
                        <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                          <div className="truncate" title={strategicName}>
                            {strategicName}
                          </div>
                          {hasParent && (
                            <div className="text-xs text-gray-500 mt-1">
                              From:{" "}
                              {obj.objective?.type === "DEPARTMENT"
                                ? "Division"
                                : obj.objective?.type === "PERSONNEL"
                                  ? "Department"
                                  : "Corporate"}
                            </div>
                          )}
                        </TableCell>
                        {columnHeaders.showSecondColumn && (
                          <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                            <div
                              className="truncate"
                              title={childName || "N/A"}
                            >
                              {childName
                                ? childName
                                : hasParent
                                  ? "N/A"
                                  : strategicName}
                            </div>
                          </TableCell>
                        )}
                      </>
                    );
                  })()}
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
                    {/* For virtual submissions (KPI-only), show a different status */}
                    {obj.submissionId.startsWith("virtual-") ? (
                      <div className="flex flex-col gap-1">
                        <Badge
                          className="bg-green-100 text-green-600 rounded-full px-3 py-1 text-xs font-medium border-0"
                        >
                          Obj Approved
                        </Badge>
                        {(() => {
                          const allApproved = effectiveKpiSubmissions.length > 0 && effectiveKpiSubmissions.every((k) => k.status === "APPROVED");
                          const allRejected = effectiveKpiSubmissions.length > 0 && effectiveKpiSubmissions.every((k) => k.status === "REJECTED");
                          const someApproved = effectiveKpiSubmissions.some((k) => k.status === "APPROVED");
                          if (allApproved) {
                            return (
                              <Badge className="bg-green-100 text-green-600 rounded-full px-3 py-1 text-xs font-medium border-0">
                                All KPIs Approved
                              </Badge>
                            );
                          }
                          if (allRejected) {
                            return (
                              <Badge className="bg-red-100 text-red-600 rounded-full px-3 py-1 text-xs font-medium border-0">
                                KPIs Rejected
                              </Badge>
                            );
                          }
                          if (someApproved) {
                            return (
                              <Badge className="bg-blue-100 text-blue-600 rounded-full px-3 py-1 text-xs font-medium border-0">
                                Partial KPIs Approved
                              </Badge>
                            );
                          }
                          return (
                            <Badge className="bg-yellow-100 text-yellow-600 rounded-full px-3 py-1 text-xs font-medium border-0">
                              KPIs Pending
                            </Badge>
                          );
                        })()}
                      </div>
                    ) : (
                      <Badge
                        className={`${statusMap[obj.status as keyof typeof statusMap]
                          ?.color || "bg-gray-100 text-gray-600"
                          } rounded-full px-3 py-1 text-xs font-medium border-0`}
                      >
                        {obj.level === "DIVISION" && obj.status === "PENDING"
                          ? "Pending Strategic Review"
                          : statusMap[obj.status as keyof typeof statusMap]?.label ||
                          obj.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {readOnly ? (
                      <span className="text-xs text-gray-500">
                        {obj.status === "PENDING"
                          ? "Awaiting approval from above"
                          : obj.status === "APPROVED"
                            ? "Approved"
                            : "Rejected"}
                      </span>
                    ) : (
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
                          {/* Virtual submissions (KPI-only) - show KPI approval/rejection options */}
                          {obj.submissionId.startsWith("virtual-") ? (
                            <>
                              <DropdownMenuItem asChild>
                                <ApproveSubmissionDialog
                                  submission={{
                                    submissionId: obj.submissionId,
                                    type: "OBJECTIVE",
                                    level: obj.level,
                                    status: "PENDING", // KPIs are pending
                                    reason: obj.reason || "",
                                    submittedBy: {
                                      employeeId:
                                        obj.submittedBy.employeeId || "",
                                      fullName: obj.submittedBy.fullName,
                                    },
                                    objective: obj.objective
                                      ? {
                                        objectiveId:
                                          obj.objective.objectiveId,
                                        name: obj.objective.title || obj.objective.name || "",
                                        type: obj.objective.type || "",
                                        status: "APPROVED",
                                      }
                                      : undefined,
                                    createdAt: new Date().toISOString(),
                                  }}
                                  onApprove={onApproveSubmission}
                                >
                                  <div className="text-green-600 hover:bg-green-50 cursor-pointer flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve All KPIs ({kpiCount})
                                  </div>
                                </ApproveSubmissionDialog>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <RejectSubmissionDialog
                                  submission={{
                                    submissionId: obj.submissionId,
                                    type: "OBJECTIVE",
                                    level: obj.level,
                                    status: "PENDING",
                                    reason: obj.reason || "",
                                    submittedBy: {
                                      employeeId:
                                        obj.submittedBy.employeeId || "",
                                      fullName: obj.submittedBy.fullName,
                                    },
                                    objective: obj.objective
                                      ? {
                                        objectiveId:
                                          obj.objective.objectiveId,
                                        name: obj.objective.title || obj.objective.name || "",
                                        type: obj.objective.type || "",
                                        status: "APPROVED",
                                      }
                                      : undefined,
                                    createdAt: new Date().toISOString(),
                                  }}
                                  onReject={onRejectSubmission}
                                >
                                  <div className="text-red-600 hover:bg-red-50 cursor-pointer flex items-center">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject All KPIs ({kpiCount})
                                  </div>
                                </RejectSubmissionDialog>
                              </DropdownMenuItem>
                            </>
                          ) : kpiCount > 0 ? (
                            <>
                              <DropdownMenuItem asChild>
                                <ApproveObjectiveWithKPIsDialog
                                  submission={{
                                    submissionId: obj.submissionId,
                                    objective: obj.objective,
                                    level: obj.level,
                                  }}
                                  associatedKPIs={effectiveKpiSubmissions.map(
                                    (k) => ({
                                      kpiId: k.kpi?.kpiId || "",
                                      name: k.kpi?.name || "Unknown KPI",
                                      status: k.status,
                                      weight: k.kpi?.weight,
                                      baseline: k.kpi?.baseline,
                                      submissionId: k.submissionId,
                                    })
                                  )}
                                  onApprove={async (id, reason, selectedKPIs) => {
                                    await onApproveSubmission(
                                      id,
                                      reason,
                                      selectedKPIs
                                    );
                                  }}
                                >
                                  <div className="text-green-600 hover:bg-green-50 cursor-pointer flex items-center w-full px-2 py-1.5 text-sm">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Objective + KPIs
                                  </div>
                                </ApproveObjectiveWithKPIsDialog>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                {(() => {
                                  const allKPIsApproved =
                                    effectiveKpiSubmissions.every(
                                      (k) => k.status === "APPROVED"
                                    );
                                  const hasKPIs =
                                    effectiveKpiSubmissions.length > 0;
                                  const canApproveObjective =
                                    (!hasKPIs || allKPIsApproved) &&
                                    canApproveGroupedSubmission(obj);

                                  return (
                                    <DropdownMenuItem
                                      asChild
                                      disabled={!canApproveObjective}
                                    >
                                      <div className="w-full">
                                        <ApproveSubmissionDialog
                                          submission={{
                                            submissionId: obj.submissionId,
                                            type: "OBJECTIVE",
                                            level: obj.level,
                                            status: obj.status,
                                            reason: obj.reason || "",
                                            submittedBy: {
                                              employeeId:
                                                obj.submittedBy.employeeId ||
                                                "",
                                              fullName:
                                                obj.submittedBy.fullName,
                                            },
                                            objective: obj.objective
                                              ? {
                                                objectiveId:
                                                  obj.objective.objectiveId,
                                                name:
                                                  obj.objective.title || obj.objective.name || "",
                                                type:
                                                  obj.objective.type || "",
                                                status:
                                                  obj.objective.status ||
                                                  obj.status,
                                              }
                                              : undefined,
                                            createdAt: new Date().toISOString(),
                                          }}
                                          onApprove={onApproveSubmission}
                                        >
                                          <div
                                            className={`flex items-center w-full px-2 py-1.5 text-sm ${canApproveObjective
                                              ? "text-green-600 hover:bg-green-50 cursor-pointer"
                                              : "text-gray-400 cursor-not-allowed grayscale"
                                              }`}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            <span>Approve Objective</span>
                                            {!canApproveObjective && (
                                              <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-1 rounded">
                                                Wait for KPIs
                                              </span>
                                            )}
                                          </div>
                                        </ApproveSubmissionDialog>
                                      </div>
                                    </DropdownMenuItem>
                                  );
                                })()}
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
                                    employeeId:
                                      obj.submittedBy.employeeId || "",
                                    fullName: obj.submittedBy.fullName,
                                  },
                                  objective: obj.objective
                                    ? {
                                      objectiveId: obj.objective.objectiveId,
                                      name: obj.objective.title || obj.objective.name || "",
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
                                    name: obj.objective.title || obj.objective.name || "",
                                    type: obj.objective.type || "",
                                    status:
                                      obj.objective.status || obj.status,
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
                    )}
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
                                    {(() => {
                                      const columnHeaders = getColumnHeaders(
                                        obj.objective?.type
                                      );
                                      return (
                                        <>
                                          <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                            {columnHeaders.firstColumn}
                                          </TableHead>
                                          {columnHeaders.showSecondColumn && (
                                            <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                              {columnHeaders.secondColumn}
                                            </TableHead>
                                          )}
                                        </>
                                      );
                                    })()}
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
                                    {!readOnly && (
                                      <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                      </TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {effectiveKpiSubmissions.map(
                                    (kpiSubmission, kpiIdx) => {
                                      // Create a truly unique key by combining multiple identifiers
                                      const uniqueKey = `${obj.submissionId}-${kpiSubmission.submissionId ||
                                        kpiSubmission.kpi?.kpiId ||
                                        "unknown"
                                        }-${kpiIdx}`;

                                      return (
                                        <TableRow
                                          key={uniqueKey}
                                          className="border-b"
                                        >
                                          {(() => {
                                            const columnHeaders =
                                              getColumnHeaders(
                                                obj.objective?.type
                                              );
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

                                            // For corporate objectives, show KPI name in first column
                                            if (
                                              obj.objective?.type ===
                                              "CORPORATE"
                                            ) {
                                              return (
                                                <TableCell className="px-4 py-3 font-medium text-gray-900">
                                                  <div
                                                    className="truncate"
                                                    title={
                                                      kpiSubmission.kpi?.name ||
                                                      "N/A"
                                                    }
                                                  >
                                                    {kpiSubmission.kpi?.name ||
                                                      "N/A"}
                                                  </div>
                                                </TableCell>
                                              );
                                            }

                                            // For other objectives, show parent KPI in first column and child KPI in second column
                                            // Find the actual parent KPI for this specific child KPI
                                            const parentName = (() => {
                                              // Try to find the KPI in allKpis to get parent information
                                              if (allKpis) {
                                                const fullKpi = allKpis.find(
                                                  (k) =>
                                                    k.kpiId ===
                                                    kpiSubmission.kpi?.kpiId
                                                );
                                                if (fullKpi?.parent?.name) {
                                                  return fullKpi.parent.name;
                                                }
                                              }

                                              // Fallback to index-based matching (less reliable)
                                              const parentKpi = (parent?.kpis ||
                                                [])[kpiIdx];
                                              if (parentKpi?.name) {
                                                return parentKpi.name;
                                              }

                                              // If no parent found, show the child KPI name in the first column
                                              return (
                                                kpiSubmission.kpi?.name || "N/A"
                                              );
                                            })();

                                            return (
                                              <>
                                                <TableCell className="px-4 py-3 font-medium text-gray-900">
                                                  <div
                                                    className="truncate"
                                                    title={parentName}
                                                  >
                                                    {parentName}
                                                    {parent && (
                                                      <div className="text-xs text-gray-500 mt-1">
                                                        From:{" "}
                                                        {obj.objective?.type ===
                                                          "DEPARTMENT"
                                                          ? "Division"
                                                          : obj.objective
                                                            ?.type ===
                                                            "PERSONNEL"
                                                            ? "Department"
                                                            : "Corporate"}
                                                      </div>
                                                    )}
                                                  </div>
                                                </TableCell>
                                                {columnHeaders.showSecondColumn && (
                                                  <TableCell className="px-4 py-3 font-medium text-gray-900">
                                                    <div
                                                      className="truncate"
                                                      title={
                                                        kpiSubmission.kpi
                                                          ?.name || "N/A"
                                                      }
                                                    >
                                                      {kpiSubmission.kpi
                                                        ?.name || "N/A"}
                                                    </div>
                                                  </TableCell>
                                                )}
                                              </>
                                            );
                                          })()}
                                          <TableCell className="px-4 py-3 text-gray-600">
                                            {kpiSubmission.kpi?.weight ?? "N/A"}
                                          </TableCell>
                                          <TableCell className="px-4 py-3 text-gray-600">
                                            {kpiSubmission.kpi?.baseline ||
                                              "N/A"}
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
                                                    childKpi.targets,
                                                    childKpi.unitType
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
                                                        {Number(
                                                          totals[y]
                                                        ).toFixed(1)}
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
                                                        a.split("/")?.[0] ||
                                                        "0"
                                                      ) -
                                                      parseInt(
                                                        b.split("/")?.[0] ||
                                                        "0"
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
                                                        {corporate !==
                                                          undefined && (
                                                            <div className="text-[11px] text-gray-500 mb-2">
                                                              {obj.objective?.type === "DIVISION" ? "Corporate Target" : "Strategic Target"}
                                                              :{" "}
                                                              <span className="font-medium text-purple-600">
                                                                {corporate}
                                                              </span>
                                                            </div>
                                                          )}
                                                        {/* Quarters */}
                                                        <div className="flex flex-wrap gap-1">
                                                          {[
                                                            "Q1",
                                                            "Q2",
                                                            "Q3",
                                                            "Q4",
                                                          ].map(
                                                            (label, idx) => (
                                                              <span
                                                                key={label}
                                                                className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700"
                                                              >
                                                                {label}:{" "}
                                                                {(
                                                                  q as Record<
                                                                    string,
                                                                    number
                                                                  >
                                                                )[
                                                                  `q${idx + 1}`
                                                                ] ?? 0}
                                                              </span>
                                                            )
                                                          )}
                                                        </div>
                                                        {/* Sum of quarters */}
                                                        {(() => {
                                                          const q1 =
                                                            (
                                                              q as Record<
                                                                string,
                                                                number
                                                              >
                                                            )["q1"] ?? 0;
                                                          const q2 =
                                                            (
                                                              q as Record<
                                                                string,
                                                                number
                                                              >
                                                            )["q2"] ?? 0;
                                                          const q3 =
                                                            (
                                                              q as Record<
                                                                string,
                                                                number
                                                              >
                                                            )["q3"] ?? 0;
                                                          const q4 =
                                                            (
                                                              q as Record<
                                                                string,
                                                                number
                                                              >
                                                            )["q4"] ?? 0;
                                                          const quarterlySum =
                                                            q1 + q2 + q3 + q4;
                                                          // Round to max 2 decimal places
                                                          const roundedSum = Math.round(quarterlySum * 100) / 100;

                                                          if (
                                                            quarterlySum > 0
                                                          ) {
                                                            return (
                                                              <div className="text-[11px] text-gray-500 mt-2">
                                                                <span className="text-gray-400">
                                                                  Sum:
                                                                </span>{" "}
                                                                <span className="font-medium text-green-600">
                                                                  {roundedSum}
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
                                            })()}
                                          </TableCell>
                                          <TableCell className="px-4 py-3 text-gray-600">
                                            {kpiSubmission.submittedBy
                                              ?.fullName ||
                                              obj.submittedBy.fullName}
                                          </TableCell>
                                          <TableCell className="px-4 py-3">
                                            <Badge
                                              className={`${statusMap[
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
                                            {kpiSubmission.reason?.trim() ? (
                                              <div
                                                className="max-w-[200px] cursor-help"
                                                title={kpiSubmission.reason.trim()}
                                              >
                                                <span
                                                  className={`text-sm block truncate ${kpiSubmission.status ===
                                                    "REJECTED"
                                                    ? "text-red-600"
                                                    : "text-green-600"
                                                    }`}
                                                >
                                                  {kpiSubmission.reason.trim()}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-gray-400 text-sm">
                                                -
                                              </span>
                                            )}
                                          </TableCell>
                                          {!readOnly && (
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
                                                      kpiSubmission.reason ||
                                                      "",
                                                    submittedBy: {
                                                      employeeId:
                                                        (
                                                          kpiSubmission.submittedBy as {
                                                            employeeId?: string;
                                                          }
                                                        )?.employeeId ||
                                                        obj.submittedBy
                                                          .employeeId ||
                                                        "",
                                                      fullName:
                                                        kpiSubmission
                                                          .submittedBy
                                                          ?.fullName ||
                                                        obj.submittedBy
                                                          .fullName,
                                                    },
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
                                                        status:
                                                          obj.objective
                                                            .status || "",
                                                      }
                                                      : undefined,
                                                    createdAt:
                                                      new Date().toISOString(),
                                                  }}
                                                  onApprove={
                                                    onApproveSubmission
                                                  }
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
                                                      kpiSubmission.reason ||
                                                      "",
                                                    submittedBy: {
                                                      employeeId:
                                                        (
                                                          kpiSubmission.submittedBy as {
                                                            employeeId?: string;
                                                          }
                                                        )?.employeeId ||
                                                        obj.submittedBy
                                                          .employeeId ||
                                                        "",
                                                      fullName:
                                                        kpiSubmission
                                                          .submittedBy
                                                          ?.fullName ||
                                                        obj.submittedBy
                                                          .fullName,
                                                    },
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
                                                        status:
                                                          obj.objective
                                                            .status || "",
                                                      }
                                                      : undefined,
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
                                          )}
                                        </TableRow>
                                      );
                                    }
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
