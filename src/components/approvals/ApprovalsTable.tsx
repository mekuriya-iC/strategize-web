"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import React from "react";
import ApprovalFilterBar from "./ApprovalFilterBar";
import ApprovalTable from "./ApprovalTable";
import { Objective } from "@/components/features/objectives/ObjectiveTable";
import DataTablePagination from "@/components/shared/DataTablePagination";
import { useObjectives } from "@/hooks/objectives/useObjectives";
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";
import { useKPIs } from "@/hooks/objectives/useKPIs";
import { useKPIMutations } from "@/hooks/objectives/useKPIMutations";
import { useSubmissionMutations } from "@/hooks/submissions/useSubmissionMutations";
import { toast } from "sonner";
import { CheckCircle, XCircle, Search, Edit } from "lucide-react";
import RejectObjectiveDialog from "./RejectObjectiveDialog";
import { Kpi, GetDepartmentsResponse } from "@/types/graphql";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useQuery } from "@apollo/client";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_PENDING_SUBMISSIONS, GET_KPI_SUBMISSIONS } from "@/lib/graphql/queries/submissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UpdateKPIForm from "../objectives/UpdateKPIForm"; // Updated import

interface ApprovalsTableProps {
  activeTab: string;
}

export default function ApprovalsTable({ activeTab }: ApprovalsTableProps) {
  // const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Default to all for approvals
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedObjectiveForReject, setSelectedObjectiveForReject] =
    useState<Objective | null>(null);
  const [editKPIOpen, setEditKPIOpen] = useState(false);
  const [selectedKPIForEdit, setSelectedKPIForEdit] = useState<Kpi | null>(null);

  const itemsPerPage = 10;

  // Fetch objectives from API
  const { objectives, loading, error, meta, refetch } = useObjectives({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
  });

  // Fetch KPIs from API
  const { kpis, loading: kpisLoading } = useKPIs({
    // Fetch all KPIs to associate with objectives
  });

  const { data: deptsData } = useQuery<GetDepartmentsResponse>(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
  });

  const { objectives: objectivePerms } = usePermissions();

  // Fetch submissions to map reasons and IDs
  const { data: subData1 } = useQuery(GET_PENDING_SUBMISSIONS, { variables: { page: 1, limit: 1000, type: "DIVISION" } });
  const { data: subData2 } = useQuery(GET_PENDING_SUBMISSIONS, { variables: { page: 1, limit: 1000, type: "DEPARTMENT" } });
  const { data: subData3 } = useQuery(GET_PENDING_SUBMISSIONS, { variables: { page: 1, limit: 1000, type: "PERSONNEL" } });

  const { data: kpiSubData1 } = useQuery(GET_KPI_SUBMISSIONS, { variables: { page: 1, limit: 1000, type: "DIVISION" } });
  const { data: kpiSubData2 } = useQuery(GET_KPI_SUBMISSIONS, { variables: { page: 1, limit: 1000, type: "DEPARTMENT" } });
  const { data: kpiSubData3 } = useQuery(GET_KPI_SUBMISSIONS, { variables: { page: 1, limit: 1000, type: "PERSONNEL" } });

  const allPendingSubmissions = useMemo(() => {
    const subs = [
      ...(subData1?.submissions?.items || []),
      ...(subData2?.submissions?.items || []),
      ...(subData3?.submissions?.items || []),
      ...(kpiSubData1?.submissions?.items || []),
      ...(kpiSubData2?.submissions?.items || []),
      ...(kpiSubData3?.submissions?.items || []),
    ];
    return subs;
  }, [subData1, subData2, subData3, kpiSubData1, kpiSubData2, kpiSubData3]);

  // Map of departmentId -> divisionId
  const departmentToDivision = useMemo(() => {
    const map: Record<string, string> = {};
    deptsData?.departments?.items?.forEach((dept) => {
      if (dept.departmentId && dept.division?.divisionId) {
        map[dept.departmentId] = dept.division.divisionId;
      }
    });
    return map;
  }, [deptsData]);

  // Mutations - Using same hooks as objectives for consistent behavior
  const { updateObjective, loading: mutationLoading } = useObjectiveMutations();
  const { updateKpi, loading: kpiMutationLoading } = useKPIMutations();
  const { updateSubmission } = useSubmissionMutations();

  // Filter objectives based on status and tab for approval workflow
  const filteredObjectives = useMemo(() => {
    let filtered = objectives;

    // Filter by status
    if (statusFilter === "pending") {
      filtered = filtered.filter((obj) => obj.status === "PENDING");
    } else if (statusFilter === "approved") {
      filtered = filtered.filter((obj) => obj.status === "APPROVED");
    } else if (statusFilter === "rejected") {
      filtered = filtered.filter((obj) => obj.status === "REJECTED");
    }
    // "all" shows all statuses

    // Filter by active tab (objective type)
    if (activeTab === "department") {
      filtered = filtered.filter((obj) => obj.type === "DEPARTMENT");
    } else if (activeTab === "personnel") {
      filtered = filtered.filter((obj) => obj.type === "PERSONNEL");
    }

    // Filter by permission (hierarchy)
    return filtered.filter((obj) => {
      const divisionId =
        obj.type === "DEPARTMENT" && obj.assigneeId
          ? departmentToDivision[obj.assigneeId]
          : obj.type === "PERSONNEL" && obj.parent?.objectiveId
            ? (function () {
              // For personnel, find its department's division
              // This is a bit complex, but usually personnel objectives
              // are approved by the Dept Manager.
              return null; // Personnel approval is handled by departmentId in guards.ts
            })()
            : null;

      const departmentId =
        obj.type === "PERSONNEL" && obj.assigneeId ? obj.assigneeId : null;

      return objectivePerms.canApprove(
        obj.type,
        divisionId,
        departmentId
      );
    });
  }, [objectives, statusFilter, activeTab, objectivePerms, departmentToDivision]);

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allPageIds = filteredObjectives.map((obj) => obj.objectiveId);
    const allSelected = allPageIds.every((id) => selected.includes(id));

    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...allPageIds])]);
    }
  };

  const handleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const handleApprove = async () => {
    try {
      const updatePromises = selected.map((objectiveId) =>
        updateObjective({
          input: {
            objectiveId,
            status: "APPROVED",
          },
        })
      );

      await Promise.all(updatePromises);
      toast.success(`${selected.length} objective(s) approved successfully`);
      setSelected([]);
      await refetch();
    } catch (error) {
      console.error("Error approving objectives:", error);
      toast.error("Failed to approve objectives");
    }
  };

  const handleReject = async () => {
    try {
      const updatePromises = selected.map((objectiveId) =>
        updateObjective({
          input: {
            objectiveId,
            status: "REJECTED",
          },
        })
      );

      await Promise.all(updatePromises);
      toast.success(`${selected.length} objective(s) rejected`);
      setSelected([]);
      await refetch();
    } catch (error) {
      console.error("Error rejecting objectives:", error);
      toast.error("Failed to reject objectives");
    }
  };

  // Individual objective approval/rejection handlers
  const handleApproveObjective = async (objective: Objective) => {
    try {
      await updateObjective({
        input: {
          objectiveId: objective.objectiveId,
          status: "APPROVED",
        },
      });
      toast.success(`Objective "${objective.name}" approved successfully`);
      await refetch();
    } catch (error) {
      console.error("Error approving objective:", error);
      toast.error("Failed to approve objective");
    }
  };

  const handleRejectObjective = async (objective: Objective) => {
    setSelectedObjectiveForReject(objective);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async (
    objective: Objective,
    selectedKPIs: string[],
    reason: string
  ) => {
    try {
      // Reject the objective
      await updateObjective({
        input: {
          objectiveId: objective.objectiveId,
          status: "REJECTED",
        },
      });

      // IMPLEMENTED: Reject selected KPIs
      if (selectedKPIs.length > 0) {
        const kpiRejectionPromises = selectedKPIs.map((kpiId) =>
          updateKpi({
            kpiId: kpiId,
            status: "REJECTED",
          })
        );

        await Promise.all(kpiRejectionPromises);
      }

      // Update submission reason if reason is provided
      if (reason.trim()) {
        const itemSubmission = allPendingSubmissions.find(s =>
          (objective.objectiveId && s.objective?.objectiveId === objective.objectiveId) ||
          (objective.objectiveId && s.kpi?.objective?.objectiveId === objective.objectiveId)
        );

        if (itemSubmission) {
          await updateSubmission({
            input: {
              submissionId: itemSubmission.submissionId,
              status: "REJECTED",
              reason: reason.trim()
            }
          });
        }
      }

      const rejectedCount = selectedKPIs.length;
      const message =
        rejectedCount > 0
          ? `Objective "${objective.name}" and ${rejectedCount} KPI${rejectedCount > 1 ? "s" : ""
          } rejected successfully`
          : `Objective "${objective.name}" rejected successfully`;

      toast.success(message);
      await refetch();
    } catch (error) {
      console.error("Error rejecting objective/KPIs:", error);
      toast.error("Failed to reject objective and KPIs");
    }
  };

  // Individual KPI approval/rejection handlers - Same experience as objectives
  const handleApproveKPI = async (kpi: Kpi) => {
    try {
      await updateKpi({
        kpiId: kpi.kpiId,
        status: "APPROVED",
      });
      toast.success(`KPI "${kpi.name}" approved successfully`);
    } catch (error) {
      console.error("Error approving KPI:", error);
      toast.error("Failed to approve KPI");
    }
  };

  const handleRejectKPI = async (kpi: Kpi) => {
    try {
      await updateKpi({
        kpiId: kpi.kpiId,
        status: "REJECTED",
      });
      toast.success(`KPI "${kpi.name}" rejected successfully`);
    } catch (error) {
      console.error("Error rejecting KPI:", error);
      toast.error("Failed to reject KPI");
    }
  };

  const handleEditKPI = (kpi: Kpi) => {
    setSelectedKPIForEdit(kpi);
    setEditKPIOpen(true);
  };

  const handleKPISuccess = () => {
    setEditKPIOpen(false);
    setSelectedKPIForEdit(null);
    refetch();
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
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Remove navigation handlers - not needed for approval workflow

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6">
      {/* Filter Bar */}
      <ApprovalFilterBar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        selectedCount={selected.length}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Summary and Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Showing {filteredObjectives.length} of {meta?.totalItems || 0}{" "}
            objectives
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

      {/* Approval Table */}
      <ApprovalTable
        objectives={filteredObjectives}
        kpis={kpis}
        selected={selected}
        expanded={expanded}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onExpand={handleExpand}
        onApproveObjective={handleApproveObjective}
        onRejectObjective={handleRejectObjective}
        onApproveKPI={handleApproveKPI}
        onRejectKPI={handleRejectKPI}
        onEditKPI={handleEditKPI}
        loading={loading || kpisLoading || kpiMutationLoading}
        error={error?.message}
      />

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          loading={loading || kpisLoading}
          itemName="objectives"
        />
      )}

      {/* Reject Objective Dialog */}
      <RejectObjectiveDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        objective={selectedObjectiveForReject}
        kpis={kpis}
        onReject={handleConfirmReject}
      />

      {/* Adjust KPI Dialog */}
      <Dialog open={editKPIOpen} onOpenChange={setEditKPIOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adjust KPI Targets</DialogTitle>
          </DialogHeader>
          {selectedKPIForEdit && (
            <UpdateKPIForm
              kpiId={selectedKPIForEdit.kpiId}
              onSuccess={handleKPISuccess}
              onCancel={() => setEditKPIOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
