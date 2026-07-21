"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateMetricDefinitionInput,
  KpiMeasurementUnit,
  KpiTemporalRollupMethod,
  KpiUnitType,
} from "@/hooks/kpi-formulas/useKpiFormulas";
import {
  MEASUREMENT_UNIT_OPTIONS,
  METRIC_TEMPORAL_ROLLUP_OPTIONS,
  UNIT_TYPE_OPTIONS,
} from "./options";

interface MetricDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  pending: boolean;
  onCreate: (input: CreateMetricDefinitionInput) => Promise<unknown>;
}

const INITIAL_FORM = {
  code: "",
  name: "",
  description: "",
  unitType: "NUMBER" as KpiUnitType,
  measurementUnit: "NUMBER" as KpiMeasurementUnit,
  temporalRollupMethod: "SUM" as KpiTemporalRollupMethod,
};

export function MetricDefinitionDialog({
  open,
  onOpenChange,
  organizationId,
  pending,
  onCreate,
}: MetricDefinitionDialogProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState<string>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = form.code.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    const name = form.name.trim();
    if (!code || !name) {
      setFormError("Code and name are required.");
      return;
    }

    setFormError(undefined);
    try {
      await onCreate({
        organizationId,
        code,
        name,
        description: form.description.trim() || undefined,
        unitType: form.unitType,
        measurementUnit: form.measurementUnit,
        temporalRollupMethod: form.temporalRollupMethod,
        isActive: true,
      });
      setForm(INITIAL_FORM);
      onOpenChange(false);
    } catch {
      // The mutation hook displays the server error in a toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create metric definition</DialogTitle>
          <DialogDescription>
            Define a reusable, governed data point for KPI formulas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="metric-code">Code</Label>
              <Input
                id="metric-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="REVENUE"
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">
                Stored in uppercase; spaces become underscores.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metric-name">Name</Label>
              <Input
                id="metric-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Recognized revenue"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric-description">Description</Label>
            <Textarea
              id="metric-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Explain the source and business meaning of this metric."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Unit type</Label>
              <Select
                value={form.unitType}
                onValueChange={(value: KpiUnitType) =>
                  setForm((current) => ({ ...current, unitType: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Measurement unit</Label>
              <Select
                value={form.measurementUnit}
                onValueChange={(value: KpiMeasurementUnit) =>
                  setForm((current) => ({ ...current, measurementUnit: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEASUREMENT_UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temporal rollup</Label>
              <Select
                value={form.temporalRollupMethod}
                onValueChange={(value: KpiTemporalRollupMethod) =>
                  setForm((current) => ({
                    ...current,
                    temporalRollupMethod: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_TEMPORAL_ROLLUP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.temporalRollupMethod === "PERIOD_START_SNAPSHOT"
                  ? "Uses the earliest approved observation by observation date within the quarter."
                  : form.temporalRollupMethod === "PERIOD_END_SNAPSHOT"
                    ? "Uses the latest approved observation by observation date within the quarter."
                    : form.temporalRollupMethod === "LATEST_APPROVED"
                      ? "Uses the observation from the logbook entry approved most recently."
                      : form.temporalRollupMethod === "AVERAGE"
                        ? "Averages all approved observations in the quarter exactly."
                        : "Adds all approved observations in the quarter exactly."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create metric
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
