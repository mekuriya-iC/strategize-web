import { gql } from "@apollo/client";

const METRIC_DEFINITION_MUTATION_FIELDS = gql`
  fragment MetricDefinitionMutationFields on MetricDefinition {
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

const KPI_FORMULA_DEFINITION_MUTATION_FIELDS = gql`
  fragment KpiFormulaDefinitionMutationFields on KpiFormulaDefinition {
    id
    organizationId
    kpiId
    calculationType
    components {
      id
      organizationId
      formulaDefinitionId
      position
      sourceType
      metricDefinitionId
      metricDefinition {
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
      sourceKpiId
      sourceKpi {
        kpiId
        name
        description
        unitType
        measurementUnit
        isActive
      }
      weight
      createdAt
    }
    numeratorSourceType
    numeratorMetricDefinitionId
    numeratorKpiId
    denominatorSourceType
    denominatorMetricDefinitionId
    denominatorKpiId
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
`;

const KPI_FORMULA_TEMPLATE_MUTATION_FIELDS = gql`
  fragment KpiFormulaTemplateMutationFields on OrganizationKpiFormulaTemplate {
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
    denominatorMetricDefinitionId
    multiplier
    isActive
    createdById
    createdAt
    updatedAt
  }
`;

export const CREATE_METRIC_DEFINITION = gql`
  ${METRIC_DEFINITION_MUTATION_FIELDS}
  mutation CreateMetricDefinition($input: CreateMetricDefinitionInput!) {
    createMetricDefinition(input: $input) {
      ...MetricDefinitionMutationFields
    }
  }
`;

export const UPDATE_METRIC_DEFINITION = gql`
  ${METRIC_DEFINITION_MUTATION_FIELDS}
  mutation UpdateMetricDefinition($input: UpdateMetricDefinitionInput!) {
    updateMetricDefinition(input: $input) {
      ...MetricDefinitionMutationFields
    }
  }
`;

export const REMOVE_METRIC_DEFINITION = gql`
  ${METRIC_DEFINITION_MUTATION_FIELDS}
  mutation RemoveMetricDefinition($id: ID!, $organizationId: ID!) {
    removeMetricDefinition(id: $id, organizationId: $organizationId) {
      ...MetricDefinitionMutationFields
    }
  }
`;

export const CREATE_KPI_FORMULA_DEFINITION = gql`
  ${KPI_FORMULA_DEFINITION_MUTATION_FIELDS}
  mutation CreateKpiFormulaDefinition($input: CreateKpiFormulaDefinitionInput!) {
    createKpiFormulaDefinition(input: $input) {
      ...KpiFormulaDefinitionMutationFields
    }
  }
`;

export const UPDATE_KPI_FORMULA_DEFINITION = gql`
  ${KPI_FORMULA_DEFINITION_MUTATION_FIELDS}
  mutation UpdateKpiFormulaDefinition($input: UpdateKpiFormulaDefinitionInput!) {
    updateKpiFormulaDefinition(input: $input) {
      ...KpiFormulaDefinitionMutationFields
    }
  }
`;

export const APPROVE_KPI_FORMULA_DEFINITION = gql`
  ${KPI_FORMULA_DEFINITION_MUTATION_FIELDS}
  mutation ApproveKpiFormulaDefinition($input: ApproveKpiFormulaDefinitionInput!) {
    approveKpiFormulaDefinition(input: $input) {
      ...KpiFormulaDefinitionMutationFields
    }
  }
`;

export const REMOVE_KPI_FORMULA_DEFINITION = gql`
  ${KPI_FORMULA_DEFINITION_MUTATION_FIELDS}
  mutation RemoveKpiFormulaDefinition($id: ID!, $organizationId: ID!) {
    removeKpiFormulaDefinition(id: $id, organizationId: $organizationId) {
      ...KpiFormulaDefinitionMutationFields
    }
  }
`;

export const CREATE_ORGANIZATION_KPI_FORMULA_TEMPLATE = gql`
  ${KPI_FORMULA_TEMPLATE_MUTATION_FIELDS}
  mutation CreateOrganizationKpiFormulaTemplate(
    $input: CreateOrganizationKpiFormulaTemplateInput!
  ) {
    createOrganizationKpiFormulaTemplate(input: $input) {
      ...KpiFormulaTemplateMutationFields
    }
  }
`;

export const UPDATE_ORGANIZATION_KPI_FORMULA_TEMPLATE = gql`
  ${KPI_FORMULA_TEMPLATE_MUTATION_FIELDS}
  mutation UpdateOrganizationKpiFormulaTemplate(
    $input: UpdateOrganizationKpiFormulaTemplateInput!
  ) {
    updateOrganizationKpiFormulaTemplate(input: $input) {
      ...KpiFormulaTemplateMutationFields
    }
  }
`;

export const REMOVE_ORGANIZATION_KPI_FORMULA_TEMPLATE = gql`
  ${KPI_FORMULA_TEMPLATE_MUTATION_FIELDS}
  mutation RemoveOrganizationKpiFormulaTemplate($id: ID!, $organizationId: ID!) {
    removeOrganizationKpiFormulaTemplate(
      id: $id
      organizationId: $organizationId
    ) {
      ...KpiFormulaTemplateMutationFields
    }
  }
`;
