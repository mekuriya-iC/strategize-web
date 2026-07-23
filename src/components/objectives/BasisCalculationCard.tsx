"use client";

import { Calculator, Link2, PenLine } from "lucide-react";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  KpiActualBasisSource,
  KpiCalculationBasisSource,
  KpiUnitType,
} from "@/types/graphql";
import {
  basisQuartersEqualAnnual,
  calculateRequiredNumerator,
  formatBasisNumber,
  splitBasisEvenly,
  type BasisQuarterValues,
} from "@/utils/basisCalculation";

interface BasisCalculationCardProps {
  unitType: KpiUnitType;
  targetValue: string;
  source: KpiCalculationBasisSource;
  onSourceChange: (source: KpiCalculationBasisSource) => void;
  actualBasisSource: KpiActualBasisSource;
  onActualBasisSourceChange: (source: KpiActualBasisSource) => void;
  numeratorLabel: string;
  onNumeratorLabelChange: (value: string) => void;
  denominatorLabel: string;
  onDenominatorLabelChange: (value: string) => void;
  basisUnitType: KpiUnitType;
  onBasisUnitTypeChange: (value: KpiUnitType) => void;
  directBasisValue: string;
  onDirectBasisValueChange: (value: string) => void;
  basisQuarters: BasisQuarterValues;
  onBasisQuartersChange: (value: BasisQuarterValues) => void;
  basisKpiId: string;
  onBasisKpiChange: (value: string) => void;
  candidateKpis: Array<{
    kpiId: string;
    name: string;
    unitType?: KpiUnitType | null;
  }>;
  currentKpiId?: string;
  isCorporate: boolean;
  disabled?: boolean;
}

const additiveUnits = new Set<KpiUnitType>([
  "CURRENCY",
  "NUMBER",
  "COUNT",
  "HOUR",
]);

const basisUnitLabels: Record<string, string> = {
  CURRENCY: "Currency",
  NUMBER: "Number",
  COUNT: "Count",
  HOUR: "Hours",
};

export function BasisCalculationCard({
  unitType,
  targetValue,
  source,
  onSourceChange,
  actualBasisSource,
  onActualBasisSourceChange,
  numeratorLabel,
  onNumeratorLabelChange,
  denominatorLabel,
  onDenominatorLabelChange,
  basisUnitType,
  onBasisUnitTypeChange,
  directBasisValue,
  onDirectBasisValueChange,
  basisQuarters,
  onBasisQuartersChange,
  basisKpiId,
  onBasisKpiChange,
  candidateKpis,
  currentKpiId,
  isCorporate,
  disabled = false,
}: BasisCalculationCardProps) {
  if (unitType !== "PERCENT" && unitType !== "RATIO") return null;

  const isPercent = unitType === "PERCENT";
  const targetNumber = Number(targetValue);
  
  // For ratio display: if target is 0.333, show as "1:3" (1 out of 3)
  // If target is 3, show as "3:1" (3 out of 1)
  let targetDisplay: string;
  if (Number.isFinite(targetNumber)) {
    if (isPercent) {
      targetDisplay = `${targetNumber}%`;
    } else {
      // For ratios less than 1, show as "1:X" format
      if (targetNumber > 0 && targetNumber < 1) {
        const denominator = Math.round(1 / targetNumber);
        targetDisplay = `1:${denominator}`;
      } else {
        targetDisplay = `${targetNumber}:1`;
      }
    }
  } else {
    targetDisplay = isPercent ? "the target percentage" : "the target ratio";
  }
  const requiredNumerator = calculateRequiredNumerator(
    targetValue,
    directBasisValue,
    unitType,
  );
  const quartersReconcile = basisQuartersEqualAnnual(
    directBasisValue,
    basisQuarters,
  );
  const basisCandidates = candidateKpis.filter(
    (candidate) =>
      candidate.kpiId !== currentKpiId &&
      !!candidate.unitType &&
      additiveUnits.has(candidate.unitType),
  );

  const updateAnnualBasis = (value: string) => {
    onDirectBasisValueChange(value);
    if (!isCorporate) onBasisQuartersChange(splitBasisEvenly(value));
  };

  return (
    <section className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <div className="flex items-start gap-3">
        <Calculator className="mt-0.5 h-5 w-5 text-blue-700" />
        <div>
          <h3 className="font-semibold text-slate-900">
            Percentage / ratio calculation
          </h3>
          <p className="text-sm text-slate-600">
            Define the approved denominator plan separately from the denominator
            used when users report actual results.
          </p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-blue-950">
          Approved denominator plan
        </Label>
        <p className="mt-1 text-xs text-slate-600">
          The denominator is the total, population, exposure, or capacity that
          {` ${numeratorLabel || "the numerator"}`} is measured against.
        </p>
      </div>

      <RadioGroup
        value={source}
        disabled={disabled}
        onValueChange={(value) =>
          onSourceChange(value as KpiCalculationBasisSource)
        }
        className="grid gap-3 md:grid-cols-3"
      >
        <label className="flex cursor-pointer gap-2 rounded-md border bg-white p-3">
          <RadioGroupItem value="NONE" className="mt-0.5" />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <PenLine className="h-4 w-4" /> Enter final result directly
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Enter the achieved {isPercent ? "percentage" : "ratio"} directly.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer gap-2 rounded-md border bg-white p-3">
          <RadioGroupItem value="DIRECT_VALUE" className="mt-0.5" />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Calculator className="h-4 w-4" /> Enter approved denominator
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Plan denominator values here and roll up exact components.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer gap-2 rounded-md border bg-white p-3">
          <RadioGroupItem value="LINKED_KPI" className="mt-0.5" />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Link2 className="h-4 w-4" /> Link approved denominator KPI
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Use an additive KPI as the denominator or weighting basis.
            </span>
          </span>
        </label>
      </RadioGroup>

      {source !== "NONE" && (
        <div className="grid gap-4 border-t border-blue-100 pt-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Numerator label</Label>
            <Input
              value={numeratorLabel}
              disabled={disabled}
              onChange={(event) => onNumeratorLabelChange(event.target.value)}
              placeholder={isPercent ? "e.g. Converted leads" : "e.g. Sales"}
            />
          </div>
          <div className="space-y-2">
            <Label>Denominator label</Label>
            <Input
              value={denominatorLabel}
              disabled={disabled}
              onChange={(event) => onDenominatorLabelChange(event.target.value)}
              placeholder={isPercent ? "e.g. Total leads" : "e.g. Representatives"}
            />
          </div>
        </div>
      )}

      {source === "DIRECT_VALUE" && (
        <div className="space-y-4 border-t border-blue-100 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Denominator unit</Label>
              <Select
                value={basisUnitType}
                disabled={disabled}
                onValueChange={(value) =>
                  onBasisUnitTypeChange(value as KpiUnitType)
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(basisUnitLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Annual {denominatorLabel || "basis"}</Label>
              <FormattedNumberInput
                value={directBasisValue}
                onValueChange={updateAnnualBasis}
                currency={basisUnitType === "CURRENCY"}
                disabled={disabled}
                min="0"
                step="any"
                placeholder="Enter the full annual value"
              />
              <p className="text-xs text-slate-500">
                Enter the full number; grouping separators are display-only.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-blue-200 bg-white p-3 text-sm">
            <p className="font-medium text-blue-950">
              Target direction: {targetDisplay}
            </p>
            <p className="mt-1 text-slate-600">
              {isPercent
                ? `${numeratorLabel || "Numerator"} ÷ ${denominatorLabel || "denominator"} × 100 must reach ${targetDisplay}.`
                : `${numeratorLabel || "Numerator"} ÷ ${denominatorLabel || "denominator"} must reach ${targetDisplay}.`}
            </p>
            {!isPercent && targetNumber >= 1 && (
              <p className="mt-1 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                Tip: For a 1 out of {Math.round(1 / targetNumber)} ratio, enter{" "}
                <strong>{(1 / Math.round(1 / targetNumber)).toFixed(4)}</strong>{" "}
                as the target instead of {targetNumber}.
              </p>
            )}
            <p className="mt-2 font-medium text-slate-900">
              Required annual {numeratorLabel || "numerator"}: {formatBasisNumber(requiredNumerator)}
            </p>
            <p className="text-xs text-slate-500">
              {isPercent
                ? "target × annual basis ÷ 100"
                : "target (as decimal) × annual basis"}
            </p>
          </div>

          {!isCorporate && (
            <div className="space-y-3">
              <div>
                <Label>Quarterly basis allocation</Label>
                <p className="text-xs text-slate-500">
                  The annual basis is split equally by default. You may edit Q1–Q4,
                  but their exact sum must equal the annual basis.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                {(["q1", "q2", "q3", "q4"] as const).map((quarter) => (
                  <div key={quarter} className="space-y-1">
                    <Label className="uppercase">{quarter}</Label>
                    <FormattedNumberInput
                      value={basisQuarters[quarter]}
                      onValueChange={(value) =>
                        onBasisQuartersChange({ ...basisQuarters, [quarter]: value })
                      }
                      currency={basisUnitType === "CURRENCY"}
                      disabled={disabled}
                      min="0"
                      step="any"
                    />
                    <p className="text-[11px] text-slate-500">
                      Required {numeratorLabel || "numerator"}: {formatBasisNumber(
                        calculateRequiredNumerator(
                          targetValue,
                          basisQuarters[quarter],
                          unitType,
                        ),
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <p
                className={`text-xs font-medium ${quartersReconcile ? "text-green-700" : "text-red-700"}`}
              >
                {quartersReconcile
                  ? "Quarterly basis values reconcile exactly to the annual basis."
                  : "Q1–Q4 basis values must sum exactly to the annual basis."}
              </p>
            </div>
          )}
        </div>
      )}

      {source === "LINKED_KPI" && (
        <div className="space-y-2 border-t border-blue-100 pt-4">
          <Label>Additive denominator KPI</Label>
          <Select
            value={basisKpiId || undefined}
            disabled={disabled || basisCandidates.length === 0}
            onValueChange={onBasisKpiChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select denominator or weighting basis KPI" />
            </SelectTrigger>
            <SelectContent>
              {basisCandidates.map((candidate) => (
                <SelectItem key={candidate.kpiId} value={candidate.kpiId}>
                  {candidate.name} ({candidate.unitType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            The linked KPI supplies the approved additive denominator. {targetDisplay}{" "}
            is retained for every child while results roll up as summed numerators
            divided by summed denominators.
          </p>
          {basisCandidates.length === 0 && (
            <p className="text-xs font-medium text-amber-700">
              No additive Currency, Number, Count, or Hours KPI is available.
            </p>
          )}
        </div>
      )}

      {source !== "NONE" && (
        <div className="space-y-3 border-t border-blue-200 pt-4">
          <div>
            <Label className="text-sm font-semibold text-blue-950">
              Actual denominator used for results
            </Label>
            <p className="mt-1 text-xs text-slate-600">
              Choose the denominator used when a result is reported. This does not
              change the approved denominator plan above.
            </p>
          </div>
          <RadioGroup
            value={actualBasisSource}
            disabled={disabled}
            onValueChange={(value) =>
              onActualBasisSourceChange(value as KpiActualBasisSource)
            }
            className="grid gap-3 md:grid-cols-3"
          >
            <label className="flex cursor-pointer gap-2 rounded-md border bg-white p-3">
              <RadioGroupItem value="USE_APPROVED_BASIS" className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">
                  Use approved denominator
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Use the approved denominator for the reporting quarter. Users do
                  not enter another denominator.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-2 rounded-md border bg-white p-3">
              <RadioGroupItem value="ENTER_ACTUAL_BASIS" className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">
                  Enter actual denominator
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Users enter the actual population, exposure, or capacity with each
                  reported result.
                </span>
              </span>
            </label>
            <label
              className={`flex gap-2 rounded-md border bg-white p-3 ${
                source === "LINKED_KPI"
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-60"
              }`}
            >
              <RadioGroupItem
                value="LINKED_KPI_ACTUAL"
                disabled={disabled || source !== "LINKED_KPI"}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium">
                  Use linked KPI actual
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Resolve the denominator from the approved actual of the linked
                  additive KPI. Reporting waits until that value is available.
                </span>
              </span>
            </label>
          </RadioGroup>
          <div className="rounded-md border border-blue-200 bg-white p-3 text-xs text-slate-700">
            <strong>Formula:</strong> {numeratorLabel || "Numerator"} ÷{" "}
            {denominatorLabel || "Denominator"}
            {isPercent ? " × 100" : ""}. Higher results move toward the configured
            target of {targetDisplay}.
          </div>
        </div>
      )}
    </section>
  );
}
