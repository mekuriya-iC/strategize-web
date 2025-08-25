"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import React from "react";
import ObjectiveFilterBar from "./ObjectiveFilterBar";
import ObjectiveTable, { Objective } from "./ObjectiveTable";
// import EditObjectiveDialog from "./EditObjectiveDialog";
import ObjectivePagination from "./ObjectivePagination";
import { useObjectives } from "@/hooks/useObjectives";
import type { ObjectivesQueryVariables } from "@/types/graphql";
import { useObjectiveMutations } from "@/hooks/useObjectiveMutations";
import { useKPIs } from "@/hooks/useKPIs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOrgUnit } from "@/context/OrgUnitContext";
import { useUser } from "@/context/UserContext";
import { useUserDepartments } from "@/hooks/useUserDepartments";
import { useDepartmentSelection } from "@/context/DepartmentSelectionContext";
import { useQuery } from "@apollo/client";
import {
  GET_KPI_SUBMISSIONS,
  GET_PENDING_SUBMISSIONS,
} from "@/lib/graphql/queries/submissions";
import BulkSubmitDialog from "../submissions/BulkSubmitDialog";

export default function ObjectivesApprovalTable() {
  const router = useRouter();
  const { user } = useUser();
  const { selectedUnit } = useOrgUnit();
  const { departmentNames } = useUserDepartments();
  const { selected: selectedDepartment } = useDepartmentSelection();
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Determine the assigneeId based on the user role and selected organizational unit
  const getAssigneeId = (): string | undefined => {
    if (user?.role === "MANAGER" && selectedUnit) {
      // For managers, show objectives assigned to their selected unit
      if (selectedUnit.__typename === "Division") {
        return (selectedUnit as { __typename: "Division"; divisionId: string })
          .divisionId;
      } else {
        return (
          selectedUnit as { __typename: "Department"; departmentId: string }
        ).departmentId;
      }
    } else if (user?.role === "NORMAL") {
      // For employees, show objectives assigned to them personally
      return user.employeeId;
    }
    return undefined;
  };

  const assigneeId = getAssigneeId();

  // Prepare query variables to avoid undefined-assigned optionals
  const objectivesQueryVars: ObjectivesQueryVariables = useMemo(() => {
    const vars: ObjectivesQueryVariables = {
      page: 1,
      limit: 1000,
    };
    if (searchTerm) {
      vars.search = searchTerm;
    }
    if (assigneeId) {
      vars.assigneeId = assigneeId;
    }
    return vars;
  }, [assigneeId, searchTerm]);

  // Fetch a large set and paginate client-side for predictable counts
  const { objectives, loading, error, /* meta, */ refetch } =
    useObjectives(objectivesQueryVars);

  // Fetch a broad set of objectives for lookup (to resolve parent KPI names in expanded rows)
  // This avoids missing parent corporate objectives when the view is scoped to a unit
  const { objectives: allObjectivesForLookup } = useObjectives({
    page: 1,
    limit: 1000,
  });

  // Fetch KPIs from API (large page so per-objective counts are correct)
  const { kpis, loading: kpisLoading } = useKPIs({
    page: 1,
    limit: 1000,
  });

  // Fetch KPI submissions specifically to get rejection reasons
  const { data: kpiSubmissionsData1 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DIVISION" },
  });
  const { data: kpiSubmissionsData2 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DEPARTMENT" },
  });
  const { data: kpiSubmissionsData3 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "PERSONNEL" },
  });

  // Fetch objective submissions to get rejection reasons for objectives
  const { data: objectiveSubmissionsData1 } = useQuery(
    GET_PENDING_SUBMISSIONS,
    {
      variables: { page: 1, limit: 1000, type: "DIVISION" },
    }
  );
  const { data: objectiveSubmissionsData2 } = useQuery(
    GET_PENDING_SUBMISSIONS,
    {
      variables: { page: 1, limit: 1000, type: "DEPARTMENT" },
    }
  );
  const { data: objectiveSubmissionsData3 } = useQuery(
    GET_PENDING_SUBMISSIONS,
    {
      variables: { page: 1, limit: 1000, type: "PERSONNEL" },
    }
  );

  // Build rejection reasons maps for Objectives and KPIs
  const { objectiveRejectionReasons, kpiRejectionReasons } = useMemo(() => {
    const objectiveReasons: Record<string, string> = {};
    const kpiReasons: Record<string, string> = {};

    // Combine all submission data (both KPI and objective submissions)
    const submissionsData = {
      submissions: {
        items: [
          ...(kpiSubmissionsData1?.submissions?.items || []),
          ...(kpiSubmissionsData2?.submissions?.items || []),
          ...(kpiSubmissionsData3?.submissions?.items || []),
          ...(objectiveSubmissionsData1?.submissions?.items || []),
          ...(objectiveSubmissionsData2?.submissions?.items || []),
          ...(objectiveSubmissionsData3?.submissions?.items || []),
        ],
      },
    };

    const allSubmissions = submissionsData?.submissions?.items || [];

    console.log("🔍 Building rejection reasons from submissions:", {
      totalSubmissions: allSubmissions.length,
      submissions: allSubmissions.map(
        (sub: {
          submissionId: string;
          type: "OBJECTIVE" | "KPI";
          status: string;
          reason?: string;
          kpi?: { kpiId: string } | null;
          objective?: { objectiveId: string } | null;
        }) => ({
          submissionId: sub.submissionId,
          type: sub.type,
          status: sub.status,
          reason: sub.reason,
          kpiId: sub.kpi?.kpiId,
          objectiveId: sub.objective?.objectiveId,
        })
      ),
    });

    allSubmissions.forEach(
      (submission: {
        status: string;
        reason?: string;
        type: "OBJECTIVE" | "KPI";
        kpi?: { kpiId: string } | null;
        objective?: { objectiveId: string } | null;
      }) => {
        if (submission.status !== "REJECTED" || !submission.reason) return;

        // console.log("🔍 Processing rejected submission:", {
        //   submissionId: submission.submissionId,
        //   type: submission.type,
        //   status: submission.status,
        //   reason: submission.reason,
        //   kpiId: submission.kpi?.kpiId,
        //   objectiveId: submission.objective?.objectiveId,
        // });

        if (submission.type === "KPI" && submission.kpi?.kpiId) {
          // Direct KPI submission rejection
          kpiReasons[submission.kpi.kpiId] = submission.reason as string;
          console.log("✅ Mapped KPI rejection reason:", {
            kpiId: submission.kpi.kpiId,
            reason: submission.reason,
          });
        } else if (submission.type === "OBJECTIVE") {
          const objId = (submission.objective?.objectiveId || "") as string;
          // Store reason for the objective itself
          objectiveReasons[objId] = submission.reason as string;
          console.log("✅ Mapped objective rejection reason:", {
            objectiveId: objId,
            reason: submission.reason,
          });
          // Also map the same reason to any rejected KPIs under that objective
          kpis
            .filter((k) => k.objective?.objectiveId === objId)
            .forEach((k) => {
              if (k.status === "REJECTED") {
                kpiReasons[k.kpiId] = submission.reason as string;
                console.log("✅ Mapped objective KPI rejection reason:", {
                  kpiId: k.kpiId,
                  reason: submission.reason,
                });
              }
            });
        }
      }
    );

    console.log("📋 Final rejection reasons maps:", {
      objectiveRejectionReasons: objectiveReasons,
      kpiRejectionReasons: kpiReasons,
    });

    return {
      objectiveRejectionReasons: objectiveReasons,
      kpiRejectionReasons: kpiReasons,
    };
  }, [
    kpiSubmissionsData1,
    kpiSubmissionsData2,
    kpiSubmissionsData3,
    objectiveSubmissionsData1,
    objectiveSubmissionsData2,
    objectiveSubmissionsData3,
    kpis,
  ]);

  // Mutations
  const {
    // updateObjective,
    // removeObjective,
    // loading: mutationLoading,
  } = useObjectiveMutations();

  // Filter objectives based on status and user role
  const filteredObjectives = useMemo(() => {
    let filtered = objectives;

    // Role-based filtering
    if (user?.role === "NORMAL") {
      // Employees: rely on assigneeId filtering only.
      // Some backends create employee-assigned children with the parent's type
      // (e.g., DEPARTMENT), so filtering strictly by type would hide them.
      // Do not filter by obj.type here.
    } else if (user?.role === "MANAGER") {
      // Managers can see all objectives assigned to their units
      // No additional filtering needed as assigneeId handles this
    } else {
      // For admins/super admins, filter out assigned objectives (children) when not in unit context
      if (!assigneeId) {
        filtered = filtered.filter((obj) => !obj.parent);
      }
    }

    // Apply status filter
    if (statusFilter === "all") {
      return filtered;
    }
    // Map UI filter values to server enum
    const mapped = statusFilter
      .toUpperCase()
      .replace("NOT_SUBMITTED", "NOT_SUBMITTED") as
      | "NOT_SUBMITTED"
      | "PENDING"
      | "APPROVED"
      | "REJECTED";
    return filtered.filter((obj) => obj.status === mapped);
  }, [objectives, statusFilter, user?.role, assigneeId]);

  // Client-side pagination after filtering
  const totalItems = filteredObjectives.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedObjectives = filteredObjectives.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allPageIds = pagedObjectives.map((obj) => obj.objectiveId);
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

  // Prepare data for bulk submission
  const selectedObjectivesForSubmission = useMemo(() => {
    return filteredObjectives
      .filter(
        (obj) =>
          selected.includes(obj.objectiveId) &&
          obj.status === "NOT_SUBMITTED" &&
          obj.type !== "CORPORATE"
      )
      .map((obj) => ({
        itemId: obj.objectiveId,
        itemName: obj.name,
        objectiveType: obj.type,
        itemType: "objective" as const,
      }));
  }, [filteredObjectives, selected]);

  const handleBulkSubmitSuccess = () => {
    setSelected([]);
    toast.success(
      `${selectedObjectivesForSubmission.length} objective(s) submitted for approval`
    );
  };

  const handleAddObjective = () => {
    // Only allow admin and super admin users to add objectives
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
      router.push("/dashboard/objectives/new");
    } else {
      toast.error("You don't have permission to add objectives");
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
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleRowsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
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

  const handleAssignSuccess = async () => {
    // After assignment succeeds, refresh the objectives list
    await refetch();
  };

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6">
      {/* Context Header for Employees */}
      {user?.role === "NORMAL" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            My Personal Objectives
          </h2>
          <p className="text-sm text-blue-700">
            These are objectives assigned to you by your manager. You can create
            KPIs for these objectives and submit them for approval.
          </p>
          {(selectedDepartment?.department || departmentNames.length > 0) && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                <span className="font-medium">
                  {departmentNames.length > 1 ? "Working in:" : "Department:"}
                </span>{" "}
                {selectedDepartment?.department?.name ||
                  departmentNames.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <ObjectiveFilterBar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        selectedCount={selected.length}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onClearFilters={handleClearFilters}
        onAddObjective={handleAddObjective}
        showAddButton={user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"}
      />

      {/* Summary */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            {`Showing ${totalItems > 0 ? startIndex + 1 : 0}-${Math.min(
              startIndex + itemsPerPage,
              totalItems
            )} of ${totalItems} objectives`}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedObjectivesForSubmission.length > 0 && (
            <BulkSubmitDialog
              items={selectedObjectivesForSubmission}
              itemType="objectives"
              onSubmitSuccess={handleBulkSubmitSuccess}
            >
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Submit {selectedObjectivesForSubmission.length} for Approval
              </Button>
            </BulkSubmitDialog>
          )}
        </div>
      </div>

      {/* Table */}
      <ObjectiveTable
        objectives={pagedObjectives}
        allObjectives={allObjectivesForLookup} // Use broad set to resolve parent KPI names
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
        onAssignSuccess={handleAssignSuccess}
        loading={loading || kpisLoading}
        error={error?.message}
        objectiveRejectionReasons={objectiveRejectionReasons}
        kpiRejectionReasons={kpiRejectionReasons}
        childQuartersByParentId={(function () {
          try {
            // Build child quarters map for corporate objectives
            const map: Record<
              string,
              Record<
                string,
                { q1?: number; q2?: number; q3?: number; q4?: number }
              >
            > = {};

            // For each corporate objective in the current page
            pagedObjectives.forEach((obj) => {
              if (obj.type !== "CORPORATE") return;

              // Find all child objectives that inherit from this corporate objective
              const childObjectives = allObjectivesForLookup.filter(
                (childObj) => childObj.parent?.objectiveId === obj.objectiveId
              );

              // Get corporate KPIs for this objective
              const corporateKpis = kpis.filter(
                (k) => k.objective?.objectiveId === obj.objectiveId
              );

              // For each corporate KPI, collect quarters from all child KPIs
              corporateKpis.forEach((corporateKpi, kpiIndex) => {
                const yearQuartersMap: Record<
                  string,
                  { q1?: number; q2?: number; q3?: number; q4?: number }
                > = {};

                // Collect quarterly data from all child objectives for this KPI index
                childObjectives.forEach((childObj) => {
                  const childKpis = kpis.filter(
                    (k) => k.objective?.objectiveId === childObj.objectiveId
                  );
                  const childKpi = childKpis[kpiIndex]; // Match by index

                  if (childKpi?.targets) {
                    childKpi.targets.forEach((target) => {
                      const parts = target.timeline.split("-");
                      if (parts.length === 2) {
                        const [year, quarter] = parts;
                        if (quarter.startsWith("Q")) {
                          if (!yearQuartersMap[year]) {
                            yearQuartersMap[year] = {};
                          }
                          const quarterNum = quarter.toLowerCase() as
                            | "q1"
                            | "q2"
                            | "q3"
                            | "q4";
                          yearQuartersMap[year][quarterNum] =
                            (yearQuartersMap[year][quarterNum] || 0) +
                            Number(target.target || 0);
                        }
                      }
                    });
                  }
                });

                map[corporateKpi.kpiId] = yearQuartersMap;
              });
            });

            return map;
          } catch (error) {
            console.error("Error building childQuartersByParentId:", error);
            return {};
          }
        })()}
      />

      {/* Pagination */}
      {totalPages > 0 && (
        <ObjectivePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </div>
  );
}
