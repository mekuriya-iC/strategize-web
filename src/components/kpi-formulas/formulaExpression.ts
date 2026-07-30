export type KpiFormulaExpressionSide =
  | "NUMERATOR"
  | "DENOMINATOR"
  | "SCALAR";
export type KpiFormulaTermOperator = "ADD" | "SUBTRACT";
export type ExpressionSourceType = "METRIC" | "KPI" | "CONSTANT";

export interface FormulaMetricReference {
  id: string;
  code?: string | null;
  name: string;
}

export interface FormulaKpiReference {
  kpiId: string;
  name: string;
}

export interface FormulaExpressionTermLike {
  id?: string;
  key?: string;
  position: number;
  side: KpiFormulaExpressionSide;
  operator: KpiFormulaTermOperator;
  sourceType: ExpressionSourceType;
  metricDefinitionId?: string | null;
  metricDefinition?: FormulaMetricReference | null;
  sourceKpiId?: string | null;
  sourceKpi?: FormulaKpiReference | null;
  constantValueExact?: string | null;
  factorExact: string;
}

export interface FormulaTermDraft extends FormulaExpressionTermLike {
  key: string;
}

export interface FormulaTermInput {
  position: number;
  operator: KpiFormulaTermOperator;
  sourceType: ExpressionSourceType;
  metricDefinitionId?: string;
  sourceKpiId?: string;
  constantValueExact?: string;
  factorExact: string;
}

export interface LegacyFormulaLike {
  calculationType: string;
  expressionTerms?: FormulaExpressionTermLike[] | null;
  numeratorSourceType?: ExpressionSourceType | null;
  numeratorMetricDefinitionId?: string | null;
  numeratorMetricDefinition?: FormulaMetricReference | null;
  numeratorKpiId?: string | null;
  numeratorKpi?: FormulaKpiReference | null;
  denominatorSourceType?: ExpressionSourceType | null;
  denominatorMetricDefinitionId?: string | null;
  denominatorMetricDefinition?: FormulaMetricReference | null;
  denominatorKpiId?: string | null;
  denominatorKpi?: FormulaKpiReference | null;
  multiplier?: number | string | null;
  components?: Array<{
    sourceType: string;
    sourceKpiId?: string | null;
    sourceKpi?: FormulaKpiReference | null;
  }> | null;
}

const EXACT_VALUE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[1-9]\d*)?$/;

export function isExactValue(value?: string | null): boolean {
  const trimmed = value?.trim();
  if (!trimmed || !EXACT_VALUE.test(trimmed)) return false;
  if (!trimmed.includes("/")) return true;
  const [numerator] = trimmed.split("/");
  return !numerator.includes(".");
}

export function isPositiveExactValue(value?: string | null): boolean {
  if (!isExactValue(value)) return false;
  const trimmed = value!.trim().replace(/^\+/, "");
  const numerator = trimmed.split("/")[0];
  return !numerator.startsWith("-") && !/^0(?:\.0*)?$/.test(numerator);
}

export function exactValueIsOne(value?: string | null): boolean {
  const trimmed = value?.trim().replace(/^\+/, "");
  if (!trimmed) return false;
  if (trimmed === "1" || /^1\.0*$/.test(trimmed)) return true;
  const fraction = /^(\d+)\/(\d+)$/.exec(trimmed);
  return Boolean(fraction && BigInt(fraction[1]) === BigInt(fraction[2]));
}

export function createFormulaTerm(
  side: KpiFormulaExpressionSide,
  key = `formula-term-${Date.now()}-${Math.random().toString(36).slice(2)}`,
): FormulaTermDraft {
  return {
    key,
    position: 1,
    side,
    operator: "ADD",
    sourceType: "METRIC",
    metricDefinitionId: "",
    factorExact: "1",
  };
}

export function normalizeTermPositions<T extends FormulaExpressionTermLike>(
  terms: T[],
  side?: KpiFormulaExpressionSide,
): T[] {
  return terms.map((term, index) => ({
    ...term,
    position: index + 1,
    ...(side ? { side } : {}),
  }));
}

export function validateFormulaTerm(
  term: FormulaExpressionTermLike,
  targetKpiId?: string,
): string | null {
  if (!isPositiveExactValue(term.factorExact)) {
    return "Factor must be a positive exact decimal or fraction (for example 1/3).";
  }

  const hasMetric = Boolean(term.metricDefinitionId);
  const hasKpi = Boolean(term.sourceKpiId);
  const hasConstant = Boolean(term.constantValueExact?.trim());

  if (term.sourceType === "METRIC") {
    if (!hasMetric) return "Select a metric source.";
    if (hasKpi || hasConstant) return "Metric terms may only set metricDefinitionId.";
  } else if (term.sourceType === "KPI") {
    if (!hasKpi) return "Select a KPI source.";
    if (hasMetric || hasConstant) return "KPI terms may only set sourceKpiId.";
    if (term.sourceKpiId === targetKpiId) {
      return "A formula cannot use its target KPI as a source.";
    }
  } else {
    if (!hasConstant || !isExactValue(term.constantValueExact)) {
      return "Constant must be an exact decimal or fraction (for example 1/3).";
    }
    if (hasMetric || hasKpi) {
      return "Constant terms may only set constantValueExact.";
    }
  }

  return null;
}

export function formulaTermToInput(term: FormulaExpressionTermLike): FormulaTermInput {
  const base = {
    position: term.position,
    operator: term.operator,
    sourceType: term.sourceType,
    factorExact: term.factorExact.trim(),
  };
  if (term.sourceType === "METRIC") {
    return { ...base, metricDefinitionId: term.metricDefinitionId! };
  }
  if (term.sourceType === "KPI") {
    return { ...base, sourceKpiId: term.sourceKpiId! };
  }
  return { ...base, constantValueExact: term.constantValueExact!.trim() };
}

export function termSourceLabel(term: FormulaExpressionTermLike): string {
  if (term.sourceType === "METRIC") {
    return term.metricDefinition?.name ?? term.metricDefinitionId ?? "Metric";
  }
  if (term.sourceType === "KPI") {
    return term.sourceKpi?.name ?? term.sourceKpiId ?? "KPI";
  }
  return term.constantValueExact?.trim() || "Constant";
}

export function renderCanonicalTerms(
  terms: FormulaExpressionTermLike[],
): string {
  const ordered = [...terms].sort((left, right) => left.position - right.position);
  if (ordered.length === 0) return "—";

  return ordered
    .map((term, index) => {
      const operator =
        term.operator === "SUBTRACT" ? (index === 0 ? "−" : " − ") : index === 0 ? "" : " + ";
      const source = termSourceLabel(term);
      const factor = exactValueIsOne(term.factorExact)
        ? ""
        : ` × ${term.factorExact.trim() || "?"}`;
      return `${operator}${source}${factor}`;
    })
    .join("");
}

function legacyTerm(
  formula: LegacyFormulaLike,
  side: "NUMERATOR" | "DENOMINATOR",
): FormulaExpressionTermLike | null {
  const prefix = side === "NUMERATOR" ? "numerator" : "denominator";
  const sourceType = formula[`${prefix}SourceType`];
  if (sourceType === "METRIC" && formula[`${prefix}MetricDefinitionId`]) {
    return {
      position: 1,
      side,
      operator: "ADD",
      sourceType,
      metricDefinitionId: formula[`${prefix}MetricDefinitionId`],
      metricDefinition: formula[`${prefix}MetricDefinition`],
      factorExact: "1",
    };
  }
  if (sourceType === "KPI" && formula[`${prefix}KpiId`]) {
    return {
      position: 1,
      side,
      operator: "ADD",
      sourceType,
      sourceKpiId: formula[`${prefix}KpiId`],
      sourceKpi: formula[`${prefix}Kpi`],
      factorExact: "1",
    };
  }
  return null;
}

export function normalizedExpressionTerms(
  formula?: LegacyFormulaLike | null,
): FormulaExpressionTermLike[] {
  if (!formula) return [];
  if (formula.expressionTerms?.length) {
    return [...formula.expressionTerms].sort((left, right) => {
      const sideOrder = { NUMERATOR: 0, DENOMINATOR: 1, SCALAR: 2 };
      return sideOrder[left.side] - sideOrder[right.side] || left.position - right.position;
    });
  }
  if (formula.calculationType !== "RATIO_FORMULA") return [];
  return [legacyTerm(formula, "NUMERATOR"), legacyTerm(formula, "DENOMINATOR")].filter(
    (term): term is FormulaExpressionTermLike => Boolean(term),
  );
}

export function renderCanonicalFormula(formula?: LegacyFormulaLike | null): string {
  if (!formula) return "—";
  const terms = normalizedExpressionTerms(formula);
  if (formula.calculationType === "SCALAR_FORMULA") {
    return renderCanonicalTerms(terms.filter((term) => term.side === "SCALAR"));
  }
  if (formula.calculationType === "RATIO_FORMULA") {
    const numerator = renderCanonicalTerms(
      terms.filter((term) => term.side === "NUMERATOR"),
    );
    const denominator = renderCanonicalTerms(
      terms.filter((term) => term.side === "DENOMINATOR"),
    );
    const multiplier = String(formula.multiplier ?? 1);
    return `(${numerator}) ÷ (${denominator}) × ${multiplier}`;
  }
  return "Weighted index";
}

export function getFormulaKpiDependencies(
  formula?: LegacyFormulaLike | null,
): FormulaKpiReference[] {
  const unique = new Map<string, FormulaKpiReference>();
  for (const term of normalizedExpressionTerms(formula)) {
    if (term.sourceType === "KPI" && term.sourceKpiId) {
      unique.set(term.sourceKpiId, {
        kpiId: term.sourceKpiId,
        name: term.sourceKpi?.name ?? term.sourceKpiId,
      });
    }
  }
  for (const component of formula?.components ?? []) {
    if (component.sourceType === "KPI" && component.sourceKpiId) {
      unique.set(component.sourceKpiId, {
        kpiId: component.sourceKpiId,
        name: component.sourceKpi?.name ?? component.sourceKpiId,
      });
    }
  }
  return [...unique.values()];
}
