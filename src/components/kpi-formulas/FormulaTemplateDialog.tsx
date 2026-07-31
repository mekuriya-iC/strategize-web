"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateOrganizationKpiFormulaTemplateInput,
  KpiResultDirection,
  KpiTargetRangeOutsidePolicy,
  KpiTemporalRollupMethod,
  KpiZeroDenominatorPolicy,
  MetricDefinition,
} from "@/hooks/kpi-formulas/useKpiFormulas";
import {
  RESULT_DIRECTION_OPTIONS,
  TARGET_RANGE_POLICY_OPTIONS,
  TEMPORAL_ROLLUP_OPTIONS,
  ZERO_POLICY_OPTIONS,
} from "./options";

interface FormulaTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  metrics: MetricDefinition[];
  pending: boolean;
  onCreate: (
    input: CreateOrganizationKpiFormulaTemplateInput,
  ) => Promise<unknown>;
}

const INITIAL_FORM = {
  name: "",
  description: "",
  numeratorMetricDefinitionId: "",
  denominatorMetricDefinitionId: "",
  multiplier: "100",
  temporalRollupMethod:
    "SUM_COMPONENTS_THEN_DIVIDE" as KpiTemporalRollupMethod,
  zeroDenominatorPolicy: "NOT_CALCULABLE" as KpiZeroDenominatorPolicy,
  resultDirection: "HIGHER_IS_BETTER" as KpiResultDirection,
  targetRangeMin: "",
  targetRangeMax: "",
  targetRangeOutsidePolicy: "" as KpiTargetRangeOutsidePolicy | "",
};

interface ExactDecimal {
  unscaled: bigint;
  scale: number;
}

function parseExactDecimal(value: string): ExactDecimal | undefined {
  const normalized = value.trim().replace(/^\+/, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return undefined;
  const negative = normalized.startsWith("-");
  const [whole, fraction = ""] = normalized.replace(/^-/, "").split(".");
  if (whole.replace(/^0+(?=\d)/, "").length > 12 || fraction.length > 18) {
    return undefined;
  }
  const magnitude = BigInt(`${whole}${fraction}`);
  return { unscaled: negative ? -magnitude : magnitude, scale: fraction.length };
}

function compareExactDecimals(left: ExactDecimal, right: ExactDecimal): number {
  const scale = Math.max(left.scale, right.scale);
  const factor = (value: ExactDecimal) =>
    value.unscaled * BigInt(10) ** BigInt(scale - value.scale);
  const normalizedLeft = factor(left);
  const normalizedRight = factor(right);
  return normalizedLeft < normalizedRight
    ? -1
    : normalizedLeft > normalizedRight
      ? 1
      : 0;
}

export function FormulaTemplateDialog({
  open,
  onOpenChange,
  organizationId,
  metrics,
  pending,
  onCreate,
}: FormulaTemplateDialogProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState<string>();
  const metricOptions = useMemo(
    () =>
      metrics
        .filter((metric) => metric.isActive)
        .map((metric) => ({
          value: metric.id,
          label: metric.name,
          description: `${metric.code} · ${metric.unitType}`,
        })),
    [metrics],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const multiplier = Number(form.multiplier);
    if (!form.name.trim()) {
      setFormError("Template name is required.");
      return;
    }
    if (
      !form.numeratorMetricDefinitionId ||
      !form.denominatorMetricDefinitionId
    ) {
      setFormError("Choose both numerator and denominator metrics.");
      return;
    }
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      setFormError("Multiplier must be greater than zero.");
      return;
    }

    let rangeInput: Pick<
      CreateOrganizationKpiFormulaTemplateInput,
      "targetRangeMin" | "targetRangeMax" | "targetRangeOutsidePolicy"
    > = {};
    if (form.resultDirection === "TARGET_RANGE") {
      const minimum = parseExactDecimal(form.targetRangeMin);
      const maximum = parseExactDecimal(form.targetRangeMax);
      if (!minimum || !maximum) {
        setFormError(
          "Target range minimum and maximum must be exact decimals with no more than 18 decimal places.",
        );
        return;
      }
      if (compareExactDecimals(minimum, maximum) > 0) {
        setFormError("Target range minimum cannot be greater than maximum.");
        return;
      }
      if (
        form.targetRangeOutsidePolicy === "NEAREST_BOUND_RATIO" &&
        (minimum.unscaled <= BigInt(0) || maximum.unscaled <= BigInt(0))
      ) {
        setFormError("Nearest-bound ratio scoring requires positive range bounds.");
        return;
      }
      rangeInput = {
        targetRangeMin: form.targetRangeMin.trim(),
        targetRangeMax: form.targetRangeMax.trim(),
        ...(form.targetRangeOutsidePolicy
          ? { targetRangeOutsidePolicy: form.targetRangeOutsidePolicy }
          : {}),
      };
    }

    setFormError(undefined);
    try {
      await onCreate({
        organizationId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        calculationType: "RATIO_FORMULA",
        numeratorMetricDefinitionId: form.numeratorMetricDefinitionId,
        denominatorMetricDefinitionId: form.denominatorMetricDefinitionId,
        multiplier,
        temporalRollupMethod: form.temporalRollupMethod,
        zeroDenominatorPolicy: form.zeroDenominatorPolicy,
        resultDirection: form.resultDirection,
        ...rangeInput,
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
          <DialogTitle>Create formula template</DialogTitle>
          <DialogDescription>
            Standardize a reusable ratio configuration for your organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Reusable ratio template</AlertTitle>
            <AlertDescription>
              Templates standardize ratio metrics, rollups, and scoring. Weighted-index
              component definitions are configured directly on each KPI formula.
            </AlertDescription>
          </Alert>

          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Conversion rate"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="When and how this template should be used."
              rows={2}
            />
          </div>

          {metricOptions.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Create at least one active metric before creating a ratio template.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <div className="space-y-2">
                <Label>Numerator metric</Label>
                <SearchableSelect
                  options={metricOptions}
                  value={form.numeratorMetricDefinitionId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      numeratorMetricDefinitionId: value,
                    }))
                  }
                  placeholder="Select numerator"
                  searchPlaceholder="Search metrics..."
                />
              </div>
              <div className="hidden pb-2 text-muted-foreground sm:block">÷</div>
              <div className="space-y-2">
                <Label>Denominator metric</Label>
                <SearchableSelect
                  options={metricOptions}
                  value={form.denominatorMetricDefinitionId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      denominatorMetricDefinitionId: value,
                    }))
                  }
                  placeholder="Select denominator"
                  searchPlaceholder="Search metrics..."
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template-multiplier">Multiplier</Label>
              <Input
                id="template-multiplier"
                type="number"
                min="0.000001"
                step="any"
                value={form.multiplier}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    multiplier: event.target.value,
                  }))
                }
                required
              />
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
                  {TEMPORAL_ROLLUP_OPTIONS.filter(
                    (option) => option.value !== "WEIGHTED_INDEX",
                  ).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zero denominator</Label>
              <Select
                value={form.zeroDenominatorPolicy}
                onValueChange={(value: KpiZeroDenominatorPolicy) =>
                  setForm((current) => ({
                    ...current,
                    zeroDenominatorPolicy: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZERO_POLICY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Result direction</Label>
              <Select
                value={form.resultDirection}
                onValueChange={(value: KpiResultDirection) =>
                  setForm((current) => ({ ...current, resultDirection: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_DIRECTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.temporalRollupMethod === "COHORT" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Opening-cohort annual calculation</AlertTitle>
              <AlertDescription>
                The annual ratio uses the exact Q4 numerator and exact Q1 denominator.
                Use a period-start denominator metric and a period-end numerator metric
                for retention-style KPIs.
              </AlertDescription>
            </Alert>
          )}

          {form.resultDirection === "TARGET_RANGE" && (
            <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
              <div>
                <Label className="text-indigo-950">Inclusive target range</Label>
                <p className="mt-1 text-xs text-indigo-700">
                  Exact values inside the inclusive range score 100%.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="template-range-min">Exact minimum</Label>
                  <Input
                    id="template-range-min"
                    type="text"
                    inputMode="decimal"
                    value={form.targetRangeMin}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        targetRangeMin: event.target.value,
                      }))
                    }
                    className="bg-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-range-max">Exact maximum</Label>
                  <Input
                    id="template-range-max"
                    type="text"
                    inputMode="decimal"
                    value={form.targetRangeMax}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        targetRangeMax: event.target.value,
                      }))
                    }
                    className="bg-white font-mono"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Outside-range scoring</Label>
                <Select
                  value={form.targetRangeOutsidePolicy || "COMPANY_DEFAULT"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      targetRangeOutsidePolicy:
                        value === "COMPANY_DEFAULT"
                          ? ""
                          : (value as KpiTargetRangeOutsidePolicy),
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPANY_DEFAULT">Use company default</SelectItem>
                    {TARGET_RANGE_POLICY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-indigo-700">
                  {TARGET_RANGE_POLICY_OPTIONS.find(
                    (option) => option.value === form.targetRangeOutsidePolicy,
                  )?.description ??
                    "The organization default policy is applied when the template is created."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || metricOptions.length === 0}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
