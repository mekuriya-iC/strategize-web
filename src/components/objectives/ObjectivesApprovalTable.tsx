"use client";
import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import React from "react";
import ObjectiveFilterBar from "./ObjectiveFilterBar";
import ObjectiveTable, {
  Objective,
} from "@/components/features/objectives/ObjectiveTable";
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
import { isTopLevelCorporateObjective } from "@/lib/objectives/kpiWeightScope";
import {
  kpiSubmissionsQueryVariables,
  objectiveSubmissionsQueryVariables,
} from "@/hooks/submissions/submissionQueryVariables";
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
  const [orderedObjectives, setOrderedObjectives] = useState<
    Objective[] | null
  >(null);
  const [activeTab, setActiveTab] = useState<string>("corporate");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>({
    key: "createdAt",
    direction: "desc",
  });
  const selectedPeriod = useSelectedStrategicPeriod();
  const selectedPeriodId = selectedPeriod?.strategicPeriodId;
  const selectedPeriodLabel =
    selectedPeriod?.name || "the selected period/quarter";

  const showTabs =
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "DIRECTOR" ||
    user?.role === "MANAGER";
  const isCorporateRole =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Use RBAC permissions
  const { guards, objectives: objectivePermissions, scope } = usePermissions();

  // Extract stable values from complex objects to avoid unnecessary re-renders
  const userRole = user?.role;
  const userEmployeeId = user?.employeeId;
  const selectedUnitId = selectedUnit?.id;
  const selectedUnitType = selectedUnit?.type;
  const managedDepartmentIds = scope?.managedDepartmentIds;
  const managedDivisionIds = scope?.managedDivisionIds;
  const isAdmin = guards.isAdmin;
  const isSuperAdmin = guards.isSuperAdmin;
  const isDirector = guards.isDirector;
  const isManager = guards.isManager;
  const isEmployee = guards.isEmployee;

  // Determine the assigneeId based on the user role and selected organizational unit
  const getAssigneeId = (): string | undefined => {
    if (isManager && selectedUnit) {
      // For managers, show objectives assigned to their selected unit
      return selectedUnit.id;
    } else if (isEmployee) {
      // For employees, show objectives assigned to them personally
      return userEmployeeId;
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
    // Only filter at API level for employees (personnel)
    // Managers, Directors, and Admins fetch all objectives and filter on frontend
    // This allows them to see hierarchical objectives (parent + children)
    if (isEmployee && assigneeId) {
      vars.assigneeId = assigneeId;
    }

    console.log("🔍 [ObjectivesQuery] Query variables", {
      vars,
      userRole: userRole,
      isEmployee: isEmployee,
      assigneeId: assigneeId,
    });

    return vars;
  }, [assigneeId, searchTerm, isEmployee]);

  // Fetch a large set and paginate client-side for predictable counts
  const pathname = usePathname();
  const { objectives, loading, error, /* meta, */ refetch } =
    useObjectives(objectivesQueryVars);

  // Refresh when landing on objectives, after login, or when user context changes.
  useEffect(() => {
    if (pathname === "/dashboard/objectives" && userEmployeeId) {
      refetch();
    }
  }, [pathname, userEmployeeId, refetch]);

  console.log("🔍 [ObjectivesQuery] API Response", {
    count: objectives.length,
    loading,
    error: error?.message,
    objectives: objectives.map((o) => ({
      id: o.objectiveId,
      title: o.title,
      type: o.type,
      assigneeType: o.assigneeType,
      assigneeId: o.assigneeId,
      periodId: o.strategicPeriod?.strategicPeriodId,
      periodStartDate: o.strategicPeriod?.startDate,
    })),
  });

  // Fetch a broad set of objectives for lookup (to resolve parent KPI names in expanded rows)
  // This avoids missing parent corporate objectives when the view is scoped to a unit
  const {
    objectives: allObjectivesForLookup,
    refetch: refetchAllObjectivesForLookup,
  } = useObjectives({
    page: 1,
    limit: 1000,
  });

  // Fetch KPIs from API (large page so per-objective counts are correct)
  const {
    kpis,
    loading: kpisLoading,
    refetch: refetchKpis,
  } = useKPIs({
    page: 1,
    limit: 1000,
  });

  // Period/quarter changes are stored globally in the topbar selector. Refetch
  // and clear local table state so the objectives dashboard responds without a
  // manual page refresh.
  useEffect(() => {
    if (pathname !== "/dashboard/objectives" || !userEmployeeId) return;

    setOrderedObjectives(null);
    setSelected([]);
    setExpanded(null);
    setCurrentPage(1);

    refetch();
    refetchAllObjectivesForLookup();
    refetchKpis();
  }, [
    pathname,
    userEmployeeId,
    selectedPeriodId,
    refetch,
    refetchAllObjectivesForLookup,
    refetchKpis,
  ]);

  // Fetch KPI submissions specifically to get rejection reasons
  const { data: kpiSubmissionsData1 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: kpiSubmissionsQueryVariables("DIVISION"),
  });
  const { data: kpiSubmissionsData2 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: kpiSubmissionsQueryVariables("DEPARTMENT"),
  });
  const { data: kpiSubmissionsData3 } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: kpiSubmissionsQueryVariables("PERSONNEL"),
  });

  // Fetch objective submissions to get rejection reasons for objectives
  const { data: objectiveSubmissionsData1 } = useQuery(
    GET_PENDING_SUBMISSIONS,
    {
      variables: objectiveSubmissionsQueryVariables("DIVISION"),
    },
  );
  const { data: objectiveSubmissionsData2 } = useQuery(
    GET_PENDING_SUBMISSIONS,
    {
      variables: objectiveSubmissionsQueryVariables("DEPARTMENT"),
    },
  );
  const { data: objectiveSubmissionsData3 } = useQuery(
    GET_PENDING_SUBMISSIONS,
    {
      variables: objectiveSubmissionsQueryVariables("PERSONNEL"),
    },
  );

  // Fetch Divisions for names lookup
  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
    skip: !showTabs,
  });

  // Fetch Departments for names lookup
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    skip: !showTabs,
  });

  // Fetch Employees for names lookup - Only for admins (backend restricts this)
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: !showTabs || !(guards.isAdmin || guards.isSuperAdmin), // Skip for non-admins
  });

  // Build names lookup map
  const unitNames = useMemo(() => {
    const map: Record<string, string> = {};
    divisionsData?.divisions?.items?.forEach((d: any) => {
      map[d.divisionId] = d.name;
    });
    departmentsData?.departments?.items?.forEach((d: any) => {
      map[d.departmentId] = d.name;
    });
    employeesData?.employees?.items?.forEach((e: any) => {
      map[e.employeeId] = e.fullName;
    });
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

    // Building rejection reasons from submissions
    // Total submissions: ${allSubmissions.length}
    const submissionMappings = allSubmissions.map(
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
      }),
    );

    allSubmissions.forEach(
      (submission: {
        status: string;
        reason?: string;
        type: "OBJECTIVE" | "KPI";
        kpi?: { kpiId: string } | null;
        objective?: { objectiveId: string } | null;
      }) => {
        if (submission.status !== "REJECTED" || !submission.reason) return;

        if (submission.type === "KPI" && submission.kpi?.kpiId) {
          // Direct KPI submission rejection
          kpiReasons[submission.kpi.kpiId] = submission.reason as string;
          // Mapped KPI rejection reason for ${submission.kpi.kpiId}
        } else if (submission.type === "OBJECTIVE") {
          const objId = (submission.objective?.objectiveId || "") as string;
          // Store reason for the objective itself
          objectiveReasons[objId] = submission.reason as string;
          // Mapped objective rejection reason for ${objId}
          // Also map the same reason to any rejected KPIs under that objective
          kpis
            .filter((k) => k.objective?.objectiveId === objId)
            .forEach((k) => {
              if (k.status === "REJECTED") {
                kpiReasons[k.kpiId] = submission.reason as string;
                // Mapped objective KPI rejection reason for ${k.kpiId}
              }
            });
        }
      },
    );

    // Final rejection reasons maps built

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
    console.log("🔍 [ObjectivesFilter] Starting filtering process", {
      totalObjectives: objectives.length,
      userRole: userRole,
      selectedUnitId: selectedUnitId,
      selectedPeriodId: selectedPeriodId,
    });

    // Starting objectives filtering
    let filtered = objectives;

    // Filter out objectives with NULL assigneeId (broken data)
    // Only show objectives that have proper assignment data
    filtered = filtered.filter((obj) => {
      // Corporate objectives without assignment are OK (top-level, no assigneeType/assigneeId)
      if (!obj.assigneeType && !obj.assigneeId) {
        return true;
      }

      // For ADMIN/SUPER_ADMIN: Show all objectives, even unassigned ones
      if (isAdmin || isSuperAdmin) {
        return true;
      }

      // For other roles: Filter out objectives with assigneeType but no assigneeId
      if (obj.assigneeType && !obj.assigneeId) {
        return false; // Broken data - has type but no ID
      }
      return true;
    });

    console.log("🔍 [ObjectivesFilter] After NULL assigneeId filter", {
      count: filtered.length,
      objectives: filtered.map((o) => ({
        id: o.objectiveId,
        title: o.title,
        type: o.type,
        assigneeType: o.assigneeType,
        assigneeId: o.assigneeId,
      })),
    });

    // First, handle role-based scope filtering with strict hierarchical alignment
    if (isEmployee) {
      console.log("🔍 [ObjectivesFilter] Applying EMPLOYEE filter");
      filtered = filtered.filter((obj) => {
        // Show objectives explicitly assigned to this employee
        if (obj.assigneeType === "PERSONNEL") {
          return obj.assigneeId === userEmployeeId;
        }
        // Show parent department objectives for context (no assigneeType means corporate or top-level)
        if (
          obj.assigneeType === "DEPARTMENT" ||
          (!obj.assigneeType && !obj.assigneeId)
        ) {
          return !obj.parent;
        }
        return false;
      });
    } else if (isManager) {
      console.log("🔍 [ObjectivesFilter] Applying MANAGER filter", {
        managedDepartmentIds: managedDepartmentIds,
        selectedUnitId: selectedUnitId,
      });

      const myDeptIds = managedDepartmentIds || [];

      // Build set of division IDs the manager can access
      const myDivisionIds = new Set<string>();

      // 1. Get divisions from manager's departments
      if (departmentsData?.departments?.items) {
        departmentsData.departments.items.forEach((dept: any) => {
          if (
            myDeptIds.includes(dept.departmentId) &&
            dept.division?.divisionId
          ) {
            myDivisionIds.add(dept.division.divisionId);
          }
        });
      }

      // 2. Include the currently selected unit (division or department's division)
      if (selectedUnitId) {
        if (selectedUnitType === "division") {
          myDivisionIds.add(selectedUnitId);
        } else if (selectedUnitType === "department") {
          // Find the division this department belongs to
          const dept = departmentsData?.departments?.items?.find(
            (d: any) => d.departmentId === selectedUnitId,
          );
          if (dept?.division?.divisionId) {
            myDivisionIds.add(dept.division.divisionId);
          }
        }
      }

      console.log("🔍 [ObjectivesFilter] Manager accessible divisions", {
        myDivisionIds: Array.from(myDivisionIds),
        myDeptIds: myDeptIds,
      });

      filtered = filtered.filter((obj) => {
        // Show objectives explicitly assigned to manager's departments
        if (
          obj.assigneeType === "DEPARTMENT" &&
          myDeptIds.includes(obj.assigneeId || "")
        ) {
          console.log("✅ [ObjectivesFilter] DEPARTMENT match", obj.title);
          return true;
        }

        // Show objectives assigned to manager's accessible divisions
        if (
          obj.assigneeType === "DIVISION" &&
          obj.assigneeId &&
          myDivisionIds.has(obj.assigneeId)
        ) {
          console.log("✅ [ObjectivesFilter] DIVISION match", obj.title);
          return true;
        }

        // Show personnel objectives that are children of manager's department objectives
        if (obj.assigneeType === "PERSONNEL") {
          const parentObj = objectives.find(
            (o) => o.objectiveId === obj.parent?.objectiveId,
          );
          const match =
            parentObj &&
            parentObj.assigneeType === "DEPARTMENT" &&
            myDeptIds.includes(parentObj.assigneeId || "");
          if (match)
            console.log("✅ [ObjectivesFilter] PERSONNEL match", obj.title);
          return match;
        }

        // Show parent division/corporate objectives for context (top-level only, no assigneeType)
        if (!obj.assigneeType && !obj.assigneeId) {
          const match = !obj.parent;
          if (match)
            console.log("✅ [ObjectivesFilter] CONTEXT match", obj.title);
          return match;
        }

        console.log(
          "❌ [ObjectivesFilter] No match",
          obj.title,
          obj.type,
          obj.assigneeType,
        );
        return false;
      });
    } else if (isDirector) {
      console.log("🔍 [ObjectivesFilter] Applying DIRECTOR filter", {
        managedDivisionIds: managedDivisionIds,
        selectedUnitId: selectedUnitId,
      });
      const myDivIds = managedDivisionIds || [];

      // Log ALL objectives to see what we're working with
      console.log(
        "🔍 [DirectorFilter] ALL OBJECTIVES:",
        filtered.map((o) => ({
          title: o.title,
          type: o.type,
          assigneeType: o.assigneeType,
          assigneeId: o.assigneeId,
        })),
      );

      filtered = filtered.filter((obj) => {
        // Show objectives explicitly assigned to director's divisions
        // Use assigneeType instead of type since backend may not set type field
        if (obj.assigneeType === "DIVISION") {
          const match = myDivIds.includes(obj.assigneeId || "");
          console.log("🔍 [DirectorFilter] DIVISION objective check", {
            title: obj.title,
            assigneeId: obj.assigneeId,
            myDivIds: myDivIds,
            match: match,
          });
          return match;
        }

        // trace recursive parentage for department and personnel objectives
        const isDescendantOfMyDiv = (currentObj: Objective): boolean => {
          if (!currentObj.parent) return false;
          const parentObj = objectives.find(
            (o) => o.objectiveId === currentObj.parent?.objectiveId,
          );
          if (!parentObj) return false;
          // Use assigneeType instead of type
          if (
            parentObj.assigneeType === "DIVISION" &&
            myDivIds.includes(parentObj.assigneeId || "")
          ) {
            return true;
          }
          return isDescendantOfMyDiv(parentObj);
        };

        // Use assigneeType instead of type for department and personnel checks
        if (
          obj.assigneeType === "DEPARTMENT" ||
          obj.assigneeType === "PERSONNEL"
        ) {
          return isDescendantOfMyDiv(obj);
        }

        // Show parent corporate objectives for context (no assigneeType means corporate)
        if (!obj.assigneeType && !obj.assigneeId) return !obj.parent;
        return false;
      });
    } else {
      console.log(
        "🔍 [ObjectivesFilter] ADMIN/SUPER_ADMIN - no role filter applied",
      );
      // ADMIN/SUPER_ADMIN see everything
    }

    console.log("🔍 [ObjectivesFilter] After role-based filter", {
      count: filtered.length,
      objectives: filtered.map((o) => ({ id: o.objectiveId, title: o.title })),
    });

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((obj) =>
        obj.title?.toLowerCase().includes(term),
      );
      console.log("🔍 [ObjectivesFilter] After search filter", {
        count: filtered.length,
        searchTerm,
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const mapped = statusFilter.toUpperCase() as any;
      filtered = filtered.filter((obj) => obj.status === mapped);
      console.log("🔍 [ObjectivesFilter] After status filter", {
        count: filtered.length,
        statusFilter,
      });
    }

    // Apply selected strategic period/quarter strictly. If no objective was
    // created in the selected period/quarter, the table should correctly show
    // an empty state instead of falling back to another active period.
    if (selectedPeriodId) {
      filtered = filtered.filter(
        (obj) => obj.strategicPeriod?.strategicPeriodId === selectedPeriodId,
      );

      console.log("🔍 [ObjectivesFilter] After strategic period filter", {
        selectedPeriodId,
        count: filtered.length,
      });
    }

    console.log("🔍 [ObjectivesFilter] FINAL RESULT", {
      count: filtered.length,
      objectives: filtered.map((o) => ({
        id: o.objectiveId,
        title: o.title,
        type: o.type,
        assigneeType: o.assigneeType,
        assigneeId: o.assigneeId,
      })),
    });

    return filtered;
  }, [
    objectives,
    statusFilter,
    searchTerm,
    isEmployee,
    isManager,
    isDirector,
    isAdmin,
    isSuperAdmin,
    userEmployeeId,
    managedDepartmentIds,
    managedDivisionIds,
    selectedPeriodId,
    selectedUnitId,
    selectedUnitType,
    departmentsData?.departments?.items,
  ]);

  // Set default tab based on role once - MUST be after filteredObjectives is defined
  const [hasSetDefaultTab, setHasSetDefaultTab] = useState(false);
  React.useEffect(() => {
    if (hasSetDefaultTab || loading) return; // Wait for objectives to load

    if (isDirector) {
      // For directors, always default to division tab
      setActiveTab("division");
      setHasSetDefaultTab(true);
    } else if (isManager) {
      // For managers, check if they have division or department objectives
      // Default to division if they have division objectives, otherwise department
      const hasDivisionObjectives = objectives.some(
        (o) =>
          o.assigneeType === "DIVISION" &&
          o.assigneeId &&
          selectedUnitType === "division" &&
          selectedUnitId === o.assigneeId,
      );

      if (hasDivisionObjectives) {
        setActiveTab("division");
      } else {
        setActiveTab("department");
      }
      setHasSetDefaultTab(true);
    } else if (isEmployee) {
      setActiveTab("personnel");
      setHasSetDefaultTab(true);
    } else if (isCorporateRole) {
      setActiveTab("corporate");
      setHasSetDefaultTab(true);
    }
  }, [
    isDirector,
    isManager,
    isEmployee,
    isCorporateRole,
    hasSetDefaultTab,
    objectives,
    selectedUnitId,
    selectedUnitType,
    loading,
  ]);

  // Sort objectives by order field
  const sortedObjectives = useMemo(() => {
    // If we have an optimistic order, use it
    if (orderedObjectives) return orderedObjectives;

    // Otherwise, sort the filtered objectives by their order field
    return [...filteredObjectives].sort((a, b) => {
      const orderA = (a as any).order ?? 0;
      const orderB = (b as any).order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      // Fallback to title if orders are same
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [filteredObjectives, orderedObjectives]);

  // Clear optimistic order only after backend data reflects the new order.
  // This avoids immediate snap-back while Apollo cache/network catches up.
  useEffect(() => {
    if (loading || !orderedObjectives) return;

    const backendOrderById = new Map(
      filteredObjectives.map((obj) => [
        obj.objectiveId,
        (obj as any).order ?? 0,
      ]),
    );

    const isSynced = orderedObjectives.every((obj) => {
      const optimisticOrder = (obj as any).order ?? 0;
      const backendOrder = backendOrderById.get(obj.objectiveId);
      return backendOrder === undefined || backendOrder === optimisticOrder;
    });

    if (isSynced) {
      setOrderedObjectives(null);
    }
  }, [loading, filteredObjectives, orderedObjectives]);

  // Determine if sorting is enabled (only for users who can edit)
  const canEnableSorting = useMemo(() => {
    // Enable sorting for admins and directors with edit permission
    return isAdmin || isSuperAdmin || isDirector || isManager;
  }, [isAdmin, isSuperAdmin, isDirector, isManager]);

  // Handle order change (optimistic update)
  const handleOrderChange = (newOrderedPage: Objective[]) => {
    // We must start with a sorted version of the base list to ensure the positions
    // we are replacing match the logical order the user sees.
    const baseList =
      orderedObjectives ||
      [...filteredObjectives].sort((a, b) => {
        const orderA = (a as any).order ?? 0;
        const orderB = (b as any).order ?? 0;
        return orderA - orderB;
      });

    const pageIds = new Set(newOrderedPage.map((o) => o.objectiveId));
    const finalFullList: Objective[] = [];

    // Reconstruct the list: replace items in this page with their new sequence
    // while keeping other items in their original relative positions.
    let pageIdx = 0;
    baseList.forEach((obj) => {
      if (pageIds.has(obj.objectiveId)) {
        finalFullList.push(newOrderedPage[pageIdx++]);
      } else {
        finalFullList.push(obj);
      }
    });

    setOrderedObjectives(finalFullList);
  };

  // Client-side pagination after filtering and sorting
  const totalItems = sortedObjectives.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedObjectives = sortedObjectives.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
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
          !isTopLevelCorporateObjective({
            type: obj.type,
            assigneeType: obj.assigneeType,
            assigneeId: obj.assigneeId,
            parentId: obj.parent?.objectiveId,
          }),
      )
      .map((obj) => ({
        itemId: obj.objectiveId,
        itemName: obj.title || obj.name || "Unnamed Objective",
        objectiveType: obj.type,
        assigneeType: obj.assigneeType,
        parentId: obj.parent?.objectiveId,
        itemType: "objective" as const,
      }));
  }, [filteredObjectives, selected]);

  const handleBulkSubmitSuccess = () => {
    setSelected([]);
    toast.success(
      `${selectedObjectivesForSubmission.length} objective(s) submitted for approval`,
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
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  const getObjectiveLevelKey = (objective: Objective) => {
    const type = String(objective.type || "").toUpperCase();
    const assigneeType = String(objective.assigneeType || "").toUpperCase();

    if (type === "CORPORATE" || assigneeType === "CORPORATE") {
      return "corporate";
    }
    if (assigneeType === "DIVISION" || type === "DIVISION") {
      return "division";
    }
    if (assigneeType === "DEPARTMENT" || type === "DEPARTMENT") {
      return "department";
    }
    if (
      assigneeType === "PERSONNEL" ||
      assigneeType === "EMPLOYEE" ||
      type === "PERSONNEL"
    ) {
      return "personnel";
    }

    // Legacy top-level corporate objectives usually have no assignee data.
    if (!objective.assigneeType && !objective.assigneeId && !objective.parent) {
      return "corporate";
    }

    return "unknown";
  };

  // Group objectives by effective hierarchy level for tabs.
  const corporateObjectives = useMemo(() => {
    const filtered = sortedObjectives.filter(
      (o) => getObjectiveLevelKey(o) === "corporate",
    );
    console.log("🔍 [TabFilter] Corporate objectives", {
      count: filtered.length,
      objectives: filtered.map((o) => o.title),
    });
    return filtered;
  }, [sortedObjectives]);

  const divisionObjectives = useMemo(() => {
    const filtered = sortedObjectives.filter(
      (o) => getObjectiveLevelKey(o) === "division",
    );
    console.log("🔍 [TabFilter] Division objectives", {
      count: filtered.length,
      objectives: filtered.map((o) => o.title),
    });
    return filtered;
  }, [sortedObjectives]);

  const departmentObjectives = useMemo(() => {
    const filtered = sortedObjectives.filter(
      (o) => getObjectiveLevelKey(o) === "department",
    );
    console.log("🔍 [TabFilter] Department objectives", {
      count: filtered.length,
      objectives: filtered.map((o) => o.title),
    });
    return filtered;
  }, [sortedObjectives]);

  const personnelObjectives = useMemo(() => {
    const filtered = sortedObjectives.filter(
      (o) => getObjectiveLevelKey(o) === "personnel",
    );
    console.log("🔍 [TabFilter] Personnel objectives", {
      count: filtered.length,
      objectives: filtered.map((o) => o.title),
    });
    return filtered;
  }, [sortedObjectives]);

  // Corporate tab: only top-level corporate objectives (exclude cascaded assignees)
  const cumulativeTabWeight = useMemo(() => {
    const group =
      activeTab === "corporate"
        ? corporateObjectives.filter(isTopLevelCorporateObjective)
        : activeTab === "division"
          ? divisionObjectives
          : activeTab === "department"
            ? departmentObjectives
            : personnelObjectives;

    return group.reduce((total, obj) => {
      const objKPIs = kpis.filter(
        (k) =>
          k.objective?.objectiveId === obj.objectiveId &&
          k.status !== "REJECTED",
      );
      return total + objKPIs.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
    }, 0);
  }, [
    activeTab,
    corporateObjectives,
    divisionObjectives,
    departmentObjectives,
    personnelObjectives,
    kpis,
  ]);

  const getPagedObjectivesForTab = (group: Objective[]) => {
    const total = group.length;
    const currentTabTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const start = (currentPage - 1) * itemsPerPage;
    const paged = group.slice(start, start + itemsPerPage);
    console.log("🔍 [Pagination] Paging objectives", {
      activeTab,
      totalInGroup: total,
      currentPage,
      itemsPerPage,
      pagedCount: paged.length,
      objectives: paged.map((o) => ({
        id: o.objectiveId,
        title: o.title,
        type: o.type,
      })),
    });
    return paged;
  };

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6">
      {/* Context Header for Employees */}
      {isEmployee && (
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
              {["corporate", "division", "department", "personnel"]
                .filter((tab) => {
                  // Only ADMIN and SUPER_ADMIN can see corporate tab
                  if (isCorporateRole) return true;
                  // Directors can see division, department, and personnel tabs
                  if (guards.isDirector)
                    return ["division", "department", "personnel"].includes(
                      tab,
                    );
                  // Managers can see department and personnel tabs
                  if (guards.isManager)
                    return ["department", "personnel"].includes(tab);
                  return false;
                })
                .map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    className={`px-6 py-2.5 text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab
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
                  <span
                    className={
                      cumulativeTabWeight > 100
                        ? "text-red-600"
                        : "text-gray-500"
                    }
                  >
                    STRATEGIC WEIGHT BUDGET
                  </span>
                  <span
                    className={
                      cumulativeTabWeight > 100
                        ? "text-red-600 font-bold animate-pulse"
                        : "text-blue-600"
                    }
                  >
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

      {/* Error message for managers/directors with no access */}
      {(isDirector || isManager) &&
        !selectedUnit &&
        filteredObjectives.length === 0 &&
        !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>No organizational unit selected.</strong> Please select a{" "}
              {isDirector ? "division" : "department"} from the dropdown above
              to view objectives.
            </p>
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
        activeTab={activeTab}
      />

      {/* Summary */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            {`Showing ${totalItems > 0 ? startIndex + 1 : 0}-${Math.min(
              startIndex + itemsPerPage,
              totalItems,
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
        objectives={
          showTabs
            ? activeTab === "corporate"
              ? getPagedObjectivesForTab(corporateObjectives)
              : activeTab === "division"
                ? getPagedObjectivesForTab(divisionObjectives)
                : activeTab === "department"
                  ? getPagedObjectivesForTab(departmentObjectives)
                  : getPagedObjectivesForTab(personnelObjectives)
            : pagedObjectives
        }
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
        enableSorting={canEnableSorting}
        onOrderChange={handleOrderChange}
        startIndex={startIndex}
        sortConfig={sortConfig}
        onSort={handleSort}
        groupBy={
          showTabs
            ? activeTab === "corporate"
              ? "none"
              : activeTab === "division"
                ? "division"
                : activeTab === "department"
                  ? "department"
                  : "personnel"
            : "none"
        }
        unitNames={unitNames}
        emptyTitle={
          selectedPeriodId
            ? `No objectives in ${selectedPeriodLabel}.`
            : "No objectives found."
        }
        emptyDescription={
          selectedPeriodId
            ? "Objectives are shown only for the exact period or quarter where they were created."
            : "Change your filters or add a new objective."
        }
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
                (childObj) => childObj.parent?.objectiveId === obj.objectiveId,
              );

              // Get corporate KPIs for this objective
              const corporateKpis = kpis.filter(
                (k) => k.objective?.objectiveId === obj.objectiveId,
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
                    (k) => k.objective?.objectiveId === childObj.objectiveId,
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
                            "q1" | "q2" | "q3" | "q4";
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
