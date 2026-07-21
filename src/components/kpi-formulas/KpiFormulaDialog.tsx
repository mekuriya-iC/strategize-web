"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Info,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
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
import type {
  CreateKpiFormulaDefinitionInput,
  KpiCalculationType,
  KpiCandidate,
  KpiFormulaComponentInput,
  KpiFormulaSourceType,
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

interface KpiFormulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  metrics: MetricDefinition[];
  kpis: KpiCandidate[];
  pending: boolean;
  onCreate: (input: CreateKpiFormulaDefinitionInput) => Promise<unknown>;
}

interface SourceState {
  type: KpiFormulaSourceType;
  id: string;
}

interface WeightedComponentState {
  key: string;
  source: SourceState;
  weight: string;
}

type EditableCalculationType = Extract<
  KpiCalculationType,
  "RATIO_FORMULA" | "WEIGHTED_INDEX"
>;

interface FormulaState {
  calculationType: EditableCalculationType;
  kpiId: string;
  numerator: SourceState;
  denominator: SourceState;
  components: WeightedComponentState[];
  multiplier: string;
  temporalRollupMethod: KpiTemporalRollupMethod;
  zeroDenominatorPolicy: KpiZeroDenominatorPolicy;
  resultDirection: KpiResultDirection;
  targetRangeMin: string;
  targetRangeMax: string;
  targetRangeOutsidePolicy: KpiTargetRangeOutsidePolicy | "";
}

let nextComponentKey = 3;

function createInitialForm(): FormulaState {
  return {
    calculationType: "RATIO_FORMULA",
    kpiId: "",
    numerator: { type: "METRIC", id: "" },
    denominator: { type: "METRIC", id: "" },
    components: [
      {
        key: "weighted-component-1",
        source: { type: "METRIC", id: "" },
        weight: "50",
      },
      {
        key: "weighted-component-2",
        source: { type: "METRIC", id: "" },
        weight: "50",
      },
    ],
    multiplier: "100",
    temporalRollupMethod: "SUM_COMPONENTS_THEN_DIVIDE",
    zeroDenominatorPolicy: "NOT_CALCULABLE",
    resultDirection: "HIGHER_IS_BETTER",
    targetRangeMin: "",
    targetRangeMax: "",
    targetRangeOutsidePolicy: "",
  };
}

function createWeightedComponent(): WeightedComponentState {
  return {
    key: `weighted-component-${nextComponentKey++}`,
    source: { type: "METRIC", id: "" },
    weight: "",
  };
}

interface ExactDecimal {
  unscaled: bigint;
  scale: number;
}

function parseExactDecimal(value: string): ExactDecimal | undefined {
  const normalized = value.trim().replace(/^\+/, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return undefined;

  const negative = normalized.startsWith("-");
  const unsigned = normalized.replace(/^-/, "");
  const [whole, fraction = ""] = unsigned.split(".");
  const significantWhole = whole.replace(/^0+(?=\d)/, "");
  if (significantWhole.length > 12 || fraction.length > 18) return undefined;

  const magnitude = BigInt(`${whole}${fraction}`);
  return {
    unscaled: negative ? -magnitude : magnitude,
    scale: fraction.length,
  };
}

function parsePositiveExactDecimal(value: string): ExactDecimal | undefined {
  const parsed = parseExactDecimal(value);
  return parsed && parsed.unscaled > BigInt(0) ? parsed : undefined;
}

function compareExactDecimals(left: ExactDecimal, right: ExactDecimal): number {
  const scale = Math.max(left.scale, right.scale);
  const normalizedLeft = left.unscaled * powerOfTen(scale - left.scale);
  const normalizedRight = right.unscaled * powerOfTen(scale - right.scale);
  return normalizedLeft < normalizedRight
    ? -1
    : normalizedLeft > normalizedRight
      ? 1
      : 0;
}

function powerOfTen(exponent: number): bigint {
  return BigInt(10) ** BigInt(exponent);
}

function formatExactDecimal(unscaled: bigint, scale: number): string {
  if (scale === 0) return unscaled.toString();
  const digits = unscaled.toString().padStart(scale + 1, "0");
  const whole = digits.slice(0, -scale);
  const fraction = digits.slice(-scale).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function summarizeExactWeights(
  weights: string[],
): { total: string; isExactlyHundred: boolean } | undefined {
  const parsed = weights.map(parsePositiveExactDecimal);
  if (parsed.some((weight) => !weight)) return undefined;

  const decimals = parsed as ExactDecimal[];
  const scale = Math.max(...decimals.map((decimal) => decimal.scale));
  const total = decimals.reduce(
    (sum, decimal) =>
      sum + decimal.unscaled * powerOfTen(scale - decimal.scale),
    BigInt(0),
  );

  return {
    total: formatExactDecimal(total, scale),
    isExactlyHundred: total === BigInt(100) * powerOfTen(scale),
  };
}

export function KpiFormulaDialog({
  open,
  onOpenChange,
  organizationId,
  metrics,
  kpis,
  pending,
  onCreate,
}: KpiFormulaDialogProps) {
  const [form, setForm] = useState<FormulaState>(createInitialForm);
  const [formError, setFormError] = useState<string>();

  const activeMetrics = useMemo(
    () => metrics.filter((metric) => metric.isActive),
    [metrics],
  );
  const activeKpis = useMemo(() => kpis.filter((kpi) => kpi.isActive), [kpis]);
  const kpiOptions = activeKpis.map((kpi) => ({
    value: kpi.kpiId,
    label: kpi.name,
    description: kpi.measurementUnit ?? kpi.unitType ?? "KPI",
  }));
  const weightSummary = useMemo(
    () => summarizeExactWeights(form.components.map((component) => component.weight)),
    [form.components],
  );

  const setCalculationType = (calculationType: EditableCalculationType) => {
    setFormError(undefined);
    setForm((current) => ({
      ...current,
      calculationType,
      temporalRollupMethod:
        calculationType === "WEIGHTED_INDEX"
          ? "WEIGHTED_INDEX"
          : current.temporalRollupMethod === "WEIGHTED_INDEX"
            ? "SUM_COMPONENTS_THEN_DIVIDE"
            : current.temporalRollupMethod,
    }));
  };

  const updateComponent = (
    index: number,
    update: Partial<Omit<WeightedComponentState, "key">>,
  ) => {
    setForm((current) => ({
      ...current,
      components: current.components.map((component, componentIndex) =>
        componentIndex === index ? { ...component, ...update } : component,
      ),
    }));
  };

  const moveComponent = (fromIndex: number, toIndex: number) => {
    setForm((current) => {
      if (toIndex < 0 || toIndex >= current.components.length) return current;
      const components = [...current.components];
      const [component] = components.splice(fromIndex, 1);
      components.splice(toIndex, 0, component);
      return { ...current, components };
    });
  };

  const removeComponent = (index: number) => {
    setForm((current) => ({
      ...current,
      components:
        current.components.length <= 2
          ? current.components
          : current.components.filter((_, componentIndex) => componentIndex !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.kpiId) {
      setFormError("Choose the target KPI.");
      return;
    }

    let rangeInput: Pick<
      CreateKpiFormulaDefinitionInput,
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

    let input: CreateKpiFormulaDefinitionInput;
    if (form.calculationType === "WEIGHTED_INDEX") {
      if (form.components.length < 2) {
        setFormError("Weighted-index formulas require at least two components.");
        return;
      }

      const sourceKeys = new Set<string>();
      for (const [index, component] of form.components.entries()) {
        const position = index + 1;
        if (!component.source.id) {
          setFormError(`Choose a source for component ${position}.`);
          return;
        }
        if (component.source.type === "KPI" && component.source.id === form.kpiId) {
          setFormError("A formula cannot use its target KPI as a component source.");
          return;
        }

        const sourceKey = `${component.source.type}:${component.source.id}`;
        if (sourceKeys.has(sourceKey)) {
          setFormError(`Component ${position} duplicates an earlier source.`);
          return;
        }
        sourceKeys.add(sourceKey);

        if (!parsePositiveExactDecimal(component.weight)) {
          setFormError(
            `Component ${position} weight must be a positive exact decimal with no more than 18 decimal places.`,
          );
          return;
        }
      }

      if (!weightSummary?.isExactlyHundred) {
        setFormError(
          `Component weights must total exactly 100${weightSummary ? `; the exact total is ${weightSummary.total}` : ""}.`,
        );
        return;
      }

      const components: KpiFormulaComponentInput[] = form.components.map(
        (component, index) =>
          component.source.type === "METRIC"
            ? {
                position: index + 1,
                sourceType: "METRIC",
                metricDefinitionId: component.source.id,
                weight: component.weight.trim(),
              }
            : {
                position: index + 1,
                sourceType: "KPI",
                sourceKpiId: component.source.id,
                weight: component.weight.trim(),
              },
      );

      input = {
        organizationId,
        kpiId: form.kpiId,
        calculationType: "WEIGHTED_INDEX",
        components,
        temporalRollupMethod: "WEIGHTED_INDEX",
        zeroDenominatorPolicy: form.zeroDenominatorPolicy,
        resultDirection: form.resultDirection,
        ...rangeInput,
      };
    } else {
      const multiplier = Number(form.multiplier);
      if (!form.numerator.id || !form.denominator.id) {
        setFormError("Choose both numerator and denominator sources.");
        return;
      }
      if (
        (form.numerator.type === "KPI" && form.numerator.id === form.kpiId) ||
        (form.denominator.type === "KPI" && form.denominator.id === form.kpiId)
      ) {
        setFormError("A formula cannot use its target KPI as a source.");
        return;
      }
      if (!Number.isFinite(multiplier) || multiplier <= 0) {
        setFormError("Multiplier must be greater than zero.");
        return;
      }

      input = {
        organizationId,
        kpiId: form.kpiId,
        calculationType: "RATIO_FORMULA",
        numeratorSourceType: form.numerator.type,
        denominatorSourceType: form.denominator.type,
        multiplier,
        temporalRollupMethod: form.temporalRollupMethod,
        zeroDenominatorPolicy: form.zeroDenominatorPolicy,
        resultDirection: form.resultDirection,
        ...rangeInput,
        ...(form.numerator.type === "METRIC"
          ? { numeratorMetricDefinitionId: form.numerator.id }
          : { numeratorKpiId: form.numerator.id }),
        ...(form.denominator.type === "METRIC"
          ? { denominatorMetricDefinitionId: form.denominator.id }
          : { denominatorKpiId: form.denominator.id }),
      };
    }

    setFormError(undefined);
    try {
      await onCreate(input);
      setForm(createInitialForm());
      onOpenChange(false);
    } catch {
      // The mutation hook displays the server error in a toast.
    }
  };

  const ratioHasNoSources = activeMetrics.length === 0 && activeKpis.length < 2;
  const weightedHasTooFewSources =
    activeMetrics.length + Math.max(activeKpis.length - 1, 0) < 2;
  const hasInsufficientSources =
    form.calculationType === "WEIGHTED_INDEX"
      ? weightedHasTooFewSources
      : ratioHasNoSources;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create KPI formula</DialogTitle>
          <DialogDescription>
            Configure a versioned ratio or weighted-index formula. New definitions
            begin in draft.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Formula type</Label>
            <Select
              value={form.calculationType}
              onValueChange={(value: EditableCalculationType) =>
                setCalculationType(value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RATIO_FORMULA">Ratio formula</SelectItem>
                <SelectItem value="WEIGHTED_INDEX">Weighted index</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>
              {form.calculationType === "WEIGHTED_INDEX"
                ? "Weighted index"
                : "Ratio formula"}
            </AlertTitle>
            <AlertDescription>
              {form.calculationType === "WEIGHTED_INDEX" ? (
                <>
                  Weighted values must use a compatible score/index scale before they
                  are combined. Enter positive decimal weights totaling exactly 100;
                  weights are submitted exactly as entered and are never rounded by
                  this editor.
                </>
              ) : (
                <>
                  Each side can reference either an active metric or another active
                  KPI. Circular KPI dependencies are rejected by the server.
                </>
              )}
            </AlertDescription>
          </Alert>

          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Target KPI</Label>
            <SearchableSelect
              options={kpiOptions}
              value={form.kpiId}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, kpiId: value }))
              }
              placeholder="Select the KPI this formula calculates"
              searchPlaceholder="Search KPIs..."
              emptyMessage="No active KPI candidates found."
            />
          </div>

          {form.calculationType === "WEIGHTED_INDEX" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label>Ordered components</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Evaluation follows the order shown below. Each source may appear
                    only once.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      components: [
                        ...current.components,
                        createWeightedComponent(),
                      ],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add component
                </Button>
              </div>

              <div className="space-y-3">
                {form.components.map((component, index) => (
                  <div
                    key={component.key}
                    className="rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="font-medium">Component {index + 1}</div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => moveComponent(index, index - 1)}
                          disabled={index === 0}
                          aria-label={`Move component ${index + 1} up`}
                          title="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => moveComponent(index, index + 1)}
                          disabled={index === form.components.length - 1}
                          aria-label={`Move component ${index + 1} down`}
                          title="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeComponent(index)}
                          disabled={form.components.length <= 2}
                          aria-label={`Remove component ${index + 1}`}
                          title={
                            form.components.length <= 2
                              ? "At least two components are required"
                              : "Remove component"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(10rem,0.35fr)]">
                      <SourceEditor
                        label={`Component ${index + 1}`}
                        source={component.source}
                        metrics={activeMetrics}
                        kpis={activeKpis}
                        targetKpiId={form.kpiId}
                        onChange={(source) => updateComponent(index, { source })}
                      />
                      <div className="space-y-2">
                        <Label htmlFor={`component-weight-${component.key}`}>
                          Exact weight (%)
                        </Label>
                        <Input
                          id={`component-weight-${component.key}`}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={component.weight}
                          onChange={(event) =>
                            updateComponent(index, { weight: event.target.value })
                          }
                          placeholder="50"
                          className="bg-background font-mono"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Positive decimal; up to 18 decimal places.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  weightSummary?.isExactlyHundred
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                Exact weight total: {weightSummary?.total ?? "—"} / 100
              </div>
            </div>
          ) : (
            <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
              <SourceEditor
                label="Numerator"
                source={form.numerator}
                metrics={activeMetrics}
                kpis={activeKpis}
                targetKpiId={form.kpiId}
                onChange={(numerator) =>
                  setForm((current) => ({ ...current, numerator }))
                }
              />
              <div className="hidden pt-10 text-xl font-medium text-muted-foreground md:block">
                ÷
              </div>
              <SourceEditor
                label="Denominator"
                source={form.denominator}
                metrics={activeMetrics}
                kpis={activeKpis}
                targetKpiId={form.kpiId}
                onChange={(denominator) =>
                  setForm((current) => ({ ...current, denominator }))
                }
              />
            </div>
          )}

          {hasInsufficientSources && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {form.calculationType === "WEIGHTED_INDEX"
                  ? "Add at least two eligible active metrics or source KPIs before creating a weighted index."
                  : "Add active metrics or additional KPIs before creating a formula."}
              </AlertDescription>
            </Alert>
          )}

          {form.calculationType === "RATIO_FORMULA" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="formula-multiplier">Multiplier</Label>
                <Input
                  id="formula-multiplier"
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
                <p className="text-xs text-muted-foreground">
                  Use 100 to express the ratio as a percentage.
                </p>
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
                <Label>Zero denominator policy</Label>
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
              <ResultDirectionSelect
                value={form.resultDirection}
                onChange={(resultDirection) =>
                  setForm((current) => ({ ...current, resultDirection }))
                }
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Temporal rollup</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                  Weighted index
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for weighted-index formulas.
                </p>
              </div>
              <ResultDirectionSelect
                value={form.resultDirection}
                onChange={(resultDirection) =>
                  setForm((current) => ({ ...current, resultDirection }))
                }
              />
            </div>
          )}

          {form.calculationType === "RATIO_FORMULA" &&
            form.temporalRollupMethod === "COHORT" && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Opening-cohort annual calculation</AlertTitle>
                <AlertDescription>
                  The annual result uses the exact Q4 numerator divided by the exact
                  Q1 denominator. For retention KPIs, configure the opening-population
                  denominator metric as Period-start snapshot and the retained-cohort
                  numerator metric as Period-end snapshot.
                </AlertDescription>
              </Alert>
            )}

          {form.resultDirection === "TARGET_RANGE" && (
            <TargetRangeEditor
              minimum={form.targetRangeMin}
              maximum={form.targetRangeMax}
              policy={form.targetRangeOutsidePolicy}
              onMinimumChange={(targetRangeMin) =>
                setForm((current) => ({ ...current, targetRangeMin }))
              }
              onMaximumChange={(targetRangeMax) =>
                setForm((current) => ({ ...current, targetRangeMax }))
              }
              onPolicyChange={(targetRangeOutsidePolicy) =>
                setForm((current) => ({ ...current, targetRangeOutsidePolicy }))
              }
            />
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
              disabled={pending || activeKpis.length === 0 || hasInsufficientSources}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TargetRangeEditorProps {
  minimum: string;
  maximum: string;
  policy: KpiTargetRangeOutsidePolicy | "";
  onMinimumChange: (value: string) => void;
  onMaximumChange: (value: string) => void;
  onPolicyChange: (value: KpiTargetRangeOutsidePolicy | "") => void;
}

function TargetRangeEditor({
  minimum,
  maximum,
  policy,
  onMinimumChange,
  onMaximumChange,
  onPolicyChange,
}: TargetRangeEditorProps) {
  const selectedPolicy = TARGET_RANGE_POLICY_OPTIONS.find(
    (option) => option.value === policy,
  );
  return (
    <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
      <div>
        <Label className="text-indigo-950">Inclusive target range</Label>
        <p className="mt-1 text-xs text-indigo-700">
          Results from the exact minimum through the exact maximum score 100%.
          Values are submitted as decimal strings without floating-point conversion.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="formula-target-range-min">Exact minimum</Label>
          <Input
            id="formula-target-range-min"
            type="text"
            inputMode="decimal"
            value={minimum}
            onChange={(event) => onMinimumChange(event.target.value)}
            placeholder="75.22"
            className="bg-white font-mono"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="formula-target-range-max">Exact maximum</Label>
          <Input
            id="formula-target-range-max"
            type="text"
            inputMode="decimal"
            value={maximum}
            onChange={(event) => onMaximumChange(event.target.value)}
            placeholder="80"
            className="bg-white font-mono"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Outside-range scoring</Label>
        <Select
          value={policy || "COMPANY_DEFAULT"}
          onValueChange={(value) =>
            onPolicyChange(
              value === "COMPANY_DEFAULT"
                ? ""
                : (value as KpiTargetRangeOutsidePolicy),
            )
          }
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue />
          </SelectTrigger>
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
          {selectedPolicy?.description ??
            "The organization default policy is applied when this draft is created."}
        </p>
      </div>
    </div>
  );
}

interface SourceEditorProps {
  label: string;
  source: SourceState;
  metrics: MetricDefinition[];
  kpis: KpiCandidate[];
  targetKpiId: string;
  onChange: (source: SourceState) => void;
}

function SourceEditor({
  label,
  source,
  metrics,
  kpis,
  targetKpiId,
  onChange,
}: SourceEditorProps) {
  const options =
    source.type === "METRIC"
      ? metrics.map((metric) => ({
          value: metric.id,
          label: metric.name,
          description: `${metric.code} · ${metric.unitType}`,
        }))
      : kpis
          .filter((kpi) => kpi.kpiId !== targetKpiId)
          .map((kpi) => ({
            value: kpi.kpiId,
            label: kpi.name,
            description: kpi.measurementUnit ?? kpi.unitType ?? "KPI",
          }));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{label} source type</Label>
        <Select
          value={source.type}
          onValueChange={(type: KpiFormulaSourceType) =>
            onChange({ type, id: "" })
          }
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="METRIC">Metric definition</SelectItem>
            <SelectItem value="KPI">KPI</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>
          {label} {source.type === "METRIC" ? "metric" : "KPI"}
        </Label>
        <SearchableSelect
          options={options}
          value={source.id}
          onValueChange={(id) => onChange({ ...source, id })}
          placeholder={`Select ${label.toLowerCase()} source`}
          searchPlaceholder={`Search ${source.type === "METRIC" ? "metrics" : "KPIs"}...`}
          emptyMessage={`No eligible ${source.type === "METRIC" ? "metrics" : "KPIs"} found.`}
          className="bg-background"
        />
      </div>
    </div>
  );
}

function ResultDirectionSelect({
  value,
  onChange,
}: {
  value: KpiResultDirection;
  onChange: (value: KpiResultDirection) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Result direction</Label>
      <Select value={value} onValueChange={onChange}>
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
  );
}
