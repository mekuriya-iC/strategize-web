"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { useObjectiveAssignment } from "@/hooks/objectives/useObjectiveAssignment";
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";
import { useKPIMutations } from "@/hooks/objectives/useKPIMutations";
import { useAssignmentState } from "@/hooks/objectives/useAssignmentState";
import { useStrategicPeriodStore } from "@/stores";
import { useObjectives } from "@/hooks/objectives/useObjectives";
import { useStrategicPlansQuery } from "@/hooks/strategic-plans/useStrategicPlans";
import { buildYearRanges } from "@/components/objectives/YearSelector";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { detectKPIType, getDetailedUnitLabel } from "@/utils/unitTypeDetection";
import type {
  Objective,
  Kpi,
  Division,
  Department,
  Employee,
  PaginatedDivisions,
  PaginatedDepartments,
} from "@/types/graphql";
import { toast } from "sonner";
import { appLogger } from "@/lib/logger";

export type AssigneeType = "DIVISION" | "DEPARTMENT" | "PERSONNEL";

interface Assignment {
  assigneeId: string;
  assigneeType: AssigneeType;
  assigneeName: string;
  kpis: string[];
}

interface UseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective;
  kpis: Kpi[];
  onSuccess?: () => void;
}

export function useAssignmentDialog({
  open,
  onOpenChange,
  objective,
  kpis,
  onSuccess,
}: UseAssignmentDialogProps) {
  const { assignObjective, loading } = useObjectiveAssignment();
  const { updateObjective } = useObjectiveMutations();
  const { updateKpi, createKpi } = useKPIMutations();
  
  // Fetch strategic plans to get organizationId
  const { strategicPlans } = useStrategicPlansQuery();
  const activeStrategicPlan = strategicPlans.find(plan => plan.isActive);
  const organizationId = activeStrategicPlan?.organization?.organizationId || "";

  // Get strategic period from store
  const { selectedPeriod, annualTimeline } = useStrategicPeriodStore();

  // For backwards compatibility
  const strategicPeriodState = {
    period: selectedPeriod,
    annualTimeline,
  };

  // Get all objectives for smart detection
  const { objectives: allObjectives, refetch: refetchObjectives } =
    useObjectives({ page: 1, limit: 1000 });

  // Assignment state management
  const assignmentStateHook = useAssignmentState();
  const {
    selectedKPIs,
    selectedAssignees,
    assigneeType,
    errors: assignmentErrors,
    updateSelectedKPIs,
    updateSelectedAssignees,
    updateAssigneeType,
    updateTargetAssignment,
    getTargetAssignment,
    getTotalAssignedTarget,
    resetState,
    setSubmitting,
    setErrors,
  } = assignmentStateHook;

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [bulkAssignmentValues, setBulkAssignmentValues] = useState<
    Record<string, number>
  >({});

  // Current user (assigner)
  const { data: meData } = useQuery(GET_ME, { fetchPolicy: "cache-first" });
  const assignerId: string | undefined = meData?.me?.employeeId;

  // Fetch divisions and departments
  const { data: divisionsData } = useQuery<{ divisions: PaginatedDivisions }>(
    GET_DIVISIONS,
    {
      variables: { page: 1, limit: 1000 },
      fetchPolicy: "cache-and-network",
    }
  );

  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
  } = useQuery<{ departments: PaginatedDepartments }>(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      appLogger.error("Failed to load departments:", error);
    },
  });

  // Fetch global employees for safe joining
  const isAdmin = meData?.me?.role === "ADMIN" || meData?.me?.role === "SUPER_ADMIN";
  const { data: globalEmployeesData, loading: employeesLoading, error: employeesError } = useQuery(GET_EMPLOYEES, {
    variables: {
      page: 1,
      limit: 1000,
      search: isAdmin ? (searchTerm || undefined) : undefined // Consistent with other pages
    },
    fetchPolicy: "cache-first",
    skip: !open,
  });

  // Extract employees using safe joining
  const extractedEmployees = useMemo(() => {
    return globalEmployeesData?.employees?.items || [];
  }, [globalEmployeesData]);

  // Get available assignees
  const divisions = divisionsData?.divisions?.items || [];
  const departments = departmentsData?.departments?.items || [];
  const employees = extractedEmployees || [];

  // Helper function to get timeline from context
  const getTimelineFromContext = useCallback((): string => {
    if (strategicPeriodState?.annualTimeline) {
      return strategicPeriodState.annualTimeline;
    }
    if (objective?.strategicPeriod) {
      const yearRanges = buildYearRanges(objective.strategicPeriod);
      return yearRanges[0] || "2025/26";
    }
    return "2025/26";
  }, [strategicPeriodState, objective]);

  // Helper function to calculate yearly total from quarterly targets
  const getYearlyTotalFromTargets = useCallback(
    (targets: Array<{ timeline: string; target: number }>): number => {
      if (!targets || targets.length === 0) return 0;

      const targetsByYear = new Map<string, number>();
      targets.forEach((target) => {
        const year = target.timeline.split("-")[0];
        const currentTotal = targetsByYear.get(year) || 0;
        targetsByYear.set(year, currentTotal + target.target);
      });

      const yearlyTotals = Array.from(targetsByYear.values());
      const total = yearlyTotals.reduce((sum, total) => sum + total, 0);
      // Round to max 2 decimal places to avoid floating-point precision issues
      return Math.round(total * 100) / 100;
    },
    []
  );

  // Helper function to get assignee name
  const getAssigneeName = useCallback(
    (assigneeId: string): string => {
      if (assigneeType === "DIVISION") {
        return (
          divisions.find((d) => d.divisionId === assigneeId)?.name || assigneeId
        );
      } else if (assigneeType === "DEPARTMENT") {
        return (
          departments.find((d) => d.departmentId === assigneeId)?.name ||
          assigneeId
        );
      } else {
        return (
          employees.find((e: any) => e.employeeId === assigneeId)?.fullName ||
          assigneeId
        );
      }
    },
    [assigneeType, divisions, departments, employees]
  );

  // Helper function to get objective type for assignee
  const getAssigneeObjectiveType = useCallback(():
    | "DIVISION"
    | "DEPARTMENT"
    | "PERSONNEL" => {
    if (objective.type === "CORPORATE") {
      return assigneeType === "DIVISION" ? "DIVISION" : "DEPARTMENT";
    } else if (objective.type === "DIVISION") {
      return "DEPARTMENT";
    } else {
      return "PERSONNEL";
    }
  }, [objective.type, assigneeType]);

  // Helper function to generate placeholder name for child objective
  const generatePlaceholderName = useCallback((): string => {
    const childType = getAssigneeObjectiveType();
    const typeLabel =
      childType === "DIVISION"
        ? "Division"
        : childType === "DEPARTMENT"
          ? "Department"
          : "Personnel";

    // Generate a simple prompt for the user to add their objective name
    return `Please add ${typeLabel} objective name`;
  }, [getAssigneeObjectiveType]);

  // Get tab count for grid layout
  const getTabCount = useCallback(() => {
    if (objective.type === "CORPORATE") return 2;
    if (objective.type === "DIVISION") return 1;
    if (objective.type === "DEPARTMENT") return 1;
    return 1;
  }, [objective.type]);

  // Get assignee details by ID and type
  const getAssigneeDetails = useCallback(
    (assigneeId: string, type: AssigneeType) => {
      switch (type) {
        case "DIVISION":
          return divisions.find((d) => d.divisionId === assigneeId);
        case "DEPARTMENT":
          return departments.find((d) => d.departmentId === assigneeId);
        case "PERSONNEL":
          return employees.find((e: any) => e.employeeId === assigneeId);
        default:
          return null;
      }
    },
    [divisions, departments, employees]
  );

  // Filter assignees based on search term and organizational hierarchy
  const filteredDivisions = useMemo(
    () =>
      divisions.filter((division: Division) =>
        division.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [divisions, searchTerm]
  );

  const filteredDepartments = useMemo(() => {
    return departments.filter((department: Department) => {
      const matchesSearch =
        (!department.division?.name || "");

      if (objective.type === "DIVISION" && objective.assigneeId) {
        const belongsToThisDivision =
          department.division?.divisionId === objective.assigneeId;
        return matchesSearch && belongsToThisDivision;
      }

      return matchesSearch;
    });
  }, [departments, searchTerm, objective.type, objective.assigneeId]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee: Employee) => {
      const matchesSearch = employee.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      if (objective.type === "DEPARTMENT" && objective.assigneeId) {
        const belongsToThisDepartment = employee.departments?.some(
          (dept) => dept.departmentId === objective.assigneeId
        );
        return matchesSearch && belongsToThisDepartment;
      }

      return matchesSearch;
    });
  }, [employees, searchTerm, objective.type, objective.assigneeId]);

  // Initialize selected KPIs when dialog opens
  useEffect(() => {
    if (open && kpis.length > 0) {
      updateSelectedKPIs(kpis.map((kpi) => kpi.kpiId));
    }
  }, [open, kpis, updateSelectedKPIs]);

  // Refresh objectives data when dialog opens
  useEffect(() => {
    if (open) {
      refetchObjectives();
    }
  }, [open, refetchObjectives]);

  // Reset assigneeType based on objective type
  useEffect(() => {
    if (open) {
      if (objective.type === "CORPORATE" && assigneeType === "PERSONNEL") {
        updateAssigneeType("DIVISION");
      } else if (
        objective.type === "DIVISION" &&
        (assigneeType === "DIVISION" || assigneeType === "PERSONNEL")
      ) {
        updateAssigneeType("DEPARTMENT");
      } else if (
        objective.type === "DEPARTMENT" &&
        (assigneeType === "DIVISION" || assigneeType === "DEPARTMENT")
      ) {
        updateAssigneeType("PERSONNEL");
      }
    }
  }, [open, objective.type, assigneeType, updateAssigneeType]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      updateSelectedAssignees([]);
      updateSelectedKPIs([]);
      setAssignments([]);
      updateAssigneeType("DIVISION");
      setIsSubmitting(false);
      setBulkAssignmentValues({});
      resetState();
    }
  }, [
    open,
    updateSelectedAssignees,
    updateSelectedKPIs,
    updateAssigneeType,
    resetState,
  ]);

  // Handle assignee selection
  const handleAssigneeSelection = useCallback(
    (assigneeId: string, checked: boolean) => {
      if (checked) {
        updateSelectedAssignees([...selectedAssignees, assigneeId]);
      } else {
        updateSelectedAssignees(
          selectedAssignees.filter((id) => id !== assigneeId)
        );
      }
    },
    [selectedAssignees, updateSelectedAssignees]
  );

  // Handle KPI selection
  const handleKPISelection = useCallback(
    (kpiId: string, checked: boolean) => {
      if (checked) {
        updateSelectedKPIs([...selectedKPIs, kpiId]);
      } else {
        updateSelectedKPIs(selectedKPIs.filter((id) => id !== kpiId));
      }
    },
    [selectedKPIs, updateSelectedKPIs]
  );

  // Handle select all KPIs
  const handleSelectAllKPIs = useCallback(
    (checked: boolean) => {
      if (checked) {
        updateSelectedKPIs(kpis.map((kpi) => kpi.kpiId));
      } else {
        updateSelectedKPIs([]);
      }
    },
    [kpis, updateSelectedKPIs]
  );

  // Add selected assignees to assignment list
  const handleAddToAssignments = useCallback(() => {
    if (selectedAssignees.length === 0 || selectedKPIs.length === 0) {
      return;
    }

    const newAssignments = selectedAssignees.map((assigneeId) => {
      const assignee = getAssigneeDetails(
        assigneeId,
        assigneeType as AssigneeType
      );
      let assigneeName = "";

      if (assigneeType === "PERSONNEL") {
        assigneeName = (assignee as Employee)?.fullName || "";
      } else {
        assigneeName = (assignee as Division | Department)?.name || "";
      }

      return {
        assigneeId,
        assigneeType: assigneeType as AssigneeType,
        assigneeName,
        kpis: [...selectedKPIs],
      };
    });

    setAssignments((prev) => [...prev, ...newAssignments]);
    updateSelectedAssignees([]);
  }, [
    selectedAssignees,
    selectedKPIs,
    assigneeType,
    getAssigneeDetails,
    updateSelectedAssignees,
  ]);

  // Remove assignment from list
  const handleRemoveAssignment = useCallback((index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle bulk assignment for percentage KPIs
  const handleBulkAssignment = useCallback(
    (kpiId: string, targetValue: number) => {
      const kpi = kpis.find((k) => k.kpiId === kpiId);
      if (!kpi) return;

      const kpiType = detectKPIType(kpi);
      if (kpiType === "PERCENTAGE") {
        assignments.forEach((assignment) => {
          updateTargetAssignment(
            kpiId,
            assignment.assigneeId,
            targetValue,
            kpi
          );
        });

        toast.success("Bulk assignment completed", {
          description: `Assigned ${Number(targetValue).toFixed(
            1
          )}${getDetailedUnitLabel(kpi)} to all ${assignments.length
            } assignees.`,
        });
      } else {
        toast.error("Bulk assignment failed", {
          description: "Bulk assignment only works for percentage KPIs.",
        });
      }
    },
    [kpis, assignments, updateTargetAssignment]
  );

  // Validate assignment targets
  const validateAssignmentTargets = useCallback((): string[] => {
    const errors: string[] = [];

    if (assignments.length === 0) {
      errors.push("Please add at least one assignment to the list");
      return errors;
    }

    // Validate target assignments for each selected KPI
    selectedKPIs.forEach((kpiId) => {
      const parentKPI = kpis.find((k) => k.kpiId === kpiId);
      if (!parentKPI) return;

      const kpiType = detectKPIType(parentKPI);
      const cleanName = parentKPI.name;

      if (kpiType === "SUMMABLE") {
        const totalAssigned = getTotalAssignedTarget(kpiId);
        const parentTarget = getYearlyTotalFromTargets(parentKPI.targets || []);

        if (Math.abs(totalAssigned - parentTarget) > 0.01) {
          errors.push(
            `Total assigned target for "${cleanName}" (${Number(
              totalAssigned
            ).toFixed(1)}) must equal parent target (${Number(
              parentTarget
            ).toFixed(1)})`
          );
        }
      } else {
        const missingAssignments = assignments.filter(
          (assignment) =>
            getTargetAssignment(kpiId, assignment.assigneeId) === null
        );

        if (missingAssignments.length > 0) {
          errors.push(`All assignees must have targets for "${cleanName}"`);
        }
      }
    });

    return errors;
  }, [
    assignments,
    selectedKPIs,
    kpis,
    getTotalAssignedTarget,
    getTargetAssignment,
    getYearlyTotalFromTargets,
  ]);

  // Smart assignment function
  const handleSmartAssignment = useCallback(
    async (assignment: {
      assigneeId: string;
      assigneeName: string;
      kpis: string[];
    }) => {
      const existingObjective = allObjectives?.find(
        (obj: Objective) =>
          obj.assigneeType === getAssigneeObjectiveType() &&
          obj.assigneeId === assignment.assigneeId &&
          obj.parent?.objectiveId === objective.objectiveId
      );

      if (existingObjective) {
        const existingKPIs = existingObjective.kpis || [];
        const selectedKPIObjects = kpis.filter((k) =>
          assignment.kpis.includes(k.kpiId)
        );
        const newKPIs = selectedKPIObjects.filter(
          (selectedKPI) =>
            !existingKPIs.some(
              (existingKPI) => existingKPI.name === selectedKPI.name
            )
        );

        if (newKPIs.length > 0) {
          const createdKPIs = [];
          for (const newKPI of newKPIs) {
            try {
              const createdKPI = await createKpi({
                input: {
                  name: newKPI.name,
                  baseline: newKPI.baseline || 0,
                  weight: newKPI.weight || 0,
                  unitType: newKPI.unitType || "NUMBER",
                  strategicObjectiveId: existingObjective.objectiveId, // Backend uses strategicObjectiveId
                  parentId: newKPI.kpiId,
                  frequency: "QUARTERLY", // Default to QUARTERLY
                  measurementUnit: "NUMBER", // Default to NUMBER
                  organizationId: organizationId, // Required by backend
                  targetValue: 0, // Will be updated with targets
                  targets: [],
                }
              });
              createdKPIs.push(createdKPI);

              const targetValue = getTargetAssignment(
                newKPI.kpiId,
                assignment.assigneeId
              );
              if (targetValue !== null) {
                await updateKpi({
                  input: {
                    kpiId: createdKPI.kpiId,
                    targets: [
                      { timeline: getTimelineFromContext(), target: targetValue },
                    ]
                  }
                });
              }
            } catch (error) {
              appLogger.error("Failed to create KPI:", newKPI.name, error);
              throw error;
            }
          }

          return {
            ...existingObjective,
            kpis: [...existingKPIs, ...createdKPIs],
          };
        } else {
          return null;
        }
      } else {
        // Create new objective
        if (!assignerId) {
          throw new Error("Assigner ID is required");
        }

        const apiAssigneeType = assigneeType;

        // First, create the child objective via assignment
        const createdObjective = await assignObjective({
          objectiveId: objective.objectiveId,
          assigneeId: assignment.assigneeId,
          assignerId,
          assigneeType: apiAssigneeType,
          kpis: assignment.kpis,
        });


        // Then, update the child objective with correct type and placeholder name
        if (createdObjective?.objectiveId) {
          const correctType = getAssigneeObjectiveType();
          const placeholderName = generatePlaceholderName();

          appLogger.debug("Updating child objective", {
            objectiveId: createdObjective.objectiveId,
            targetType: correctType,
            targetName: placeholderName,
            currentType: createdObjective.type,
            currentName: createdObjective.title,
          });

          try {
            const updateResult = await updateObjective({
              input: {
                objectiveId: createdObjective.objectiveId,
                type: correctType,
                title: placeholderName,
              },
            });


            toast.success("Child objective configured", {
              description: `Type: ${correctType}, Name: "${placeholderName.substring(
                0,
                30
              )}..."`,
            });
          } catch (updateError) {
            console.error("❌ Failed to update child objective:", updateError);
            toast.error("Failed to configure child objective", {
              description: `Could not set type to ${correctType}. Please edit manually.`,
            });
          }
        } else {
          console.warn(
            "⚠️ No objectiveId in created objective:",
            createdObjective
          );
          toast.warning(
            "Child objective created but couldn't configure type/name"
          );
        }

        return createdObjective;
      }
    },
    [
      allObjectives,
      objective,
      kpis,
      assignerId,
      assigneeType,
      getAssigneeObjectiveType,
      generatePlaceholderName,
      getTargetAssignment,
      getTimelineFromContext,
      createKpi,
      updateKpi,
      assignObjective,
      updateObjective,
    ]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (assignments.length === 0 || !assignerId) return;

    const validationErrors = validateAssignmentTargets();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.error("Target assignment validation failed", {
        description: validationErrors.join(", "),
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitting(true);

    try {
      for (const assignment of assignments) {
        const assignmentResult = await handleSmartAssignment(assignment);

        if (!assignmentResult) continue;

        const assigneeKpis = assignmentResult?.kpis || [];
        const originalKpiIdToAssigneeId = new Map();
        assigneeKpis.forEach(
          (assigneeKpi: { kpiId: string }, index: number) => {
            const originalKpiId = assignment.kpis[index];
            if (originalKpiId) {
              originalKpiIdToAssigneeId.set(originalKpiId, assigneeKpi.kpiId);
            }
          }
        );

        for (const originalKpiId of assignment.kpis) {
          const targetValue = getTargetAssignment(
            originalKpiId,
            assignment.assigneeId
          );

          if (targetValue !== null) {
            try {
              const assigneeKpiId =
                originalKpiIdToAssigneeId.get(originalKpiId);
              if (!assigneeKpiId) continue;

              await updateKpi({
                input: {
                  kpiId: assigneeKpiId,
                  targets: [
                    { timeline: getTimelineFromContext(), target: targetValue },
                  ]
                }
              });
            } catch (error) {
              appLogger.error("Failed to update assignee KPI targets:", error);
            }
          }
        }
      }

      toast.success("Smart assignment completed successfully!");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      appLogger.error("Assignment failed:", error);
      toast.error("Failed to assign objective", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  }, [
    assignments,
    assignerId,
    validateAssignmentTargets,
    setErrors,
    setSubmitting,
    handleSmartAssignment,
    getTargetAssignment,
    getTimelineFromContext,
    updateKpi,
    onSuccess,
    onOpenChange,
  ]);

  const isFormValid = assignments.length > 0 && !!assignerId;

  return {
    // State
    searchTerm,
    setSearchTerm,
    isSubmitting,
    assignments,
    bulkAssignmentValues,
    setBulkAssignmentValues,
    selectedKPIs,
    selectedAssignees,
    assigneeType,
    assignmentErrors,
    loading,
    employeesLoading,
    employeesError,

    // Data
    divisions,
    departments,
    employees,
    filteredDivisions,
    filteredDepartments,
    filteredEmployees,
    allObjectives,
    assignerId,

    // Computed
    isFormValid,
    getTabCount,
    getAssigneeName,
    getAssigneeDetails,
    getAssigneeObjectiveType,
    getYearlyTotalFromTargets,

    // Actions
    handleAssigneeSelection,
    handleKPISelection,
    handleSelectAllKPIs,
    handleAddToAssignments,
    handleRemoveAssignment,
    handleBulkAssignment,
    handleSubmit,
    updateAssigneeType,
    updateTargetAssignment,
    getTargetAssignment,
    getTotalAssignedTarget,
    refetchObjectives,
  };
}
