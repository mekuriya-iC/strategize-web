"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2, Plus, Info, TrendingUp } from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  BULK_ASSIGN_KPI_TO_EMPLOYEES,
  BULK_ASSIGN_KPI_TO_DEPARTMENTS,
  BULK_ASSIGN_KPI_TO_DIVISIONS,
} from "@/lib/graphql/mutations/kpis";
import { useAuthStore } from "@/stores";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { toast } from "sonner";
import { parseGraphQLError } from "@/utils/errorParsing";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface BulkKpiAssignmentDialogProps {
  parentAssignmentId: string;
  parentAssignmentLevel: "DEPARTMENT" | "DIVISION" | "CORPORATE";
  parentWeight: number;
  kpiName: string;
  unitType?: string;
  calculationBasisSource?: "NONE" | "DIRECT_VALUE" | "LINKED_KPI" | null;
  strategicPeriodId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface Assignee {
  id: string;
  targetValue: string;
  customWeight?: string;
}

export default function BulkKpiAssignmentDialog({
  parentAssignmentId,
  parentAssignmentLevel,
  parentWeight,
  kpiName,
  unitType,
  calculationBasisSource,
  strategicPeriodId,
  onSuccess,
  trigger,
}: BulkKpiAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState<
    "equal" | "proportional" | "custom"
  >("proportional");
  const [assignees, setAssignees] = useState<Assignee[]>([
    { id: "", targetValue: "" },
  ]);
  const [cap, setCap] = useState("1.5");
  const isBasisDrivenRate =
    (unitType === "PERCENT" || unitType === "RATIO") &&
    (calculationBasisSource === "DIRECT_VALUE" ||
      calculationBasisSource === "LINKED_KPI");

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Determine what we're assigning to
  const childLevel =
    parentAssignmentLevel === "DEPARTMENT"
      ? "EMPLOYEE"
      : parentAssignmentLevel === "DIVISION"
        ? "DEPARTMENT"
        : "DIVISION";

  // Fetch options based on child level
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: childLevel !== "EMPLOYEE",
  });

  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    skip: childLevel !== "DEPARTMENT",
  });

  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
    skip: childLevel !== "DIVISION",
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
        const { title, description } = parseGraphQLError(
          error,
          "Bulk assignment",
        );
        toast.error(title, { description });
      },
    },
  );

  const [bulkAssignToDepartments, { loading: loadingDepartments }] =
    useMutation(BULK_ASSIGN_KPI_TO_DEPARTMENTS, {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success(`KPI assigned to ${assignees.length} departments`);
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(
          error,
          "Bulk assignment",
        );
        toast.error(title, { description });
      },
    });

  const [bulkAssignToDivisions, { loading: loadingDivisions }] = useMutation(
    BULK_ASSIGN_KPI_TO_DIVISIONS,
    {
      refetchQueries: "active",
      onCompleted: () => {
        toast.success(`KPI assigned to ${assignees.length} divisions`);
        handleClose();
      },
      onError: (error) => {
        const { title, description } = parseGraphQLError(
          error,
          "Bulk assignment",
        );
        toast.error(title, { description });
      },
    },
  );

  const loading = loadingEmployees || loadingDepartments || loadingDivisions;

  const handleClose = () => {
    setOpen(false);
    setAssignees([{ id: "", targetValue: "" }]);
    setDistributionMethod("proportional");
    setCap("1.5");
    onSuccess?.();
  };

  const addAssignee = () => {
    setAssignees([...assignees, { id: "", targetValue: "" }]);
  };

  const removeAssignee = (index: number) => {
    if (assignees.length > 1) {
      setAssignees(assignees.filter((_, i) => i !== index));
    }
  };

  const updateAssignee = (
    index: number,
    field: keyof Assignee,
    value: string,
  ) => {
    const updated = [...assignees];
    updated[index] = { ...updated[index], [field]: value };
    setAssignees(updated);
  };

  const calculateWeightDistribution = () => {
    if (distributionMethod === "equal") {
      const weightPerAssignee = parentWeight / assignees.length;
      return assignees.map(() => weightPerAssignee.toFixed(2));
    } else if (distributionMethod === "proportional") {
      const totalTarget = assignees.reduce(
        (sum, a) => sum + (parseFloat(a.targetValue) || 0),
        0,
      );
      if (totalTarget === 0) return assignees.map(() => "0");

      return assignees.map((a) => {
        const target = parseFloat(a.targetValue) || 0;
        const proportion = target / totalTarget;
        return (parentWeight * proportion).toFixed(2);
      });
    } else {
      // custom
      return assignees.map((a) => a.customWeight || "0");
    }
  };

  const weights = calculateWeightDistribution();
  const totalWeight = weights.reduce(
    (sum, w) => sum + parseFloat(w),
    0,
  ).toFixed(2);
  const isValidWeightSum = Math.abs(parseFloat(totalWeight) - parentWeight) < 0.01;

  const handleSubmit = async () => {
    if (isBasisDrivenRate) {
      toast.error(
        "Use Assign Objective so approved denominator data is preserved for every assignee.",
      );
      return;
    }
    // Validation
    const hasEmptyAssignees = assignees.some((a) => !a.id);
    if (hasEmptyAssignees) {
      toast.error("Please select all assignees");
      return;
    }

    const hasInvalidTargets = assignees.some(
      (a) => !a.targetValue || isNaN(parseFloat(a.targetValue)),
    );
    if (hasInvalidTargets) {
      toast.error("Please enter valid target values for all assignees");
      return;
    }

    if (distributionMethod === "custom") {
      const hasInvalidWeights = assignees.some(
        (a) => !a.customWeight || isNaN(parseFloat(a.customWeight)),
      );
      if (hasInvalidWeights) {
        toast.error("Please enter custom weights for all assignees");
        return;
      }

      if (!isValidWeightSum) {
        toast.error(
          `Custom weights must sum to parent weight (${parentWeight}%). Current sum: ${totalWeight}%`,
        );
        return;
      }
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
              departmentKpiAssignmentId: parentAssignmentId,
              employees: assignees.map((a) => ({
                userId: a.id,
                targetValue: parseFloat(a.targetValue),
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
      } else if (childLevel === "DEPARTMENT") {
        await bulkAssignToDepartments({
          variables: {
            input: {
              divisionKpiAssignmentId: parentAssignmentId,
              departments: assignees.map((a) => ({
                departmentId: a.id,
                targetValue: parseFloat(a.targetValue),
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
              corporateKpiAssignmentId: parentAssignmentId,
              divisions: assignees.map((a) => ({
                divisionId: a.id,
                targetValue: parseFloat(a.targetValue),
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
      console.error("Error bulk assigning KPI:", error);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Bulk Assign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Bulk Assign KPI
          </DialogTitle>
          <DialogDescription>
            Assign <strong>{kpiName}</strong> to multiple{" "}
            {childLevel.toLowerCase()}s with automatic weight distribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isBasisDrivenRate && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              This target-only bulk assignment cannot preserve approved denominator
              allocations or linked KPI dependencies. Use <strong>Assign Objective</strong>{" "}
              from the objective page.
            </div>
          )}

          {/* Parent Weight Info */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">
                Parent Weight Available:
              </span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {parentWeight}%
            </Badge>
          </div>

          {/* Distribution Method */}
          <div className="space-y-2">
            <Label>Weight Distribution Method</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={
                  distributionMethod === "equal" ? "default" : "outline"
                }
                className="gap-2"
                onClick={() => setDistributionMethod("equal")}
              >
                Equal Split
              </Button>
              <Button
                type="button"
                variant={
                  distributionMethod === "proportional" ? "default" : "outline"
                }
                className="gap-2"
                onClick={() => setDistributionMethod("proportional")}
              >
                Proportional
              </Button>
              <Button
                type="button"
                variant={
                  distributionMethod === "custom" ? "default" : "outline"
                }
                className="gap-2"
                onClick={() => setDistributionMethod("custom")}
              >
                Custom
              </Button>
            </div>
            <div className="text-xs text-gray-500 flex items-start gap-2">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                {distributionMethod === "equal" &&
                  "Weight split evenly among all assignees"}
                {distributionMethod === "proportional" &&
                  "Weight distributed based on target values"}
                {distributionMethod === "custom" &&
                  "Manually specify weight for each assignee"}
              </span>
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
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add {childLevel}
              </Button>
            </div>

            <div className="space-y-3">
              {assignees.map((assignee, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 border rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    {/* Assignee Selection */}
                    <div className="col-span-5">
                      <SearchableSelect
                        options={options}
                        value={assignee.id}
                        onValueChange={(value) =>
                          updateAssignee(index, "id", value)
                        }
                        placeholder={`Select ${childLevel.toLowerCase()}`}
                        searchPlaceholder={`Search...`}
                        clearable
                      />
                    </div>

                    {/* Target Value */}
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Target"
                        value={assignee.targetValue}
                        onChange={(e) =>
                          updateAssignee(index, "targetValue", e.target.value)
                        }
                      />
                    </div>

                    {/* Custom Weight (if custom method) */}
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

                    {/* Calculated Weight Display */}
                    {distributionMethod !== "custom" && (
                      <div className="col-span-2 flex items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="w-full">
                                {weights[index]}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Calculated weight allocation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}

                    {/* Remove Button */}
                    <div className="col-span-2 flex items-center justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAssignee(index)}
                        disabled={assignees.length === 1}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weight Summary */}
          <div
            className={`p-3 rounded-lg border-2 ${isValidWeightSum ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-amber-300 bg-amber-50 dark:bg-amber-950/20"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Weight:</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{totalWeight}%</span>
                <span className="text-sm text-gray-500">
                  / {parentWeight}%
                </span>
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isValidWeightSum || isBasisDrivenRate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Assigning..." : `Assign to ${assignees.length} ${childLevel}s`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
