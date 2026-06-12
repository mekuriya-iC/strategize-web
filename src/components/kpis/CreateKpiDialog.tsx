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
import { Loader2, Target } from "lucide-react";

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
        targetValue: editKpi.targetValue?.toString() || "",
        baselineValue: editKpi.baselineValue?.toString() || "",
        weight: editKpi.weight?.toString() || "",
        strategicObjectiveId: editKpi.objective?.objectiveId || "",
        customUnitLabel: editKpi.customUnitLabel || "",
        parentId: (editKpi as any).parentId || "", // Parent KPI for cascade
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

  const isLoading = isEdit ? mutLoading.update : mutLoading.create;
  const isValid = form.name && form.measurementUnit && form.frequency && form.targetValue;

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
        baselineValue: form.baselineValue ? parseFloat(form.baselineValue) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        strategicObjectiveId: form.strategicObjectiveId || undefined,
        customUnitLabel: form.measurementUnit === "custom" ? form.customUnitLabel || undefined : undefined,
        parentId: form.parentId || undefined, // Include parent KPI for cascade aggregation
      };

      if (isEdit && editKpi) {
        await updateKpi({ kpiId: editKpi.kpiId, ...payload });
      } else {
        await createKpi({ organizationId, ...payload });
      }
      onOpenChange(false);
    } catch {
      /* handled by hook */
    }
  };

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

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
            <Label>KPI Name <span className="text-red-500">*</span></Label>
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
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency <span className="text-red-500">*</span></Label>
              <Select value={form.frequency} onValueChange={set("frequency")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Measurement Unit */}
          <div className="space-y-2">
            <Label>Measurement Unit <span className="text-red-500">*</span></Label>
            <Select value={form.measurementUnit} onValueChange={set("measurementUnit")}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {MEASUREMENT_UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
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
                   form.measurementUnit !== "rating")) && "Target Value"}
                {" "}<span className="text-red-500">*</span>
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
                   form.measurementUnit !== "rating")) && "Baseline Value"}
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
              Select a parent KPI to enable automatic cascade aggregation. When this KPI is achieved, it contributes to the parent KPI.
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
