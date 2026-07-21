"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_KPI_FORMULA_DEFINITIONS } from "@/lib/graphql/queries/kpi-formulas";
import { GET_KPI_FORMULA_QUARTER_PLANS } from "@/lib/graphql/queries/kpi-formula-planning";
import {
  SET_KPI_FORMULA_QUARTER_COMPONENT_INPUTS,
  SET_KPI_FORMULA_QUARTER_METRIC_INPUTS,
} from "@/lib/graphql/mutations/kpi-formula-planning";
import type {
  KpiFormulaComponent,
  KpiFormulaDefinition,
  KpiFormulaSourceType,
} from "./useKpiFormulas";
import type { KpiQuarterPlanStatus } from "@/types/graphql";

export type KpiFormulaQuarterReconciliationStatus =
  | "PENDING_INPUT"
  | "VALID"
  | "INVALID"
  | "LOCKED";

export interface KpiFormulaQuarterComponentPlanView {
  id: string;
  organizationId: string;
  formulaQuarterPlanId: string;
  formulaComponentId: string;
  plannedValue?: string | null;
  formulaComponent: KpiFormulaComponent;
}

export interface KpiFormulaQuarterPlanView {
  id: string;
  organizationId: string;
  kpiId: string;
  quarterPlanId: string;
  formulaDefinitionId: string;
  components: KpiFormulaQuarterComponentPlanView[];
  numeratorPlannedValue?: string | null;
  denominatorPlannedValue?: string | null;
  calculatedTargetDecimal?: string | null;
  calculatedTargetExact?: string | null;
  reconciliationStatus: KpiFormulaQuarterReconciliationStatus;
  validationMessage?: string | null;
  version: number;
  lockedAt?: string | null;
  quarterPlan: {
    kpiQuarterPlanId: string;
    annualStrategicPeriodId: string;
    quarterNumber: number;
    timeline: string;
    originalTarget: number;
    status: KpiQuarterPlanStatus;
  };
}

export interface FormulaQuarterMetricInput {
  quarterNumber: number;
  numeratorPlannedValue?: string | null;
  denominatorPlannedValue?: string | null;
}

export interface FormulaQuarterComponentInput {
  quarterNumber: number;
  formulaComponentId: string;
  plannedValue?: string | null;
}

interface FormulaDefinitionsData {
  kpiFormulaDefinitions: {
    items: KpiFormulaDefinition[];
  };
}

interface FormulaQuarterPlansData {
  kpiFormulaQuarterPlans: KpiFormulaQuarterPlanView[];
}

interface FormulaQuarterPlansVariables {
  organizationId: string;
  kpiId: string;
  annualPeriodId?: string;
}

interface SetFormulaMetricInputsData {
  setKpiFormulaQuarterMetricInputs: KpiFormulaQuarterPlanView[];
}

interface SetFormulaMetricInputsVariables {
  input: {
    organizationId: string;
    kpiId: string;
    annualPeriodId: string;
    inputs: FormulaQuarterMetricInput[];
  };
}

interface SetFormulaComponentInputsData {
  setKpiFormulaQuarterComponentInputs: KpiFormulaQuarterPlanView[];
}

interface SetFormulaComponentInputsVariables {
  input: {
    organizationId: string;
    kpiId: string;
    annualPeriodId: string;
    inputs: FormulaQuarterComponentInput[];
  };
}

export function useKpiFormulaQuarterPlanning({
  organizationId,
  kpiId,
  annualPeriodId,
  enabled,
}: {
  organizationId?: string;
  kpiId: string;
  annualPeriodId?: string;
  enabled: boolean;
}) {
  const canLoad = Boolean(enabled && organizationId && kpiId && annualPeriodId);
  const formulaQuery = useQuery<
    FormulaDefinitionsData,
    { organizationId: string; page: number; limit: number; kpiId: string }
  >(GET_KPI_FORMULA_DEFINITIONS, {
    variables: {
      organizationId: organizationId ?? "",
      page: 1,
      limit: 20,
      kpiId,
    },
    skip: !canLoad,
    fetchPolicy: "cache-and-network",
  });
  const plansQuery = useQuery<
    FormulaQuarterPlansData,
    FormulaQuarterPlansVariables
  >(GET_KPI_FORMULA_QUARTER_PLANS, {
    variables: {
      organizationId: organizationId ?? "",
      kpiId,
      annualPeriodId,
    },
    skip: !canLoad,
    fetchPolicy: "cache-and-network",
  });
  const [setMetricInputsMutation, metricMutationState] = useMutation<
    SetFormulaMetricInputsData,
    SetFormulaMetricInputsVariables
  >(SET_KPI_FORMULA_QUARTER_METRIC_INPUTS);
  const [setComponentInputsMutation, componentMutationState] = useMutation<
    SetFormulaComponentInputsData,
    SetFormulaComponentInputsVariables
  >(SET_KPI_FORMULA_QUARTER_COMPONENT_INPUTS);

  const approvedFormula = useMemo(
    () =>
      formulaQuery.data?.kpiFormulaDefinitions.items.find(
        (formula) => formula.status === "APPROVED",
      ) ?? null,
    [formulaQuery.data],
  );
  const plans = useMemo(
    () =>
      [...(plansQuery.data?.kpiFormulaQuarterPlans ?? [])].sort(
        (left, right) =>
          left.quarterPlan.quarterNumber - right.quarterPlan.quarterNumber,
      ),
    [plansQuery.data],
  );

  const saveMetricInputs = useCallback(
    async (inputs: FormulaQuarterMetricInput[]) => {
      if (!organizationId || !annualPeriodId) {
        throw new Error("Formula planning requires an organization and annual period.");
      }
      const result = await setMetricInputsMutation({
        variables: {
          input: { organizationId, kpiId, annualPeriodId, inputs },
        },
      });
      await plansQuery.refetch();
      return result.data?.setKpiFormulaQuarterMetricInputs ?? [];
    },
    [
      annualPeriodId,
      kpiId,
      organizationId,
      plansQuery,
      setMetricInputsMutation,
    ],
  );

  const saveComponentInputs = useCallback(
    async (inputs: FormulaQuarterComponentInput[]) => {
      if (!organizationId || !annualPeriodId) {
        throw new Error("Formula planning requires an organization and annual period.");
      }
      const result = await setComponentInputsMutation({
        variables: {
          input: { organizationId, kpiId, annualPeriodId, inputs },
        },
      });
      await plansQuery.refetch();
      return result.data?.setKpiFormulaQuarterComponentInputs ?? [];
    },
    [
      annualPeriodId,
      kpiId,
      organizationId,
      plansQuery,
      setComponentInputsMutation,
    ],
  );

  return {
    approvedFormula,
    plans,
    loading: formulaQuery.loading || plansQuery.loading,
    saving: metricMutationState.loading || componentMutationState.loading,
    error:
      formulaQuery.error ??
      plansQuery.error ??
      metricMutationState.error ??
      componentMutationState.error,
    saveMetricInputs,
    saveComponentInputs,
  };
}

export function formulaComponentSourceLabel(
  component: KpiFormulaComponent,
): string {
  if (component.sourceType === "METRIC") {
    return component.metricDefinition?.name ?? `component ${component.position} metric`;
  }
  return component.sourceKpi?.name ?? `component ${component.position} KPI`;
}

export function formulaSourceLabel(
  formula: KpiFormulaDefinition,
  side: "numerator" | "denominator",
): { type?: KpiFormulaSourceType | null; label: string } {
  const type = formula[`${side}SourceType`];
  if (type === "METRIC") {
    return {
      type,
      label:
        formula[`${side}MetricDefinition`]?.name ?? `${side} metric`,
    };
  }
  if (type === "KPI") {
    return {
      type,
      label: formula[`${side}Kpi`]?.name ?? `${side} KPI`,
    };
  }
  return { type, label: `${side} source` };
}
