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
import { useKPIMutations } from "@/hooks/useKPIMutations";
import type { Kpi } from "@/types/graphql";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SubmissionApprovalsTable() {
  const { user } = useUser();
  const { selectedUnit } = useOrgUnit();

  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending for submissions
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
    propagateQuarterlyValues,
    loading: mutationLoading,
  } = useSubmissionApprovalMutations();

  // KPI mutations for nested KPIs
  const { updateKpi } = useKPIMutations();

  // Helper function to handle nested KPI approval/rejection
  const handleNestedKPIAction = async (
    kpiId: string,
    action: "APPROVED" | "REJECTED"
  ) => {
    try {
      await updateKpi({
        input: {
          kpiId: kpiId,
          status: action,
        },
      });

      // Propagate quarterly values up the hierarchy for KPI approvals
      if (action === "APPROVED") {
        console.log(
          "🔄 Starting quarterly propagation for approved nested KPI:",
          kpiId
        );
        try {
          await propagateQuarterlyValues(kpiId);
          // Force refetch after propagation to ensure UI updates
          console.log("🔄 Refetching data after propagation...");
          await refetch();

          // Additional delay and force a final refetch to ensure UI sync
          setTimeout(async () => {
            console.log("🔄 Final refetch to ensure UI sync...");
            await refetch();

            // Ultimate fallback: force page refresh to ensure fresh data
            setTimeout(() => {
              console.log(
                "🔄 Forcing page refresh for absolute data freshness..."
              );
              window.location.reload();
            }, 1000);
          }, 2000);
        } catch (propagationError) {
          console.error(
            "❌ Error in propagation for nested KPI:",
            propagationError
          );
          // Don't fail the main approval, just log the error
        }
      }

      toast.success(`KPI ${action.toLowerCase()} successfully`);
      if (action !== "APPROVED") {
        await refetch();
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()} KPI:`, error);
      toast.error(`Failed to ${action.toLowerCase()} KPI`);
    }
  };

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

  const handleSelectAll = () => {
    const objectiveSubmissions = filteredSubmissions.filter(
      (sub) => sub.type === "OBJECTIVE"
    );
    const allPageIds = objectiveSubmissions.map((sub) => sub.submissionId);
    const allSelected = allPageIds.every((id) => selected.includes(id));

    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...allPageIds])]);
    }
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
    reason: string,
    selectedKPIs?: string[]
  ) => {
    try {
      const submission = submissions.find(
        (sub) => sub.submissionId === submissionId
      );

      // Check if this is a nested KPI (submissionId is actually a KPI ID)
      if (!submission) {
        // This might be a nested KPI - check if submissionId is a valid UUID format
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            submissionId
          );
        if (isUUID) {
          await handleNestedKPIAction(submissionId, "APPROVED");
          return;
        }
        toast.error("Submission not found");
        return;
      }

      await handleApproveSubmissionWithItemUpdate(submission, reason);

      // If selectedKPIs is provided, handle KPI approvals/rejections
      if (selectedKPIs && selectedKPIs.length > 0) {
        const kpiPromises = selectedKPIs.map(async (kpiId) => {
          await handleNestedKPIAction(kpiId, "APPROVED");
        });

        await Promise.all(kpiPromises);
        toast.success(
          `Objective approved with ${selectedKPIs.length} KPI${
            selectedKPIs.length > 1 ? "s" : ""
          }`
        );
      } else {
        toast.success(`Submission approved successfully`);
      }

      // Force a comprehensive refetch after all approvals and propagations
      console.log("🔄 Comprehensive refetch after approval...");
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
      const submission = submissions.find(
        (sub) => sub.submissionId === submissionId
      );

      // Check if this is a nested KPI (submissionId is actually a KPI ID)
      if (!submission) {
        // This might be a nested KPI - check if submissionId is a valid UUID format
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            submissionId
          );
        if (isUUID) {
          await handleNestedKPIAction(submissionId, "REJECTED");
          return;
        }
        toast.error("Submission not found");
        return;
      }

      await handleRejectSubmissionWithItemUpdate(submission, reason);
      toast.success(`Submission rejected successfully`);
      await refetch();
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
        onSelectAll={handleSelectAll}
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
