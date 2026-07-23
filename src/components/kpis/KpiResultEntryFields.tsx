"use client";

import { AlertCircle, Calculator } from "lucide-react";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  KpiActualBasisSource,
  KpiResultInputMode,
  KpiUnitType,
} from "@/types/graphql";
import type { KpiResultEntryContext } from "@/types/logbook";
import {
  calculateKpiResultPreview,
  isExactDecimal,
  isPositiveExactDecimal,
} from "@/utils/basisCalculation";

interface KpiResultEntryFieldsProps {
  unitType: KpiUnitType;
  inputMode: KpiResultInputMode;
  onInputModeChange: (value: KpiResultInputMode) => void;
  numeratorExact: string;
  onNumeratorExactChange: (value: string) => void;
  rateExact: string;
  onRateExactChange: (value: string) => void;
  actualBasisExact: string;
  onActualBasisExactChange: (value: string) => void;
  context?: KpiResultEntryContext | null;
  contextLoading?: boolean;
  fallbackActualBasisSource?: KpiActualBasisSource | null;
  fallbackNumeratorLabel?: string | null;
  fallbackDenominatorLabel?: string | null;
  fallbackBasisUnitType?: string | null;
  disabled?: boolean;
}

const basisUnitLabel = (unitType?: string | null): string => {
  switch (unitType) {
    case "CURRENCY":
      return "ETB";
    case "HOUR":
      return "hours";
    case "COUNT":
      return "count";
    case "NUMBER":
      return "number";
    default:
      return unitType || "value";
  }
};

const sourceLabel = (source: KpiActualBasisSource): string => {
  switch (source) {
    case "ENTER_ACTUAL_BASIS":
      return "Entered actual denominator";
    case "LINKED_KPI_ACTUAL":
      return "Linked KPI approved actual";
    case "USE_APPROVED_BASIS":
    default:
      return "Approved denominator plan";
  }
};

export function getResultEntryResolvedBasis({
  actualBasisSource,
  actualBasisExact,
  context,
}: {
  actualBasisSource: KpiActualBasisSource;
  actualBasisExact: string;
  context?: KpiResultEntryContext | null;
}): string {
  return actualBasisSource === "ENTER_ACTUAL_BASIS"
    ? actualBasisExact
    : context?.resolvedBasisExact || "";
}

export function isKpiResultEntryValid({
  inputMode,
  numeratorExact,
  rateExact,
  resolvedBasisExact,
  basisAvailable,
}: {
  inputMode: KpiResultInputMode;
  numeratorExact: string;
  rateExact: string;
  resolvedBasisExact: string;
  basisAvailable: boolean;
}): boolean {
  const enteredValue = inputMode === "NUMERATOR" ? numeratorExact : rateExact;
  return (
    isExactDecimal(enteredValue) &&
    basisAvailable &&
    isPositiveExactDecimal(resolvedBasisExact)
  );
}

export function KpiResultEntryFields({
  unitType,
  inputMode,
  onInputModeChange,
  numeratorExact,
  onNumeratorExactChange,
  rateExact,
  onRateExactChange,
  actualBasisExact,
  onActualBasisExactChange,
  context,
  contextLoading = false,
  fallbackActualBasisSource = "USE_APPROVED_BASIS",
  fallbackNumeratorLabel,
  fallbackDenominatorLabel,
  fallbackBasisUnitType,
  disabled = false,
}: KpiResultEntryFieldsProps) {
  const actualBasisSource =
    context?.actualBasisSource ||
    fallbackActualBasisSource ||
    "USE_APPROVED_BASIS";
  const numeratorLabel =
    context?.numeratorLabel || fallbackNumeratorLabel || "Numerator";
  const denominatorLabel =
    context?.denominatorLabel || fallbackDenominatorLabel || "Denominator";
  const denominatorUnitType =
    context?.basisUnitType || fallbackBasisUnitType || "NUMBER";
  const denominatorUnit = basisUnitLabel(denominatorUnitType);
  const resolvedBasisExact = getResultEntryResolvedBasis({
    actualBasisSource,
    actualBasisExact,
    context,
  });
  const basisAvailable =
    actualBasisSource === "ENTER_ACTUAL_BASIS"
      ? isPositiveExactDecimal(actualBasisExact)
      : Boolean(context?.basisAvailable && resolvedBasisExact);
  const preview = calculateKpiResultPreview({
    inputMode,
    numeratorExact,
    rateExact,
    basisExact: resolvedBasisExact,
    unitType,
  });
  const rateSuffix = unitType === "PERCENT" ? "%" : ":1";
  const sourceDescription =
    actualBasisSource === "LINKED_KPI_ACTUAL" && context?.linkedBasisKpiName
      ? `${sourceLabel(actualBasisSource)} · ${context.linkedBasisKpiName}`
      : sourceLabel(actualBasisSource);

  return (
    <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex items-start gap-2">
        <Calculator className="mt-0.5 h-4 w-4 text-blue-700" />
        <div>
          <p className="text-sm font-semibold text-blue-950">
            Report percentage / ratio components
          </p>
          <p className="text-xs text-blue-800">
            {numeratorLabel} ÷ {denominatorLabel}
            {unitType === "PERCENT" ? " × 100" : ""}. The denominator is the
            total, population, exposure, or capacity being measured.
          </p>
        </div>
      </div>

      <RadioGroup
        value={inputMode}
        disabled={disabled}
        onValueChange={(value) => onInputModeChange(value as KpiResultInputMode)}
        className="grid gap-3 sm:grid-cols-2"
      >
        <label className="flex cursor-pointer gap-2 rounded-md border bg-white p-3">
          <RadioGroupItem value="NUMERATOR" className="mt-0.5" />
          <span>
            <span className="block text-sm font-medium">Enter numerator</span>
            <span className="block text-xs text-slate-500">
              Enter {numeratorLabel}; the result rate is derived.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer gap-2 rounded-md border bg-white p-3">
          <RadioGroupItem value="RATE_AND_BASIS" className="mt-0.5" />
          <span>
            <span className="block text-sm font-medium">Enter rate + basis</span>
            <span className="block text-xs text-slate-500">
              Enter the achieved result; the numerator is derived from the basis.
            </span>
          </span>
        </label>
      </RadioGroup>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            {inputMode === "NUMERATOR"
              ? numeratorLabel
              : unitType === "PERCENT"
                ? "Achieved percentage"
                : "Achieved ratio"}
          </Label>
          <div className="flex gap-2">
            <FormattedNumberInput
              step="any"
              min="0"
              value={inputMode === "NUMERATOR" ? numeratorExact : rateExact}
              onValueChange={
                inputMode === "NUMERATOR"
                  ? onNumeratorExactChange
                  : onRateExactChange
              }
              currency={
                inputMode === "NUMERATOR" && denominatorUnitType === "CURRENCY"
              }
              disabled={disabled}
              placeholder="0"
              className="flex-1"
            />
            <div className="flex items-center rounded-md bg-slate-100 px-3 text-sm text-slate-600">
              {inputMode === "NUMERATOR" ? denominatorUnit : rateSuffix}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{denominatorLabel}</Label>
          {actualBasisSource === "ENTER_ACTUAL_BASIS" ? (
            <FormattedNumberInput
              step="any"
              min="0"
              value={actualBasisExact}
              onValueChange={onActualBasisExactChange}
              currency={denominatorUnitType === "CURRENCY"}
              disabled={disabled}
              placeholder="Enter actual denominator"
            />
          ) : (
            <Input
              value={
                contextLoading
                  ? "Resolving denominator…"
                  : resolvedBasisExact
                    ? `${Number(resolvedBasisExact).toLocaleString()} ${denominatorUnit}`
                    : "Not available"
              }
              disabled
            />
          )}
          <p className="text-xs text-slate-500">{sourceDescription}</p>
        </div>
      </div>

      {!contextLoading && !basisAvailable && (
        <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {context?.message ||
              (actualBasisSource === "LINKED_KPI_ACTUAL"
                ? "The linked KPI actual is not approved or available yet."
                : "Enter a denominator greater than zero.")}
          </span>
        </div>
      )}

      {(preview.rateExact || preview.numeratorExact) && basisAvailable && (
        <div className="rounded-md border border-blue-200 bg-white p-3 text-sm">
          <p className="font-medium text-blue-950">Result preview</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <span className="block text-xs text-slate-500">Numerator</span>
              <strong>{preview.numeratorExact || "—"}</strong>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Denominator</span>
              <strong>{preview.basisExact || "—"}</strong>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Derived result</span>
              <strong>
                {preview.rateExact || "—"}
                {preview.rateExact ? rateSuffix : ""}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
