import { gql } from "@apollo/client";

export const GET_KPI_FORMULA_ANNUAL_ACTUAL = gql`
  query GetKpiFormulaAnnualActual(
    $organizationId: ID!
    $kpiId: ID!
    $annualPeriodId: ID!
  ) {
    kpiFormulaAnnualActual(
      organizationId: $organizationId
      kpiId: $kpiId
      annualPeriodId: $annualPeriodId
    ) {
      organizationId
      kpiId
      annualPeriodId
      status
      numeratorExact
      numeratorDecimal
      denominatorExact
      denominatorDecimal
      resultExact
      resultDecimal
      completedQuarterCount
      formulaDefinitionIds
      message
    }
  }
`;

export const KPI_FORMULA_QUARTER_PLAN_FIELDS = gql`
  fragment KpiFormulaQuarterPlanFields on KpiFormulaQuarterPlan {
    id
    organizationId
    kpiId
    quarterPlanId
    formulaDefinitionId
    components {
      id
      organizationId
      formulaQuarterPlanId
      formulaComponentId
      plannedValue
      formulaComponent {
        id
        position
        sourceType
        metricDefinitionId
        metricDefinition {
          id
          code
          name
        }
        sourceKpiId
        sourceKpi {
          kpiId
          name
        }
        weight
      }
    }
    expressionTermPlans {
      id
      organizationId
      formulaQuarterPlanId
      formulaExpressionTermId
      plannedValue
      formulaExpressionTerm {
        id
        position
        side
        operator
        sourceType
        metricDefinitionId
        metricDefinition {
          id
          code
          name
        }
        sourceKpiId
        sourceKpi {
          kpiId
          name
        }
        constantValueExact
        factorExact
      }
    }
    numeratorPlannedValue
    denominatorPlannedValue
    calculatedTargetDecimal
    calculatedTargetExact
    reconciliationStatus
    validationMessage
    version
    lockedAt
    quarterPlan {
      kpiQuarterPlanId
      annualStrategicPeriodId
      quarterNumber
      timeline
      originalTarget
      status
    }
  }
`;

export const GET_KPI_FORMULA_QUARTER_PLANS = gql`
  ${KPI_FORMULA_QUARTER_PLAN_FIELDS}
  query GetKpiFormulaQuarterPlans(
    $organizationId: ID!
    $kpiId: ID!
    $annualPeriodId: ID
  ) {
    kpiFormulaQuarterPlans(
      organizationId: $organizationId
      kpiId: $kpiId
      annualPeriodId: $annualPeriodId
    ) {
      ...KpiFormulaQuarterPlanFields
    }
  }
`;
