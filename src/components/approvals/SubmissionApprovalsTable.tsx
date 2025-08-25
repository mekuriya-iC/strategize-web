"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import React from "react";
// import ApprovalFilterBar from "./ApprovalFilterBar";
import SubmissionApprovalTable from "./SubmissionApprovalTable";
import type { GroupedSubmission } from "./SubmissionApprovalTable";
import ObjectivePagination from "../objectives/ObjectivePagination";
import { useSubmissionApprovals } from "@/hooks/useSubmissionApprovals";
import { useSubmissionApprovalMutations } from "@/hooks/useSubmissionApprovalMutations";
import { useUser } from "@/context/UserContext";
import { useOrgUnit } from "@/context/OrgUnitContext";
import { useObjectives } from "@/hooks/useObjectives";
import { useKPIs } from "@/hooks/useKPIs";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import type { Kpi } from "@/types/graphql";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for submissions that can be either main submissions or KPI submissions
type SubmissionData = {
  submissionId: string;
  type: string;
  status: string;
  reason?: string;
  kpi?: { kpiId: string } | null;
  objective?: { objectiveId: string } | null;
  level?: string;
  submittedBy?: { fullName: string };
  associatedKpiSubmissions?: SubmissionData[];
  kpiSubmissionCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function SubmissionApprovalsTable() {
  const { user } = useUser();
  const { selectedUnit } = useOrgUnit();

  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Default to all submissions for approval table
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Determine approver role based on user's actual role and context
  const getApproverRole = (): "CORPORATE" | "DIVISION" | "DEPARTMENT" => {
    // For corporate users (ADMIN, SUPER_ADMIN), they handle corporate-level approvals
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
      return "CORPORATE";
    }

    // For managers, determine their level based on what unit they've selected
    if (user?.role === "MANAGER" && selectedUnit) {
      if (selectedUnit.__typename === "Division") {
        return "DIVISION";
      } else if (selectedUnit.__typename === "Department") {
        return "DEPARTMENT";
      }
    }

    // Default to corporate level for fallback
    return "CORPORATE";
  };

  const approverRole = getApproverRole();

  // Dynamic submission tabs removed; UI currently uses single table regardless of unit level.

  // Fetch submissions for approval
  const { submissions, loading, error, meta, refetch } = useSubmissionApprovals(
    {
      page: currentPage,
      limit: itemsPerPage,
      approverRole: approverRole,
      status:
        statusFilter === "all"
          ? undefined
          : (statusFilter.toUpperCase() as "PENDING" | "APPROVED" | "REJECTED"),
    }
  );

  // Fetch a broad set of objectives to resolve strategic/child names in the table
  const { objectives: allObjectivesLookup } = useObjectives({
    page: 1,
    limit: 1000,
  });

  // Fetch all KPIs to resolve targets in approvals view
  const { kpis: allKpis } = useKPIs({ page: 1, limit: 1000 });

  // Build corporate target map for each child KPI id
  const strategicTargetsById = useMemo(() => {
    try {
      const byChildId: Record<string, Record<string, number>> = {};

      // Group KPIs by objective
      const kpisByObjective: Record<string, Kpi[]> = {};
      (allKpis || []).forEach((k) => {
        const oid = k.objective?.objectiveId || "";
        if (!oid) return;
        if (!kpisByObjective[oid]) kpisByObjective[oid] = [] as Kpi[];
        kpisByObjective[oid].push(k);
      });

      // For each child objective that has a parent, map child->parent yearly targets by index
      (allObjectivesLookup || []).forEach(
        (child: {
          objectiveId: string;
          parent?: { objectiveId: string } | null;
        }) => {
          const parentId = child?.parent?.objectiveId;
          if (!parentId) return;
          const childKpis = kpisByObjective[child.objectiveId] || [];
          const parentKpis = kpisByObjective[parentId] || [];

          childKpis.forEach((ck, idx) => {
            const pk = parentKpis[idx];
            if (!pk) return;
            const map: Record<string, number> = {};
            (pk.targets || []).forEach((t) => {
              const tl = t.timeline as string;
              if (tl.includes("-Q")) {
                const year = tl.split("-")[0];
                map[year] = (map[year] || 0) + Number(t.target || 0);
              } else {
                map[tl] = Number(t.target || 0);
              }
            });
            byChildId[ck.kpiId] = map;
          });
        }
      );

      return byChildId;
    } catch {
      return {} as Record<string, Record<string, number>>;
    }
  }, [allObjectivesLookup, allKpis]);

  // Submission approval mutations
  const {
    handleApproveSubmissionWithItemUpdate,
    handleRejectSubmissionWithItemUpdate,
    loading: mutationLoading,
  } = useSubmissionApprovalMutations();

  // Removed unused updateKpi variable

  // Removed unused handleNestedKPIAction function

  // Filter submissions based on search term (focus on objectives)
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((submission) => {
        const itemName =
          submission.objective?.name || submission.kpi?.name || "";
        const submitterName = submission.submittedBy.fullName;
        const reason = submission.reason || "";

        return (
          itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reason.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return filtered;
  }, [submissions, searchTerm]);

  const handleSelect = (submissionId: string) => {
    setSelected((prev) =>
      prev.includes(submissionId)
        ? prev.filter((id) => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleApprove = async () => {
    try {
      const approvePromises = selected.map((submissionId) => {
        const submission = submissions.find(
          (sub) => sub.submissionId === submissionId
        );
        if (!submission) return Promise.resolve();

        return handleApproveSubmissionWithItemUpdate(
          submission,
          "Bulk approved"
        );
      });

      await Promise.all(approvePromises);
      toast.success(`${selected.length} submission(s) approved successfully`);
      setSelected([]);
      await refetch();
    } catch (error) {
      console.error("Error approving submissions:", error);
      toast.error("Failed to approve submissions");
    }
  };

  const handleReject = async () => {
    try {
      const rejectPromises = selected.map((submissionId) => {
        const submission = submissions.find(
          (sub) => sub.submissionId === submissionId
        );
        if (!submission) return Promise.resolve();

        return handleRejectSubmissionWithItemUpdate(
          submission,
          "Bulk rejected"
        );
      });

      await Promise.all(rejectPromises);
      toast.success(`${selected.length} submission(s) rejected`);
      setSelected([]);
      await refetch();
    } catch (error) {
      console.error("Error rejecting submissions:", error);
      toast.error("Failed to reject submissions");
    }
  };

  const handleApproveSubmission = async (
    submissionId: string,
    reason: string
  ) => {
    try {
      // console.log("🔍 APPROVAL DEBUG - Starting approval for:", {
      //   submissionId,
      //   reason,
      //   totalSubmissions: submissions.length,
      // });

      // First, try to find in main submissions array (for objectives)
      let submission: SubmissionData | undefined = submissions.find(
        (sub) => sub.submissionId === submissionId
      );

      // If not found in main array, search in associated KPI submissions
      if (!submission) {
        // console.log(
        //   "🔍 APPROVAL DEBUG - Not found in main array, searching in KPI submissions..."
        // );

        for (const obj of submissions) {
          const objWithKpis = obj as unknown as {
            associatedKpiSubmissions?: Array<{
              submissionId: string;
              type: string;
              status: string;
              reason?: string;
              kpi?: { kpiId: string };
              objective?: { objectiveId: string };
            }>;
          };
          if (objWithKpis.associatedKpiSubmissions) {
            const kpiSubmission = objWithKpis.associatedKpiSubmissions.find(
              (kpi: {
                submissionId: string;
                type: string;
                status: string;
                reason?: string;
                kpi?: { kpiId: string };
                objective?: { objectiveId: string };
              }) => kpi.submissionId === submissionId
            );
            if (kpiSubmission) {
              submission = kpiSubmission as SubmissionData;
              // console.log("🔍 APPROVAL DEBUG - Found KPI submission:", {
              //   submissionId: kpiSubmission.submissionId,
              //   type: kpiSubmission.type,
              //   status: kpiSubmission.status,
              // });
              break;
            }
          }
        }
      }

      // If submission not found, show error
      if (!submission) {
        // console.log("🔍 APPROVAL DEBUG - Submission not found anywhere");
        toast.error("Submission not found");
        return;
      }

      // Extract the minimal submission data required by the function
      const minimalSubmission = {
        submissionId: submission.submissionId,
        type: submission.type as "OBJECTIVE" | "KPI",
        objective: submission.objective,
        kpi: submission.kpi,
      };

      // console.log(
      //   "🔍 APPROVAL DEBUG - About to call handleApproveSubmissionWithItemUpdate with:",
      //   {
      //     submissionId: minimalSubmission.submissionId,
      //     type: minimalSubmission.type,
      //     reason,
      //   }
      // );

      await handleApproveSubmissionWithItemUpdate(minimalSubmission, reason);

      // console.log(
      //   "🔍 APPROVAL DEBUG - handleApproveSubmissionWithItemUpdate completed successfully"
      // );
      toast.success(`Submission approved successfully`);

      // Force a comprehensive refetch after all approvals and propagations
      // console.log("🔄 Comprehensive refetch after approval...");
      await refetch();
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Failed to approve submission");
    }
  };

  const handleRejectSubmission = async (
    submissionId: string,
    reason: string
  ) => {
    try {
      // console.log("🚨 REJECTION DEBUG - Starting rejection for:", {
      //   submissionId,
      //   reason,
      //   totalSubmissions: submissions.length,
      // });

      // First, try to find in main submissions array (for objectives)
      let submission: SubmissionData | undefined = submissions.find(
        (sub) => sub.submissionId === submissionId
      );

      // If not found in main array, search in associated KPI submissions
      if (!submission) {
        // console.log(
        //   "🚨 REJECTION DEBUG - Not found in main array, searching in KPI submissions..."
        // );

        for (const obj of submissions) {
          const objWithKpis = obj as unknown as {
            associatedKpiSubmissions?: Array<{
              submissionId: string;
              type: string;
              status: string;
              reason?: string;
              kpi?: { kpiId: string };
              objective?: { objectiveId: string };
            }>;
          };
          if (objWithKpis.associatedKpiSubmissions) {
            const kpiSubmission = objWithKpis.associatedKpiSubmissions.find(
              (kpi: {
                submissionId: string;
                type: string;
                status: string;
                reason?: string;
                kpi?: { kpiId: string };
                objective?: { objectiveId: string };
              }) => kpi.submissionId === submissionId
            );
            if (kpiSubmission) {
              submission = kpiSubmission as SubmissionData;
              // console.log("🚨 REJECTION DEBUG - Found KPI submission:", {
              //   submissionId: kpiSubmission.submissionId,
              //   type: kpiSubmission.type,
              //   status: kpiSubmission.status,
              // });
              break;
            }
          }
        }
      }

      // console.log("🚨 REJECTION DEBUG - Found submission:", {
      //   found: !!submission,
      //   submissionType: submission?.type,
      //   submissionStatus: submission?.status,
      //   submissionReason: submission?.reason,
      // });

      // If submission not found, show error
      if (!submission) {
        // console.log("🚨 REJECTION DEBUG - Submission not found anywhere");
        toast.error("Submission not found");
        return;
      }

      // Extract the minimal submission data required by the function
      const minimalSubmission = {
        submissionId: submission.submissionId,
        type: submission.type as "OBJECTIVE" | "KPI",
        objective: submission.objective,
        kpi: submission.kpi,
      };

      // console.log(
      //   "🚨 REJECTION DEBUG - Calling handleRejectSubmissionWithItemUpdate..."
      // );
      // console.log(
      //   "🔍 REJECTION DEBUG - About to call handleRejectSubmissionWithItemUpdate with:",
      //   {
      //     submissionId: minimalSubmission.submissionId,
      //     type: minimalSubmission.type,
      //     reason,
      //   }
      // );

      await handleRejectSubmissionWithItemUpdate(minimalSubmission, reason);

      // console.log(
      //   "🚨 REJECTION DEBUG - Mutation completed, calling refetch..."
      // );
      toast.success(`Submission rejected successfully`);

      // console.log(
      //   "🚨 REJECTION DEBUG - Before refetch, submissions count:",
      //   submissions.length
      // );
      await refetch();
      // console.log("🚨 REJECTION DEBUG - After refetch completed");
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Failed to reject submission");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("pending");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6">
      {/* Enhanced Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search objectives..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          <Button
            onClick={handleClearFilters}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear Filters
          </Button>
        </div>

        {/* Selected Count */}
        {selected.length > 0 && (
          <div className="text-sm text-gray-600">
            {selected.length} selected
          </div>
        )}
      </div>

      {/* Summary and Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Showing{" "}
            {
              filteredSubmissions.filter((sub) => sub.type === "OBJECTIVE")
                .length
            }{" "}
            of {meta?.totalItems || 0} objective submissions
          </p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <>
              <Button
                onClick={handleApprove}
                disabled={mutationLoading}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {mutationLoading
                  ? "Processing..."
                  : `Approve ${selected.length}`}
              </Button>
              <Button
                onClick={handleReject}
                disabled={mutationLoading}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                {mutationLoading
                  ? "Processing..."
                  : `Reject ${selected.length}`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Submission Approval Table */}
      <SubmissionApprovalTable
        submissions={filteredSubmissions as GroupedSubmission[]}
        selected={selected}
        onSelect={handleSelect}
        onApproveSubmission={handleApproveSubmission}
        onRejectSubmission={handleRejectSubmission}
        loading={loading}
        error={error}
        allObjectives={allObjectivesLookup}
        allKpis={allKpis}
        strategicTargetsById={strategicTargetsById}
      />

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <ObjectivePagination
          currentPage={currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
