"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Kpi } from "@/types/graphql";
import {
  formulaComponentSourceLabel,
  formulaSourceLabel,
  type FormulaQuarterComponentInput,
  type FormulaQuarterMetricInput,
  type KpiFormulaQuarterPlanView,
  useKpiFormulaQuarterPlanning,
} from "@/hooks/kpi-formulas/useKpiFormulaQuarterPlanning";
import type { KpiFormulaComponent } from "@/hooks/kpi-formulas/useKpiFormulas";
import {
  normalizedExpressionTerms,
  renderCanonicalFormula,
  termSourceLabel,
  type FormulaExpressionTermLike,
} from "@/components/kpi-formulas/formulaExpression";
import {
  buildExpressionTermMetricInputs,
  type ExpressionTermInputsByQuarter,
} from "@/components/kpi-formulas/formulaQuarterPlanning";
import { useAuthStore } from "@/stores";

interface QuarterInputState {
  numerator: string;
  denominator: string;
}

interface ExactFraction {
  numerator: bigint;
  denominator: bigint;
}

type InputsByQuarter = Record<number, QuarterInputState>;
type ComponentInputsByQuarter = Record<number, Record<string, string>>;

export interface FormulaQuarterPlanningCardHandle {
  save: () => Promise<void>;
}

interface FormulaQuarterPlanningCardProps {
  kpi: Kpi;
  annualPeriodId?: string;
  canEdit: boolean;
}

const QUARTERS = [1, 2, 3, 4] as const;
const LOCKED_QUARTER_STATUSES = new Set(["PENDING", "APPROVED", "LOCKED"]);
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TEN = BigInt(10);

function emptyInputs(): InputsByQuarter {
  return {
    1: { numerator: "", denominator: "" },
    2: { numerator: "", denominator: "" },
    3: { numerator: "", denominator: "" },
    4: { numerator: "", denominator: "" },
  };
}

function emptyComponentInputs(): ComponentInputsByQuarter {
  return { 1: {}, 2: {}, 3: {}, 4: {} };
}

function emptyExpressionTermInputs(): ExpressionTermInputsByQuarter {
  return { 1: {}, 2: {}, 3: {}, 4: {} };
}

function planByQuarter(
  plans: KpiFormulaQuarterPlanView[],
): Map<number, KpiFormulaQuarterPlanView> {
  return new Map(plans.map((plan) => [plan.quarterPlan.quarterNumber, plan]));
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < ZERO ? -left : left;
  let b = right < ZERO ? -right : right;
  while (b !== ZERO) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a === ZERO ? ONE : a;
}

function normalizeFraction(fraction: ExactFraction): ExactFraction {
  const sign = fraction.denominator < ZERO ? -ONE : ONE;
  const divisor = greatestCommonDivisor(fraction.numerator, fraction.denominator);
  return {
    numerator: (fraction.numerator / divisor) * sign,
    denominator: (fraction.denominator / divisor) * sign,
  };
}

function powerOfTen(exponent: number): bigint {
  let result = ONE;
  for (let index = 0; index < exponent; index += 1) result *= TEN;
  return result;
}

function parseExactDecimal(value?: string | null): ExactFraction | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/.exec(trimmed);
  if (!match) return null;

  const sign = match[1] === "-" ? -ONE : ONE;
  const integerDigits = match[2] ?? "0";
  const decimalDigits = match[3] ?? match[4] ?? "";
  const denominator = powerOfTen(decimalDigits.length);
  const numerator = BigInt(`${integerDigits}${decimalDigits}`) * sign;
  return normalizeFraction({ numerator, denominator });
}

function parseExactValue(value?: string | null): ExactFraction | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const fractionParts = trimmed.split("/");
  if (fractionParts.length === 1) return parseExactDecimal(trimmed);
  if (fractionParts.length !== 2) return null;
  const numerator = parseExactDecimal(fractionParts[0]);
  const denominator = parseExactDecimal(fractionParts[1]);
  return numerator && denominator ? divideFractions(numerator, denominator) : null;
}

function addFractions(left: ExactFraction, right: ExactFraction): ExactFraction {
  return normalizeFraction({
    numerator:
      left.numerator * right.denominator + right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  });
}

function multiplyFractions(
  left: ExactFraction,
  right: ExactFraction,
): ExactFraction {
  return normalizeFraction({
    numerator: left.numerator * right.numerator,
    denominator: left.denominator * right.denominator,
  });
}

function divideFractions(
  numerator: ExactFraction,
  denominator: ExactFraction,
): ExactFraction | null {
  if (denominator.numerator === ZERO) return null;
  return normalizeFraction({
    numerator: numerator.numerator * denominator.denominator,
    denominator: numerator.denominator * denominator.numerator,
  });
}

function formatFraction(value: ExactFraction | null): string {
  if (!value) return "—";
  return value.denominator === ONE
    ? value.numerator.toString()
    : `${value.numerator.toString()}/${value.denominator.toString()}`;
}

function sumExactDecimals(values: string[]): ExactFraction | null {
  let total: ExactFraction = { numerator: ZERO, denominator: ONE };
  for (const value of values) {
    const parsed = parseExactDecimal(value);
    if (!parsed) return null;
    total = addFractions(total, parsed);
  }
  return total;
}

function weightedProduct(
  plannedValue?: string | null,
  weight?: string | null,
): ExactFraction | null {
  const parsedValue = parseExactValue(plannedValue);
  const parsedWeight = parseExactValue(weight);
  if (!parsedValue || !parsedWeight) return null;
  return multiplyFractions(parsedValue, parsedWeight);
}

function weightedNumerator(
  components: KpiFormulaComponent[],
  valueForComponent: (component: KpiFormulaComponent) => string | null | undefined,
): ExactFraction | null {
  let total: ExactFraction = { numerator: ZERO, denominator: ONE };
  for (const component of components) {
    const product = weightedProduct(valueForComponent(component), component.weight);
    if (!product) return null;
    total = addFractions(total, product);
  }
  return total;
}

function expressionTermContribution(
  term: FormulaExpressionTermLike,
  plannedValue?: string | null,
): ExactFraction | null {
  const sourceValue = parseExactValue(plannedValue);
  const factor = parseExactValue(term.factorExact);
  if (!sourceValue || !factor) return null;
  const contribution = multiplyFractions(sourceValue, factor);
  return term.operator === "SUBTRACT"
    ? { ...contribution, numerator: -contribution.numerator }
    : contribution;
}

function statusStyle(status?: string): string {
  if (status === "VALID" || status === "LOCKED")
    return "border-green-200 bg-green-50 text-green-700";
  if (status === "INVALID") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function isLockedStatus(status?: string | null): boolean {
  return Boolean(status && LOCKED_QUARTER_STATUSES.has(status));
}

export const FormulaQuarterPlanningCard = forwardRef<
  FormulaQuarterPlanningCardHandle,
  FormulaQuarterPlanningCardProps
>(function FormulaQuarterPlanningCard({ kpi, annualPeriodId, canEdit }, ref) {
  const isFormulaKpi =
    kpi.calculationType === "RATIO_FORMULA" ||
    kpi.calculationType === "SCALAR_FORMULA" ||
    kpi.calculationType === "WEIGHTED_INDEX";
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const {
    approvedFormula,
    plans,
    loading,
    saving,
    error,
    saveMetricInputs,
    saveComponentInputs,
  } = useKpiFormulaQuarterPlanning({
    organizationId,
    kpiId: kpi.kpiId,
    annualPeriodId,
    enabled: isFormulaKpi,
  });
  const [inputs, setInputs] = useState<InputsByQuarter>(emptyInputs);
  const [componentInputs, setComponentInputs] =
    useState<ComponentInputsByQuarter>(emptyComponentInputs);
  const [expressionTermInputs, setExpressionTermInputs] =
    useState<ExpressionTermInputsByQuarter>(emptyExpressionTermInputs);
  const plansByQuarter = useMemo(() => planByQuarter(plans), [plans]);
  const orderedComponents = useMemo(
    () =>
      [...(approvedFormula?.components ?? [])].sort(
        (left, right) => left.position - right.position,
      ),
    [approvedFormula],
  );
  const totalWeight = useMemo(
    () => sumExactDecimals(orderedComponents.map((component) => component.weight)),
    [orderedComponents],
  );
  const plannedExpressionTerms = useMemo(() => {
    const byId = new Map<string, FormulaExpressionTermLike>();
    for (const plan of plans) {
      for (const termPlan of plan.expressionTermPlans ?? []) {
        byId.set(termPlan.formulaExpressionTermId, termPlan.formulaExpressionTerm);
      }
    }
    return byId;
  }, [plans]);
  const expressionTerms = useMemo(
    () =>
      normalizedExpressionTerms(approvedFormula).map((term) => {
        const plannedTerm = term.id ? plannedExpressionTerms.get(term.id) : null;
        return {
          ...term,
          metricDefinition:
            term.metricDefinition ?? plannedTerm?.metricDefinition ?? null,
          sourceKpi: term.sourceKpi ?? plannedTerm?.sourceKpi ?? null,
        };
      }),
    [approvedFormula, plannedExpressionTerms],
  );
  const hasExpressionTermPlanning = Boolean(
    approvedFormula?.expressionTerms?.length,
  );
  const numeratorTerms = expressionTerms.filter((term) =>
    approvedFormula?.calculationType === "SCALAR_FORMULA"
      ? term.side === "SCALAR"
      : term.side === "NUMERATOR",
  );
  const denominatorTerms = expressionTerms.filter(
    (term) => term.side === "DENOMINATOR",
  );
  const numeratorHasMetric = numeratorTerms.some(
    (term) => term.sourceType === "METRIC",
  );
  const denominatorHasMetric = denominatorTerms.some(
    (term) => term.sourceType === "METRIC",
  );

  useEffect(() => {
    if (plans.length === 0) return;
    setInputs((current) => {
      const next = { ...current };
      for (const plan of plans) {
        const quarter = plan.quarterPlan.quarterNumber;
        next[quarter] = {
          numerator:
            plan.numeratorPlannedValue == null
              ? current[quarter]?.numerator ?? ""
              : String(plan.numeratorPlannedValue),
          denominator:
            plan.denominatorPlannedValue == null
              ? current[quarter]?.denominator ?? ""
              : String(plan.denominatorPlannedValue),
        };
      }
      return next;
    });
    setComponentInputs((current) => {
      const next = { ...current };
      for (const plan of plans) {
        const quarter = plan.quarterPlan.quarterNumber;
        next[quarter] = { ...(current[quarter] ?? {}) };
        for (const componentPlan of plan.components ?? []) {
          if (componentPlan.plannedValue != null) {
            next[quarter][componentPlan.formulaComponentId] = String(
              componentPlan.plannedValue,
            );
          }
        }
      }
      return next;
    });
    setExpressionTermInputs((current) => {
      const next = { ...current };
      for (const plan of plans) {
        const quarter = plan.quarterPlan.quarterNumber;
        next[quarter] = { ...(current[quarter] ?? {}) };
        for (const termPlan of plan.expressionTermPlans ?? []) {
          if (
            termPlan.formulaExpressionTerm.sourceType === "METRIC" &&
            termPlan.plannedValue != null
          ) {
            next[quarter][termPlan.formulaExpressionTermId] = String(
              termPlan.plannedValue,
            );
          }
        }
      }
      return next;
    });
  }, [plans]);

  const quarterPlanFor = useCallback(
    (quarterNumber: number) =>
      plansByQuarter.get(quarterNumber)?.quarterPlan ??
      kpi.quarterPlans?.find(
        (candidate) => candidate.quarterNumber === quarterNumber,
      ),
    [kpi.quarterPlans, plansByQuarter],
  );

  const planningLocked = useMemo(
    () =>
      !canEdit ||
      QUARTERS.some((quarterNumber) => {
        const plan = plansByQuarter.get(quarterNumber);
        return (
          plan?.reconciliationStatus === "LOCKED" ||
          isLockedStatus(quarterPlanFor(quarterNumber)?.status)
        );
      }),
    [canEdit, plansByQuarter, quarterPlanFor],
  );

  const numeratorSource = approvedFormula
    ? formulaSourceLabel(approvedFormula, "numerator")
    : null;
  const denominatorSource = approvedFormula
    ? formulaSourceLabel(approvedFormula, "denominator")
    : null;

  const save = useCallback(async () => {
    if (!isFormulaKpi || !canEdit || planningLocked) return;
    if (loading) {
      throw new Error("Formula configuration is still loading. Please try again.");
    }
    if (!approvedFormula) {
      throw new Error("This formula KPI has no approved formula definition.");
    }

    if (approvedFormula.calculationType === "WEIGHTED_INDEX") {
      const metricComponents = orderedComponents.filter(
        (component) => component.sourceType === "METRIC",
      );
      const componentValues: FormulaQuarterComponentInput[] = QUARTERS.flatMap(
        (quarterNumber) =>
          metricComponents.map((component) => ({
            quarterNumber,
            formulaComponentId: component.id,
            plannedValue:
              componentInputs[quarterNumber]?.[component.id]?.trim() || null,
          })),
      );
      await saveComponentInputs(componentValues);
      return;
    }

    if (
      approvedFormula.calculationType !== "RATIO_FORMULA" &&
      approvedFormula.calculationType !== "SCALAR_FORMULA"
    ) {
      throw new Error("The approved formula type is not supported for planning.");
    }
    if (hasExpressionTermPlanning) {
      await saveMetricInputs(
        buildExpressionTermMetricInputs(
          QUARTERS,
          expressionTerms,
          expressionTermInputs,
        ),
      );
      return;
    }

    const legacyMetricInputs: FormulaQuarterMetricInput[] = QUARTERS.map(
      (quarterNumber) => ({
        quarterNumber,
        ...(numeratorHasMetric
          ? {
              numeratorPlannedValue:
                inputs[quarterNumber].numerator.trim() || null,
            }
          : {}),
        ...(denominatorHasMetric
          ? {
              denominatorPlannedValue:
                inputs[quarterNumber].denominator.trim() || null,
            }
          : {}),
      }),
    );
    await saveMetricInputs(legacyMetricInputs);
  }, [
    approvedFormula,
    canEdit,
    componentInputs,
    expressionTermInputs,
    expressionTerms,
    hasExpressionTermPlanning,
    inputs,
    isFormulaKpi,
    loading,
    orderedComponents,
    numeratorHasMetric,
    denominatorHasMetric,
    planningLocked,
    saveComponentInputs,
    saveMetricInputs,
  ]);

  useImperativeHandle(ref, () => ({ save }), [save]);

  if (!isFormulaKpi) return null;

  if (loading && !approvedFormula) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading formula planning…
      </div>
    );
  }

  if (!approvedFormula) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-4 w-4" />
          Approved formula required
        </div>
        <p className="mt-1">
          Configure and approve this KPI&apos;s formula before entering quarterly
          metric targets.
        </p>
      </div>
    );
  }

  const isWeighted = approvedFormula.calculationType === "WEIGHTED_INDEX";
  const usesAnnualComponentRollup =
    approvedFormula.temporalRollupMethod === "SUM_COMPONENTS_THEN_DIVIDE";

  return (
    <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-medium text-indigo-950">
            {isWeighted ? "Weighted-index target inputs" : "Formula target inputs"}
          </h4>
          <p className="mt-1 text-xs text-indigo-700">
            {isWeighted ? (
              <>
                Σ(component value × exact weight) ÷ Σ(exact weight). Metric values
                remain exact decimal strings; KPI values are resolved from their
                quarter plans.
              </>
            ) : (
              <>
                {renderCanonicalFormula(approvedFormula)}. {hasExpressionTermPlanning
                  ? "Each metric term is planned and reconciled independently; KPI terms and constants are resolved by the server."
                  : "This legacy formula uses exact numerator/denominator side-total planning fields."}
              </>
            )}
          </p>
        </div>
        <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">
          {approvedFormula.temporalRollupMethod.replaceAll("_", " ")}
        </Badge>
      </div>

      {!isWeighted && (
        <div className="rounded-md border border-indigo-200 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-700">
            Ordered term sources
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {expressionTerms.map((term) => (
              <Badge key={term.id ?? `${term.side}-${term.position}`} variant="outline">
                {term.side} {term.operator === "SUBTRACT" ? "−" : "+"} {termSourceLabel(term)} × {term.factorExact}
                {term.sourceType === "KPI"
                  ? " · read only"
                  : term.sourceType === "CONSTANT"
                    ? " · preview only"
                    : " · metric input"}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {hasExpressionTermPlanning
              ? "Each metric term is planned and reconciled independently. KPI terms are resolved from linked quarter targets; constants and exact factors are immutable formula inputs."
              : "This legacy flat formula is planned using exact numerator and denominator side totals."}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error.message}
        </div>
      )}

      {isWeighted ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {QUARTERS.map((quarterNumber) => {
            const plan = plansByQuarter.get(quarterNumber);
            const quarterPlan = quarterPlanFor(quarterNumber);
            const configuredTarget =
              quarterPlan?.originalTarget ??
              kpi.targets?.find((target) =>
                target.timeline.toUpperCase().endsWith(`-Q${quarterNumber}`),
              )?.target;
            const componentPlans = new Map(
              (plan?.components ?? []).map((componentPlan) => [
                componentPlan.formulaComponentId,
                componentPlan,
              ]),
            );
            const valueForComponent = (component: KpiFormulaComponent) =>
              component.sourceType === "METRIC"
                ? componentInputs[quarterNumber]?.[component.id] ?? ""
                : componentPlans.get(component.id)?.plannedValue;
            const calculatedNumerator = weightedNumerator(
              orderedComponents,
              valueForComponent,
            );
            const individuallyLocked =
              plan?.reconciliationStatus === "LOCKED" ||
              isLockedStatus(quarterPlan?.status);

            return (
              <section
                key={quarterNumber}
                className="overflow-hidden rounded-lg border bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                  <h5 className="font-semibold text-indigo-950">Q{quarterNumber}</h5>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={statusStyle(plan?.reconciliationStatus)}
                    >
                      {plan?.reconciliationStatus ?? "PENDING INPUT"}
                    </Badge>
                    {(planningLocked || individuallyLocked) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LockKeyhole className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-160 text-sm">
                    <thead className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Component source</th>
                        <th className="px-3 py-2">Planned value</th>
                        <th className="px-3 py-2">Exact weight</th>
                        <th className="px-3 py-2">Exact weighted contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orderedComponents.map((component) => {
                        const plannedValue = valueForComponent(component);
                        const product = weightedProduct(
                          plannedValue,
                          component.weight,
                        );
                        const contribution =
                          product && totalWeight
                            ? divideFractions(product, totalWeight)
                            : null;
                        return (
                          <tr key={component.id} className="align-top">
                            <td className="px-3 py-3">
                              <div className="font-medium">
                                {component.position}.{" "}
                                {formulaComponentSourceLabel(component)}
                              </div>
                              <div className="mt-1 text-[11px] text-muted-foreground">
                                {component.sourceType === "METRIC"
                                  ? "Metric source"
                                  : "KPI source · read only"}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {component.sourceType === "METRIC" ? (
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    componentInputs[quarterNumber]?.[component.id] ??
                                    ""
                                  }
                                  onChange={(event) =>
                                    setComponentInputs((current) => ({
                                      ...current,
                                      [quarterNumber]: {
                                        ...(current[quarterNumber] ?? {}),
                                        [component.id]: event.target.value,
                                      },
                                    }))
                                  }
                                  disabled={planningLocked || saving}
                                  aria-label={`Q${quarterNumber} ${formulaComponentSourceLabel(component)}`}
                                />
                              ) : (
                                <div className="rounded-md border bg-slate-50 px-3 py-2 text-slate-700">
                                  {plannedValue ?? "Resolved after target save"}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 font-mono text-xs">
                              {component.weight}
                            </td>
                            <td className="px-3 py-3 font-mono text-xs">
                              {product && totalWeight ? (
                                <>
                                  <div>
                                    {formatFraction(product)} ÷ {formatFraction(totalWeight)}
                                  </div>
                                  <div className="mt-1 break-all text-[11px] text-muted-foreground">
                                    = {formatFraction(contribution)}
                                  </div>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-2 border-t bg-slate-50/70 p-3 sm:grid-cols-2">
                  <div className="rounded-md border bg-white p-2">
                    <div className="text-[11px] text-muted-foreground">
                      Calculated numerator · Σ(value × weight)
                    </div>
                    <div className="mt-1 break-all font-mono text-xs">
                      {formatFraction(calculatedNumerator)}
                    </div>
                  </div>
                  <div className="rounded-md border bg-white p-2">
                    <div className="text-[11px] text-muted-foreground">
                      Calculated denominator · Σ(weight)
                    </div>
                    <div className="mt-1 break-all font-mono text-xs">
                      {formatFraction(totalWeight)}
                    </div>
                  </div>
                  <div className="rounded-md border bg-white p-2">
                    <div className="text-[11px] text-muted-foreground">
                      Calculated result
                    </div>
                    <div className="mt-1 font-mono text-xs">
                      {plan?.calculatedTargetDecimal ?? "—"}
                    </div>
                    {plan?.calculatedTargetExact && (
                      <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                        {plan.calculatedTargetExact}
                      </div>
                    )}
                  </div>
                  <div className="rounded-md border bg-white p-2">
                    <div className="text-[11px] text-muted-foreground">
                      Configured target
                    </div>
                    <div className="mt-1 font-mono text-xs">
                      {configuredTarget == null ? "—" : String(configuredTarget)}
                    </div>
                  </div>
                </div>

                {plan?.validationMessage && (
                  <p
                    className={`border-t px-3 py-2 text-xs ${
                      plan.reconciliationStatus === "INVALID"
                        ? "text-red-600"
                        : "text-amber-700"
                    }`}
                  >
                    {plan.validationMessage}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      ) : hasExpressionTermPlanning ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {QUARTERS.map((quarterNumber) => {
            const plan = plansByQuarter.get(quarterNumber);
            const quarterPlan = quarterPlanFor(quarterNumber);
            const configuredTarget =
              quarterPlan?.originalTarget ??
              kpi.targets?.find((target) =>
                target.timeline.toUpperCase().endsWith(`-Q${quarterNumber}`),
              )?.target;
            const termPlans = new Map(
              (plan?.expressionTermPlans ?? []).map((termPlan) => [
                termPlan.formulaExpressionTermId,
                termPlan,
              ]),
            );
            const individuallyLocked =
              plan?.reconciliationStatus === "LOCKED" ||
              isLockedStatus(quarterPlan?.status);

            return (
              <section
                key={quarterNumber}
                className="overflow-hidden rounded-lg border bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                  <h5 className="font-semibold text-indigo-950">Q{quarterNumber}</h5>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={statusStyle(plan?.reconciliationStatus)}
                    >
                      {plan?.reconciliationStatus ?? "PENDING INPUT"}
                    </Badge>
                    {(planningLocked || individuallyLocked) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LockKeyhole className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-180 text-sm">
                    <thead className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Expression term</th>
                        <th className="px-3 py-2">Source value</th>
                        <th className="px-3 py-2">Exact factor</th>
                        <th className="px-3 py-2">Signed contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {expressionTerms.map((term) => {
                        const termId = term.id ?? `${term.side}-${term.position}`;
                        const resolvedPlanValue = term.id
                          ? termPlans.get(term.id)?.plannedValue
                          : null;
                        const sourceValue =
                          term.sourceType === "METRIC"
                            ? expressionTermInputs[quarterNumber]?.[termId] ?? ""
                            : term.sourceType === "CONSTANT"
                              ? term.constantValueExact
                              : resolvedPlanValue;
                        const contribution = expressionTermContribution(
                          term,
                          sourceValue,
                        );

                        return (
                          <tr key={termId} className="align-top">
                            <td className="px-3 py-3">
                              <div className="font-medium">
                                {term.side} {term.position}. {termSourceLabel(term)}
                              </div>
                              <div className="mt-1 text-[11px] text-muted-foreground">
                                {term.operator === "SUBTRACT" ? "Subtract" : "Add"} · {term.sourceType === "METRIC"
                                  ? "metric input"
                                  : term.sourceType === "KPI"
                                    ? "linked KPI · read only"
                                    : "immutable constant"}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {term.sourceType === "METRIC" ? (
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    expressionTermInputs[quarterNumber]?.[termId] ??
                                    ""
                                  }
                                  onChange={(event) =>
                                    setExpressionTermInputs((current) => ({
                                      ...current,
                                      [quarterNumber]: {
                                        ...(current[quarterNumber] ?? {}),
                                        [termId]: event.target.value,
                                      },
                                    }))
                                  }
                                  disabled={planningLocked || saving}
                                  aria-label={`Q${quarterNumber} ${term.side.toLowerCase()} term ${term.position} ${termSourceLabel(term)}`}
                                />
                              ) : (
                                <div className="rounded-md border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                                  {sourceValue ??
                                    (term.sourceType === "KPI"
                                      ? "Resolved after linked target save"
                                      : "—")}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 font-mono text-xs">
                              {term.factorExact}
                            </td>
                            <td className="px-3 py-3 font-mono text-xs">
                              {formatFraction(contribution)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-2 border-t bg-slate-50/70 p-3 sm:grid-cols-2">
                  <div className="rounded-md border bg-white p-2">
                    <div className="text-[11px] text-muted-foreground">
                      {approvedFormula.calculationType === "SCALAR_FORMULA"
                        ? "Calculated scalar expression"
                        : "Calculated numerator"}
                    </div>
                    <div className="mt-1 break-all font-mono text-xs">
                      {plan?.numeratorPlannedValue ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-md border bg-white p-2">
                    <div className="text-[11px] text-muted-foreground">
                      {approvedFormula.calculationType === "SCALAR_FORMULA"
                        ? "Denominator"
                        : "Calculated denominator"}
                    </div>
                    <div className="mt-1 break-all font-mono text-xs">
                      {approvedFormula.calculationType === "SCALAR_FORMULA"
                        ? "Not applicable"
                        : plan?.denominatorPlannedValue ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-md border bg-white p-2">
                    <div className="text-[11px] text-muted-foreground">
                      Calculated target
                    </div>
                    <div className="mt-1 font-mono text-xs">
                      {plan?.calculatedTargetDecimal ?? "—"}
                    </div>
                    {plan?.calculatedTargetExact && (
                      <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                        {plan.calculatedTargetExact}
                      </div>
                    )}
                  </div>
                  <div className="rounded-md border bg-white p-2">
                    <div className="text-[11px] text-muted-foreground">
                      {usesAnnualComponentRollup
                        ? "Quarter target (reference only)"
                        : "Configured target"}
                    </div>
                    <div className="mt-1 font-mono text-xs">
                      {configuredTarget == null ? "—" : String(configuredTarget)}
                    </div>
                  </div>
                </div>

                {plan?.validationMessage && (
                  <p
                    className={`border-t px-3 py-2 text-xs ${
                      plan.reconciliationStatus === "INVALID"
                        ? "text-red-600"
                        : "text-amber-700"
                    }`}
                  >
                    {plan.validationMessage}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 border-separate border-spacing-y-2 text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-2">Quarter</th>
                <th className="px-2">
                  {approvedFormula.calculationType === "SCALAR_FORMULA"
                    ? "Scalar metric side total"
                    : numeratorSource?.label}
                </th>
                <th className="px-2">
                  {approvedFormula.calculationType === "SCALAR_FORMULA"
                    ? "No denominator"
                    : denominatorSource?.label}
                </th>
                <th className="px-2">Calculated target</th>
                <th className="px-2">
                  {usesAnnualComponentRollup
                    ? "Quarter target (reference only)"
                    : "Configured target"}
                </th>
                <th className="px-2">Reconciliation</th>
              </tr>
            </thead>
            <tbody>
              {QUARTERS.map((quarterNumber) => {
                const plan = plansByQuarter.get(quarterNumber);
                const quarterPlan = quarterPlanFor(quarterNumber);
                const individuallyLocked =
                  plan?.reconciliationStatus === "LOCKED" ||
                  isLockedStatus(quarterPlan?.status);
                const configuredTarget =
                  quarterPlan?.originalTarget ??
                  kpi.targets?.find((target) =>
                    target.timeline.toUpperCase().endsWith(`-Q${quarterNumber}`),
                  )?.target;

                return (
                  <tr key={quarterNumber} className="bg-white align-top shadow-sm">
                    <td className="rounded-l-md px-2 py-3 font-medium">
                      Q{quarterNumber}
                    </td>
                    <td className="px-2 py-2">
                      {numeratorHasMetric ? (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={inputs[quarterNumber].numerator}
                          onChange={(event) =>
                            setInputs((current) => ({
                              ...current,
                              [quarterNumber]: {
                                ...current[quarterNumber],
                                numerator: event.target.value,
                              },
                            }))
                          }
                          disabled={planningLocked || saving}
                          aria-label={`Q${quarterNumber} ${numeratorSource?.label}`}
                        />
                      ) : (
                        <div className="rounded-md border bg-slate-50 px-3 py-2 text-slate-700">
                          {approvedFormula.calculationType === "SCALAR_FORMULA" &&
                          numeratorTerms[0]?.sourceType === "CONSTANT"
                            ? `Constant ${numeratorTerms[0].constantValueExact}`
                            : plan?.numeratorPlannedValue ?? "Resolved after target save"}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {denominatorHasMetric ? (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={inputs[quarterNumber].denominator}
                          onChange={(event) =>
                            setInputs((current) => ({
                              ...current,
                              [quarterNumber]: {
                                ...current[quarterNumber],
                                denominator: event.target.value,
                              },
                            }))
                          }
                          disabled={planningLocked || saving}
                          aria-label={`Q${quarterNumber} ${denominatorSource?.label}`}
                        />
                      ) : (
                        <div className="rounded-md border bg-slate-50 px-3 py-2 text-slate-700">
                          {approvedFormula.calculationType === "SCALAR_FORMULA"
                            ? "Not applicable"
                            : plan?.denominatorPlannedValue ??
                              "Resolved after target save"}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 font-mono text-xs">
                      {plan?.calculatedTargetDecimal ?? "—"}
                      {plan?.calculatedTargetExact && (
                        <div className="mt-1 max-w-52 break-all text-[10px] text-muted-foreground">
                          {plan.calculatedTargetExact}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 font-mono text-xs">
                      {configuredTarget == null ? "—" : String(configuredTarget)}
                    </td>
                    <td className="rounded-r-md px-2 py-3">
                      <Badge
                        variant="outline"
                        className={statusStyle(plan?.reconciliationStatus)}
                      >
                        {plan?.reconciliationStatus ?? "PENDING INPUT"}
                      </Badge>
                      {plan?.validationMessage && (
                        <p className="mt-1 max-w-64 text-xs text-red-600">
                          {plan.validationMessage}
                        </p>
                      )}
                      {(planningLocked || individuallyLocked) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <LockKeyhole className="h-3 w-3" /> Locked
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100 pt-3">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {usesAnnualComponentRollup
            ? "Quarter rates may vary. The annual target is calculated from summed raw numerator and denominator components."
            : approvedFormula.temporalRollupMethod === "AVERAGE"
              ? "Quarter rates may vary. Their arithmetic average must match the cascaded annual target."
              : approvedFormula.temporalRollupMethod === "SUM"
                ? "Quarter percentage-point contributions may vary. Their sum must match the cascaded annual target."
                : "Submission is allowed only when all four quarters reconcile as VALID."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={planningLocked || saving}
          onClick={async () => {
            try {
              await save();
              toast.success(
                isWeighted
                  ? "Weighted component inputs saved and reconciled"
                  : "Formula inputs saved and reconciled",
              );
            } catch (saveError) {
              toast.error(
                saveError instanceof Error
                  ? saveError.message
                  : "Failed to save formula inputs",
              );
            }
          }}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isWeighted ? "Save component inputs" : "Save formula inputs"}
        </Button>
      </div>
    </div>
  );
});
