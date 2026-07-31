import { gql } from "@apollo/client";
import { KPI_FORMULA_QUARTER_PLAN_FIELDS } from "@/lib/graphql/queries/kpi-formula-planning";

export const SET_KPI_FORMULA_QUARTER_METRIC_INPUTS = gql`
  ${KPI_FORMULA_QUARTER_PLAN_FIELDS}
  mutation SetKpiFormulaQuarterMetricInputs(
    $input: SetKpiFormulaQuarterMetricInputsInput!
  ) {
    setKpiFormulaQuarterMetricInputs(input: $input) {
      ...KpiFormulaQuarterPlanFields
    }
  }
`;

export const SET_KPI_FORMULA_QUARTER_COMPONENT_INPUTS = gql`
  ${KPI_FORMULA_QUARTER_PLAN_FIELDS}
  mutation SetKpiFormulaQuarterComponentInputs(
    $input: SetKpiFormulaQuarterComponentInputsInput!
  ) {
    setKpiFormulaQuarterComponentInputs(input: $input) {
      ...KpiFormulaQuarterPlanFields
    }
  }
`;
