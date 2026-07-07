"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useKpiMutations, type Kpi } from "@/hooks/kpis/useKpis";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, Target, Users, User, GitMerge } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateKpiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  /** Pass to open in edit mode */
  editKpi?: Kpi | null;
}

const MEASUREMENT_UNITS = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "number", label: "Number (#)" },
  { value: "currency", label: "Currency ($)" },
  { value: "hour", label: "Hours (hrs)" },
  { value: "boolean", label: "Boolean (Yes/No)" },
  { value: "rating", label: "Rating (★)" },
  { value: "custom", label: "Custom" },
];

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi_annual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
];

const KPI_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "shared", label: "Shared" },
];

const defaultForm = {
  name: "",
  description: "",
  kpiType: "individual",
  measurementUnit: "",
  frequency: "",
  targetValue: "",
  baselineValue: "",
  weight: "",
  strategicObjectiveId: "",
  customUnitLabel: "",
  parentId: "", // For KPI cascade/hierarchy
  unitType: "", // Keep track of unitType mapping
  kpiMode: "AGGREGATED", // Default mode
  managerRetentionPercent: "", // For HYBRID mode
};

const mapMeasurementUnitToUnitType = (unit: string): string => {
  switch (unit) {
    case "percentage":
      return "PERCENT";
    case "currency":
      return "CURRENCY";
    case "hour":
      return "HOUR";
    case "number":
    case "boolean":
    case "rating":
    case "custom":
    default:
      return "NUMBER";
  }
};

export function CreateKpiDialog({
  open,
  onOpenChange,
  organizationId,
  editKpi,
}: CreateKpiDialogProps) {
  const isEdit = !!editKpi;
  const { createKpi, updateKpi, loading: mutLoading } = useKpiMutations();

  const [form, setForm] = useState(defaultForm);

  // Populate form when editing
  useEffect(() => {
    if (editKpi) {
      setForm({
        name: editKpi.name,
        description: editKpi.description || "",
        kpiType: editKpi.kpiType || "individual",
        measurementUnit: editKpi.measurementUnit || "",
        frequency: editKpi.frequency || "",
        targetValue:
          (editKpi.assignedTargetValue ?? editKpi.targetValue)?.toString() ||
          "",
        baselineValue:
          (editKpi.baselineValue ?? editKpi.baseline)?.toString() || "",
        weight: editKpi.weight?.toString() || "",
        strategicObjectiveId: editKpi.objective?.objectiveId || "",
        customUnitLabel: editKpi.customUnitLabel || "",
        parentId: editKpi.parent?.kpiId || "", // Parent KPI for cascade
        unitType: editKpi.unitType || "",
        kpiMode: (editKpi as any).kpiMode || "AGGREGATED",
        managerRetentionPercent:
          (editKpi as any).managerRetentionPercent?.toString() || "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [editKpi, open]);

  // Fetch objectives for dropdown
  const { data: objData } = useQuery(GET_OBJECTIVES, {
    variables: { page: 1, limit: 500, organizationId },
    fetchPolicy: "cache-and-network",
  });
  const objectives = (objData?.objectives?.items || []).map((o: any) => ({
    value: o.objectiveId,
    label: o.title,
    description: o.level || undefined,
  }));

  // Fetch KPIs for parent selection
  const { data: kpiData } = useQuery(GET_KPIS, {
    variables: { page: 1, limit: 500 },
    fetchPolicy: "cache-and-network",
  });
  const availableParentKpis = (kpiData?.kpis?.items || [])
    .filter((k: any) => !isEdit || k.kpiId !== editKpi?.kpiId) // Don't show self as parent
    .map((k: any) => ({
      value: k.kpiId,
      label: k.name,
      description: k.assigneeType || "Corporate",
    }));

  const selectedObjective = (objData?.objectives?.items || []).find(
    (o: any) => o.objectiveId === form.strategicObjectiveId,
  );
  const objectiveType =
    editKpi?.objective?.assigneeType ||
    editKpi?.objective?.type ||
    selectedObjective?.assigneeType ||
    selectedObjective?.type;
  const showModeSelector =
    objectiveType?.toUpperCase() === "DIVISION" ||
    objectiveType?.toUpperCase() === "DEPARTMENT";

  const isLoading = isEdit ? mutLoading.update : mutLoading.create;
  const isValid =
    form.name &&
    form.measurementUnit &&
    form.frequency &&
    form.targetValue &&
    (!showModeSelector ||
      form.kpiMode !== "HYBRID" ||
      (form.managerRetentionPercent &&
        parseFloat(form.managerRetentionPercent) > 0 &&
        parseFloat(form.managerRetentionPercent) < 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        kpiType: form.kpiType || undefined,
        measurementUnit: form.measurementUnit,
        frequency: form.frequency,
        targetValue: parseFloat(form.targetValue),
        baselineValue:
          form.baselineValue && form.baselineValue.trim() !== ""
            ? parseFloat(form.baselineValue)
            : undefined,
        weight:
          form.weight && form.weight.trim() !== ""
            ? parseFloat(form.weight)
            : undefined,
        strategicObjectiveId: form.strategicObjectiveId || undefined,
        customUnitLabel:
          form.measurementUnit === "custom"
            ? form.customUnitLabel || undefined
            : undefined,
        parentId: form.parentId || undefined, // Include parent KPI for cascade aggregation
        unitType:
          form.unitType || mapMeasurementUnitToUnitType(form.measurementUnit),
        kpiMode: form.kpiMode || "AGGREGATED",
        managerRetentionPercent:
          form.kpiMode === "HYBRID" && form.managerRetentionPercent
            ? parseFloat(form.managerRetentionPercent)
            : undefined,
      };

      if (isEdit && editKpi) {
        await updateKpi({ kpiId: editKpi.kpiId, ...payload } as any);
      } else {
        await createKpi({ organizationId, ...payload } as any);
      }
      onOpenChange(false);
    } catch {
      /* handled by hook */
    }
  };

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleMeasurementUnitChange = (val: string) => {
    setForm((f) => ({
      ...f,
      measurementUnit: val,
      unitType: mapMeasurementUnitToUnitType(val),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="w-5 h-5 text-blue-600" />
            {isEdit ? "Edit KPI" : "Create KPI"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the KPI details below."
              : "Define a new Key Performance Indicator to track progress."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label>
              KPI Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Customer Satisfaction Score"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe what this KPI measures..."
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              rows={2}
            />
          </div>

          {/* KPI Performance Mode - Only for Division/Department level KPIs */}
          {showModeSelector && (
            <div className="space-y-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <Label className="text-base font-semibold">
                Performance Tracking Mode
              </Label>
              <RadioGroup value={form.kpiMode} onValueChange={set("kpiMode")}>
                <div className="space-y-3">
                  {/* AGGREGATED */}
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <RadioGroupItem
                      value="AGGREGATED"
                      id="mode-aggregated"
                      className="mt-1"
                    />
                    <label
                      htmlFor="mode-aggregated"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Aggregated</span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          Team Results
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Performance calculated from subordinates' achievements.
                        Manager enables team to achieve targets.
                      </p>
                    </label>
                  </div>

                  {/* DIRECT */}
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white dark:bg-slate-800 hover:border-green-300 dark:hover:border-green-700 transition-colors">
                    <RadioGroupItem
                      value="DIRECT"
                      id="mode-direct"
                      className="mt-1"
                    />
                    <label
                      htmlFor="mode-direct"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Direct</span>
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                          Personal Work
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Manager logs achievements directly. For personal
                        responsibilities like partnerships, reporting, or
                        strategic work.
                      </p>
                    </label>
                  </div>

                  {/* HYBRID */}
                  <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                    <RadioGroupItem
                      value="HYBRID"
                      id="mode-hybrid"
                      className="mt-1"
                    />
                    <label
                      htmlFor="mode-hybrid"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <GitMerge className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">Hybrid</span>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                          Shared Responsibility
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Both manager and subordinates contribute. Manager
                        retains a portion for direct work, rest cascades to
                        team.
                      </p>
                    </label>
                  </div>
                </div>
              </RadioGroup>

              {/* Manager Retention Slider for HYBRID mode */}
              {form.kpiMode === "HYBRID" && (
                <div className="mt-4 p-4 border rounded-lg bg-white dark:bg-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Manager Retention
                    </Label>
                    <span className="text-2xl font-bold text-purple-600">
                      {form.managerRetentionPercent || 30}%
                    </span>
                  </div>
                  <Slider
                    value={[parseFloat(form.managerRetentionPercent) || 30]}
                    onValueChange={([val]) =>
                      set("managerRetentionPercent")(val.toString())
                    }
                    min={1}
                    max={99}
                    step={1}
                    className="w-full"
                  />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/20">
                      <div className="font-medium text-purple-700 dark:text-purple-300">
                        Manager's Portion
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {form.managerRetentionPercent || 30}% of{" "}
                        {form.targetValue || 0} ={" "}
                        {(
                          ((parseFloat(form.targetValue) || 0) *
                            (parseFloat(form.managerRetentionPercent) || 30)) /
                          100
                        ).toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                      <div className="font-medium text-blue-700 dark:text-blue-300">
                        Team's Portion
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {100 - (parseFloat(form.managerRetentionPercent) || 30)}
                        % of {form.targetValue || 0} ={" "}
                        {(
                          ((parseFloat(form.targetValue) || 0) *
                            (100 -
                              (parseFloat(form.managerRetentionPercent) ||
                                30))) /
                          100
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Alert>
                    <AlertDescription className="text-xs">
                      Manager will log achievements for their portion. The team
                      portion cascades to subordinates.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {/* Type + Frequency row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>KPI Type</Label>
              <Select value={form.kpiType} onValueChange={set("kpiType")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {KPI_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Frequency <span className="text-red-500">*</span>
              </Label>
              <Select value={form.frequency} onValueChange={set("frequency")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Measurement Unit */}
          <div className="space-y-2">
            <Label>
              Measurement Unit <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.measurementUnit}
              onValueChange={handleMeasurementUnitChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {MEASUREMENT_UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom unit label */}
          {form.measurementUnit === "custom" && (
            <div className="space-y-2">
              <Label>Custom Unit Label</Label>
              <Input
                placeholder="e.g. tickets, calls, units"
                value={form.customUnitLabel}
                onChange={(e) => set("customUnitLabel")(e.target.value)}
              />
            </div>
          )}

          {/* Target + Baseline row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {form.measurementUnit === "percentage" && "Target (%)"}
                {form.measurementUnit === "currency" && "Target Amount"}
                {form.measurementUnit === "hour" && "Target Hours"}
                {form.measurementUnit === "rating" && "Target Rating"}
                {(!form.measurementUnit ||
                  (form.measurementUnit !== "percentage" &&
                    form.measurementUnit !== "currency" &&
                    form.measurementUnit !== "hour" &&
                    form.measurementUnit !== "rating")) &&
                  "Target Value"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 100"
                value={form.targetValue}
                onChange={(e) => set("targetValue")(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                {form.measurementUnit === "percentage" && "Baseline (%)"}
                {form.measurementUnit === "currency" && "Baseline Amount"}
                {form.measurementUnit === "hour" && "Baseline Hours"}
                {form.measurementUnit === "rating" && "Baseline Rating"}
                {(!form.measurementUnit ||
                  (form.measurementUnit !== "percentage" &&
                    form.measurementUnit !== "currency" &&
                    form.measurementUnit !== "hour" &&
                    form.measurementUnit !== "rating")) &&
                  "Baseline Value"}
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 0"
                value={form.baselineValue}
                onChange={(e) => set("baselineValue")(e.target.value)}
              />
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label>Weight (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g. 20"
              value={form.weight}
              onChange={(e) => set("weight")(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Relative importance of this KPI (0–100%)
            </p>
          </div>

          {/* Linked Objective */}
          <div className="space-y-2">
            <Label>Linked Objective</Label>
            <SearchableSelect
              value={form.strategicObjectiveId}
              onValueChange={set("strategicObjectiveId")}
              placeholder="Select objective (optional)"
              searchPlaceholder="Search objectives..."
              emptyMessage="No objectives found"
              options={objectives}
              clearable
            />
          </div>

          {/* Parent KPI (for cascade aggregation) */}
          <div className="space-y-2">
            <Label>Parent KPI</Label>
            <SearchableSelect
              value={form.parentId}
              onValueChange={set("parentId")}
              placeholder="Select parent KPI (optional)"
              searchPlaceholder="Search KPIs..."
              emptyMessage="No KPIs found"
              options={availableParentKpis}
              clearable
            />
            <p className="text-xs text-muted-foreground">
              Select a parent KPI to enable automatic cascade aggregation. When
              this KPI is achieved, it contributes to the parent KPI.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create KPI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateKpiDialog;
