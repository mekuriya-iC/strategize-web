"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import React from "react";
import ObjectiveFilterBar from "./ObjectiveFilterBar";
import ObjectiveTable, { Objective } from "@/components/features/objectives/ObjectiveTable";
// import EditObjectiveDialog from "./EditObjectiveDialog";
import DataTablePagination from "@/components/shared/DataTablePagination";
import { useObjectives } from "@/hooks/objectives/useObjectives";
import type { ObjectivesQueryVariables } from "@/types/graphql";
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";
import { useKPIs } from "@/hooks/objectives/useKPIs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore, useOrgUnitStore } from "@/stores";
import { useUserDepartments } from "@/hooks/org-structure/useUserDepartments";
import { useDepartmentSelection } from "@/context/DepartmentSelectionContext";
import { useQuery } from "@apollo/client";
import {
  GET_KPI_SUBMISSIONS,
  GET_PENDING_SUBMISSIONS,
} from "@/lib/graphql/queries/submissions";
import BulkSubmitDialog from "../submissions/BulkSubmitDialog";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { useSelectedStrategicPeriod } from "@/stores/strategicPeriodStore";
import { Building2 } from "lucide-react";

export default function ObjectivesApprovalTable() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);
  const { departmentNames } = useUserDepartments();
  const { selected: selectedDepartment } = useDepartmentSelection();
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  // State for optimistic ordering updates
  const [orderedObjectives, setOrderedObjectives] = useState<Objective[] | null>(null);
  const [activeTab, setActiveTab] = useState<string>("corporate");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({
    key: "createdAt",
    direction: "desc"
  });
  const selectedPeriod = useSelectedStrategicPeriod();

  const showTabs = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "DIRECTOR" || user?.role === "MANAGER";
  const isCorporateRole = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Use RBAC permissions
  const { guards, objectives: objectivePermissions, scope } = usePermissions();

  // Set default tab based on role once
  const [hasSetDefaultTab, setHasSetDefaultTab] = useState(false);
  React.useEffect(() => {
    if (hasSetDefaultTab) return;

    if (guards.isDirector) {
      setActiveTab("division");
      setHasSetDefaultTab(true);
    } else if (guards.isManager) {
      setActiveTab("department");
      setHasSetDefaultTab(true);
    } else if (guards.isEmployee) {
      setActiveTab("personnel");
      setHasSetDefaultTab(true);
    } else if (isCorporateRole) {
      setActiveTab("corporate");
      setHasSetDefaultTab(true);
    }
  }, [guards, isCorporateRole, hasSetDefaultTab]);

  // Determine the assigneeId based on the user role and selected organizational unit
  const getAssigneeId = (): string | undefined => {
    if (guards.isManager && selectedUnit) {
      // For managers, show objectives assigned to their selected unit
      return selectedUnit.id;
    } else if (guards.isEmployee) {
      // For employees, show objectives assigned to them personally
      return user?.employeeId;
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

  // Fetch Divisions for names lookup
  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
    skip: !showTabs
  });

  // Fetch Departments for names lookup
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    skip: !showTabs
  });

  // Fetch Employees for names lookup
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: !showTabs
  });

  // Build names lookup map
  const unitNames = useMemo(() => {
    const map: Record<string, string> = {};
    divisionsData?.divisions?.items?.forEach((d: any) => { map[d.divisionId] = d.name; });
    departmentsData?.departments?.items?.forEach((d: any) => { map[d.departmentId] = d.name; });
    employeesData?.employees?.items?.forEach((e: any) => { map[e.employeeId] = e.fullName; });
    return map;
  }, [divisionsData, departmentsData, employeesData]);

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
    console.log("[ObjectivesApprovalTable] Starting filtering...");
    let filtered = objectives;

    // First, handle role-based scope filtering with strict hierarchical alignment
    if (guards.isEmployee) {
      filtered = filtered.filter((obj) => {
        if (obj.type === "PERSONNEL") return obj.assigneeId === user?.employeeId;
        if (obj.type === "DEPARTMENT") return !obj.parent; // Show context
        return false;
      });
    } else if (guards.isManager) {
      const myDeptIds = scope?.managedDepartmentIds || [];
      filtered = filtered.filter((obj) => {
        if (obj.type === "DEPARTMENT") return myDeptIds.includes(obj.assigneeId || "");
        if (obj.type === "PERSONNEL") {
          // Trace parent - must belong to manager's departments
          const parentObj = objectives.find(o => o.objectiveId === obj.parent?.objectiveId);
          return parentObj && parentObj.type === "DEPARTMENT" && myDeptIds.includes(parentObj.assigneeId || "");
        }
        if (obj.type === "DIVISION") return !obj.parent; // Context
        return false;
      });
    } else if (guards.isDirector) {
      const myDivIds = scope?.managedDivisionIds || [];
      filtered = filtered.filter((obj) => {
        if (obj.type === "DIVISION") return myDivIds.includes(obj.assigneeId || "");

        // trace recursive parentage
        const isDescendantOfMyDiv = (currentObj: Objective): boolean => {
          if (!currentObj.parent) return false;
          const parentObj = objectives.find(o => o.objectiveId === currentObj.parent?.objectiveId);
          if (!parentObj) return false;
          if (parentObj.type === "DIVISION" && myDivIds.includes(parentObj.assigneeId || "")) return true;
          return isDescendantOfMyDiv(parentObj);
        };

        if (obj.type === "DEPARTMENT" || obj.type === "PERSONNEL") {
          return isDescendantOfMyDiv(obj);
        }

        if (obj.type === "CORPORATE") return !obj.parent; // Context
        return false;
      });
    } else {
      // ADMIN/SUPER_ADMIN see everything
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (obj) =>
          obj.name?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const mapped = statusFilter.toUpperCase() as any;
      filtered = filtered.filter((obj) => obj.status === mapped);
    }

    // Apply strategic period filter
    if (selectedPeriod) {
      filtered = filtered.filter(
        (obj) => obj.strategicPeriod?.strategicPeriodId === selectedPeriod.strategicPeriodId
      );
    }

    return filtered;
  }, [objectives, statusFilter, searchTerm, guards, user?.employeeId, scope, selectedPeriod]);

  // Sort objectives by order field
  const sortedObjectives = useMemo(() => {
    const objectivesToSort = orderedObjectives || filteredObjectives;
    return [...objectivesToSort].sort((a, b) => {
      const orderA = (a as Objective & { order?: number }).order ?? Infinity;
      const orderB = (b as Objective & { order?: number }).order ?? Infinity;
      return orderA - orderB;
    });
  }, [filteredObjectives, orderedObjectives]);

  // Reset ordered objectives when filtered objectives change
  React.useEffect(() => {
    setOrderedObjectives(null);
  }, [filteredObjectives]);

  // Determine if sorting is enabled (only for users who can edit)
  const canEnableSorting = useMemo(() => {
    // Enable sorting for admins and directors with edit permission
    return guards.isAdmin || guards.isSuperAdmin || guards.isDirector || guards.isManager;
  }, [guards]);

  // Handle order change (optimistic update)
  const handleOrderChange = (newOrderedObjectives: Objective[]) => {
    setOrderedObjectives(newOrderedObjectives);
  };

  // Client-side pagination after filtering and sorting
  const totalItems = sortedObjectives.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedObjectives = sortedObjectives.slice(
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
          (obj.status === "NOT_SUBMITTED" || obj.status === "REJECTED") &&
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
    // Only allow users with objective creation permission
    if (objectivePermissions.creatableTypes.length > 0) {
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

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  // Group objectives by type for corporate tabs
  const corporateObjectives = useMemo(() => filteredObjectives.filter(o => o.type === "CORPORATE"), [filteredObjectives]);
  const divisionObjectives = useMemo(() => filteredObjectives.filter(o => o.type === "DIVISION"), [filteredObjectives]);
  const departmentObjectives = useMemo(() => filteredObjectives.filter(o => o.type === "DEPARTMENT"), [filteredObjectives]);
  const personnelObjectives = useMemo(() => filteredObjectives.filter(o => o.type === "PERSONNEL"), [filteredObjectives]);

  // Calculate cumulative weight for the current level (tab)
  const cumulativeTabWeight = useMemo(() => {
    const group =
      activeTab === "corporate" ? corporateObjectives :
        activeTab === "division" ? divisionObjectives :
          activeTab === "department" ? departmentObjectives :
            personnelObjectives;

    return group.reduce((total, obj) => {
      const objKPIs = kpis.filter(k => k.objective?.objectiveId === obj.objectiveId);
      return total + objKPIs.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
    }, 0);
  }, [activeTab, corporateObjectives, divisionObjectives, departmentObjectives, personnelObjectives, kpis]);

  const getPagedObjectivesForTab = (group: Objective[]) => {
    const total = group.length;
    const currentTabTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const start = (currentPage - 1) * itemsPerPage;
    return group.slice(start, start + itemsPerPage);
  };

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6">
      {/* Context Header for Employees */}
      {guards.isEmployee && (
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

      {/* Hierarchical Level Tabs and Global Weight Tracker */}
      {showTabs && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-gray-100 shadow-sm sticky top-0 z-10">
            <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
              {["corporate", "division", "department", "personnel"].filter(tab => {
                if (isCorporateRole) return true;
                if (guards.isDirector) return ["division", "department", "personnel"].includes(tab);
                if (guards.isManager) return ["department", "personnel"].includes(tab);
                return false;
              }).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-6 py-2.5 text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 ${activeTab === tab
                    ? "bg-blue-600 text-white shadow-md transform scale-105"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Objectives
                </button>
              ))}
            </div>

            {/* Level Weight Progress Tracker - Only show for non-grouped view (Corporate) */}
            {activeTab === "corporate" && (
              <div className="flex flex-col gap-1 min-w-[200px] px-2">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider">
                  <span className={cumulativeTabWeight > 100 ? "text-red-600" : "text-gray-500"}>
                    STRATEGIC WEIGHT BUDGET
                  </span>
                  <span className={cumulativeTabWeight > 100 ? "text-red-600 font-bold animate-pulse" : "text-blue-600"}>
                    {cumulativeTabWeight.toFixed(1)}% / 100%
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner border border-gray-100">
                  <div
                    className={`h-full transition-all duration-500 ease-out rounded-full ${cumulativeTabWeight > 100 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"}`}
                    style={{ width: `${Math.min(cumulativeTabWeight, 105)}%` }}
                  />
                </div>
                {cumulativeTabWeight > 100 && (
                  <p className="text-[10px] text-red-500 font-medium text-right">
                    ⚠️ Cumulative limit exceeded!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info Card for Directors/Managers */}
      {(guards.isDirector || guards.isManager) && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-2">
            {guards.isDirector ? "Division Manager" : "Department Manager"} - Debug Info
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-purple-800">User Role:</p>
              <p className="text-purple-700">{user?.role}</p>
            </div>
            <div>
              <p className="font-medium text-purple-800">User ID:</p>
              <p className="text-purple-700">{user?.employeeId}</p>
            </div>
            {guards.isDirector && (
              <>
                <div>
                  <p className="font-medium text-purple-800">Managed Division IDs:</p>
                  <p className="text-purple-700">
                    {scope?.managedDivisionIds?.length ?
                      scope.managedDivisionIds.join(", ") :
                      "⚠️ EMPTY - This is why you see no objectives!"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-purple-800">Division Objectives Assigned to Me:</p>
                  <p className="text-purple-700">
                    {objectives.filter(o =>
                      o.type === "DIVISION" &&
                      o.assigneeId &&
                      scope?.managedDivisionIds?.includes(o.assigneeId)
                    ).length}
                  </p>
                </div>
              </>
            )}
            {guards.isManager && (
              <>
                <div>
                  <p className="font-medium text-purple-800">Managed Department IDs:</p>
                  <p className="text-purple-700">
                    {scope?.managedDepartmentIds?.length ?
                      scope.managedDepartmentIds.join(", ") :
                      "⚠️ EMPTY - This is why you see no objectives!"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-purple-800">Department Objectives Assigned to Me:</p>
                  <p className="text-purple-700">
                    {objectives.filter(o =>
                      o.type === "DEPARTMENT" &&
                      o.assigneeId &&
                      scope?.managedDepartmentIds?.includes(o.assigneeId)
                    ).length}
                  </p>
                </div>
              </>
            )}
            <div className="col-span-2">
              <p className="font-medium text-purple-800">Total Objectives in Database:</p>
              <p className="text-purple-700">{objectives.length}</p>
            </div>
            <div className="col-span-2">
              <p className="font-medium text-purple-800">Filtered Objectives (What you see):</p>
              <p className="text-purple-700">{filteredObjectives.length}</p>
            </div>
          </div>
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
        showAddButton={objectivePermissions.creatableTypes.length > 0}
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
        objectives={showTabs ?
          (activeTab === "corporate" ? getPagedObjectivesForTab(corporateObjectives) :
            activeTab === "division" ? getPagedObjectivesForTab(divisionObjectives) :
              activeTab === "department" ? getPagedObjectivesForTab(departmentObjectives) :
                getPagedObjectivesForTab(personnelObjectives)) :
          pagedObjectives}
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
        enableSorting={canEnableSorting && activeTab === "corporate"}
        onOrderChange={handleOrderChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        groupBy={showTabs ?
          (activeTab === "corporate" ? "none" :
            activeTab === "division" ? "division" :
              activeTab === "department" ? "department" :
                "personnel") : "none"}
        unitNames={unitNames}
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
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          loading={loading || kpisLoading}
          itemName="objectives"
        />
      )}
    </div>
  );
}
