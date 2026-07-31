import type { FormulaExpressionTermLike } from "./formulaExpression";

export type ExpressionTermInputsByQuarter = Record<
  number,
  Record<string, string>
>;

export interface FormulaQuarterExpressionTermMetricInput {
  quarterNumber: number;
  expressionTerms: Array<{
    formulaExpressionTermId: string;
    plannedValue: string | null;
  }>;
}

export function buildExpressionTermMetricInputs(
  quarterNumbers: readonly number[],
  terms: FormulaExpressionTermLike[],
  inputs: ExpressionTermInputsByQuarter,
): FormulaQuarterExpressionTermMetricInput[] {
  const metricTerms = terms.filter((term) => term.sourceType === "METRIC");
  for (const term of metricTerms) {
    if (!term.id) {
      throw new Error(
        `Formula ${term.side.toLowerCase()} term ${term.position} has no persisted identifier.`,
      );
    }
  }

  return quarterNumbers.map((quarterNumber) => ({
    quarterNumber,
    expressionTerms: metricTerms.map((term) => ({
      formulaExpressionTermId: term.id!,
      plannedValue: inputs[quarterNumber]?.[term.id!]?.trim() || null,
    })),
  }));
}
