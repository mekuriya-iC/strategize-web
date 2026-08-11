import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { useKPIMutations } from "@/hooks/objectives/useKPIMutations";
import { CREATE_SUPPORT_KPI } from "@/lib/graphql/mutations/supportRelationships";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { invalidateAfterMutation } from "@/stores/cacheStore";
import { useStrategicPlansQuery } from "@/hooks/strategic-plans/useStrategicPlans";
import type {
  KpiWeightType,
  KpiStatus,
  KpiUnitType,
  CreateKpiInput,
  CreateSupportKpiInput,
  KpiTargetInput,
  KpiAggregationMethod,
  KpiAggregationWeightSource,
  KpiCarryPolicy,
  KpiCalculationBasisSource,
  KpiActualBasisSource,
  KpiZeroDenominatorPolicy,
  KpiQuarterlyAggregationMethod,
} from "@/types/graphql";
import { isAggregationMethodAllowed } from "@/lib/objectives/kpiAggregationOptions";
import {
  basisQuartersEqualAnnual,
  buildDirectBasisTargets,
  EMPTY_BASIS_QUARTERS,
  type BasisQuarterValues,
} from "@/utils/basisCalculation";

export interface CreateKPIFormData {
  name: string;
  baseline: string;
  weight: string;
  weightType: KpiWeightType;
  status: KpiStatus;
  unitType: KpiUnitType;
  quarterlyAggregationMethod: KpiQuarterlyAggregationMethod;
  kpiMode?: string;
  managerRetentionPercent?: string;
  aggregationMethod: KpiAggregationMethod;
  weightingBasisKpiId: string;
  aggregationWeightSource: KpiAggregationWeightSource;
  carryPolicy: KpiCarryPolicy;
  calculationBasisSource: KpiCalculationBasisSource;
  zeroDenominatorPolicy: KpiZeroDenominatorPolicy;
  actualBasisSource: KpiActualBasisSource;
  directBasisValue: string;
  numeratorLabel: string;
  denominatorLabel: string;
  basisUnitType: KpiUnitType;
}

export interface YearlyQuarters {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

interface UseCreateKPIFormProps {
  objectiveId: string;
  onSuccess?: () => void;
  isCorporate?: boolean;
  isSupport?: boolean;
  supportSourceIds?: string[];
}

const measurementUnitFor = (unitType: KpiUnitType): string => {
  if (unitType === "PERCENT") return "PERCENTAGE";
  if (unitType === "RATIO") return "NUMBER"; // RATIO KPIs use "NUMBER" as measurementUnit
  if (unitType === "CURRENCY") return "CURRENCY";
  if (unitType === "HOUR") return "HOUR";
  if (unitType === "COUNT") return "NUMBER"; // COUNT KPIs use "NUMBER"
  return "NUMBER"; // Default to "NUMBER" for NUMBER unit type
};

export function useCreateKPIForm({
  objectiveId,
  onSuccess,
  isCorporate = false,
  isSupport = false,
  supportSourceIds = [],
}: UseCreateKPIFormProps) {
  const { createKpi } = useKPIMutations();
  const [createSupportKpi] = useMutation(CREATE_SUPPORT_KPI, {
    onCompleted: () => invalidateAfterMutation.kpi(),
    refetchQueries: [
      { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
      { query: GET_OBJECTIVES, variables: { page: 1, limit: 1000 } },
      "GetObjectives",
    ],
  });
  const [selectedSupportSourceIds, setSelectedSupportSourceIds] = useState<
    string[]
  >(() => (supportSourceIds.length === 1 ? supportSourceIds : []));

  // Fetch strategic plans to get organizationId
  const { strategicPlans } = useStrategicPlansQuery();
  const activeStrategicPlan = strategicPlans.find((plan) => plan.isActive);
  const organizationId =
    activeStrategicPlan?.organization?.organizationId || "";

  const [formData, setFormData] = useState<CreateKPIFormData>({
    name: "",
    baseline: "",
    weight: "",
    weightType: "PERCENT",
    status: "NOT_SUBMITTED",
    unitType: "NUMBER",
    quarterlyAggregationMethod: "SUM",
    kpiMode: isSupport ? "DIRECT" : "AGGREGATED",
    managerRetentionPercent: "30",
    aggregationMethod: "SUM",
    weightingBasisKpiId: "",
    aggregationWeightSource: "PLANNED_TARGET",
    carryPolicy: "ADDITIVE",
    calculationBasisSource: "NONE",
    zeroDenominatorPolicy: "NOT_CALCULABLE",
    actualBasisSource: "USE_APPROVED_BASIS",
    directBasisValue: "",
    numeratorLabel: "",
    denominatorLabel: "",
    basisUnitType: "NUMBER",
  });

  // Annual Goals - Only for strategic period (single year)
  const [annualTargets, setAnnualTargets] = useState<Record<string, string>>(
    {},
  );

  // Quarterly breakdown - Only for strategic period (single year)
  const [yearlyQuarters, setYearlyQuarters] = useState<
    Record<string, YearlyQuarters>
  >({});
  const [basisQuarters, setBasisQuarters] = useState<BasisQuarterValues>({
    ...EMPTY_BASIS_QUARTERS,
  });

  // Loading/Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback(
    <K extends keyof CreateKPIFormData>(
      field: K,
      value: CreateKPIFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const targets: KpiTargetInput[] = [];

      // Strategic period is a single year-range (we treat the first available entry as the strategic year).
      // The UI stores the annual target in `annualTargets[strategicYear]`.
      const strategicYear =
        Object.keys(annualTargets)[0] || Object.keys(yearlyQuarters)[0];
      const annualValue =
        parseFloat((strategicYear && annualTargets[strategicYear]) || "0") || 0;

      // Annual target is required for both corporate and non-corporate in strategic period.
      if (!strategicYear || annualValue <= 0) {
        throw new Error("Annual target is required for the strategic period");
      }

      if (isCorporate) {
        // Corporate: Submit only the annual target (no quarterly planning required)
        targets.push({
          timeline: strategicYear,
          target: annualValue,
        });
      } else {
        // Non-Corporate: Requires quarterly breakdown for the strategic year.
        // IMPORTANT: We submit ONLY quarterly targets to avoid creating an extra yearly target record.
        const quarters = yearlyQuarters[strategicYear];
        if (!quarters) {
          throw new Error(
            "Quarterly breakdown is required for non-corporate KPIs",
          );
        }

        const q1 = parseFloat(quarters.q1 || "0") || 0;
        const q2 = parseFloat(quarters.q2 || "0") || 0;
        const q3 = parseFloat(quarters.q3 || "0") || 0;
        const q4 = parseFloat(quarters.q4 || "0") || 0;
        const values = [q1, q2, q3, q4];
        if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
          throw new Error("Every quarter must have a value greater than zero");
        }
        const sum = q1 + q2 + q3 + q4;

        const TOLERANCE = 0.01;
        const shouldAverage =
          formData.quarterlyAggregationMethod === "AVERAGE";
        const plannedVal = shouldAverage ? sum / values.length : sum;
        if (Math.abs(plannedVal - annualValue) > TOLERANCE) {
          throw new Error(
            `Quarterly ${shouldAverage ? "average" : "sum"} must equal the annual target`,
          );
        }

        (
          Object.entries({ q1, q2, q3, q4 }) as Array<
            ["q1" | "q2" | "q3" | "q4", number]
          >
        ).forEach(([quarter, val]) => {
          const quarterNum = quarter.replace("q", "");
          targets.push({
            timeline: `${strategicYear}-Q${quarterNum}`,
            target: val,
          });
        });
      }

      const isRateLike =
        formData.unitType === "PERCENT" || formData.unitType === "RATIO";
      const basisSource = isRateLike
        ? formData.calculationBasisSource
        : "NONE";
      if (basisSource !== "NONE" && (!formData.numeratorLabel.trim() || !formData.denominatorLabel.trim())) {
        throw new Error("Numerator and denominator labels are required");
      }
      if (basisSource === "DIRECT_VALUE") {
        const annualBasis = Number(formData.directBasisValue);
        if (!Number.isFinite(annualBasis) || annualBasis <= 0) {
          throw new Error("Annual direct basis must be greater than zero");
        }
        if (!isCorporate && !basisQuartersEqualAnnual(formData.directBasisValue, basisQuarters)) {
          throw new Error("Q1–Q4 basis values must sum exactly to the annual basis");
        }
      }
      if (basisSource === "LINKED_KPI" && !formData.weightingBasisKpiId) {
        throw new Error("Select an additive linked basis KPI");
      }
      if (
        formData.actualBasisSource === "LINKED_KPI_ACTUAL" &&
        basisSource !== "LINKED_KPI"
      ) {
        throw new Error(
          "Linked KPI actual requires a linked approved denominator KPI",
        );
      }
      if (
        !isSupport &&
        formData.kpiMode !== "DIRECT" &&
        !isAggregationMethodAllowed({
          method: formData.aggregationMethod,
          unitType: formData.unitType,
          calculationBasisSource: basisSource,
        })
      ) {
        throw new Error(
          "Choose an aggregation method compatible with this KPI unit and calculation basis",
        );
      }
      if (
        !isSupport &&
        formData.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE" &&
        basisSource === "NONE" &&
        !formData.weightingBasisKpiId
      ) {
        throw new Error(
          "Select a weighting-basis KPI for denominator-weighted aggregation",
        );
      }

      const input: CreateKpiInput = {
        name: formData.name,
        baseline:
          formData.baseline !== "" ? parseFloat(formData.baseline) : undefined,
        weight: parseFloat(formData.weight) || 0,
        unitType: formData.unitType,
        quarterlyAggregationMethod: formData.quarterlyAggregationMethod,
        strategicObjectiveId: objectiveId, // Backend uses strategicObjectiveId
        frequency: "QUARTERLY", // Default to QUARTERLY
        measurementUnit: measurementUnitFor(formData.unitType),
        organizationId: organizationId, // Required by backend
        targetValue: annualValue, // Use the annual target value directly
        targets: targets,
        kpiMode: formData.kpiMode || (isSupport ? "DIRECT" : "AGGREGATED"),
        managerRetentionPercent:
          formData.kpiMode === "HYBRID" && formData.managerRetentionPercent
            ? parseFloat(formData.managerRetentionPercent)
            : undefined,
        aggregationMethod: isSupport ? "SUM" : formData.aggregationMethod,
        weightingBasisKpiId:
          !isSupport &&
          formData.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE" &&
          basisSource !== "DIRECT_VALUE"
            ? formData.weightingBasisKpiId || undefined
            : undefined,
        aggregationWeightSource: formData.aggregationWeightSource,
        carryPolicy:
          formData.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE"
            ? "NONE"
            : formData.carryPolicy,
        calculationBasisSource: basisSource,
        zeroDenominatorPolicy:
          basisSource !== "NONE" ? formData.zeroDenominatorPolicy : undefined,
        actualBasisSource:
          basisSource !== "NONE" ? formData.actualBasisSource : undefined,
        directBasisValue:
          basisSource === "DIRECT_VALUE" ? formData.directBasisValue : undefined,
        directBasisTargets:
          basisSource === "DIRECT_VALUE" && !isCorporate
            ? buildDirectBasisTargets(strategicYear, basisQuarters)
            : undefined,
        numeratorLabel:
          basisSource !== "NONE" ? formData.numeratorLabel.trim() : undefined,
        denominatorLabel:
          basisSource !== "NONE" ? formData.denominatorLabel.trim() : undefined,
        basisUnitType:
          basisSource === "DIRECT_VALUE" ? formData.basisUnitType : undefined,
      };

      if (isSupport) {
        if (supportSourceIds.length === 0) {
          throw new Error(
            "This support objective has no Corporate KPI sources. KPI creation is unavailable.",
          );
        }
        if (selectedSupportSourceIds.length === 0) {
          throw new Error("Select at least one Corporate KPI to support.");
        }

        const supportInput: CreateSupportKpiInput = {
          objectiveId,
          name: input.name,
          baseline: input.baseline,
          weight: input.weight ?? 0,
          unitType: input.unitType,
          quarterlyAggregationMethod: input.quarterlyAggregationMethod,
          frequency: input.frequency,
          measurementUnit: input.measurementUnit,
          targetValue: input.targetValue,
          targets: input.targets ?? [],
          kpiMode: input.kpiMode,
          managerRetentionPercent: input.managerRetentionPercent,
          sourceCorporateKpiIds: selectedSupportSourceIds,
        };
        await createSupportKpi({ variables: { input: supportInput } });
      } else {
        await createKpi({ input });
      }

      // client.refetchQueries is handled by mutations, but we can do extra safety
      // await client.refetchQueries({ include: ["GetKPIs", "GetObjective"] });
      // useKPIMutations handles refetching.

      onSuccess?.();
    } catch (error) {
      console.error(error);
      // Toast handled by mutation hooks usually, but if error propagates
      // throw error;
      // actually useCreateKPIForm swallows error in catch block at Step 1707?
      // "throw error;" is there.
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    yearlyQuarters,
    annualTargets,
    objectiveId,
    createKpi,
    createSupportKpi,
    isSupport,
    supportSourceIds,
    selectedSupportSourceIds,
    onSuccess,
    isCorporate,
    organizationId,
    basisQuarters,
  ]);

  return {
    formData,
    annualTargets,
    setAnnualTargets,
    yearlyQuarters,
    setYearlyQuarters,
    basisQuarters,
    setBasisQuarters,
    isSubmitting,
    updateField,
    selectedSupportSourceIds,
    setSelectedSupportSourceIds,
    handleSubmit,
  };
}
