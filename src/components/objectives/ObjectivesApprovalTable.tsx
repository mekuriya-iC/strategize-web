"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import React from "react";
import KPIDetailsView from "./KPIDetailsView";
import ObjectiveFilterBar from "./ObjectiveFilterBar";
import ObjectiveTable, { Objective } from "./ObjectiveTable";
import ObjectivePagination from "./ObjectivePagination";

const mockObjectives: Objective[] = [
  {
    id: "1",
    title: "Increase i-Capital's shareholder value",
    kpis: [
      "Revenue from SL4 (line) in million",
      "Revenue from RAS(5 line) in million",
      "Revenue from KSP in million",
    ],
    weight: 30,
    status: "not_submitted",
  },
  {
    id: "2",
    title: "Implement a training platform throughout three divisions.",
    kpis: [
      "Employee training completion rate",
      "Average training score",
      "Training hours per employee",
      "Feedback score",
    ],
    weight: 13,
    status: "not_submitted",
  },
  {
    id: "3",
    title: "Deploy a learning management system across 3 departments.",
    kpis: ["System adoption rate", "User satisfaction"],
    weight: 17,
    status: "not_submitted",
  },
  {
    id: "4",
    title: "Implement a training platform throughout three divisions.",
    kpis: [
      "Employee training completion rate",
      "Average training score",
      "Training hours per employee",
    ],
    weight: 20,
    status: "not_submitted",
  },
  {
    id: "5",
    title: "Deploy a learning management system across 3 departments.",
    kpis: [
      "System adoption rate",
      "User satisfaction",
      "Course completion rate",
    ],
    weight: 20,
    status: "not_submitted",
  },
  {
    id: "6",
    title: "Enhance customer satisfaction through service improvement",
    kpis: [
      "Customer satisfaction score",
      "Response time improvement",
      "Service quality rating",
    ],
    weight: 25,
    status: "pending",
  },
  {
    id: "7",
    title: "Optimize operational efficiency across all departments",
    kpis: [
      "Process automation rate",
      "Cost reduction percentage",
      "Productivity index",
    ],
    weight: 18,
    status: "approved",
  },
  {
    id: "8",
    title: "Strengthen cybersecurity infrastructure",
    kpis: ["Security incidents reduction", "Compliance score", "System uptime"],
    weight: 22,
    status: "rejected",
  },
];

export default function ObjectivesApprovalTable() {
  const [objectives, setObjectives] = useState(mockObjectives);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading] = useState(false);
  const [error] = useState<string | undefined>(undefined);

  const itemsPerPage = 10;

  // Filter objectives based on search and status
  const filteredObjectives = useMemo(() => {
    return objectives.filter((obj) => {
      const matchesSearch = obj.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || obj.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [objectives, searchTerm, statusFilter]);

  // Paginated objectives
  const paginatedObjectives = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredObjectives.slice(startIndex, endIndex);
  }, [filteredObjectives, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredObjectives.length / itemsPerPage);

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allPageIds = paginatedObjectives.map((obj) => obj.id);
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

  const handleSubmitForApproval = () => {
    setObjectives((prev) =>
      prev.map((o) =>
        selected.includes(o.id) ? { ...o, status: "pending" } : o
      )
    );
    setSelected([]);
  };

  const handleAddObjective = () => {
    // TODO: Implement add objective logic
    console.log("Add objective clicked");
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
    setSelectedObjective(objective);
  };

  if (selectedObjective) {
    return (
      <KPIDetailsView
        objective={selectedObjective}
        onBack={() => setSelectedObjective(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6">
      {/* Filter Bar */}
      <ObjectiveFilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onClearFilters={handleClearFilters}
        selectedCount={selected.length}
        onAddObjective={handleAddObjective}
      />

      {/* Results Summary */}

      {/* Table */}
      <ObjectiveTable
        objectives={paginatedObjectives}
        selected={selected}
        expanded={expanded}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onExpand={handleExpand}
        onObjectiveClick={handleObjectiveClick}
        loading={loading}
        error={error}
      />
      <div className="text-sm text-gray-600">
        Showing {filteredObjectives.length} of {objectives.length} objectives
      </div>

      {/* Submit Button */}
      {selected.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitForApproval}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Submit {selected.length} objective{selected.length > 1 ? "s" : ""}{" "}
            for Approval
          </Button>
        </div>
      )}

      {/* Pagination */}
      <ObjectivePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredObjectives.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </div>
  );
}
