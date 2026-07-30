import { print } from "graphql";
import { describe, expect, it } from "vitest";
import { CREATE_KPI_FORMULA_DEFINITION } from "../mutations/kpi-formulas";
import { GET_KPI_FORMULA_DEFINITIONS } from "../queries/kpi-formulas";
import { GET_KPI_FORMULA_QUARTER_PLANS } from "../queries/kpi-formula-planning";
import { GET_LOGBOOK_FORMULA_FOR_CONTEXT } from "../queries/logbook";
import { GET_KPI } from "../queries/kpis";

const TERM_FIELDS = [
  "side",
  "operator",
  "sourceType",
  "metricDefinitionId",
  "sourceKpiId",
  "constantValueExact",
  "factorExact",
] as const;

describe("KPI formula GraphQL shapes", () => {
  it.each([
    ["definition query", GET_KPI_FORMULA_DEFINITIONS],
    ["definition mutation", CREATE_KPI_FORMULA_DEFINITION],
    ["logbook context", GET_LOGBOOK_FORMULA_FOR_CONTEXT],
  ])("selects expression terms in the %s", (_, document) => {
    const printed = print(document);
    expect(printed).toContain("expressionTerms {");
    for (const field of TERM_FIELDS) expect(printed).toContain(field);
    expect(printed).toContain("metricDefinition {");
    expect(printed).toContain("sourceKpi {");
  });

  it("selects KPI zero policy and quarter calculation status", () => {
    const printed = print(GET_KPI);
    expect(printed).toContain("zeroDenominatorPolicy");
    expect(printed).toContain("calculationStatus");
  });

  it("selects independently persisted quarter expression-term plans", () => {
    const printed = print(GET_KPI_FORMULA_QUARTER_PLANS);
    expect(printed).toContain("expressionTermPlans {");
    expect(printed).toContain("formulaExpressionTermId");
    expect(printed).toContain("plannedValue");
    expect(printed).toContain("formulaExpressionTerm {");
    for (const field of TERM_FIELDS) expect(printed).toContain(field);
  });
});
