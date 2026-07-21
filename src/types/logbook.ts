export type LogbookKpiCalculationType =
  | "MANUAL_VALUE"
  | "RATIO_FORMULA"
  | "WEIGHTED_INDEX";

export type LogbookFormulaCalculationType = Exclude<
  LogbookKpiCalculationType,
  "MANUAL_VALUE"
>;

export type LogbookFormulaSourceType = "METRIC" | "KPI";

export interface LogbookFormulaMetricDefinition {
  id: string;
  organizationId?: string;
  code: string;
  name: string;
  description?: string | null;
  unitType?: string | null;
  measurementUnit?: string | null;
  temporalRollupMethod?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogbookFormulaKpiSource {
  kpiId: string;
  name: string;
  description?: string | null;
  unitType?: string | null;
  measurementUnit?: string | null;
  isActive?: boolean;
}

export interface LogbookFormulaComponent {
  id: string;
  organizationId: string;
  formulaDefinitionId: string;
  position: number;
  sourceType: LogbookFormulaSourceType;
  metricDefinitionId?: string | null;
  metricDefinition?: LogbookFormulaMetricDefinition | null;
  sourceKpiId?: string | null;
  sourceKpi?: LogbookFormulaKpiSource | null;
  /** Exact decimal string returned by the API. */
  weight: string;
  createdAt: string;
}

export interface LogbookFormulaDefinition {
  id: string;
  organizationId: string;
  kpiId: string;
  kpi?: LogbookFormulaKpiSource;
  calculationType: LogbookFormulaCalculationType;
  components: LogbookFormulaComponent[];
  numeratorSourceType?: LogbookFormulaSourceType | null;
  numeratorMetricDefinitionId?: string | null;
  numeratorMetricDefinition?: LogbookFormulaMetricDefinition | null;
  numeratorKpiId?: string | null;
  numeratorKpi?: LogbookFormulaKpiSource | null;
  denominatorSourceType?: LogbookFormulaSourceType | null;
  denominatorMetricDefinitionId?: string | null;
  denominatorMetricDefinition?: LogbookFormulaMetricDefinition | null;
  denominatorKpiId?: string | null;
  denominatorKpi?: LogbookFormulaKpiSource | null;
  multiplier: number;
  temporalRollupMethod: string;
  zeroDenominatorPolicy: string;
  resultDirection: string;
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  version: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LogbookFormulaForContextQueryData {
  logbookFormulaForContext?: LogbookFormulaDefinition | null;
}

export interface LogbookFormulaForContextQueryVariables {
  organizationId: string;
  kpiId: string;
  entryDate: string;
}

export interface LogbookKpiOption {
  kpiId: string;
  name: string;
  targetValue?: number | null;
  unitType?: string | null;
  measurementUnit?: string | null;
  kpiMode?: string | null;
  assigneeType?: string | null;
  managerRetentionPercent?: number | null;
  calculationType?: LogbookKpiCalculationType | null;
  calculationBasisSource?: "NONE" | "DIRECT_VALUE" | "LINKED_KPI" | null;
  directBasisValue?: string | null;
  numeratorLabel?: string | null;
  denominatorLabel?: string | null;
  basisUnitType?: string | null;
  quarterPlans?: Array<{
    quarterNumber: number;
    directBasisTarget?: string | null;
  }>;
  objective?: {
    type?: string | null;
  } | null;
}

export interface LogbookKpisQueryData {
  myKpis: {
    items: LogbookKpiOption[];
  };
}

export interface LogbookKpisQueryVariables {
  page?: number;
  limit?: number;
  strategicPeriodId?: string;
}

interface LogbookFormulaSourceBase {
  key: string;
  position: number;
  label: string;
  /** Present only for weighted-index components and kept as an exact string. */
  weight?: string;
}

export interface LogbookMetricFormulaSource
  extends LogbookFormulaSourceBase {
  sourceType: "METRIC";
  metricDefinitionId: string;
  metricDefinition?: LogbookFormulaMetricDefinition | null;
}

export interface LogbookKpiFormulaSource extends LogbookFormulaSourceBase {
  sourceType: "KPI";
  sourceKpiId: string;
  sourceKpi?: LogbookFormulaKpiSource | null;
}

export type LogbookFormulaSource =
  | LogbookMetricFormulaSource
  | LogbookKpiFormulaSource;

export const isLogbookFormulaCalculationType = (
  calculationType?: string | null,
): calculationType is LogbookFormulaCalculationType =>
  calculationType === "RATIO_FORMULA" || calculationType === "WEIGHTED_INDEX";

export const getOrderedLogbookFormulaSources = (
  formula?: LogbookFormulaDefinition | null,
): LogbookFormulaSource[] => {
  if (!formula) return [];

  if (formula.calculationType === "WEIGHTED_INDEX") {
    return [...(formula.components || [])]
      .sort((left, right) => left.position - right.position)
      .flatMap((component): LogbookFormulaSource[] => {
        const base = {
          key: component.id,
          position: component.position,
          label: `Component ${component.position}`,
          weight: component.weight,
        };

        if (component.sourceType === "METRIC" && component.metricDefinitionId) {
          return [
            {
              ...base,
              sourceType: "METRIC",
              metricDefinitionId: component.metricDefinitionId,
              metricDefinition: component.metricDefinition,
            },
          ];
        }

        if (component.sourceType === "KPI" && component.sourceKpiId) {
          return [
            {
              ...base,
              sourceType: "KPI",
              sourceKpiId: component.sourceKpiId,
              sourceKpi: component.sourceKpi,
            },
          ];
        }

        return [];
      });
  }

  const sources: LogbookFormulaSource[] = [];
  if (
    formula.numeratorSourceType === "METRIC" &&
    formula.numeratorMetricDefinitionId
  ) {
    sources.push({
      key: `numerator-metric-${formula.numeratorMetricDefinitionId}`,
      position: 1,
      label: "Numerator",
      sourceType: "METRIC",
      metricDefinitionId: formula.numeratorMetricDefinitionId,
      metricDefinition: formula.numeratorMetricDefinition,
    });
  } else if (
    formula.numeratorSourceType === "KPI" &&
    formula.numeratorKpiId
  ) {
    sources.push({
      key: `numerator-kpi-${formula.numeratorKpiId}`,
      position: 1,
      label: "Numerator",
      sourceType: "KPI",
      sourceKpiId: formula.numeratorKpiId,
      sourceKpi: formula.numeratorKpi,
    });
  }

  if (
    formula.denominatorSourceType === "METRIC" &&
    formula.denominatorMetricDefinitionId
  ) {
    sources.push({
      key: `denominator-metric-${formula.denominatorMetricDefinitionId}`,
      position: 2,
      label: "Denominator",
      sourceType: "METRIC",
      metricDefinitionId: formula.denominatorMetricDefinitionId,
      metricDefinition: formula.denominatorMetricDefinition,
    });
  } else if (
    formula.denominatorSourceType === "KPI" &&
    formula.denominatorKpiId
  ) {
    sources.push({
      key: `denominator-kpi-${formula.denominatorKpiId}`,
      position: 2,
      label: "Denominator",
      sourceType: "KPI",
      sourceKpiId: formula.denominatorKpiId,
      sourceKpi: formula.denominatorKpi,
    });
  }

  return sources;
};

export interface LogbookMetricObservation {
  id: string;
  metricDefinitionId: string;
  value: string;
  observedAt: string;
  metricDefinition: {
    id: string;
    code: string;
    name: string;
    unitType: string;
    measurementUnit: string;
    temporalRollupMethod: string;
  };
}

export interface FrontendLogbookItem {
  id: string;
  activity: string;
  description: string;
  outcome: string;
  entryDate: string;
  attachmentUrl?: string | null;
  status?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    employeeId?: string;
    fullName?: string;
    email?: string;
    title?: string;
  } | null;
  linkedKpiId?: string;
  linkedKpi?: {
    kpiId: string;
    name: string;
    targetValue?: number | null;
    unitType?: string | null;
    measurementUnit?: string | null;
    calculationType?: LogbookKpiCalculationType | null;
    calculationBasisSource?: "NONE" | "DIRECT_VALUE" | "LINKED_KPI" | null;
    directBasisValue?: string | null;
    numeratorLabel?: string | null;
    denominatorLabel?: string | null;
    basisUnitType?: string | null;
    quarterPlans?: Array<{
      quarterNumber: number;
      directBasisTarget?: string | null;
    }>;
  } | null;
  quarterPlan?: {
    kpiQuarterPlanId: string;
    quarterNumber: number;
    timeline: string;
    status: string;
  } | null;
  metricObservations?: LogbookMetricObservation[];
  kpiTargetValue?: number | null;
  kpiAchievedValue?: number | null;
  kpiCompletionPercent?: number | null;
  contributionUnit?: string;
  strategicPeriodId?: string;
}
