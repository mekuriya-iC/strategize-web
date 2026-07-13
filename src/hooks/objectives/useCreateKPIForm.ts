import { useState, useCallback } from "react";
import { useKPIMutations } from "@/hooks/objectives/useKPIMutations";
import { useStrategicPlansQuery } from "@/hooks/strategic-plans/useStrategicPlans";
import type {
  KpiWeightType,
  KpiStatus,
  KpiUnitType,
  CreateKpiInput,
  KpiTargetInput,
} from "@/types/graphql";

export interface CreateKPIFormData {
  name: string;
  baseline: string;
  weight: string;
  weightType: KpiWeightType;
  status: KpiStatus;
  unitType: KpiUnitType;
  kpiMode?: string;
  managerRetentionPercent?: string;
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
}

export function useCreateKPIForm({
  objectiveId,
  onSuccess,
  isCorporate = false,
}: UseCreateKPIFormProps) {
  const { createKpi } = useKPIMutations();

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
    kpiMode: "AGGREGATED",
    managerRetentionPercent: "30",
  });

  // Annual Goals - Only for strategic period (single year)
  const [annualTargets, setAnnualTargets] = useState<Record<string, string>>(
    {},
  );

  // Quarterly breakdown - Only for strategic period (single year)
  const [yearlyQuarters, setYearlyQuarters] = useState<
    Record<string, YearlyQuarters>
  >({});

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
        const isPercent =
          formData.unitType === "PERCENT" || formData.unitType === "RATIO";
        const plannedVal = isPercent ? sum / 4 : sum;
        if (Math.abs(plannedVal - annualValue) > TOLERANCE) {
          throw new Error(
            isPercent
              ? "Quarterly breakdown average must equal the annual target"
              : "Quarterly breakdown sum must equal the annual target",
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

      const input: CreateKpiInput = {
        name: formData.name,
        baseline:
          formData.baseline !== "" ? parseFloat(formData.baseline) : undefined,
        weight: parseFloat(formData.weight) || 0,
        unitType: formData.unitType,
        strategicObjectiveId: objectiveId, // Backend uses strategicObjectiveId
        frequency: "QUARTERLY", // Default to QUARTERLY
        measurementUnit: "NUMBER", // Default to NUMBER
        organizationId: organizationId, // Required by backend
        targetValue: annualValue, // Use the annual target value directly
        targets: targets,
        kpiMode: formData.kpiMode || "AGGREGATED",
        managerRetentionPercent:
          formData.kpiMode === "HYBRID" && formData.managerRetentionPercent
            ? parseFloat(formData.managerRetentionPercent)
            : undefined,
      };

      await createKpi({ input });

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
    onSuccess,
    isCorporate,
    organizationId,
  ]);

  return {
    formData,
    annualTargets,
    setAnnualTargets,
    yearlyQuarters,
    setYearlyQuarters,
    isSubmitting,
    updateField,
    handleSubmit,
  };
}
