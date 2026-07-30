"use client";

import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import {
  GET_KPI_FORMULA_DEFINITIONS,
  GET_METRIC_DEFINITIONS,
  GET_ORGANIZATION_KPI_FORMULA_TEMPLATES,
} from "@/lib/graphql/queries/kpi-formulas";
import type {
  FormulaTermInput,
  KpiFormulaExpressionSide,
  KpiFormulaTermOperator,
} from "@/components/kpi-formulas/formulaExpression";
import {
  APPROVE_KPI_FORMULA_DEFINITION,
  CREATE_KPI_FORMULA_DEFINITION,
  CREATE_METRIC_DEFINITION,
  CREATE_ORGANIZATION_KPI_FORMULA_TEMPLATE,
  REMOVE_KPI_FORMULA_DEFINITION,
  REMOVE_METRIC_DEFINITION,
  REMOVE_ORGANIZATION_KPI_FORMULA_TEMPLATE,
  UPDATE_KPI_FORMULA_DEFINITION,
  UPDATE_METRIC_DEFINITION,
  UPDATE_ORGANIZATION_KPI_FORMULA_TEMPLATE,
} from "@/lib/graphql/mutations/kpi-formulas";

export type KpiUnitType =
  | "NUMBER"
  | "PERCENT"
  | "CURRENCY"
  | "HOUR"
  | "RATIO"
  | "COUNT";
export type KpiMeasurementUnit =
  | "PERCENTAGE"
  | "NUMBER"
  | "CURRENCY"
  | "BOOLEAN"
  | "RATING"
  | "HOUR"
  | "CUSTOM";
export type KpiTemporalRollupMethod =
  | "SUM"
  | "AVERAGE"
  | "SUM_COMPONENTS_THEN_DIVIDE"
  | "LATEST_APPROVED"
  | "PERIOD_START_SNAPSHOT"
  | "PERIOD_END_SNAPSHOT"
  | "COHORT"
  | "WEIGHTED_INDEX";
export type KpiCalculationType =
  | "MANUAL_VALUE"
  | "RATIO_FORMULA"
  | "SCALAR_FORMULA"
  | "WEIGHTED_INDEX";
export type KpiFormulaSourceType = "METRIC" | "KPI" | "CONSTANT";
export type { KpiFormulaExpressionSide, KpiFormulaTermOperator };
export type KpiZeroDenominatorPolicy = "NOT_CALCULABLE" | "ZERO" | "BLOCK";
export type KpiResultDirection =
  | "HIGHER_IS_BETTER"
  | "LOWER_IS_BETTER"
  | "TARGET_RANGE";
export type KpiFormulaDefinitionStatus = "DRAFT" | "APPROVED" | "ARCHIVED";
export type KpiTargetRangeOutsidePolicy =
  | "ZERO_OUTSIDE"
  | "NEAREST_BOUND_RATIO";

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemCount: number;
}

export interface MetricDefinition {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
  unitType: KpiUnitType;
  measurementUnit: KpiMeasurementUnit;
  temporalRollupMethod: KpiTemporalRollupMethod;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KpiCandidate {
  kpiId: string;
  name: string;
  description?: string | null;
  unitType?: string | null;
  measurementUnit?: string | null;
  zeroDenominatorPolicy?: KpiZeroDenominatorPolicy | null;
  isActive: boolean;
}

export interface KpiFormulaComponent {
  id: string;
  organizationId: string;
  formulaDefinitionId: string;
  position: number;
  sourceType: Exclude<KpiFormulaSourceType, "CONSTANT">;
  metricDefinitionId?: string | null;
  metricDefinition?: MetricDefinition | null;
  sourceKpiId?: string | null;
  sourceKpi?: KpiCandidate | null;
  weight: string;
  createdAt: string;
}

export interface KpiFormulaExpressionTerm {
  id: string;
  organizationId: string;
  formulaDefinitionId: string;
  position: number;
  side: KpiFormulaExpressionSide;
  operator: KpiFormulaTermOperator;
  sourceType: KpiFormulaSourceType;
  metricDefinitionId?: string | null;
  metricDefinition?: MetricDefinition | null;
  sourceKpiId?: string | null;
  sourceKpi?: KpiCandidate | null;
  constantValueExact?: string | null;
  factorExact: string;
  createdAt: string;
}

export type KpiFormulaExpressionTermInput = FormulaTermInput;

export type KpiFormulaComponentInput =
  | {
      position: number;
      sourceType: "METRIC";
      metricDefinitionId: string;
      sourceKpiId?: never;
      weight: string;
    }
  | {
      position: number;
      sourceType: "KPI";
      metricDefinitionId?: never;
      sourceKpiId: string;
      weight: string;
    };

export interface KpiFormulaDefinition {
  id: string;
  organizationId: string;
  kpiId: string;
  kpi: KpiCandidate;
  calculationType: KpiCalculationType;
  components: KpiFormulaComponent[];
  expressionTerms?: KpiFormulaExpressionTerm[] | null;
  numeratorSourceType?: KpiFormulaSourceType | null;
  numeratorMetricDefinitionId?: string | null;
  numeratorMetricDefinition?: MetricDefinition | null;
  numeratorKpiId?: string | null;
  numeratorKpi?: KpiCandidate | null;
  denominatorSourceType?: KpiFormulaSourceType | null;
  denominatorMetricDefinitionId?: string | null;
  denominatorMetricDefinition?: MetricDefinition | null;
  denominatorKpiId?: string | null;
  denominatorKpi?: KpiCandidate | null;
  multiplier: number;
  temporalRollupMethod: KpiTemporalRollupMethod;
  zeroDenominatorPolicy: KpiZeroDenominatorPolicy;
  resultDirection: KpiResultDirection;
  targetRangeMin?: string | null;
  targetRangeMax?: string | null;
  targetRangeOutsidePolicy: KpiTargetRangeOutsidePolicy;
  status: KpiFormulaDefinitionStatus;
  version: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationKpiFormulaTemplate {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  calculationType: KpiCalculationType;
  temporalRollupMethod: KpiTemporalRollupMethod;
  zeroDenominatorPolicy: KpiZeroDenominatorPolicy;
  resultDirection: KpiResultDirection;
  targetRangeMin?: string | null;
  targetRangeMax?: string | null;
  targetRangeOutsidePolicy: KpiTargetRangeOutsidePolicy;
  numeratorMetricDefinitionId?: string | null;
  numeratorMetricDefinition?: MetricDefinition | null;
  denominatorMetricDefinitionId?: string | null;
  denominatorMetricDefinition?: MetricDefinition | null;
  multiplier: number;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMetricDefinitionInput {
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  unitType: KpiUnitType;
  measurementUnit: KpiMeasurementUnit;
  temporalRollupMethod: KpiTemporalRollupMethod;
  isActive?: boolean;
}

export interface UpdateMetricDefinitionInput
  extends Partial<Omit<CreateMetricDefinitionInput, "organizationId">> {
  id: string;
  organizationId: string;
}

export interface CreateOrganizationKpiFormulaTemplateInput {
  organizationId: string;
  name: string;
  description?: string;
  calculationType: KpiCalculationType;
  temporalRollupMethod: KpiTemporalRollupMethod;
  zeroDenominatorPolicy: KpiZeroDenominatorPolicy;
  resultDirection: KpiResultDirection;
  targetRangeMin?: string | null;
  targetRangeMax?: string | null;
  targetRangeOutsidePolicy?: KpiTargetRangeOutsidePolicy;
  numeratorMetricDefinitionId?: string;
  denominatorMetricDefinitionId?: string;
  multiplier?: number;
  isActive?: boolean;
}

export interface UpdateOrganizationKpiFormulaTemplateInput
  extends Partial<
    Omit<
      CreateOrganizationKpiFormulaTemplateInput,
      | "organizationId"
      | "numeratorMetricDefinitionId"
      | "denominatorMetricDefinitionId"
    >
  > {
  id: string;
  organizationId: string;
  numeratorMetricDefinitionId?: string | null;
  denominatorMetricDefinitionId?: string | null;
}

export interface CreateKpiFormulaDefinitionInput {
  organizationId: string;
  kpiId: string;
  calculationType: KpiCalculationType;
  components?: KpiFormulaComponentInput[];
  numeratorTerms?: KpiFormulaExpressionTermInput[];
  denominatorTerms?: KpiFormulaExpressionTermInput[];
  scalarTerm?: KpiFormulaExpressionTermInput;
  numeratorSourceType?: KpiFormulaSourceType;
  numeratorMetricDefinitionId?: string;
  numeratorKpiId?: string;
  denominatorSourceType?: KpiFormulaSourceType;
  denominatorMetricDefinitionId?: string;
  denominatorKpiId?: string;
  multiplier?: number;
  temporalRollupMethod: KpiTemporalRollupMethod;
  zeroDenominatorPolicy: KpiZeroDenominatorPolicy;
  resultDirection: KpiResultDirection;
  targetRangeMin?: string | null;
  targetRangeMax?: string | null;
  targetRangeOutsidePolicy?: KpiTargetRangeOutsidePolicy;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateKpiFormulaDefinitionInput
  extends Partial<
    Omit<
      CreateKpiFormulaDefinitionInput,
      | "organizationId"
      | "kpiId"
      | "numeratorSourceType"
      | "numeratorMetricDefinitionId"
      | "numeratorKpiId"
      | "denominatorSourceType"
      | "denominatorMetricDefinitionId"
      | "denominatorKpiId"
      | "effectiveFrom"
      | "effectiveTo"
    >
  > {
  id: string;
  organizationId: string;
  numeratorSourceType?: KpiFormulaSourceType | null;
  numeratorMetricDefinitionId?: string | null;
  numeratorKpiId?: string | null;
  denominatorSourceType?: KpiFormulaSourceType | null;
  denominatorMetricDefinitionId?: string | null;
  denominatorKpiId?: string | null;
  status?: KpiFormulaDefinitionStatus;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}

interface MetricDefinitionsData {
  metricDefinitions: Page<MetricDefinition>;
}

interface FormulaDefinitionsData {
  kpiFormulaDefinitions: Page<KpiFormulaDefinition>;
}

interface FormulaTemplatesData {
  organizationKpiFormulaTemplates: Page<OrganizationKpiFormulaTemplate>;
}

interface KpisData {
  kpis: Page<KpiCandidate>;
}

interface OrganizationPageVariables {
  organizationId: string;
  page: number;
  limit: number;
  activeOnly?: boolean;
}

interface FormulaPageVariables {
  organizationId: string;
  page: number;
  limit: number;
  kpiId?: string;
}

const PAGE_LIMIT = 500;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export function useKpiFormulas(organizationId?: string) {
  const queryOptions = {
    skip: !organizationId,
    fetchPolicy: "cache-and-network" as const,
    notifyOnNetworkStatusChange: true,
  };

  const metricsQuery = useQuery<MetricDefinitionsData, OrganizationPageVariables>(
    GET_METRIC_DEFINITIONS,
    {
      ...queryOptions,
      variables: {
        organizationId: organizationId ?? "",
        page: 1,
        limit: PAGE_LIMIT,
        activeOnly: false,
      },
    },
  );
  const templatesQuery = useQuery<FormulaTemplatesData, OrganizationPageVariables>(
    GET_ORGANIZATION_KPI_FORMULA_TEMPLATES,
    {
      ...queryOptions,
      variables: {
        organizationId: organizationId ?? "",
        page: 1,
        limit: PAGE_LIMIT,
        activeOnly: false,
      },
    },
  );
  const formulasQuery = useQuery<FormulaDefinitionsData, FormulaPageVariables>(
    GET_KPI_FORMULA_DEFINITIONS,
    {
      ...queryOptions,
      variables: {
        organizationId: organizationId ?? "",
        page: 1,
        limit: PAGE_LIMIT,
      },
    },
  );
  const kpisQuery = useQuery<KpisData>(GET_KPIS, {
    ...queryOptions,
    variables: {
      organizationId: organizationId ?? "",
      page: 1,
      limit: PAGE_LIMIT,
    },
  });

  const [createMetricMutation, createMetricState] = useMutation(
    CREATE_METRIC_DEFINITION,
  );
  const [updateMetricMutation, updateMetricState] = useMutation(
    UPDATE_METRIC_DEFINITION,
  );
  const [removeMetricMutation, removeMetricState] = useMutation(
    REMOVE_METRIC_DEFINITION,
  );
  const [createTemplateMutation, createTemplateState] = useMutation(
    CREATE_ORGANIZATION_KPI_FORMULA_TEMPLATE,
  );
  const [updateTemplateMutation, updateTemplateState] = useMutation(
    UPDATE_ORGANIZATION_KPI_FORMULA_TEMPLATE,
  );
  const [removeTemplateMutation, removeTemplateState] = useMutation(
    REMOVE_ORGANIZATION_KPI_FORMULA_TEMPLATE,
  );
  const [createFormulaMutation, createFormulaState] = useMutation(
    CREATE_KPI_FORMULA_DEFINITION,
  );
  const [updateFormulaMutation, updateFormulaState] = useMutation(
    UPDATE_KPI_FORMULA_DEFINITION,
  );
  const [approveFormulaMutation, approveFormulaState] = useMutation(
    APPROVE_KPI_FORMULA_DEFINITION,
  );
  const [removeFormulaMutation, removeFormulaState] = useMutation(
    REMOVE_KPI_FORMULA_DEFINITION,
  );

  const createMetric = async (input: CreateMetricDefinitionInput) => {
    try {
      const result = await createMetricMutation({ variables: { input } });
      await metricsQuery.refetch();
      toast.success("Metric created", {
        description: `${input.name} is ready to use in formulas.`,
      });
      return result.data?.createMetricDefinition as MetricDefinition | undefined;
    } catch (error) {
      toast.error("Could not create metric", { description: errorMessage(error) });
      throw error;
    }
  };

  const updateMetric = async (input: UpdateMetricDefinitionInput) => {
    try {
      const result = await updateMetricMutation({ variables: { input } });
      await metricsQuery.refetch();
      toast.success("Metric updated");
      return result.data?.updateMetricDefinition as MetricDefinition | undefined;
    } catch (error) {
      toast.error("Could not update metric", { description: errorMessage(error) });
      throw error;
    }
  };

  const removeMetric = async (id: string) => {
    try {
      const result = await removeMetricMutation({
        variables: { id, organizationId },
      });
      await metricsQuery.refetch();
      toast.success("Metric removed");
      return result.data?.removeMetricDefinition as MetricDefinition | undefined;
    } catch (error) {
      toast.error("Could not remove metric", { description: errorMessage(error) });
      throw error;
    }
  };

  const createTemplate = async (
    input: CreateOrganizationKpiFormulaTemplateInput,
  ) => {
    try {
      const result = await createTemplateMutation({ variables: { input } });
      await templatesQuery.refetch();
      toast.success("Formula template created", {
        description: `${input.name} is available to your organization.`,
      });
      return result.data
        ?.createOrganizationKpiFormulaTemplate as OrganizationKpiFormulaTemplate | undefined;
    } catch (error) {
      toast.error("Could not create template", { description: errorMessage(error) });
      throw error;
    }
  };

  const updateTemplate = async (
    input: UpdateOrganizationKpiFormulaTemplateInput,
  ) => {
    try {
      const result = await updateTemplateMutation({ variables: { input } });
      await templatesQuery.refetch();
      toast.success("Formula template updated");
      return result.data
        ?.updateOrganizationKpiFormulaTemplate as OrganizationKpiFormulaTemplate | undefined;
    } catch (error) {
      toast.error("Could not update template", { description: errorMessage(error) });
      throw error;
    }
  };

  const removeTemplate = async (id: string) => {
    try {
      const result = await removeTemplateMutation({
        variables: { id, organizationId },
      });
      await templatesQuery.refetch();
      toast.success("Formula template removed");
      return result.data
        ?.removeOrganizationKpiFormulaTemplate as OrganizationKpiFormulaTemplate | undefined;
    } catch (error) {
      toast.error("Could not remove template", { description: errorMessage(error) });
      throw error;
    }
  };

  const createFormula = async (input: CreateKpiFormulaDefinitionInput) => {
    try {
      const result = await createFormulaMutation({ variables: { input } });
      await formulasQuery.refetch();
      toast.success("Draft formula created", {
        description: "Review the formula, then approve it when it is ready.",
      });
      return result.data?.createKpiFormulaDefinition as
        | KpiFormulaDefinition
        | undefined;
    } catch (error) {
      toast.error("Could not create formula", { description: errorMessage(error) });
      throw error;
    }
  };

  const updateFormula = async (input: UpdateKpiFormulaDefinitionInput) => {
    try {
      const result = await updateFormulaMutation({ variables: { input } });
      await formulasQuery.refetch();
      toast.success("Draft formula updated");
      return result.data?.updateKpiFormulaDefinition as
        | KpiFormulaDefinition
        | undefined;
    } catch (error) {
      toast.error("Could not update formula", { description: errorMessage(error) });
      throw error;
    }
  };

  const approveFormula = async (id: string) => {
    if (!organizationId) throw new Error("Organization is required.");
    try {
      const result = await approveFormulaMutation({
        variables: { input: { id, organizationId } },
      });
      await formulasQuery.refetch();
      toast.success("Formula approved", {
        description: "This version is now active for the target KPI.",
      });
      return result.data?.approveKpiFormulaDefinition as
        | KpiFormulaDefinition
        | undefined;
    } catch (error) {
      toast.error("Could not approve formula", { description: errorMessage(error) });
      throw error;
    }
  };

  const removeFormula = async (id: string) => {
    try {
      const result = await removeFormulaMutation({
        variables: { id, organizationId },
      });
      await formulasQuery.refetch();
      toast.success("Draft formula removed");
      return result.data?.removeKpiFormulaDefinition as
        | KpiFormulaDefinition
        | undefined;
    } catch (error) {
      toast.error("Could not remove formula", { description: errorMessage(error) });
      throw error;
    }
  };

  return {
    metrics: metricsQuery.data?.metricDefinitions.items ?? [],
    metricsMeta: metricsQuery.data?.metricDefinitions.meta,
    templates: templatesQuery.data?.organizationKpiFormulaTemplates.items ?? [],
    templatesMeta: templatesQuery.data?.organizationKpiFormulaTemplates.meta,
    formulas: formulasQuery.data?.kpiFormulaDefinitions.items ?? [],
    formulasMeta: formulasQuery.data?.kpiFormulaDefinitions.meta,
    kpis: kpisQuery.data?.kpis.items ?? [],
    loading: {
      metrics: metricsQuery.loading,
      templates: templatesQuery.loading,
      formulas: formulasQuery.loading,
      kpis: kpisQuery.loading,
      createMetric: createMetricState.loading,
      updateMetric: updateMetricState.loading,
      removeMetric: removeMetricState.loading,
      createTemplate: createTemplateState.loading,
      updateTemplate: updateTemplateState.loading,
      removeTemplate: removeTemplateState.loading,
      createFormula: createFormulaState.loading,
      updateFormula: updateFormulaState.loading,
      approveFormula: approveFormulaState.loading,
      removeFormula: removeFormulaState.loading,
    },
    errors: [
      metricsQuery.error,
      templatesQuery.error,
      formulasQuery.error,
      kpisQuery.error,
    ].filter(Boolean),
    createMetric,
    updateMetric,
    removeMetric,
    createTemplate,
    updateTemplate,
    removeTemplate,
    createFormula,
    updateFormula,
    approveFormula,
    removeFormula,
    refetchAll: () =>
      Promise.all([
        metricsQuery.refetch(),
        templatesQuery.refetch(),
        formulasQuery.refetch(),
        kpisQuery.refetch(),
      ]),
  };
}
