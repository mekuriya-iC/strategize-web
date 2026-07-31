import { gql } from "@apollo/client";

const KPI_FORMULA_METRIC_FIELDS = gql`
  fragment KpiFormulaMetricFields on MetricDefinition {
    id
    organizationId
    code
    name
    description
    unitType
    measurementUnit
    temporalRollupMethod
    isActive
    createdAt
    updatedAt
  }
`;

const KPI_FORMULA_KPI_FIELDS = gql`
  fragment KpiFormulaKpiFields on Kpi {
    kpiId
    name
    description
    unitType
    measurementUnit
    zeroDenominatorPolicy
    assigneeType
    assigneeId
    isActive
    objective {
      type
      assigneeType
      assigneeId
    }
  }
`;

const PAGINATION_META_FIELDS = gql`
  fragment KpiFormulaPaginationMetaFields on PaginationMeta {
    currentPage
    totalPages
    totalItems
    itemsPerPage
    itemCount
  }
`;

export const GET_METRIC_DEFINITIONS = gql`
  ${KPI_FORMULA_METRIC_FIELDS}
  ${PAGINATION_META_FIELDS}
  query GetMetricDefinitions(
    $organizationId: ID!
    $page: Int!
    $limit: Int!
    $activeOnly: Boolean
  ) {
    metricDefinitions(
      organizationId: $organizationId
      page: $page
      limit: $limit
      activeOnly: $activeOnly
    ) {
      items {
        ...KpiFormulaMetricFields
      }
      meta {
        ...KpiFormulaPaginationMetaFields
      }
    }
  }
`;

export const GET_KPI_FORMULA_DEFINITIONS = gql`
  ${KPI_FORMULA_METRIC_FIELDS}
  ${KPI_FORMULA_KPI_FIELDS}
  ${PAGINATION_META_FIELDS}
  query GetKpiFormulaDefinitions(
    $organizationId: ID!
    $page: Int!
    $limit: Int!
    $kpiId: ID
  ) {
    kpiFormulaDefinitions(
      organizationId: $organizationId
      page: $page
      limit: $limit
      kpiId: $kpiId
    ) {
      items {
        id
        organizationId
        kpiId
        kpi {
          ...KpiFormulaKpiFields
        }
        calculationType
        expressionTerms {
          id
          position
          side
          operator
          sourceType
          metricDefinitionId
          metricDefinition {
            ...KpiFormulaMetricFields
          }
          sourceKpiId
          sourceKpi {
            ...KpiFormulaKpiFields
          }
          constantValueExact
          factorExact
        }
        components {
          id
          organizationId
          formulaDefinitionId
          position
          sourceType
          metricDefinitionId
          metricDefinition {
            ...KpiFormulaMetricFields
          }
          sourceKpiId
          sourceKpi {
            ...KpiFormulaKpiFields
          }
          weight
          createdAt
        }
        numeratorSourceType
        numeratorMetricDefinitionId
        numeratorMetricDefinition {
          ...KpiFormulaMetricFields
        }
        numeratorKpiId
        numeratorKpi {
          ...KpiFormulaKpiFields
        }
        denominatorSourceType
        denominatorMetricDefinitionId
        denominatorMetricDefinition {
          ...KpiFormulaMetricFields
        }
        denominatorKpiId
        denominatorKpi {
          ...KpiFormulaKpiFields
        }
        multiplier
        temporalRollupMethod
        zeroDenominatorPolicy
        resultDirection
        targetRangeMin
        targetRangeMax
        targetRangeOutsidePolicy
        status
        version
        effectiveFrom
        effectiveTo
        createdById
        approvedById
        approvedAt
        createdAt
        updatedAt
      }
      meta {
        ...KpiFormulaPaginationMetaFields
      }
    }
  }
`;

export const GET_ORGANIZATION_KPI_FORMULA_TEMPLATES = gql`
  ${KPI_FORMULA_METRIC_FIELDS}
  ${PAGINATION_META_FIELDS}
  query GetOrganizationKpiFormulaTemplates(
    $organizationId: ID!
    $page: Int!
    $limit: Int!
    $activeOnly: Boolean
  ) {
    organizationKpiFormulaTemplates(
      organizationId: $organizationId
      page: $page
      limit: $limit
      activeOnly: $activeOnly
    ) {
      items {
        id
        organizationId
        name
        description
        calculationType
        temporalRollupMethod
        zeroDenominatorPolicy
        resultDirection
        targetRangeMin
        targetRangeMax
        targetRangeOutsidePolicy
        numeratorMetricDefinitionId
        numeratorMetricDefinition {
          ...KpiFormulaMetricFields
        }
        denominatorMetricDefinitionId
        denominatorMetricDefinition {
          ...KpiFormulaMetricFields
        }
        multiplier
        isActive
        createdById
        createdAt
        updatedAt
      }
      meta {
        ...KpiFormulaPaginationMetaFields
      }
    }
  }
`;
