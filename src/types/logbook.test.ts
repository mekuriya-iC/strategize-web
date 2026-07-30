import { describe, expect, it } from "vitest";
import {
  getOrderedLogbookFormulaSources,
  type LogbookFormulaDefinition,
} from "./logbook";

function formula(
  overrides: Partial<LogbookFormulaDefinition>,
): LogbookFormulaDefinition {
  return {
    id: "formula-1",
    organizationId: "org-1",
    kpiId: "target-kpi",
    calculationType: "RATIO_FORMULA",
    components: [],
    multiplier: 100,
    temporalRollupMethod: "SUM_COMPONENTS_THEN_DIVIDE",
    zeroDenominatorPolicy: "NOT_CALCULABLE",
    resultDirection: "HIGHER_IS_BETTER",
    status: "APPROVED",
    version: 1,
    createdById: "user-1",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

describe("getOrderedLogbookFormulaSources", () => {
  it("requires one observation per unique metric and preserves KPI/constant semantics", () => {
    const sources = getOrderedLogbookFormulaSources(
      formula({
        expressionTerms: [
          {
            id: "term-1",
            position: 1,
            side: "NUMERATOR",
            operator: "ADD",
            sourceType: "METRIC",
            metricDefinitionId: "metric-1",
            metricDefinition: { id: "metric-1", code: "M1", name: "Metric one" },
            factorExact: "1",
          },
          {
            id: "term-2",
            position: 2,
            side: "NUMERATOR",
            operator: "ADD",
            sourceType: "METRIC",
            metricDefinitionId: "metric-1",
            metricDefinition: { id: "metric-1", code: "M1", name: "Metric one" },
            factorExact: "1/3",
          },
          {
            id: "term-3",
            position: 1,
            side: "DENOMINATOR",
            operator: "ADD",
            sourceType: "KPI",
            sourceKpiId: "source-kpi",
            sourceKpi: { kpiId: "source-kpi", name: "Source KPI" },
            factorExact: "1",
          },
          {
            id: "term-4",
            position: 2,
            side: "DENOMINATOR",
            operator: "SUBTRACT",
            sourceType: "CONSTANT",
            constantValueExact: "1/3",
            factorExact: "2",
          },
        ],
      }),
    );

    expect(sources.map((source) => source.sourceType)).toEqual([
      "METRIC",
      "KPI",
      "CONSTANT",
    ]);
    expect(sources[0]).toMatchObject({
      metricDefinitionId: "metric-1",
      label: "Numerator term 1",
    });
    expect(sources[1]).toMatchObject({
      sourceKpiId: "source-kpi",
      factorExact: "1",
    });
    expect(sources[2]).toMatchObject({
      constantValueExact: "1/3",
      operator: "SUBTRACT",
      factorExact: "2",
    });
  });

  it("continues to extract legacy simple-ratio sources", () => {
    const sources = getOrderedLogbookFormulaSources(
      formula({
        numeratorSourceType: "METRIC",
        numeratorMetricDefinitionId: "metric-numerator",
        denominatorSourceType: "KPI",
        denominatorKpiId: "kpi-denominator",
      }),
    );

    expect(sources).toHaveLength(2);
    expect(sources[0]).toMatchObject({ sourceType: "METRIC" });
    expect(sources[1]).toMatchObject({ sourceType: "KPI" });
  });
});
