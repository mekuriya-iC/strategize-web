"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import React from "react";
import ObjectiveFilterBar from "./ObjectiveFilterBar";
import ObjectiveTable, { Objective } from "./ObjectiveTable";
// import EditObjectiveDialog from "./EditObjectiveDialog";
import ObjectivePagination from "./ObjectivePagination";
import { useObjectives } from "@/hooks/useObjectives";
import { useObjectiveMutations } from "@/hooks/useObjectiveMutations";
import { useKPIs } from "@/hooks/useKPIs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ObjectivesApprovalTable() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Mutations
  const {
    updateObjective,
    // removeObjective,
    loading: mutationLoading,
  } = useObjectiveMutations();

  // Filter objectives based on status (API doesn't support status filter, so we filter locally)
  const filteredObjectives = useMemo(() => {
    if (statusFilter === "all") {
      return objectives;
    }
    return objectives.filter((obj) => obj.status === statusFilter);
  }, [objectives, statusFilter]);

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

  const handleSubmitForApproval = async () => {
    try {
      const updatePromises = selected.map((objectiveId) =>
        updateObjective({
          input: {
            objectiveId,
            status: "PENDING",
          },
        })
      );

      await Promise.all(updatePromises);
      toast.success(`${selected.length} objective(s) submitted for approval`);
      setSelected([]);
    } catch (error) {
      console.error("Error submitting objectives for approval:", error);
      toast.error("Failed to submit objectives for approval");
    }
  };

  const handleAddObjective = () => {
    router.push("/dashboard/objectives/new");
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

  const handleObjectiveClick = (objective: Objective) => {
    // Navigate to objective details page with KPI management
    router.push(`/dashboard/objectives/${objective.objectiveId}`);
  };

  const handleViewObjective = (objective: Objective) => {
    router.push(`/dashboard/objectives/${objective.objectiveId}`);
  };

  const handleEditSuccess = async () => {
    await refetch(); // Refresh the objectives list after successful edit
  };

  const handleDeleteObjective = async () => {
    // After DeleteObjectiveDialog succeeds, simply refetch objectives list
    await refetch();
  };

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6">
      {/* Filter Bar */}
      <ObjectiveFilterBar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        selectedCount={selected.length}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onClearFilters={handleClearFilters}
        onAddObjective={handleAddObjective}
      />

      {/* Summary */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Showing {filteredObjectives.length} of {meta?.totalItems || 0}{" "}
            objectives
          </p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button
              onClick={handleSubmitForApproval}
              disabled={mutationLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {mutationLoading
                ? "Submitting..."
                : `Submit ${selected.length} for Approval`}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <ObjectiveTable
        objectives={filteredObjectives}
        kpis={kpis}
        selected={selected}
        expanded={expanded}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onExpand={handleExpand}
        onObjectiveClick={handleObjectiveClick}
        onViewObjective={handleViewObjective}
        onEditSuccess={handleEditSuccess}
        onDeleteObjective={handleDeleteObjective}
        loading={loading || kpisLoading}
        error={error?.message}
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
