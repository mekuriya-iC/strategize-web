"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { UserPlus, Building2, Users, User, Info, Check } from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_KPI_ASSIGNMENT_EMPLOYEE,
  CREATE_KPI_ASSIGNMENT_DEPARTMENT,
  CREATE_KPI_ASSIGNMENT_DIVISION,
  CREATE_KPI_ASSIGNMENT_CORPORATE,
} from "@/lib/graphql/mutations/kpis";
import { GET_KPI } from "@/lib/graphql/queries/kpis";
import { useAuthStore } from "@/stores";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { toast } from "sonner";
import { parseGraphQLError } from "@/utils/errorParsing";
import { Checkbox } from "@/components/ui/checkbox";
import { getUnitLabel, getUnitName } from "@/utils/kpi-format";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KpiAssignmentDialogProps {
  kpi: {
    kpiId: string;
    name: string;
    targetValue?: number | null;
    assignedTargetValue?: number | null;
    measurementUnit: string;
    unitType?: string;
    customUnitLabel?: string;
    weight?: number | null;
    status?: string;
    objective?: {
      title?: string;
    } | null;
  };
  strategicPeriodId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type KpiUnitDisplay = {
  valueLabel: string;
  fullName: string;
};

const getMeasurementUnitDisplay = (kpi: KpiAssignmentDialogProps["kpi"]): KpiUnitDisplay => {
  if (kpi.customUnitLabel?.trim()) {
    const label = kpi.customUnitLabel.trim();
    return { valueLabel: label, fullName: label };
  }

  if (kpi.unitType) {
    const valueLabel = getUnitLabel(kpi.unitType);
    const fullName = getUnitName(kpi.unitType);

    return {
      valueLabel: valueLabel || kpi.measurementUnit || "",
      fullName:
        fullName && fullName !== "Unknown"
          ? fullName
          : (kpi.measurementUnit ?? "Not set"),
    };
  }

  switch (kpi.measurementUnit) {
    case "percentage":
      return { valueLabel: "%", fullName: "Percentage" };
    case "currency":
      return { valueLabel: "Million ETB", fullName: "Currency (Million ETB)" };
    case "hour":
      return { valueLabel: "hrs", fullName: "Hours" };
    case "rating":
      return { valueLabel: "Rating", fullName: "Rating" };
    case "boolean":
      return { valueLabel: "Yes/No", fullName: "Boolean" };
    case "number":
      return { valueLabel: "", fullName: "Number" };
    default:
      return {
        valueLabel: kpi.measurementUnit ?? "",
        fullName: kpi.measurementUnit ?? "Not set",
      };
  }
};

export default function KpiAssignmentDialog({
  kpi,
  strategicPeriodId,
  onSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: KpiAssignmentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const [assignmentType, setAssignmentType] = useState<
    "EMPLOYEE" | "DEPARTMENT" | "DIVISION" | "CORPORATE"
  >("EMPLOYEE");
  const [selectedId, setSelectedId] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [weight, setWeight] = useState("100");
  const [parentWeightAllocation, setParentWeightAllocation] = useState("");
  const [cap, setCap] = useState("1.5");
  const [useCustomParentWeight, setUseCustomParentWeight] = useState(false);
  const [hasEditedTarget, setHasEditedTarget] = useState(false);
  const [hasEditedWeight, setHasEditedWeight] = useState(false);

  // Fetch employees - filter by department for non-admins
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const { data: liveKpiData, loading: liveKpiLoading } = useQuery(GET_KPI, {
    variables: { kpiId: kpi.kpiId },
    skip: !open || !kpi.kpiId,
    fetchPolicy: "cache-and-network",
  });

  const liveKpi = liveKpiData?.kpi;
  const resolvedKpi = liveKpi ?? kpi;
  const resolvedTarget =
    resolvedKpi?.assignedTargetValue ?? resolvedKpi?.targetValue ?? 0;
  const resolvedWeight = resolvedKpi?.weight ?? 100;
  const resolvedMeasurementUnit = getMeasurementUnitDisplay(resolvedKpi);

  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: {
      page: 1,
      limit: 1000,
      // Only admins can see all employees, others see department employees
      ...(isAdmin ? {} : { departmentId: user?.department?.departmentId }),
    },
    skip:
      assignmentType !== "EMPLOYEE" ||
      (!isAdmin && !user?.department?.departmentId),
  });

  // Fetch departments
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    skip: assignmentType !== "DEPARTMENT",
  });

  // Fetch divisions
  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
    skip: assignmentType !== "DIVISION",
  });

  const [createEmployeeAssignment, { loading: loadingEmployee }] = useMutation(
    CREATE_KPI_ASSIGNMENT_EMPLOYEE,
    {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success("KPI assigned to employee successfully");
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(
          error,
          "KPI assignment",
        );
        toast.error(title, { description });
      },
    },
  );

  const [createDepartmentAssignment, { loading: loadingDepartment }] =
    useMutation(CREATE_KPI_ASSIGNMENT_DEPARTMENT, {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success("KPI assigned to department successfully");
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(
          error,
          "KPI assignment",
        );
        toast.error(title, { description });
      },
    });

  const [createDivisionAssignment, { loading: loadingDivision }] = useMutation(
    CREATE_KPI_ASSIGNMENT_DIVISION,
    {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success("KPI assigned to division successfully");
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(
          error,
          "KPI assignment",
        );
        toast.error(title, { description });
      },
    },
  );

  const [createCorporateAssignment, { loading: loadingCorporate }] =
    useMutation(CREATE_KPI_ASSIGNMENT_CORPORATE, {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success("KPI assigned to corporate successfully");
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(
          error,
          "KPI assignment",
        );
        toast.error(title, { description });
      },
    });

  const loading =
    loadingEmployee || loadingDepartment || loadingDivision || loadingCorporate;

  useEffect(() => {
    if (!open) {
      return;
    }

    setAssignmentType("EMPLOYEE");
    setSelectedId("");
    setTargetValue(String(resolvedTarget));
    setWeight(String(resolvedWeight));
    setParentWeightAllocation(String(resolvedWeight));
    setUseCustomParentWeight(false);
    setCap("1.5");
    setHasEditedTarget(false);
    setHasEditedWeight(false);
  }, [open, kpi.kpiId]);

  useEffect(() => {
    if (!open || hasEditedTarget) {
      return;
    }

    setTargetValue(String(resolvedTarget));
  }, [open, hasEditedTarget, resolvedTarget]);

  useEffect(() => {
    if (!open || hasEditedWeight) {
      return;
    }

    const nextWeight = String(resolvedWeight);
    setWeight(nextWeight);
    if (!useCustomParentWeight) {
      setParentWeightAllocation(nextWeight);
    }
  }, [open, hasEditedWeight, resolvedWeight, useCustomParentWeight]);

  const handleClose = () => {
    setOpen(false);
    setSelectedId("");
    setTargetValue(String(resolvedTarget));
    setWeight(String(resolvedWeight));
    setParentWeightAllocation(String(resolvedWeight));
    setUseCustomParentWeight(false);
    setCap("1.5");
    setHasEditedTarget(false);
    setHasEditedWeight(false);
    onSuccess?.();
  };

  const handleSubmit = async () => {
    if (!selectedId) {
      toast.error("Please select an assignee");
      return;
    }

    const target = parseFloat(targetValue);
    const weightValue = parseFloat(weight);
    const capValue = parseFloat(cap);
    const parentWeightValue = useCustomParentWeight && parentWeightAllocation 
      ? parseFloat(parentWeightAllocation) 
      : weightValue;

    if (isNaN(target) || isNaN(weightValue) || isNaN(capValue)) {
      toast.error("Please enter valid numbers");
      return;
    }

    if (useCustomParentWeight && isNaN(parentWeightValue)) {
      toast.error("Please enter a valid parent weight allocation");
      return;
    }

    if (capValue <= 0) {
      toast.error("Cap must be greater than zero");
      return;
    }

    try {
      if (assignmentType === "EMPLOYEE") {
        await createEmployeeAssignment({
          variables: {
            input: {
              kpiId: kpi.kpiId,
              userId: selectedId, // Backend uses userId not employeeId
              strategicPeriodId,
              targetValue: target,
              weight: weightValue,
              parentWeightAllocation: useCustomParentWeight ? parentWeightValue : undefined,
              cap: capValue,
            },
          },
        });
      } else if (assignmentType === "DEPARTMENT") {
        await createDepartmentAssignment({
          variables: {
            input: {
              kpiId: kpi.kpiId,
              departmentId: selectedId,
              strategicPeriodId,
              targetValue: target,
              weight: weightValue,
              parentWeightAllocation: useCustomParentWeight ? parentWeightValue : undefined,
              cap: capValue,
            },
          },
        });
      } else if (assignmentType === "DIVISION") {
        await createDivisionAssignment({
          variables: {
            input: {
              kpiId: kpi.kpiId,
              divisionId: selectedId,
              strategicPeriodId,
              targetValue: target,
              weight: weightValue,
              parentWeightAllocation: useCustomParentWeight ? parentWeightValue : undefined,
              cap: capValue,
            },
          },
        });
      } else if (assignmentType === "CORPORATE") {
        await createCorporateAssignment({
          variables: {
            input: {
              kpiId: kpi.kpiId,
              organizationId: selectedId,
              strategicPeriodId,
              targetValue: target,
              weight: weightValue,
              cap: capValue,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error assigning KPI:", error);
    }
  };

  const employees = employeesData?.employees?.items || [];
  const departments = departmentsData?.departments?.items || [];
  const divisions = divisionsData?.divisions?.items || [];

  const getAssignmentIcon = () => {
    switch (assignmentType) {
      case "EMPLOYEE":
        return <User className="w-5 h-5 text-blue-600" />;
      case "DEPARTMENT":
        return <Users className="w-5 h-5 text-green-600" />;
      case "DIVISION":
        return <Building2 className="w-5 h-5 text-purple-600" />;
      case "CORPORATE":
        return <Building2 className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Assign KPI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Assign KPI
          </DialogTitle>
          <DialogDescription>
            Assign <strong>{resolvedKpi.name}</strong> to an employee, department,
            division, or corporate scorecard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {resolvedKpi.name}
                </p>
                {resolvedKpi.objective?.title && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Objective: {resolvedKpi.objective.title}
                  </p>
                )}
                {resolvedKpi.status && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Status: {resolvedKpi.status.replace(/_/g, " ")}
                  </p>
                )}
              </div>
              {liveKpiLoading && (
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Refreshing KPI data...
                </p>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400 sm:grid-cols-2">
              <p>
                Current target:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {resolvedTarget}
                  {resolvedMeasurementUnit.valueLabel
                    ? ` ${resolvedMeasurementUnit.valueLabel}`
                    : ""}
                </span>
              </p>
              <p>
                Unit:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {resolvedMeasurementUnit.fullName}
                </span>
              </p>
              <p>
                Default weight:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {resolvedWeight}%
                </span>
              </p>
            </div>
          </div>

          {/* Assignment Type */}
          <div className="space-y-2">
            <Label>Assignment Type</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                variant={assignmentType === "EMPLOYEE" ? "default" : "outline"}
                className="gap-2"
                onClick={() => {
                  setAssignmentType("EMPLOYEE");
                  setSelectedId("");
                }}
              >
                <User className="w-4 h-4" />
                Employee
              </Button>
              <Button
                type="button"
                variant={
                  assignmentType === "DEPARTMENT" ? "default" : "outline"
                }
                className="gap-2"
                onClick={() => {
                  setAssignmentType("DEPARTMENT");
                  setSelectedId("");
                }}
              >
                <Users className="w-4 h-4" />
                Department
              </Button>
              <Button
                type="button"
                variant={assignmentType === "DIVISION" ? "default" : "outline"}
                className="gap-2"
                onClick={() => {
                  setAssignmentType("DIVISION");
                  setSelectedId("");
                }}
              >
                <Building2 className="w-4 h-4" />
                Division
              </Button>
              <Button
                type="button"
                variant={assignmentType === "CORPORATE" ? "default" : "outline"}
                className="gap-2"
                disabled={!user?.organizationId}
                onClick={() => {
                  setAssignmentType("CORPORATE");
                  setSelectedId(user?.organizationId || "");
                }}
              >
                <Building2 className="w-4 h-4" />
                Corporate
              </Button>
            </div>
          </div>

          {/* Assignee Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {getAssignmentIcon()}
              Select{" "}
              {assignmentType.charAt(0) + assignmentType.slice(1).toLowerCase()}
            </Label>
            <SearchableSelect
              options={
                assignmentType === "EMPLOYEE"
                  ? employees.map((emp: any) => ({
                      value: emp.employeeId,
                      label: emp.fullName,
                      description: emp.email,
                    }))
                  : assignmentType === "DEPARTMENT"
                    ? departments.map((dept: any) => ({
                        value: dept.departmentId,
                        label: dept.name,
                      }))
                    : assignmentType === "DIVISION"
                      ? divisions.map((div: any) => ({
                          value: div.divisionId,
                          label: div.name,
                        }))
                      : user?.organizationId
                        ? [
                            {
                              value: user.organizationId,
                              label: "Corporate / Organization",
                            },
                          ]
                        : []
              }
              value={selectedId}
              onValueChange={setSelectedId}
              placeholder={`Select ${assignmentType.toLowerCase()}`}
              searchPlaceholder={`Search ${assignmentType.toLowerCase()}...`}
              clearable
            />
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="targetValue">
              Target Value <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="targetValue"
                type="number"
                step="0.01"
                value={targetValue}
                onChange={(e) => {
                  setTargetValue(e.target.value);
                  setHasEditedTarget(true);
                }}
                className="flex-1"
              />
              <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400">
                {resolvedMeasurementUnit.valueLabel || resolvedMeasurementUnit.fullName}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Live KPI target: {resolvedTarget}
              {resolvedMeasurementUnit.valueLabel
                ? ` ${resolvedMeasurementUnit.valueLabel}`
                : ""}
            </p>
          </div>

          {/* Weight */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="weight">
                Weight (%) <span className="text-red-500">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Local weight used for internal performance tracking at this level</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={weight}
              onChange={(e) => {
                setHasEditedWeight(true);
                setWeight(e.target.value);
                // Auto-sync parent weight if not using custom
                if (!useCustomParentWeight) {
                  setParentWeightAllocation(e.target.value);
                }
              }}
            />
            <p className="text-xs text-gray-500">
              Local weight shown at this organizational level
            </p>
          </div>

          {/* Parent Weight Allocation (Only for non-corporate) */}
          {assignmentType !== "CORPORATE" && (
            <div className="space-y-3 border-l-2 border-blue-200 pl-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-r py-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="useCustomParentWeight"
                  checked={useCustomParentWeight}
                  onCheckedChange={(checked) => {
                    setUseCustomParentWeight(checked as boolean);
                    if (!checked) {
                      // Reset to match local weight
                      setParentWeightAllocation(weight);
                    }
                  }}
                />
                <Label
                  htmlFor="useCustomParentWeight"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  Set different parent weight allocation
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-blue-600" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-1">Parent Weight Allocation</p>
                        <p className="text-xs">
                          This is the weight contribution to the parent level when achieving 100%. 
                          Allows flexible local weight management while maintaining cascade integrity.
                        </p>
                        <p className="text-xs mt-2">
                          Example: Department shows 8% locally but contributes 6% to division.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>

              {useCustomParentWeight && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="parentWeightAllocation">
                      Parent Weight Allocation (%)
                    </Label>
                    <Input
                      id="parentWeightAllocation"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={parentWeightAllocation}
                      onChange={(e) => setParentWeightAllocation(e.target.value)}
                      placeholder={weight}
                    />
                  </div>
                  <div className="flex items-start gap-2 text-xs bg-blue-100 dark:bg-blue-900/40 p-2 rounded">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="font-medium">Weight Cascade</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Local: {weight}% (shown at this level) →{" "}
                        {assignmentType === "EMPLOYEE" && "Department"}
                        {assignmentType === "DEPARTMENT" && "Division"}
                        {assignmentType === "DIVISION" && "Corporate"}
                        : {parentWeightAllocation || weight}% (contribution to parent)
                      </p>
                    </div>
                  </div>
                </>
              )}

              {!useCustomParentWeight && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Check className="w-3 h-3 text-green-600" />
                  <span>Parent weight will match local weight ({weight}%)</span>
                </div>
              )}
            </div>
          )}

          {/* Cap */}
          <div className="space-y-2">
            <Label htmlFor="cap">
              Overachievement Cap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cap"
              type="number"
              step="0.1"
              min="0.1"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Use 1.5 for 150% max achievement scoring.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Assigning..." : "Assign KPI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
