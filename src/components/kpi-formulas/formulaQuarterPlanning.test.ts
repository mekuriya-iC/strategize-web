import { describe, expect, it } from "vitest";
import type { FormulaQuarterMetricInput } from "@/hooks/kpi-formulas/useKpiFormulaQuarterPlanning";
import type { FormulaExpressionTermLike } from "./formulaExpression";
import { buildExpressionTermMetricInputs } from "./formulaQuarterPlanning";

function term(
  overrides: Partial<FormulaExpressionTermLike> &
    Pick<FormulaExpressionTermLike, "id" | "side" | "position">,
): FormulaExpressionTermLike {
  return {
    operator: "ADD",
    sourceType: "METRIC",
    metricDefinitionId: `metric-${overrides.id}`,
    factorExact: "1",
    ...overrides,
  };
}

describe("formula quarter term planning", () => {
  it("submits every gross-margin metric occurrence independently", () => {
    const terms = [
      term({ id: "revenue-numerator", side: "NUMERATOR", position: 1 }),
      term({
        id: "delivery-cost",
        side: "NUMERATOR",
        position: 2,
        operator: "SUBTRACT",
      }),
      term({ id: "revenue-denominator", side: "DENOMINATOR", position: 1 }),
    ];

    const result: FormulaQuarterMetricInput[] = buildExpressionTermMetricInputs(
      [1],
      terms,
      {
        1: {
          "revenue-numerator": "283795000",
          "delivery-cost": "70296500",
          "revenue-denominator": "283795000",
        },
      },
    );

    expect(result).toEqual([
      {
        quarterNumber: 1,
        expressionTerms: [
          {
            formulaExpressionTermId: "revenue-numerator",
            plannedValue: "283795000",
          },
          {
            formulaExpressionTermId: "delivery-cost",
            plannedValue: "70296500",
          },
          {
            formulaExpressionTermId: "revenue-denominator",
            plannedValue: "283795000",
          },
        ],
      },
    ]);
  });

  it("submits the scalar source term with its exact unscaled value", () => {
    const terms = [
      term({
        id: "qualified-pipeline",
        side: "SCALAR",
        position: 1,
        factorExact: "1/3",
      }),
    ];

    expect(
      buildExpressionTermMetricInputs([1], terms, {
        1: { "qualified-pipeline": "733425000" },
      }),
    ).toEqual([
      {
        quarterNumber: 1,
        expressionTerms: [
          {
            formulaExpressionTermId: "qualified-pipeline",
            plannedValue: "733425000",
          },
        ],
      },
    ]);
  });

  it("does not submit linked KPI or constant terms as editable inputs", () => {
    const terms = [
      term({ id: "revenue", side: "NUMERATOR", position: 1 }),
      term({
        id: "linked-cost",
        side: "NUMERATOR",
        position: 2,
        sourceType: "KPI",
        metricDefinitionId: null,
        sourceKpiId: "cost-kpi",
      }),
      term({
        id: "adjustment",
        side: "NUMERATOR",
        position: 3,
        sourceType: "CONSTANT",
        metricDefinitionId: null,
        constantValueExact: "1/3",
      }),
    ];

    const [result] = buildExpressionTermMetricInputs([1], terms, {
      1: {
        revenue: "100",
        "linked-cost": "25",
        adjustment: "0.333333333333333333",
      },
    });

    expect(result.expressionTerms).toEqual([
      { formulaExpressionTermId: "revenue", plannedValue: "100" },
    ]);
  });
});
