"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TrendingUp, Upload } from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_KPI_UPDATE } from "@/lib/graphql/mutations/kpis";
import { GET_KPI_UPDATES } from "@/lib/graphql/queries/kpis";
import { GET_KPI_RESULT_ENTRY_CONTEXT } from "@/lib/graphql/queries/logbook";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import type {
  KpiActualBasisSource,
  KpiResultInputMode,
  KpiUnitType,
} from "@/types/graphql";
import type {
  KpiResultEntryContextQueryData,
  KpiResultEntryContextQueryVariables,
} from "@/types/logbook";
import {
  KpiResultEntryFields,
  getResultEntryResolvedBasis,
  isKpiResultEntryValid,
} from "@/components/kpis/KpiResultEntryFields";
import { calculateKpiResultPreview } from "@/utils/basisCalculation";

interface KpiProgressDialogProps {
  kpi: {
    kpiId: string;
    name: string;
    targetValue: number;
    measurementUnit: string;
    baselineValue?: number;
    unitType?: string | null;
    calculationBasisSource?: "NONE" | "DIRECT_VALUE" | "LINKED_KPI" | null;
    actualBasisSource?: KpiActualBasisSource | null;
    directBasisValue?: string | null;
    numeratorLabel?: string | null;
    denominatorLabel?: string | null;
    basisUnitType?: string | null;
  };
  strategicPeriodId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function KpiProgressDialog({
  kpi,
  strategicPeriodId,
  onSuccess,
  trigger,
}: KpiProgressDialogProps) {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isBasisDriven =
    kpi.calculationBasisSource === "DIRECT_VALUE" ||
    kpi.calculationBasisSource === "LINKED_KPI";
  const isCurrency = isBasisDriven
    ? kpi.basisUnitType === "CURRENCY"
    : kpi.measurementUnit?.toUpperCase() === "CURRENCY";
  const unitLabel = isCurrency
    ? "ETB"
    : isBasisDriven
      ? kpi.basisUnitType || "value"
      : kpi.measurementUnit;
  const formatValue = (value: number) =>
    isCurrency ? value.toLocaleString() : value;
  const [formData, setFormData] = useState({
    achievedValue: "",
    reportingDate: new Date().toISOString().split("T")[0],
    notes: "",
    evidenceUrl: "",
  });
  const [resultInputMode, setResultInputMode] =
    useState<KpiResultInputMode>("NUMERATOR");
  const [actualNumeratorExact, setActualNumeratorExact] = useState("");
  const [actualRateExact, setActualRateExact] = useState("");
  const [actualBasisExact, setActualBasisExact] = useState("");
  const { data: resultContextData, loading: resultContextLoading } = useQuery<
    KpiResultEntryContextQueryData,
    KpiResultEntryContextQueryVariables
  >(GET_KPI_RESULT_ENTRY_CONTEXT, {
    variables: {
      kpiId: kpi.kpiId,
      entryDate: formData.reportingDate,
    },
    skip: !open || !isBasisDriven || !formData.reportingDate,
    fetchPolicy: "cache-and-network",
  });
  const resultEntryContext = resultContextData?.kpiResultEntryContext;
  const actualBasisSource =
    resultEntryContext?.actualBasisSource ||
    kpi.actualBasisSource ||
    "USE_APPROVED_BASIS";
  const resolvedBasisExact = getResultEntryResolvedBasis({
    actualBasisSource,
    actualBasisExact,
    context: resultEntryContext,
  });
  const resultPreview = calculateKpiResultPreview({
    inputMode: resultInputMode,
    numeratorExact: actualNumeratorExact,
    rateExact: actualRateExact,
    basisExact: resolvedBasisExact,
    unitType: (kpi.unitType || "PERCENT") as KpiUnitType,
  });

  const [createKpiUpdate, { loading }] = useMutation(CREATE_KPI_UPDATE, {
    refetchQueries: [
      {
        query: GET_KPI_UPDATES,
        variables: {
          kpiId: kpi.kpiId,
          page: 1,
          limit: 100,
          strategicPeriodId,
        },
      },
    ],
    onCompleted: () => {
      toast.success(`✅ Progress updated for "${kpi.name}"`);
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update progress: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      achievedValue: "",
      reportingDate: new Date().toISOString().split("T")[0],
      notes: "",
      evidenceUrl: "",
    });
    setResultInputMode("NUMERATOR");
    setActualNumeratorExact("");
    setActualRateExact("");
    setActualBasisExact("");
  };

  const calculateResult = () => {
    if (isBasisDriven) return Number(resultPreview.rateExact || 0);
    const achieved = parseFloat(formData.achievedValue);
    return Number.isFinite(achieved) ? achieved : 0;
  };

  const calculateProgress = () => {
    const result = calculateResult();
    const baseline = isBasisDriven ? 0 : kpi.baselineValue || 0;
    const target = kpi.targetValue;
    const range = target - baseline;

    if (range === 0) return result >= target ? 100 : 0;

    const progress = ((result - baseline) / range) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const getProgressStatus = (percentage: number) => {
    if (percentage >= 100) return "COMPLETED";
    if (percentage >= 75) return "ON_TRACK";
    if (percentage >= 50) return "AT_RISK";
    return "OFF_TRACK";
  };

  const handleSubmit = async () => {
    const achieved = isBasisDriven
      ? calculateResult()
      : parseFloat(formData.achievedValue);
    if (!isBasisDriven && isNaN(achieved)) {
      toast.error("Please enter a valid achieved value");
      return;
    }
    if (isBasisDriven) {
      const basisAvailable =
        actualBasisSource === "ENTER_ACTUAL_BASIS"
          ? Number(actualBasisExact) > 0
          : Boolean(resultEntryContext?.basisAvailable);
      if (
        !isKpiResultEntryValid({
          inputMode: resultInputMode,
          numeratorExact: actualNumeratorExact,
          rateExact: actualRateExact,
          resolvedBasisExact,
          basisAvailable,
        })
      ) {
        toast.error(
          resultEntryContext?.message ||
            (actualBasisSource === "LINKED_KPI_ACTUAL"
              ? "The linked KPI actual is not approved or available yet"
              : "Enter a valid result and denominator"),
        );
        return;
      }
    }

    const progressPercentage = calculateProgress();
    const progressStatus = getProgressStatus(progressPercentage);

    try {
      await createKpiUpdate({
        variables: {
          input: {
            kpiId: kpi.kpiId,
            achievedValue: achieved,
            progressPercentage,
            progressStatus,
            reportingDate: formData.reportingDate,
            notes: formData.notes || undefined,
            evidenceUrl: formData.evidenceUrl || undefined,
            strategicPeriodId,
            reportedByUserId: user?.employeeId,
          },
        },
      });
    } catch (error) {
      console.error("Error creating KPI update:", error);
    }
  };

  const progressPercentage = calculateProgress();
  const progressStatus = getProgressStatus(progressPercentage);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Update Progress
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Update KPI Progress
          </DialogTitle>
          <DialogDescription>
            Report progress for: <strong>{kpi.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* KPI Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Baseline</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isBasisDriven
                  ? "Calculated"
                  : `${formatValue(kpi.baselineValue || 0)} ${unitLabel}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatValue(kpi.targetValue)}{kpi.unitType === "PERCENT" ? "%" : kpi.unitType === "RATIO" ? ":1" : ` ${unitLabel}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Required</p>
              <p className="text-lg font-semibold text-green-600">
                {isBasisDriven
                  ? resolvedBasisExact
                    ? `${formatValue(
                        (Number(resolvedBasisExact) * kpi.targetValue) /
                          (kpi.unitType === "PERCENT" ? 100 : 1),
                      )} ${unitLabel}`
                    : "Waiting for denominator"
                  : `${formatValue(kpi.targetValue - (kpi.baselineValue || 0))} ${unitLabel}`}
              </p>
            </div>
          </div>

          {isBasisDriven ? (
            <KpiResultEntryFields
              unitType={(kpi.unitType || "PERCENT") as KpiUnitType}
              inputMode={resultInputMode}
              onInputModeChange={setResultInputMode}
              numeratorExact={actualNumeratorExact}
              onNumeratorExactChange={setActualNumeratorExact}
              rateExact={actualRateExact}
              onRateExactChange={setActualRateExact}
              actualBasisExact={actualBasisExact}
              onActualBasisExactChange={setActualBasisExact}
              context={resultEntryContext}
              contextLoading={resultContextLoading}
              fallbackActualBasisSource={kpi.actualBasisSource}
              fallbackNumeratorLabel={kpi.numeratorLabel}
              fallbackDenominatorLabel={kpi.denominatorLabel}
              fallbackBasisUnitType={kpi.basisUnitType}
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="achievedValue">
                Achieved Value <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <FormattedNumberInput
                  id="achievedValue"
                  step="0.01"
                  placeholder={
                    isCurrency ? "Enter achieved value in ETB" : "Enter achieved value"
                  }
                  value={formData.achievedValue}
                  onValueChange={(value) =>
                    setFormData({ ...formData, achievedValue: value })
                  }
                  currency={isCurrency}
                  className="flex-1"
                />
                <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400">
                  {unitLabel}
                </div>
              </div>
            </div>
          )}

          {/* Progress Preview */}
          {(isBasisDriven ? resultPreview.rateExact : formData.achievedValue) && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Progress
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  Status: <strong>{progressStatus.replace(/_/g, " ")}</strong>
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {isBasisDriven
                    ? `${calculateResult().toFixed(3)}${kpi.unitType === "PERCENT" ? "%" : kpi.unitType === "RATIO" ? ":1" : ""} / ${kpi.targetValue}${kpi.unitType === "PERCENT" ? "%" : kpi.unitType === "RATIO" ? ":1" : ""}`
                    : `${parseFloat(formData.achievedValue).toFixed(2)} / ${kpi.targetValue}`}
                </span>
              </div>
            </div>
          )}

          {/* Reporting Date */}
          <div className="space-y-2">
            <Label htmlFor="reportingDate">
              Reporting Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reportingDate"
              type="date"
              value={formData.reportingDate}
              onChange={(e) =>
                setFormData({ ...formData, reportingDate: e.target.value })
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes, challenges, or achievements..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Evidence URL */}
          <div className="space-y-2">
            <Label htmlFor="evidenceUrl" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Evidence URL (Optional)
            </Label>
            <Input
              id="evidenceUrl"
              type="url"
              placeholder="https://example.com/evidence"
              value={formData.evidenceUrl}
              onChange={(e) =>
                setFormData({ ...formData, evidenceUrl: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              Link to supporting documents, reports, or evidence
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.reportingDate ||
              (isBasisDriven
                ? !(resultInputMode === "NUMERATOR"
                    ? actualNumeratorExact
                    : actualRateExact)
                : !formData.achievedValue)
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Submitting..." : "Submit Progress"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
