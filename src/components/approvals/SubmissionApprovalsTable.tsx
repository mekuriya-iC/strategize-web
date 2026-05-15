"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import React from "react";
import SubmissionApprovalTable from "./SubmissionApprovalTable";
import type { GroupedSubmission } from "./SubmissionApprovalTable";
import DataTablePagination from "@/components/shared/DataTablePagination";
import { useSubmissionApprovals } from "@/hooks/submissions/useSubmissionApprovals";
import { useSubmissionApprovalMutations } from "@/hooks/submissions/useSubmissionApprovalMutations";
import { useAuthStore, useOrgUnitStore } from "@/stores";
import { useObjectives } from "@/hooks/objectives/useObjectives";
import { useKPIs } from "@/hooks/objectives/useKPIs";
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
  const user = useAuthStore((state) => state.user);
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);

  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending (submitted) submissions
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Determine approver role based on user's actual role and context
  const getApproverRole = (): "CORPORATE" | "DIVISION" | "DEPARTMENT" => {
    // For corporate users (ADMIN, SUPER_ADMIN), they handle corporate-level approvals
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
      return "CORPORATE";
    }

    // Directors are always division-level approvers
    if (user?.role === "DIRECTOR" && selectedUnit) {
      return "DIVISION";
    }

    // For managers, determine their level based on what unit they've selected
    if (user?.role === "MANAGER" && selectedUnit) {
      if (selectedUnit.type === "division") {
        return "DIVISION";
      } else if (selectedUnit.type === "department") {
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
    handleApproveObjectiveWithKpis,
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

        return handleApproveSubmission(
          submission.submissionId,
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
      // Handle virtual objective submissions (KPI-only groupings)
      // Virtual submissions are created when KPIs are submitted but their parent objective is already approved
      if (submissionId.startsWith("virtual-")) {
        const virtualSubmission = submissions.find(
          (sub) => sub.submissionId === submissionId
        ) as GroupedSubmission | undefined;

        if (virtualSubmission?.associatedKpiSubmissions && virtualSubmission.associatedKpiSubmissions.length > 0) {

          const kpiApprovalPromises = virtualSubmission.associatedKpiSubmissions
            .filter((kpiSub) => kpiSub.status === "PENDING")
            .map((kpiSub) => {
              const kpiMinimalSubmission = {
                submissionId: kpiSub.submissionId,
                type: "KPI" as const,
                objective: kpiSub.objective,
                kpi: kpiSub.kpi,
              };
              return handleApproveSubmissionWithItemUpdate(kpiMinimalSubmission, reason);
            });

          await Promise.all(kpiApprovalPromises);
          toast.success(`${virtualSubmission.associatedKpiSubmissions.length} KPI submission(s) approved successfully`);
          await refetch();
          return;
        } else {
          toast.error("No KPI submissions found to approve");
          return;
        }
      }

      // First, try to find in main submissions array (for objectives)
      let submission: SubmissionData | undefined = submissions.find(
        (sub) => sub.submissionId === submissionId
      );

      // If not found in main array, search in associated KPI submissions
      if (!submission) {
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
              break;
            }
          }
        }
      }

      // If submission not found, show error
      if (!submission) {
        toast.error("Submission not found");
        return;
      }

      const minimalSubmission = {
        submissionId: submission.submissionId,
        type: submission.type as "OBJECTIVE" | "KPI",
        objective: submission.objective,
        kpi: submission.kpi,
      };

      if (submission.type === "OBJECTIVE") {
        const objectiveSubmission = submissions.find(
          (sub) => sub.submissionId === submissionId
        ) as GroupedSubmission | undefined;

        const pendingKpiSubs =
          objectiveSubmission?.associatedKpiSubmissions?.filter(
            (kpiSub) => kpiSub.status === "PENDING"
          ) ?? [];

        if (pendingKpiSubs.length > 0) {
          const selectedPending = pendingKpiSubs.filter((kpiSub) => {
            if (selectedKPIs && selectedKPIs.length > 0) {
              return selectedKPIs.includes(kpiSub.kpi?.kpiId || "");
            }
            if (submission.level === "DIVISION") {
              return false;
            }
            return true;
          });

          const kpiSubmissionIds = selectedPending.map(
            (kpiSub) => kpiSub.submissionId
          );
          const approvingAllPending =
            kpiSubmissionIds.length === pendingKpiSubs.length;

          if (approvingAllPending && kpiSubmissionIds.length > 0) {
            await handleApproveObjectiveWithKpis(
              submissionId,
              reason,
              kpiSubmissionIds
            );
            toast.success("Objective and KPIs approved successfully");
            await refetch();
            return;
          }

          if (kpiSubmissionIds.length > 0) {
            const kpiApprovalPromises = selectedPending.map((kpiSub) =>
              handleApproveSubmissionWithItemUpdate(
                {
                  submissionId: kpiSub.submissionId,
                  type: "KPI" as const,
                  objective: kpiSub.objective,
                  kpi: kpiSub.kpi,
                },
                reason
              )
            );
            await Promise.all(kpiApprovalPromises);
            toast.success(
              `${kpiSubmissionIds.length} KPI submission(s) approved`
            );
            await refetch();
            return;
          }
        }
      }

      await handleApproveSubmissionWithItemUpdate(minimalSubmission, reason);

      toast.success(`Submission approved successfully`);

      // Force a comprehensive refetch after all approvals and propagations
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
      // Handle virtual objective submissions (KPI-only groupings)
      // Virtual submissions are created when KPIs are submitted but their parent objective is already approved
      if (submissionId.startsWith("virtual-")) {
        const virtualSubmission = submissions.find(
          (sub) => sub.submissionId === submissionId
        ) as GroupedSubmission | undefined;

        if (virtualSubmission?.associatedKpiSubmissions && virtualSubmission.associatedKpiSubmissions.length > 0) {

          const kpiRejectPromises = virtualSubmission.associatedKpiSubmissions
            .filter((kpiSub) => kpiSub.status === "PENDING")
            .map((kpiSub) => {
              const kpiMinimalSubmission = {
                submissionId: kpiSub.submissionId,
                type: "KPI" as const,
                objective: kpiSub.objective,
                kpi: kpiSub.kpi,
              };
              return handleRejectSubmissionWithItemUpdate(kpiMinimalSubmission, reason);
            });

          await Promise.all(kpiRejectPromises);
          toast.success(`${virtualSubmission.associatedKpiSubmissions.length} KPI submission(s) rejected`);
          await refetch();
          return;
        } else {
          toast.error("No KPI submissions found to reject");
          return;
        }
      }

      // First, try to find in main submissions array (for objectives)
      let submission: SubmissionData | undefined = submissions.find(
        (sub) => sub.submissionId === submissionId
      );

      // If not found in main array, search in associated KPI submissions
      if (!submission) {
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
              break;
            }
          }
        }
      }

      // If submission not found, show error
      if (!submission) {
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

      await handleRejectSubmissionWithItemUpdate(minimalSubmission, reason);

      // If this is an objective submission, also reject all associated KPI submissions
      if (submission.type === "OBJECTIVE") {
        const objectiveSubmission = submissions.find(
          (sub) => sub.submissionId === submissionId
        ) as GroupedSubmission | undefined;

        if (objectiveSubmission?.associatedKpiSubmissions && objectiveSubmission.associatedKpiSubmissions.length > 0) {

          const kpiRejectPromises = objectiveSubmission.associatedKpiSubmissions
            .filter((kpiSub) => kpiSub.status === "PENDING")
            .map((kpiSub) => {
              const kpiMinimalSubmission = {
                submissionId: kpiSub.submissionId,
                type: "KPI" as const,
                objective: kpiSub.objective,
                kpi: kpiSub.kpi,
              };
              return handleRejectSubmissionWithItemUpdate(kpiMinimalSubmission, reason);
            });

          await Promise.all(kpiRejectPromises);
        }
      }

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
              <SelectItem value="pending">Pending (Submitted)</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
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
        <DataTablePagination
          currentPage={currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          loading={loading}
          itemName="submissions"
        />
      )}
    </div>
  );
}
