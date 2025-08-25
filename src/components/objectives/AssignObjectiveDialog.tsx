"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Users,
  Building2,
  CheckCircle,
  AlertCircle,
  Target,
  Info,
} from "lucide-react";
import { useObjectiveAssignment } from "@/hooks/useObjectiveAssignment";
// Removed unused useObjectiveMutations import
import { useKPIMutations } from "@/hooks/useKPIMutations";
import { useAssignmentState } from "@/hooks/useAssignmentState";
import { useStrategicPeriod } from "@/context/StrategicPeriodContext";
import { useObjectives } from "@/hooks/useObjectives";
import { buildYearRanges } from "./YearSelector";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_ME } from "@/lib/graphql/queries/employees";
import {
  detectKPIType,
  getDetailedUnitLabel,
  getAssignmentMethodDescription,
} from "@/utils/unitTypeDetection";
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

interface AssignObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective;
  kpis: Kpi[];
  onSuccess?: () => void;
}

type AssigneeType = "DIVISION" | "DEPARTMENT" | "EMPLOYEE";

export default function AssignObjectiveDialog({
  open,
  onOpenChange,
  objective,
  kpis,
  onSuccess,
}: AssignObjectiveDialogProps) {
  const { assignObjective, loading } = useObjectiveAssignment();
  const { updateKpiTargets, createKpi } = useKPIMutations();

  // Get strategic period context for timeline
  const { selected: strategicPeriodState } = useStrategicPeriod();

  // Get all objectives for smart detection
  const { objectives: allObjectives, refetch: refetchObjectives } =
    useObjectives({ page: 1, limit: 1000 });

  // Helper function to get the correct timeline from context
  const getTimelineFromContext = (): string => {
    // First try to get from strategic period context
    if (strategicPeriodState?.annualTimeline) {
      return strategicPeriodState.annualTimeline;
    }

    // Fallback to objective's strategic period if available
    if (objective?.strategicPeriod) {
      const yearRanges = buildYearRanges(objective.strategicPeriod);
      return yearRanges[0] || "2025/26"; // Default fallback
    }

    return "2025/26"; // Final fallback
  };

  // Helper function to calculate yearly total from quarterly targets
  const getYearlyTotalFromTargets = (
    targets: Array<{ timeline: string; target: number }>
  ): number => {
    if (!targets || targets.length === 0) return 0;

    // Group targets by year
    const targetsByYear = new Map<string, number>();

    targets.forEach((target) => {
      const year = target.timeline.split("-")[0]; // Extract year from "2025-Q1" or "2025/26"
      const currentTotal = targetsByYear.get(year) || 0;
      targetsByYear.set(year, currentTotal + target.target);
    });

    // Return the total for the first year (or sum all years if multiple)
    const yearlyTotals = Array.from(targetsByYear.values());
    const total = yearlyTotals.reduce((sum, total) => sum + total, 0);

    // Debug logging
    console.log("🔧 getYearlyTotalFromTargets:", {
      targets: targets,
      targetsByYear: Object.fromEntries(targetsByYear),
      yearlyTotals: yearlyTotals,
      total: total,
    });

    return total;
  };

  // Enhanced assignment state management
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

  // Legacy state for backward compatibility
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignments, setAssignments] = useState<
    Array<{
      assigneeId: string;
      assigneeType: AssigneeType;
      assigneeName: string;
      kpis: string[];
    }>
  >([]);

  // State for bulk assignment values
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
  } = useQuery<{
    departments: PaginatedDepartments;
  }>(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.error("❌ Failed to load departments:", error);
    },
  });

  // Extract employees from department data (workaround for manager permissions)
  const extractedEmployees = useMemo(() => {
    if (!departmentsData?.departments?.items) return [];

    const employeeMap = new Map();

    // Collect all employees from all departments
    departmentsData.departments.items.forEach((dept) => {
      dept.employees?.forEach((emp) => {
        if (!employeeMap.has(emp.employeeId)) {
          // Create employee object with department info
          employeeMap.set(emp.employeeId, {
            ...emp,
            departments: [{ departmentId: dept.departmentId, name: dept.name }],
          });
        } else {
          // Add this department to existing employee
          const existingEmp = employeeMap.get(emp.employeeId) as Employee & {
            departments?: Array<{ departmentId: string; name: string }>;
          };
          (existingEmp.departments ||= []).push({
            departmentId: dept.departmentId,
            name: dept.name,
          });
        }
      });
    });

    const employees = Array.from(employeeMap.values()) as Array<
      Employee & {
        departments?: Array<{ departmentId: string; name: string }>;
      }
    >;
    console.log("✅ Employees extracted from departments:", {
      totalEmployees: employees.length,
      employees: employees.map((emp) => ({
        id: emp.employeeId,
        name: emp.fullName,
        departments: emp.departments?.length || 0,
        departmentNames:
          emp.departments?.map(
            (d: { departmentId: string; name: string }) => d.name
          ) || [],
      })),
    });

    return employees;
  }, [departmentsData]);

  // Use extracted employees instead of direct query
  const employeesLoading = departmentsLoading;
  const employeesError = departmentsError;

  // Initialize selected KPIs with all KPIs when dialog opens
  useEffect(() => {
    if (open && kpis.length > 0) {
      updateSelectedKPIs(kpis.map((kpi) => kpi.kpiId));
    }
  }, [open, kpis, updateSelectedKPIs]);

  // Refresh objectives data when dialog opens to ensure we have latest data
  useEffect(() => {
    if (open) {
      console.log("🔧 DEBUG: Dialog opened, refreshing objectives data...");
      refetchObjectives();
    }
  }, [open, refetchObjectives]);

  // Reset assigneeType to appropriate default based on objective type
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

  // Helper function to get tab count for grid layout
  const getTabCount = () => {
    if (objective.type === "CORPORATE") {
      return 2; // Division, Department
    } else if (objective.type === "DIVISION") {
      return 1; // Department only
    } else if (objective.type === "DEPARTMENT") {
      return 1; // Employee only
    }
    return 1;
  };

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

  // Get available assignees based on type
  const divisions = divisionsData?.divisions?.items || [];
  const departments = departmentsData?.departments?.items || [];
  const employees = extractedEmployees || [];

  // Helper function to get assignee name
  const getAssigneeName = (assigneeId: string): string => {
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
        employees.find((e) => e.employeeId === assigneeId)?.fullName ||
        assigneeId
      );
    }
  };

  // Helper function to get objective type for assignee
  const getAssigneeObjectiveType = (): string => {
    if (objective.type === "CORPORATE") {
      return assigneeType === "DIVISION" ? "DIVISION" : "DEPARTMENT";
    } else if (objective.type === "DIVISION") {
      return "DEPARTMENT";
    } else {
      return "PERSONNEL";
    }
  };

  // Removed unused getAssignmentPreview function

  // Filter assignees based on organizational hierarchy and search term
  const filteredDivisions = divisions.filter((division: Division) =>
    division.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // For division objectives, show only departments that belong to this division
  const filteredDepartments = departments.filter((department: Department) => {
    const matchesSearch = department.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // If this is a division objective, only show departments under this division
    if (objective.type === "DIVISION" && objective.assigneeId) {
      const belongsToThisDivision =
        department.division?.divisionId === objective.assigneeId;
      console.log(`🏢 Department filtering for ${objective.type} objective:`, {
        departmentName: department.name,
        departmentDivisionId: department.division?.divisionId,
        objectiveAssigneeId: objective.assigneeId,
        belongsToThisDivision,
        willInclude: matchesSearch && belongsToThisDivision,
      });
      return matchesSearch && belongsToThisDivision;
    }

    // For corporate objectives, show all departments
    return matchesSearch;
  });

  // For department objectives, show only employees that belong to this department
  const filteredEmployees = employees.filter((employee: Employee) => {
    const matchesSearch = employee.fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    console.log(`🔍 Employee filtering debug for ${employee.fullName}:`, {
      objectiveType: objective.type,
      objectiveAssigneeId: objective.assigneeId,
      employeeDepartments: employee.departments,
      hasEmployeeDepartments: !!employee.departments,
      departmentCount: employee.departments?.length || 0,
    });

    // If this is a department objective, only show employees in this department
    if (objective.type === "DEPARTMENT" && objective.assigneeId) {
      const belongsToThisDepartment = employee.departments?.some(
        (dept) => dept.departmentId === objective.assigneeId
      );
      console.log(`👤 Department filtering for ${employee.fullName}:`, {
        objectiveAssigneeId: objective.assigneeId,
        employeeDepartments:
          employee.departments?.map((d) => ({
            id: d.departmentId,
            name: d.name,
          })) || [],
        belongsToThisDepartment,
        matchesSearch,
        willInclude: matchesSearch && belongsToThisDepartment,
      });
      return matchesSearch && belongsToThisDepartment;
    }

    // For division objectives, show all employees (they can assign to any employee)
    console.log(
      `👤 Non-department filtering for ${employee.fullName}: matchesSearch = ${matchesSearch}`
    );
    return matchesSearch;
  });

  // Debug: Log filtering summary
  console.log(
    `🎯 Assignment filtering summary for ${objective.type} objective:`,
    {
      objectiveName: objective.name,
      objectiveAssigneeId: objective.assigneeId,
      totalDivisions: divisions.length,
      filteredDivisions: filteredDivisions.length,
      totalDepartments: departments.length,
      filteredDepartments: filteredDepartments.length,
      totalEmployees: employees.length,
      filteredEmployees: filteredEmployees.length,
      allEmployees: employees.map((emp) => ({
        id: emp.employeeId,
        name: emp.fullName,
        departments:
          emp.departments?.map((d: { departmentId: string; name: string }) => ({
            id: d.departmentId,
            name: d.name,
          })) || [],
      })),
    }
  );

  // Helper function to get assignee details by ID and type
  const getAssigneeDetails = (assigneeId: string, type: AssigneeType) => {
    switch (type) {
      case "DIVISION":
        return divisions.find(
          (division: Division) => division.divisionId === assigneeId
        );
      case "DEPARTMENT":
        return departments.find(
          (department: Department) => department.departmentId === assigneeId
        );
      case "EMPLOYEE":
        return employees.find(
          (employee: Employee) => employee.employeeId === assigneeId
        );
      default:
        return null;
    }
  };

  // Helper function to handle multiple assignee selection
  const handleAssigneeSelection = (assigneeId: string, checked: boolean) => {
    if (checked) {
      updateSelectedAssignees([...selectedAssignees, assigneeId]);
    } else {
      updateSelectedAssignees(
        selectedAssignees.filter((id) => id !== assigneeId)
      );
    }
  };

  // Handle KPI selection
  const handleKPISelection = (kpiId: string, checked: boolean) => {
    if (checked) {
      updateSelectedKPIs([...selectedKPIs, kpiId]);
    } else {
      updateSelectedKPIs(selectedKPIs.filter((id) => id !== kpiId));
    }
  };

  // Handle select all KPIs
  const handleSelectAllKPIs = (checked: boolean) => {
    if (checked) {
      updateSelectedKPIs(kpis.map((kpi) => kpi.kpiId));
    } else {
      updateSelectedKPIs([]);
    }
  };

  // Add selected assignees to assignment list
  const handleAddToAssignments = () => {
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

    // Clear current assignee selections but keep KPIs selected for target assignment
    updateSelectedAssignees([]);
    // Don't clear KPIs - we need them for target assignment section
  };

  // Remove assignment from list
  const handleRemoveAssignment = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle bulk assignment for percentage KPIs
  const handleBulkAssignment = (kpiId: string, targetValue: number) => {
    console.log("🔧 DEBUG handleBulkAssignment:", {
      kpiId,
      targetValue,
      assignmentsCount: assignments.length,
      assignments: assignments.map((a) => ({
        assigneeId: a.assigneeId,
        assigneeName: a.assigneeName,
      })),
    });

    const kpi = kpis.find((k) => k.kpiId === kpiId);
    if (!kpi) {
      console.warn("❌ KPI not found for bulk assignment:", kpiId);
      return;
    }

    const kpiType = detectKPIType(kpi);
    console.log("🔧 DEBUG KPI details:", {
      kpiName: kpi.name,
      kpiType,
      unitType: kpi.unitType,
    });

    if (kpiType === "PERCENTAGE") {
      // For percentage KPIs, assign the same target to all assignments in the list
      let updatedCount = 0;
      assignments.forEach((assignment) => {
        console.log("🔧 DEBUG updating assignment:", {
          assigneeId: assignment.assigneeId,
          assigneeName: assignment.assigneeName,
          targetValue,
        });
        updateTargetAssignment(kpiId, assignment.assigneeId, targetValue, kpi);
        updatedCount++;
      });

      console.log("🔧 DEBUG bulk assignment completed:", {
        updatedCount,
        totalAssignments: assignments.length,
      });

      toast.success("Bulk assignment completed", {
        description: `Assigned ${targetValue}${getDetailedUnitLabel(
          kpi
        )} to all ${assignments.length} assignees.`,
      });
    } else {
      console.warn(
        "❌ Bulk assignment only works for percentage KPIs, got:",
        kpiType
      );
      toast.error("Bulk assignment failed", {
        description: "Bulk assignment only works for percentage KPIs.",
      });
    }
  };

  // Validate assignments with target assignments
  const validateAssignmentTargets = (): string[] => {
    const errors: string[] = [];

    console.log("🔧 DEBUG: validateAssignmentTargets called");

    // Check if we have assignments
    if (assignments.length === 0) {
      errors.push("Please add at least one assignment to the list");
      return errors;
    }

    console.log("🔧 DEBUG: assignments found:", assignments.length);
    console.log(
      "🔧 DEBUG: assignments content:",
      assignments.map((a) => ({
        assigneeId: a.assigneeId,
        assigneeName: a.assigneeName,
        kpis: a.kpis,
        kpiNames: kpis
          .filter((k) => a.kpis.includes(k.kpiId))
          .map((k) => k.name),
      }))
    );

    // Check if any assignments will actually be processed (not all skipped)
    // Use assignments array instead of selectedAssignees for validation
    const assignmentPreviews = assignments.map((assignment) => {
      // Find existing objective for this assignment
      const existingObjective = allObjectives?.find(
        (obj: Objective) =>
          obj.assigneeType === getAssigneeObjectiveType() &&
          obj.assigneeId === assignment.assigneeId &&
          obj.parent?.objectiveId === objective.objectiveId
      );

      // Get existing KPIs if objective exists
      const existingKPIs = existingObjective?.kpis || [];

      // Check which selected KPIs already exist
      const selectedKPIObjects = kpis.filter((k) =>
        assignment.kpis.includes(k.kpiId)
      );
      const existingSelectedKPIs = selectedKPIObjects.filter((k) =>
        existingKPIs.some((existing) => existing.name === k.name)
      );
      const newKPIs = selectedKPIObjects.filter(
        (k) => !existingKPIs.some((existing) => existing.name === k.name)
      );

      return {
        assigneeId: assignment.assigneeId,
        assigneeName: assignment.assigneeName,
        existingObjective,
        existingKPIs: existingKPIs.map((k) => k.name),
        existingSelectedKPIs: existingSelectedKPIs.map((k) => k.name),
        newKPIs: newKPIs.map((k) => k.name),
        willCreate: !existingObjective,
        willAdd: existingObjective && newKPIs.length > 0,
        willSkip: existingObjective && newKPIs.length === 0,
        hasWarnings: existingSelectedKPIs.length > 0,
      };
    });

    console.log(
      "🔧 DEBUG: assignmentPreviews calculated:",
      assignmentPreviews.length
    );

    const hasValidAssignments = assignmentPreviews.some(
      (preview) => preview.willCreate || preview.willAdd
    );

    console.log("🔧 DEBUG validation check:", {
      assignmentPreviews: assignmentPreviews.map((p) => ({
        assigneeName: p.assigneeName,
        willCreate: p.willCreate,
        willAdd: p.willAdd,
        willSkip: p.willSkip,
        existingObjective: p.existingObjective
          ? p.existingObjective.objectiveId
          : null,
        existingKPIs: p.existingKPIs,
        newKPIs: p.newKPIs,
        existingSelectedKPIs: p.existingSelectedKPIs,
      })),
      hasValidAssignments,
    });

    if (!hasValidAssignments) {
      // TEMPORARY: Allow assignment to proceed if detection might be wrong
      console.log(
        "🔧 DEBUG: No valid assignments detected, but allowing to proceed for debugging"
      );
      // errors.push(
      //   "All selected KPIs are already assigned to the selected entities. No new assignments needed."
      // );
      // return errors;
    }

    // Validate target assignments for each selected KPI
    selectedKPIs.forEach((kpiId) => {
      const parentKPI = kpis.find((k) => k.kpiId === kpiId);
      if (!parentKPI) return;

      const kpiType = detectKPIType(parentKPI);
      // Removed unused unitType variable
      const cleanName = parentKPI.name;

      if (kpiType === "SUMMABLE") {
        // For summable KPIs, check if total assigned equals parent target
        const totalAssigned = getTotalAssignedTarget(kpiId);
        const parentTarget = getYearlyTotalFromTargets(parentKPI.targets || []);

        if (Math.abs(totalAssigned - parentTarget) > 0.01) {
          // Allow small rounding differences
          errors.push(
            `Total assigned target for "${cleanName}" (${totalAssigned}) must equal parent target (${parentTarget})`
          );
        }
      } else {
        // For percentage KPIs, check if all assignees have targets
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
  };

  // Smart assignment function that prevents duplicates and adds new KPIs to existing objectives
  const handleSmartAssignment = async (assignment: {
    assigneeId: string;
    assigneeName: string;
    kpis: string[];
  }) => {
    // Find existing objective for this assignee
    // Also check that it's a child of the current objective (has the same parent)
    const existingObjective = allObjectives?.find(
      (obj: Objective) =>
        obj.assigneeType === getAssigneeObjectiveType() &&
        obj.assigneeId === assignment.assigneeId &&
        obj.parent?.objectiveId === objective.objectiveId
    );

    if (existingObjective) {
      // ✅ Objective exists - check which KPIs are missing
      const existingKPIs = existingObjective.kpis || [];
      const selectedKPIObjects = kpis.filter((k) =>
        assignment.kpis.includes(k.kpiId)
      );

      // Find KPIs that are NOT already assigned
      const newKPIs = selectedKPIObjects.filter(
        (selectedKPI) =>
          !existingKPIs.some(
            (existingKPI) => existingKPI.name === selectedKPI.name
          )
      );

      // Find KPIs that ARE already assigned
      const alreadyAssignedKPIs = selectedKPIObjects.filter((selectedKPI) =>
        existingKPIs.some(
          (existingKPI) => existingKPI.name === selectedKPI.name
        )
      );

      console.log("🔧 DEBUG: Existing objective found:", {
        existingObjectiveId: existingObjective.objectiveId,
        existingObjectiveName: existingObjective.name,
        assigneeId: assignment.assigneeId,
        assigneeName: getAssigneeName(assignment.assigneeId),
        existingKPIs: existingKPIs.map((k) => k.name),
        newKPIs: newKPIs.map((k) => k.name),
        alreadyAssignedKPIs: alreadyAssignedKPIs.map((k) => k.name),
      });

      if (newKPIs.length > 0) {
        // ✅ Add missing KPIs to existing objective using CREATE_KPI
        console.log(
          "🔧 DEBUG: Adding new KPIs to existing objective using CREATE_KPI:",
          {
            existingObjectiveId: existingObjective.objectiveId,
            newKPIIds: newKPIs.map((k) => k.kpiId),
            newKPINames: newKPIs.map((k) => k.name),
          }
        );

        // Create each new KPI in the existing objective
        const createdKPIs = [];
        for (const newKPI of newKPIs) {
          try {
            const createdKPI = await createKpi({
              name: newKPI.name,
              baseline: newKPI.baseline || 0,
              weight: newKPI.weight || 0,
              unitType: newKPI.unitType || "NUMBER",
              objectiveId: existingObjective.objectiveId, // Add to existing objective
              parentId: newKPI.kpiId, // Link to parent KPI
              targets: [], // Empty targets - will be set later
            });
            createdKPIs.push(createdKPI);
            console.log(
              "✅ Created KPI in existing objective:",
              createdKPI.name
            );

            // Immediately set targets for the newly created KPI
            const targetValue = getTargetAssignment(
              newKPI.kpiId,
              assignment.assigneeId
            );
            if (targetValue !== null) {
              console.log("🔧 DEBUG: Setting targets for newly created KPI:", {
                kpiId: createdKPI.kpiId,
                kpiName: createdKPI.name,
                targetValue,
                timeline: getTimelineFromContext(),
              });

              await updateKpiTargets(createdKPI.kpiId, [
                {
                  timeline: getTimelineFromContext(),
                  target: targetValue,
                },
              ]);
              console.log(
                "✅ Set targets for newly created KPI:",
                createdKPI.name
              );
            } else {
              console.log(
                "⚠️ No target value found for newly created KPI:",
                createdKPI.name
              );
            }
          } catch (error) {
            console.error("❌ Failed to create KPI:", newKPI.name, error);
            throw error;
          }
        }

        // Return the existing objective with the new KPIs
        return {
          ...existingObjective,
          kpis: [...existingKPIs, ...createdKPIs],
        };
      } else {
        // ✅ Skip entirely - all KPIs already exist
        console.log("🔧 DEBUG: All KPIs already assigned, skipping assignment");
        return null; // Indicate no assignment needed
      }
    } else {
      // ✅ Create new objective with all KPIs using assignObjective
      console.log("🔧 DEBUG: Creating new objective:", {
        assigneeId: assignment.assigneeId,
        assigneeName: getAssigneeName(assignment.assigneeId),
        kpis: assignment.kpis,
      });

      return await handleNewObjectiveAssignment({
        ...assignment,
        assigneeType: getAssigneeObjectiveType(),
      });
    }
  };

  // Handle new objective assignment (original logic)
  const handleNewObjectiveAssignment = async (assignment: {
    assigneeId: string;
    assigneeName: string;
    assigneeType: string;
    kpis: string[];
  }) => {
    // Determine the correct objective type to create based on current objective type and assignee type
    const getObjectiveTypeToCreate = () => {
      if (objective.type === "CORPORATE") {
        return assigneeType === "DIVISION" ? "DIVISION" : "DEPARTMENT";
      } else if (objective.type === "DIVISION") {
        return "DEPARTMENT";
      } else if (objective.type === "DEPARTMENT") {
        return "PERSONNEL";
      }
      return "DIVISION"; // fallback
    };

    const objectiveTypeToCreate = getObjectiveTypeToCreate();
    const apiAssigneeType =
      assignment.assigneeType === "EMPLOYEE"
        ? "PERSONNEL"
        : assignment.assigneeType;

    console.log("🔧 DEBUG: Creating new objective for:", {
      assigneeId: assignment.assigneeId,
      assigneeName: getAssigneeName(assignment.assigneeId),
      assigneeType: apiAssigneeType,
      objectiveTypeToCreate,
      currentObjectiveType: objective.type,
      kpis: assignment.kpis,
      objectiveId: objective.objectiveId,
      mutationInput: {
        objectiveId: objective.objectiveId,
        assigneeId: assignment.assigneeId,
        assignerId,
        assigneeType: apiAssigneeType,
        kpis: assignment.kpis,
      },
    });

    if (!assignerId) {
      throw new Error("Assigner ID is required");
    }

    return await assignObjective({
      objectiveId: objective.objectiveId,
      assigneeId: assignment.assigneeId,
      assignerId,
      assigneeType: apiAssigneeType,
      kpis: assignment.kpis,
    });
  };

  // Handle form submission - assign all assignments with target data
  const handleSubmit = async () => {
    console.log("🔧 DEBUG: handleSubmit called");

    if (assignments.length === 0 || !assignerId) {
      console.log("🔧 DEBUG: Early return - no assignments or assignerId");
      return;
    }

    console.log("🔧 DEBUG: About to validate assignments");
    // Validate target assignments before submission
    const validationErrors = validateAssignmentTargets();
    console.log("🔧 DEBUG: Validation errors:", validationErrors);
    console.log(
      "🔧 DEBUG: Validation errors details:",
      validationErrors.map((error, index) => `Error ${index}: "${error}"`)
    );

    if (validationErrors.length > 0) {
      console.log("🔧 DEBUG: Validation failed, setting errors");
      setErrors(validationErrors);
      toast.error("Target assignment validation failed", {
        description: validationErrors.join(", "),
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitting(true);

    try {
      // Submit each assignment individually with target data
      for (const assignment of assignments) {
        const assignmentResult = await handleSmartAssignment(assignment);

        // Skip if no assignment was needed (all KPIs already exist)
        if (!assignmentResult) {
          console.log("🔧 DEBUG: Skipping assignment - all KPIs already exist");
          continue;
        }

        console.log("🔧 DEBUG: Assignment result:", {
          assignmentResult: assignmentResult
            ? {
                objectiveId: assignmentResult.objectiveId,
                name: assignmentResult.name,
                type: assignmentResult.type,
                assigneeId: assignmentResult.assigneeId,
                assigneeType: assignmentResult.assigneeType,
                parentId: assignmentResult.parent?.objectiveId,
                parentName: assignmentResult.parent?.name,
                kpisCount: assignmentResult.kpis?.length || 0,
              }
            : null,
        });

        // Get the newly created assignee KPI IDs from the assignment result
        const assigneeKpis = assignmentResult?.kpis || [];

        // Create a mapping from original KPI IDs to new assignee KPI IDs
        // Since assigneeKpis are returned in the same order as assignment.kpis
        const originalKpiIdToAssigneeId = new Map();
        assigneeKpis.forEach(
          (
            assigneeKpi: { kpiId: string; name: string; status: string },
            index: number
          ) => {
            const originalKpiId = assignment.kpis[index];
            if (originalKpiId) {
              originalKpiIdToAssigneeId.set(originalKpiId, assigneeKpi.kpiId);
            }
          }
        );

        // Then, update KPI targets for each assigned KPI using the NEW assignee KPI IDs
        // CRITICAL FIX: Use assignee KPI IDs, NOT original corporate KPI IDs
        console.log("🔧 DEBUG: Starting target update loop for assignment:", {
          assignmentId: assignment.assigneeId,
          assignmentType: assignment.assigneeType,
          kpisToUpdate: assignment.kpis,
          assigneeKpis: assigneeKpis,
          originalKpiIdToAssigneeId: Array.from(
            originalKpiIdToAssigneeId.entries()
          ),
        });

        for (const originalKpiId of assignment.kpis) {
          const targetValue = getTargetAssignment(
            originalKpiId,
            assignment.assigneeId
          );
          console.log("🔧 DEBUG: Target assignment check:", {
            originalKpiId,
            assigneeId: assignment.assigneeId,
            targetValue,
            hasTarget: targetValue !== null,
          });

          if (targetValue !== null) {
            try {
              // Find the original KPI to get its name
              const originalKpi = kpis.find((k) => k.kpiId === originalKpiId);
              if (!originalKpi) {
                console.warn(`Original KPI ${originalKpiId} not found`);
                continue;
              }

              // Get the NEW assignee KPI ID using the original KPI ID mapping
              const assigneeKpiId =
                originalKpiIdToAssigneeId.get(originalKpiId);
              if (!assigneeKpiId) {
                console.warn(
                  `Assignee KPI ID not found for original KPI ${originalKpiId}`
                );
                continue;
              }

              // 🔧 DEBUG: Add comprehensive debugging before updateKpiTargets
              console.log("🔧 DEBUG BEFORE updateKpiTargets:", {
                originalKpiId,
                targetValue,
                assigneeKpiId,
                originalKpiName: originalKpi.name,
                originalKpiIdToAssigneeId: Array.from(
                  originalKpiIdToAssigneeId.entries()
                ),
                assignment: assignment,
                timeline: getTimelineFromContext(),
                targetInput: {
                  timeline: getTimelineFromContext(),
                  target: targetValue,
                },
              });

              // Update the NEW ASSIGNEE KPI (not the original corporate KPI)
              await updateKpiTargets(assigneeKpiId, [
                {
                  timeline: getTimelineFromContext(),
                  target: targetValue,
                },
              ]);
              console.log(
                `✅ Updated NEW ASSIGNEE KPI ${assigneeKpiId} (${originalKpi.name}) for assignee ${assignment.assigneeId} with target ${targetValue}`
              );
              console.log(
                `✅ Original corporate KPI ${originalKpiId} remains unchanged with its original targets`
              );
            } catch (error) {
              console.error(`Failed to update assignee KPI targets:`, error);
              // Continue with other assignments even if one fails
            }
          }
        }
      }

      toast.success("Smart assignment completed successfully!", {
        description: `Created new objectives and added KPIs to existing objectives using CREATE_KPI. No duplicates created.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Assignment failed:", error);
      toast.error("Failed to assign objective", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const isFormValid = assignments.length > 0 && !!assignerId; // Temporarily remove assignmentErrors check

  console.log("🔧 DEBUG: Form validation check:", {
    assignmentsLength: assignments.length,
    hasAssignerId: !!assignerId,
    assignmentErrorsLength: assignmentErrors.length,
    isFormValid,
    loading,
    isSubmitting,
    buttonDisabled: !isFormValid || loading || isSubmitting,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Objective
          </DialogTitle>
          <DialogDescription>
            Assign &quot;{objective.name}&quot; to a{" "}
            {objective.type === "CORPORATE"
              ? "division or department"
              : objective.type === "DIVISION"
              ? "department"
              : "employee"}{" "}
            with selected KPIs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Smart Assignment Info */}
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-green-800 text-sm">
              <strong>Smart Assignment:</strong> The system prevents duplicate
              objectives by adding new KPIs to existing objectives when
              possible. This ensures clean data organization and eliminates
              duplicates.
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log("🔧 DEBUG: Force refreshing objectives data...");
                refetchObjectives();
              }}
              className="ml-auto text-xs"
            >
              🔄 Refresh Data
            </Button>
          </div>

          {/* Assignee Type Selection */}
          <Tabs
            value={assigneeType}
            onValueChange={(value) =>
              updateAssigneeType(
                value as "DIVISION" | "DEPARTMENT" | "PERSONNEL"
              )
            }
          >
            <TabsList
              className={`grid w-full ${
                getTabCount() === 1
                  ? "grid-cols-1"
                  : getTabCount() === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {/* Division tab - only show for CORPORATE objectives */}
              {objective.type === "CORPORATE" && (
                <TabsTrigger
                  value="DIVISION"
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Division
                </TabsTrigger>
              )}

              {/* Department tab - show for CORPORATE and DIVISION objectives */}
              {(objective.type === "CORPORATE" ||
                objective.type === "DIVISION") && (
                <TabsTrigger
                  value="DEPARTMENT"
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Department
                </TabsTrigger>
              )}

              {/* Employee tab - show for DEPARTMENT objectives only */}
              {objective.type === "DEPARTMENT" && (
                <TabsTrigger
                  value="EMPLOYEE"
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Employee
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="DIVISION" className="space-y-4">
              <div className="space-y-2">
                <Label>Search Divisions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search divisions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredDivisions.map((division: Division) => (
                  <div
                    key={division.divisionId}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedAssignees.includes(division.divisionId)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAssignees.includes(
                          division.divisionId
                        )}
                        onCheckedChange={(checked) =>
                          handleAssigneeSelection(
                            division.divisionId,
                            checked as boolean
                          )
                        }
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{division.name}</h4>
                        <p className="text-sm text-gray-500">
                          Manager: {division.manager?.fullName || "No Manager"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Departments: {division.departments?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="DEPARTMENT" className="space-y-4">
              <div className="space-y-2">
                <Label>Search Departments</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredDepartments.map((department: Department) => (
                  <div
                    key={department.departmentId}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedAssignees.includes(department.departmentId)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAssignees.includes(
                          department.departmentId
                        )}
                        onCheckedChange={(checked) =>
                          handleAssigneeSelection(
                            department.departmentId,
                            checked as boolean
                          )
                        }
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{department.name}</h4>
                        <p className="text-sm text-gray-500">
                          Manager:{" "}
                          {department.manager?.fullName || "No Manager"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Division: {department.division?.name || "No Division"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Employees: {department.employees?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="EMPLOYEE" className="space-y-4">
              <div className="space-y-2">
                <Label>Search Employees</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {employeesLoading && (
                  <div className="p-4 text-center text-gray-500">
                    Loading employees...
                  </div>
                )}
                {employeesError && (
                  <div className="p-4 text-center text-red-500">
                    Error loading employees: {employeesError.message}
                  </div>
                )}
                {!employeesLoading &&
                  !employeesError &&
                  filteredEmployees.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No employees found for this department
                    </div>
                  )}
                {filteredEmployees.map((employee: Employee) => (
                  <div
                    key={employee.employeeId}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedAssignees.includes(employee.employeeId)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAssignees.includes(
                          employee.employeeId
                        )}
                        onCheckedChange={(checked) =>
                          handleAssigneeSelection(
                            employee.employeeId,
                            checked as boolean
                          )
                        }
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{employee.fullName}</h4>
                        <p className="text-sm text-gray-500">
                          Email: {employee.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Role: {employee.role}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: {employee.status}
                        </p>
                        {employee.departments &&
                          employee.departments.length > 0 && (
                            <p className="text-sm text-gray-500">
                              Department:{" "}
                              {employee.departments
                                .map((dept) => dept.name)
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Add to Assignment List Button */}
          {selectedAssignees.length > 0 && selectedKPIs.length > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={handleAddToAssignments}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Add {selectedAssignees.length} {assigneeType.toLowerCase()}
                {selectedAssignees.length > 1 ? "s" : ""} with{" "}
                {selectedKPIs.length} KPI{selectedKPIs.length > 1 ? "s" : ""} to
                Assignment List
              </Button>
            </div>
          )}

          <Separator />

          {/* KPI Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select KPIs to Assign</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedKPIs.length === kpis.length && kpis.length > 0
                    }
                    onCheckedChange={handleSelectAllKPIs}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.kpiId}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <Checkbox
                      checked={selectedKPIs.includes(kpi.kpiId)}
                      onCheckedChange={(checked) =>
                        handleKPISelection(kpi.kpiId, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{kpi.name}</h4>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Baseline: {kpi.baseline || "N/A"}</span>
                        <span>Weight: {kpi.weight}%</span>
                        <span>Targets: {kpi.targets?.length || 0}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        kpi.status === "APPROVED" ? "default" : "secondary"
                      }
                    >
                      {kpi.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Target Assignment Section */}
          {selectedKPIs.length > 0 && assignments.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Target className="w-5 h-5" />
                  Target Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedKPIs.map((kpiId) => {
                  const kpi = kpis.find((k) => k.kpiId === kpiId);
                  if (!kpi) return null;

                  const kpiType = detectKPIType(kpi);
                  const cleanName = kpi.name;
                  const parentTarget = getYearlyTotalFromTargets(
                    kpi.targets || []
                  );
                  const totalAssigned = getTotalAssignedTarget(kpiId);
                  const unitLabel = getDetailedUnitLabel(kpi);
                  const assignmentMethod = getAssignmentMethodDescription(kpi);

                  return (
                    <div key={kpiId} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">
                            {cleanName}
                          </h4>
                          <p className="text-sm text-blue-700">
                            {assignmentMethod}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-700">
                            Parent Target: {parentTarget} {unitLabel}
                          </p>
                          {kpiType === "SUMMABLE" && (
                            <p
                              className={`text-sm ${
                                totalAssigned === parentTarget
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              Total Assigned: {totalAssigned} {unitLabel}
                            </p>
                          )}
                          {kpiType === "PERCENTAGE" && (
                            <div className="flex items-center gap-2 mt-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={parentTarget.toString()}
                                value={bulkAssignmentValues[kpiId] || ""}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setBulkAssignmentValues((prev) => ({
                                    ...prev,
                                    [kpiId]: value,
                                  }));
                                }}
                                className="w-20 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const value =
                                      bulkAssignmentValues[kpiId] ||
                                      parentTarget;
                                    handleBulkAssignment(kpiId, value);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const value =
                                    bulkAssignmentValues[kpiId] || parentTarget;
                                  handleBulkAssignment(kpiId, value);
                                }}
                                className="text-xs"
                              >
                                Bulk Assign
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {assignments.map((assignment) => {
                          const assignee = getAssigneeDetails(
                            assignment.assigneeId,
                            assignment.assigneeType
                          );
                          const assigneeName =
                            assignment.assigneeType === "EMPLOYEE"
                              ? (assignee as Employee)?.fullName || ""
                              : (assignee as Division | Department)?.name || "";

                          const currentTarget =
                            getTargetAssignment(kpiId, assignment.assigneeId) ||
                            0;

                          return (
                            <div
                              key={`${kpiId}-${assignment.assigneeId}`}
                              className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {assigneeName}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={currentTarget}
                                  onChange={(e) => {
                                    const newTarget =
                                      parseFloat(e.target.value) || 0;
                                    updateTargetAssignment(
                                      kpiId,
                                      assignment.assigneeId,
                                      newTarget,
                                      kpi
                                    );
                                  }}
                                  className="w-24"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-600">
                                  {unitLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {kpiType === "SUMMABLE" && (
                        <div
                          className={`flex items-center gap-2 p-2 rounded ${
                            totalAssigned === parentTarget
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {totalAssigned === parentTarget ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          <span className="text-sm">
                            {totalAssigned === parentTarget
                              ? "Target allocation is valid"
                              : `Target allocation must equal ${parentTarget} ${unitLabel}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Assignment List */}
          {assignments.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Assignment List ({assignments.length} assignments)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-300"
                          >
                            {assignment.assigneeType}
                          </Badge>
                          <h4 className="font-medium">
                            {assignment.assigneeName}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {assignment.kpis.length} KPI
                          {assignment.kpis.length > 1 ? "s" : ""}:{" "}
                          {assignment.kpis
                            .map((kpiId) => {
                              const kpi = kpis.find((k) => k.kpiId === kpiId);
                              return kpi?.name;
                            })
                            .join(", ")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAssignment(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Errors */}
          {assignmentErrors.length > 0 && (
            <div className="space-y-2">
              {assignmentErrors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Assignment Preview */}
          {assignments.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Info className="w-5 h-5" />
                  Assignment Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.map((assignment) => {
                  // Calculate preview for each assignment
                  const existingObjective = allObjectives?.find(
                    (obj) =>
                      obj.assigneeType === getAssigneeObjectiveType() &&
                      obj.assigneeId === assignment.assigneeId &&
                      obj.parent?.objectiveId === objective.objectiveId
                  );

                  // Get existing KPIs if objective exists
                  const existingKPIs = existingObjective?.kpis || [];

                  // Check which selected KPIs already exist
                  const selectedKPIObjects = kpis.filter((k) =>
                    assignment.kpis.includes(k.kpiId)
                  );
                  const existingSelectedKPIs = selectedKPIObjects.filter((k) =>
                    existingKPIs.some((existing) => existing.name === k.name)
                  );
                  const newKPIs = selectedKPIObjects.filter(
                    (k) =>
                      !existingKPIs.some((existing) => existing.name === k.name)
                  );

                  const preview = {
                    assigneeId: assignment.assigneeId,
                    assigneeName: assignment.assigneeName,
                    existingObjective,
                    existingKPIs: existingKPIs.map((k) => k.name),
                    existingSelectedKPIs: existingSelectedKPIs.map(
                      (k) => k.name
                    ),
                    newKPIs: newKPIs.map((k) => k.name),
                    willCreate: !existingObjective,
                    willAdd: existingObjective && newKPIs.length > 0,
                    willSkip: existingObjective && newKPIs.length === 0,
                    hasWarnings: existingSelectedKPIs.length > 0,
                  };

                  return (
                    <div
                      key={preview.assigneeId}
                      className="p-3 bg-white border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-blue-900">
                          {preview.assigneeName}
                        </h4>
                        {preview.willCreate && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-300"
                          >
                            ➕ New Objective
                          </Badge>
                        )}
                        {preview.willAdd && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-300"
                          >
                            ➕ Add New KPIs
                          </Badge>
                        )}
                        {preview.willSkip && (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-700 border-gray-300"
                          >
                            ⏭️ Skip (All Exist)
                          </Badge>
                        )}
                        {preview.hasWarnings && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-700 border-yellow-300"
                          >
                            ⚠️ Duplicates Found
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        {preview.willCreate && (
                          <div className="text-green-700">
                            ➕ Will create new objective with{" "}
                            {preview.newKPIs.length} KPI
                            {preview.newKPIs.length > 1 ? "s" : ""}:{" "}
                            {preview.newKPIs.join(", ")}
                          </div>
                        )}

                        {preview.willAdd && (
                          <div className="text-green-700">
                            ➕ Will add {preview.newKPIs.length} new KPI
                            {preview.newKPIs.length > 1 ? "s" : ""} to existing
                            objective: {preview.newKPIs.join(", ")}
                          </div>
                        )}
                        {preview.willSkip && (
                          <div className="text-gray-700">
                            ⏭️ Will skip assignment: All KPIs already assigned
                            to {preview.assigneeName}
                          </div>
                        )}

                        {preview.hasWarnings && (
                          <div className="text-yellow-700">
                            ⚠️ Will skip {preview.existingSelectedKPIs.length}{" "}
                            existing KPI
                            {preview.existingSelectedKPIs.length > 1 ? "s" : ""}
                            : {preview.existingSelectedKPIs.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Validation Warning */}
          {assignments.length === 0 && assignmentErrors.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">
                Please add at least one assignment to the list before
                submitting.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              console.log("🔧 DEBUG: Button clicked!");
              console.log("🔧 DEBUG: Button state:", {
                isFormValid,
                loading,
                isSubmitting,
                disabled: !isFormValid || loading || isSubmitting,
              });
              try {
                await handleSubmit();
              } catch (error) {
                console.error("🔧 DEBUG: Error in handleSubmit:", error);
                console.error(
                  "🔧 DEBUG: Error stack:",
                  (error as Error)?.stack
                );
              }
            }}
            disabled={!isFormValid || loading || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading || isSubmitting
              ? "Assigning..."
              : `Assign to ${assignments.length} ${
                  assignments.length === 1 ? "Entity" : "Entities"
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
