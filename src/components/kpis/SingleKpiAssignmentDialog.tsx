"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Users, Loader2, UserPlus, TrendingUp } from "lucide-react";
import { Kpi } from "@/types/graphql";
import {
  GET_KPI_ASSIGNMENTS_DEPARTMENT,
  GET_KPI_ASSIGNMENTS_DIVISION,
  GET_KPI_ASSIGNMENTS_CORPORATE,
} from "@/lib/graphql/queries/kpis";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation } from "@apollo/client";
import {
  BULK_ASSIGN_KPI_TO_EMPLOYEES,
  BULK_ASSIGN_KPI_TO_DEPARTMENTS,
  BULK_ASSIGN_KPI_TO_DIVISIONS,
  CREATE_KPI_ASSIGNMENT_CORPORATE,
  CREATE_KPI_ASSIGNMENT_DEPARTMENT,
} from "@/lib/graphql/mutations/kpis";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { parseGraphQLError } from "@/utils/errorParsing";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Assignee {
  id: string;
  targetValue: string;
  customWeight?: string;
}

interface SingleKpiAssignmentDialogProps {
  kpi: Kpi;
  onSuccess?: () => void;
}

/**
 * Component for assigning a single KPI to downstream entities
 * Manually controls dialog state instead of using trigger pattern to work inside DropdownMenu
 */
export default function SingleKpiAssignmentDialog({
  kpi,
  onSuccess,
}: SingleKpiAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState<
    "equal" | "proportional" | "custom"
  >("proportional");
  const [corporateTargetLevel, setCorporateTargetLevel] = useState<
    "DIVISION" | "DEPARTMENT"
  >("DIVISION");
  // Auto-populate assignees with the cascading portion of target
  const initializeAssignees = () => {
    const mode = (kpi as any).kpiMode || "AGGREGATED";
    const retention = (kpi as any).managerRetentionPercent || 0;
    const originalTarget = kpi.targetValue || 0;
    const cascadingTarget = mode === "HYBRID" 
      ? originalTarget - (originalTarget * retention / 100)
      : originalTarget;
    
    return [{ id: "", targetValue: cascadingTarget.toString() }];
  };

  const [assignees, setAssignees] = useState<Assignee[]>(initializeAssignees);
  const [cap, setCap] = useState("1.5");

  const user = useAuthStore((state) => state.user);
  const organizationId = user?.organizationId;
  const objectiveType = kpi.objective?.type;
  const strategicPeriodId = kpi.objective?.strategicPeriod?.strategicPeriodId;

  // Determine child level
  const childLevel =
    objectiveType === "DEPARTMENT"
      ? "EMPLOYEE"
      : objectiveType === "DIVISION"
        ? "DEPARTMENT"
        : corporateTargetLevel;

  // Query for parent assignment
  let queryVariables: any = null;
  let queryToUse: any = null;
  let skipQuery = false;

  if (objectiveType === "CORPORATE") {
    queryToUse = GET_KPI_ASSIGNMENTS_CORPORATE;
    queryVariables = {
      organizationId,
      kpiId: kpi.kpiId,
      strategicPeriodId,
      page: 1,
      limit: 1,
    };
    skipQuery = !organizationId || !strategicPeriodId;
  } else if (objectiveType === "DIVISION") {
    queryToUse = GET_KPI_ASSIGNMENTS_DIVISION;
    queryVariables = {
      divisionId: kpi.objective?.assigneeId,
      strategicPeriodId,
      page: 1,
      limit: 100,
    };
    skipQuery = !kpi.objective?.assigneeId || !strategicPeriodId;
  } else if (objectiveType === "DEPARTMENT") {
    queryToUse = GET_KPI_ASSIGNMENTS_DEPARTMENT;
    queryVariables = {
      departmentId: kpi.objective?.assigneeId,
      strategicPeriodId,
      page: 1,
      limit: 100,
    };
    skipQuery = !kpi.objective?.assigneeId || !strategicPeriodId;
  }

  const { data: assignmentData, loading: assignmentLoading } = useQuery(queryToUse, {
    skip: skipQuery || !queryToUse || !open,
    variables: queryVariables,
    fetchPolicy: "network-only",
  });

  // Fetch options based on child level
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: childLevel !== "EMPLOYEE" || !open,
  });

  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    skip: childLevel !== "DEPARTMENT" || !open,
  });

  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
    skip: childLevel !== "DIVISION" || !open,
  });

  // Extract parent assignment ID
  let parentAssignmentId: string | null = null;
  let parentWeight = kpi.weight || 0;

  if (assignmentData && !assignmentLoading) {
    const assignments =
      objectiveType === "CORPORATE"
        ? assignmentData.kpiAssignmentsCorporate?.items
        : objectiveType === "DIVISION"
          ? assignmentData.kpiAssignmentsDivision?.items
          : assignmentData.kpiAssignmentsDepartment?.items;

    const assignment = assignments?.find((a: any) => a.kpi?.kpiId === kpi.kpiId);

    if (assignment) {
      parentAssignmentId =
        objectiveType === "CORPORATE"
          ? assignment.kpiAssignmentCorporateId
          : objectiveType === "DIVISION"
            ? assignment.kpiAssignmentDivisionId
            : assignment.kpiAssignmentDepartmentId;
    }
  }

  // Mutations
  const [createCorporateAssignment] = useMutation(
    CREATE_KPI_ASSIGNMENT_CORPORATE,
    {
      refetchQueries: "active",
      onError: (error) => {
        const { title, description } = parseGraphQLError(error, "Corporate assignment");
        toast.error(title, { description });
      },
    }
  );

  const [createDepartmentAssignment, { loading: creatingDepartment }] =
    useMutation(CREATE_KPI_ASSIGNMENT_DEPARTMENT, {
      refetchQueries: "active",
      onError: (error) => {
        const { title, description } = parseGraphQLError(
          error,
          "Department assignment",
        );
        toast.error(title, { description });
      },
    });

  const [bulkAssignToEmployees, { loading: loadingEmployees }] = useMutation(
    BULK_ASSIGN_KPI_TO_EMPLOYEES,
    {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success(`KPI assigned to ${assignees.length} employees`);
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(error, "Bulk assignment");
        toast.error(title, { description });
      },
    }
  );

  const [bulkAssignToDepartments, { loading: loadingDepartments }] = useMutation(
    BULK_ASSIGN_KPI_TO_DEPARTMENTS,
    {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success(`KPI assigned to ${assignees.length} departments`);
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(error, "Bulk assignment");
        toast.error(title, { description });
      },
    }
  );

  const [bulkAssignToDivisions, { loading: loadingDivisions }] = useMutation(
    BULK_ASSIGN_KPI_TO_DIVISIONS,
    {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success(`KPI assigned to ${assignees.length} divisions`);
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(error, "Bulk assignment");
        toast.error(title, { description });
      },
    }
  );

  const loading =
    loadingEmployees ||
    loadingDepartments ||
    loadingDivisions ||
    creatingDepartment;

  const handleClose = () => {
    setOpen(false);
    setAssignees(initializeAssignees());
    setDistributionMethod("proportional");
    setCorporateTargetLevel("DIVISION");
    setCap("1.5");
    onSuccess?.();
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  const addAssignee = () => {
    const mode = (kpi as any).kpiMode || "AGGREGATED";
    const retention = (kpi as any).managerRetentionPercent || 0;
    const originalTarget = kpi.targetValue || 0;
    const cascadingTarget = mode === "HYBRID" 
      ? originalTarget - (originalTarget * retention / 100)
      : originalTarget;
    
    setAssignees([...assignees, { id: "", targetValue: cascadingTarget.toString() }]);
  };

  const removeAssignee = (index: number) => {
    if (assignees.length > 1) {
      setAssignees(assignees.filter((_, i) => i !== index));
    }
  };

  const updateAssignee = (index: number, field: keyof Assignee, value: string) => {
    const updated = [...assignees];
    updated[index] = { ...updated[index], [field]: value };
    setAssignees(updated);
  };

  const calculateTargetDistribution = () => {
    // For HYBRID mode, only distribute the team's portion of the target
    const mode = (kpi as any).kpiMode || "AGGREGATED";
    const retention = (kpi as any).managerRetentionPercent || 0;
    const originalTarget = kpi.targetValue || 0;
    const cascadingTarget = mode === "HYBRID" 
      ? originalTarget - (originalTarget * retention / 100)
      : originalTarget;

    if (distributionMethod === "equal") {
      const targetPerAssignee = cascadingTarget / assignees.length;
      return assignees.map(() => targetPerAssignee.toFixed(2));
    }
    return assignees.map((a) => a.targetValue);
  };

  const calculateWeightDistribution = () => {
    // For HYBRID mode, only distribute the team's portion
    const mode = (kpi as any).kpiMode || "AGGREGATED";
    const retention = (kpi as any).managerRetentionPercent || 0;
    const cascadingWeight = mode === "HYBRID" 
      ? parentWeight - (parentWeight * retention / 100)
      : parentWeight;

    if (distributionMethod === "equal") {
      const weightPerAssignee = cascadingWeight / assignees.length;
      return assignees.map(() => weightPerAssignee.toFixed(2));
    } else if (distributionMethod === "proportional") {
      const totalTarget = assignees.reduce(
        (sum, a) => sum + (parseFloat(a.targetValue) || 0),
        0
      );
      if (totalTarget === 0) return assignees.map(() => "0");

      return assignees.map((a) => {
        const target = parseFloat(a.targetValue) || 0;
        const proportion = target / totalTarget;
        return (cascadingWeight * proportion).toFixed(2);
      });
    } else {
      return assignees.map((a) => a.customWeight || "0");
    }
  };

  const distributedTargets = calculateTargetDistribution();

  const weights = calculateWeightDistribution();
  const totalWeight = weights.reduce((sum, w) => sum + parseFloat(w), 0).toFixed(2);
  
  // For HYBRID mode, validate against team's portion only
  const mode = (kpi as any).kpiMode || "AGGREGATED";
  const retention = (kpi as any).managerRetentionPercent || 0;
  const cascadingWeight = mode === "HYBRID" 
    ? parentWeight - (parentWeight * retention / 100)
    : parentWeight;
  
  const isValidWeightSum = Math.abs(parseFloat(totalWeight) - cascadingWeight) < 0.01;

  const handleSubmit = async () => {
    if (!strategicPeriodId) {
      toast.error(
        "This KPI has no strategic period. Refresh the KPI list or assign a strategic period to its objective before cascading it.",
      );
      return;
    }

    // For CORPORATE level, create corporate assignment first if it doesn't exist
    let assignmentId = parentAssignmentId;
    
    if (objectiveType === "CORPORATE" && !parentAssignmentId) {
      try {
        const result = await createCorporateAssignment({
          variables: {
            input: {
              kpiId: kpi.kpiId,
              organizationId,
              strategicPeriodId,
              targetValue: kpi.targetValue || 0,
              weight: kpi.weight || 0,
              cap: parseFloat(cap),
              assignedById: user?.employeeId,
            },
          },
        });
        
        assignmentId = result.data?.createKpiAssignmentCorporate?.kpiAssignmentCorporateId;
        
        if (!assignmentId) {
          toast.error("Failed to create corporate assignment");
          return;
        }
      } catch (error) {
        console.error("Error creating corporate assignment:", error);
        return; // Error already handled by mutation onError
      }
    }

    if (!assignmentId) {
      toast.error("Parent assignment not found");
      return;
    }

    const hasEmptyAssignees = assignees.some((a) => !a.id);
    if (hasEmptyAssignees) {
      toast.error("Please select all assignees");
      return;
    }

    const hasInvalidTargets = distributionMethod === "equal" 
      ? false // Equal distribution calculates targets automatically
      : assignees.some((a) => !a.targetValue || isNaN(parseFloat(a.targetValue)));
    
    if (hasInvalidTargets) {
      toast.error("Please enter valid target values for all assignees");
      return;
    }

    if (distributionMethod === "custom" && !isValidWeightSum) {
      toast.error(
        `Custom weights must sum to cascading weight (${cascadingWeight.toFixed(2)}%). Current sum: ${totalWeight}%`
      );
      return;
    }

    const capValue = parseFloat(cap);
    if (isNaN(capValue) || capValue <= 0) {
      toast.error("Please enter a valid cap value");
      return;
    }

    try {
      if (childLevel === "EMPLOYEE") {
        await bulkAssignToEmployees({
          variables: {
            input: {
              departmentKpiAssignmentId: assignmentId,
              employees: assignees.map((a, index) => ({
                userId: a.id,
                targetValue: distributionMethod === "equal" 
                  ? parseFloat(distributedTargets[index])
                  : parseFloat(a.targetValue),
                customParentWeightAllocation:
                  distributionMethod === "custom"
                    ? parseFloat(a.customWeight!)
                    : undefined,
              })),
              distributionMethod,
              strategicPeriodId,
              cap: capValue,
            },
          },
        });
      } else if (
        objectiveType === "CORPORATE" &&
        childLevel === "DEPARTMENT"
      ) {
        await Promise.all(
          assignees.map((assignee, index) =>
            createDepartmentAssignment({
              variables: {
                input: {
                  kpiId: kpi.kpiId,
                  departmentId: assignee.id,
                  strategicPeriodId,
                  targetValue:
                    distributionMethod === "equal"
                      ? parseFloat(distributedTargets[index])
                      : parseFloat(assignee.targetValue),
                  weight: parseFloat(weights[index]),
                  parentWeightAllocation: parseFloat(weights[index]),
                  cap: capValue,
                  assignedById: user?.employeeId,
                },
              },
            }),
          ),
        );
        toast.success(`KPI assigned to ${assignees.length} departments`);
        handleClose();
      } else if (childLevel === "DEPARTMENT") {
        await bulkAssignToDepartments({
          variables: {
            input: {
              divisionKpiAssignmentId: assignmentId,
              departments: assignees.map((a, index) => ({
                departmentId: a.id,
                targetValue: distributionMethod === "equal" 
                  ? parseFloat(distributedTargets[index])
                  : parseFloat(a.targetValue),
                customParentWeightAllocation:
                  distributionMethod === "custom"
                    ? parseFloat(a.customWeight!)
                    : undefined,
              })),
              distributionMethod,
              strategicPeriodId,
              cap: capValue,
            },
          },
        });
      } else if (childLevel === "DIVISION") {
        await bulkAssignToDivisions({
          variables: {
            input: {
              corporateKpiAssignmentId: assignmentId,
              divisions: assignees.map((a, index) => ({
                divisionId: a.id,
                targetValue: distributionMethod === "equal" 
                  ? parseFloat(distributedTargets[index])
                  : parseFloat(a.targetValue),
                customParentWeightAllocation:
                  distributionMethod === "custom"
                    ? parseFloat(a.customWeight!)
                    : undefined,
              })),
              distributionMethod,
              strategicPeriodId,
              cap: capValue,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error assigning KPI:", error);
    }
  };

  const options =
    childLevel === "EMPLOYEE"
      ? (employeesData?.employees?.items || []).map((emp: any) => ({
          value: emp.employeeId,
          label: emp.fullName,
          description: emp.email,
        }))
      : childLevel === "DEPARTMENT"
        ? (departmentsData?.departments?.items || []).map((dept: any) => ({
            value: dept.departmentId,
            label: dept.name,
          }))
        : (divisionsData?.divisions?.items || []).map((div: any) => ({
            value: div.divisionId,
            label: div.name,
          }));

  // Render trigger button
  return (
    <>
      <DropdownMenuItem 
        onClick={handleOpen} 
        onSelect={(e) => {
          e.preventDefault();
        }}
        className="cursor-pointer"
      >
        <Users className="mr-2 h-4 w-4 text-blue-500" />
        <span>Assign KPI</span>
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Assign KPI: {kpi.name}
            </DialogTitle>
            <DialogDescription>
              Assign this KPI to multiple {childLevel.toLowerCase()}s. The original target value ({kpi.targetValue}) and weight ({parentWeight}%) will be distributed among assignees.
            </DialogDescription>
          </DialogHeader>

          {assignmentLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">Loading assignment data...</span>
            </div>
          ) : !parentAssignmentId && objectiveType !== "CORPORATE" ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800">
                No parent KPI assignment found. The KPI must first be assigned at the{" "}
                {objectiveType?.toLowerCase()} level before cascading down.
              </p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Original KPI Info with Mode Badge */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Original KPI Details
                  </h3>
                  {(() => {
                    const mode = (kpi as any).kpiMode || "AGGREGATED";
                    const retention = (kpi as any).managerRetentionPercent || 0;
                    
                    return (
                      <Badge 
                        variant="outline" 
                        className={
                          mode === "AGGREGATED" 
                            ? "bg-blue-100 text-blue-700 border-blue-300 font-semibold"
                            : mode === "DIRECT"
                              ? "bg-green-100 text-green-700 border-green-300 font-semibold"
                              : "bg-purple-100 text-purple-700 border-purple-300 font-semibold"
                        }
                      >
                        {mode === "AGGREGATED" && "📊 Team Results"}
                        {mode === "DIRECT" && "👤 Personal Work"}
                        {mode === "HYBRID" && `🔀 Shared (${retention}% Manager)`}
                      </Badge>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Original Target:</span>
                    </div>
                    <Badge variant="outline" className="text-base font-bold">
                      {kpi.targetValue || 0} {(kpi as any).customUnitLabel || kpi.unitType || ""}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Original Weight:</span>
                    </div>
                    <Badge variant="outline" className="text-base font-bold">
                      {parentWeight}%
                    </Badge>
                  </div>
                </div>

                {/* HYBRID Mode Split Visualization */}
                {(() => {
                  const mode = (kpi as any).kpiMode || "AGGREGATED";
                  const retention = (kpi as any).managerRetentionPercent || 0;
                  
                  if (mode === "HYBRID") {
                    const managerWeight = (parentWeight * retention) / 100;
                    const teamWeight = parentWeight - managerWeight;
                    const managerTarget = ((kpi.targetValue || 0) * retention) / 100;
                    const teamTarget = (kpi.targetValue || 0) - managerTarget;

                    return (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                            🔀 HYBRID MODE SPLIT:
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                            <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                              Manager's Portion ({retention}%)
                            </div>
                            <div className="text-purple-900 dark:text-purple-100">
                              Target: <strong>{managerTarget.toFixed(2)}</strong> | 
                              Weight: <strong>{managerWeight.toFixed(2)}%</strong>
                            </div>
                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              ✓ Stays with manager
                            </div>
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                            <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                              Team's Portion ({100 - retention}%)
                            </div>
                            <div className="text-blue-900 dark:text-blue-100">
                              Target: <strong>{teamTarget.toFixed(2)}</strong> | 
                              Weight: <strong>{teamWeight.toFixed(2)}%</strong>
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              → Will cascade below
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (mode === "AGGREGATED") {
                    return (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>📊 Team Results Mode:</strong> Full target and weight cascade to team. Manager's performance equals team's aggregated results.
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>

              {/* Cascading Weight Display */}
              {(() => {
                const mode = (kpi as any).kpiMode || "AGGREGATED";
                const retention = (kpi as any).managerRetentionPercent || 0;
                const cascadingWeight = mode === "HYBRID" 
                  ? parentWeight - (parentWeight * retention / 100)
                  : parentWeight;

                return (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        {mode === "HYBRID" ? "Team's Weight to Distribute:" : "Weight to Distribute:"}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {cascadingWeight.toFixed(2)}%
                    </Badge>
                  </div>
                );
              })()}

              {objectiveType === "CORPORATE" && (
                <div className="space-y-2">
                  <Label>Assign corporate KPI to</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={
                        corporateTargetLevel === "DIVISION"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        setCorporateTargetLevel("DIVISION");
                        setAssignees(initializeAssignees());
                      }}
                    >
                      Divisions
                    </Button>
                    <Button
                      type="button"
                      variant={
                        corporateTargetLevel === "DEPARTMENT"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        setCorporateTargetLevel("DEPARTMENT");
                        setAssignees(initializeAssignees());
                      }}
                    >
                      Departments
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select divisions for the normal cascade, or assign directly
                    to departments that report against this corporate KPI.
                  </p>
                </div>
              )}

              {/* Distribution Method */}
              <div className="space-y-2">
                <Label>Weight Distribution Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={distributionMethod === "equal" ? "default" : "outline"}
                    onClick={() => setDistributionMethod("equal")}
                  >
                    Equal Split
                  </Button>
                  <Button
                    type="button"
                    variant={distributionMethod === "proportional" ? "default" : "outline"}
                    onClick={() => setDistributionMethod("proportional")}
                  >
                    Proportional
                  </Button>
                  <Button
                    type="button"
                    variant={distributionMethod === "custom" ? "default" : "outline"}
                    onClick={() => setDistributionMethod("custom")}
                  >
                    Custom
                  </Button>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Assignees</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addAssignee}
                  >
                    Add {childLevel}
                  </Button>
                </div>

                <div className="space-y-3">
                  {assignees.map((assignee, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-12 gap-2">
                        <div className="col-span-5">
                          <SearchableSelect
                            options={options}
                            value={assignee.id}
                            onValueChange={(value) => updateAssignee(index, "id", value)}
                            placeholder={`Select ${childLevel.toLowerCase()}`}
                            searchPlaceholder="Search..."
                            clearable
                          />
                        </div>

                        <div className="col-span-3">
                          {distributionMethod === "equal" ? (
                            <div className="flex items-center h-10 px-3 bg-gray-50 border rounded-md">
                              <span className="text-sm font-medium text-gray-700">
                                {distributedTargets[index]} {(kpi as any).customUnitLabel || kpi.unitType || ""}
                              </span>
                            </div>
                          ) : (
                            <FormattedNumberInput
                              step="0.01"
                              placeholder={
                                kpi.unitType === "CURRENCY"
                                  ? "283,654,789"
                                  : "Target"
                              }
                              value={assignee.targetValue}
                              onValueChange={(value) =>
                                updateAssignee(index, "targetValue", value)
                              }
                              currency={kpi.unitType === "CURRENCY"}
                            />
                          )}
                        </div>

                        {distributionMethod === "custom" && (
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Weight %"
                              value={assignee.customWeight || ""}
                              onChange={(e) =>
                                updateAssignee(index, "customWeight", e.target.value)
                              }
                            />
                          </div>
                        )}

                        {distributionMethod !== "custom" && (
                          <div className="col-span-2 flex items-center">
                            <Badge variant="outline" className="w-full">
                              {weights[index]}%
                            </Badge>
                          </div>
                        )}

                        <div className="col-span-2 flex items-center justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAssignee(index)}
                            disabled={assignees.length === 1}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight Summary */}
              <div
                className={`p-3 rounded-lg border-2 ${
                  isValidWeightSum
                    ? "border-green-300 bg-green-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Weight:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{totalWeight}%</span>
                    <span className="text-sm text-gray-500">/ {cascadingWeight.toFixed(2)}%</span>
                    {isValidWeightSum ? (
                      <Badge variant="default" className="bg-green-600">
                        ✓ Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive">⚠ Invalid Sum</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Cap */}
              <div className="space-y-2">
                <Label htmlFor="cap">Overachievement Cap</Label>
                <Input
                  id="cap"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Use 1.5 for 150% max achievement scoring
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !isValidWeightSum || (!parentAssignmentId && objectiveType !== "CORPORATE")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading
                ? "Assigning..."
                : `Assign to ${assignees.length} ${childLevel}${assignees.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
