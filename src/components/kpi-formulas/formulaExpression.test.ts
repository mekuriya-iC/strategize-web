import { describe, expect, it } from "vitest";
import {
  getFormulaKpiDependencies,
  isExactValue,
  renderCanonicalFormula,
  renderCanonicalTerms,
  validateFormulaTerm,
  type FormulaExpressionTermLike,
} from "./formulaExpression";

const scalarThird: FormulaExpressionTermLike = {
  position: 1,
  side: "SCALAR",
  operator: "ADD",
  sourceType: "METRIC",
  metricDefinitionId: "m-score",
  metricDefinition: { id: "m-score", name: "Score" },
  factorExact: "1/3",
};

describe("formula expression model", () => {
  it("accepts exact decimals and integer fractions without coercing them", () => {
    expect(isExactValue("1/3")).toBe(true);
    expect(isExactValue("-12.500")).toBe(true);
    expect(isExactValue("1.5/3")).toBe(false);
    expect(isExactValue("1/0")).toBe(false);
  });

  it("renders a scalar factor of 1/3 canonically", () => {
    expect(renderCanonicalTerms([scalarThird])).toBe("Score × 1/3");
    expect(
      renderCanonicalFormula({
        calculationType: "SCALAR_FORMULA",
        expressionTerms: [scalarThird],
      }),
    ).toBe("Score × 1/3");
  });

  it("normalizes ordered add/subtract terms and preserves exact constants", () => {
    const terms: FormulaExpressionTermLike[] = [
      {
        position: 2,
        side: "NUMERATOR",
        operator: "SUBTRACT",
        sourceType: "CONSTANT",
        constantValueExact: "1/3",
        factorExact: "2",
      },
      {
        position: 1,
        side: "NUMERATOR",
        operator: "ADD",
        sourceType: "KPI",
        sourceKpiId: "k-source",
        sourceKpi: { kpiId: "k-source", name: "Approved sales" },
        factorExact: "1",
      },
    ];

    expect(renderCanonicalTerms(terms)).toBe(
      "Approved sales − 1/3 × 2",
    );
  });

  it("renders legacy simple ratios when expressionTerms are absent", () => {
    expect(
      renderCanonicalFormula({
        calculationType: "RATIO_FORMULA",
        numeratorSourceType: "METRIC",
        numeratorMetricDefinitionId: "m-1",
        numeratorMetricDefinition: { id: "m-1", name: "Completed" },
        denominatorSourceType: "KPI",
        denominatorKpiId: "k-2",
        denominatorKpi: { kpiId: "k-2", name: "Planned" },
        multiplier: 100,
      }),
    ).toBe("(Completed) ÷ (Planned) × 100");
  });

  it("rejects target self-sources and invalid one-of source fields", () => {
    expect(
      validateFormulaTerm(
        {
          ...scalarThird,
          sourceType: "KPI",
          metricDefinitionId: undefined,
          sourceKpiId: "target",
        },
        "target",
      ),
    ).toMatch(/target KPI/);
    expect(
      validateFormulaTerm({
        ...scalarThird,
        sourceKpiId: "also-set",
      }),
    ).toMatch(/only set metricDefinitionId/);
  });

  it("deduplicates KPI cascade dependencies", () => {
    expect(
      getFormulaKpiDependencies({
        calculationType: "RATIO_FORMULA",
        expressionTerms: [
          {
            ...scalarThird,
            side: "NUMERATOR",
            sourceType: "KPI",
            metricDefinitionId: undefined,
            sourceKpiId: "k-1",
            sourceKpi: { kpiId: "k-1", name: "Source KPI" },
          },
          {
            ...scalarThird,
            position: 2,
            side: "DENOMINATOR",
            sourceType: "KPI",
            metricDefinitionId: undefined,
            sourceKpiId: "k-1",
            sourceKpi: { kpiId: "k-1", name: "Source KPI" },
          },
        ],
      }),
    ).toEqual([{ kpiId: "k-1", name: "Source KPI" }]);
  });
});
