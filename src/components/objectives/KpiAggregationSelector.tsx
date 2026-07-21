"use client";

import { AlertCircle, Calculator } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  KpiAggregationMethod,
  KpiAggregationWeightSource,
  KpiCarryPolicy,
  KpiCalculationBasisSource,
  KpiUnitType,
} from "@/types/graphql";

interface KpiAggregationSelectorProps {
  method: KpiAggregationMethod;
  onMethodChange: (value: KpiAggregationMethod) => void;
  basisKpiId?: string;
  onBasisChange: (value: string) => void;
  weightSource: KpiAggregationWeightSource;
  onWeightSourceChange: (value: KpiAggregationWeightSource) => void;
  carryPolicy: KpiCarryPolicy;
  onCarryPolicyChange: (value: KpiCarryPolicy) => void;
  unitType?: KpiUnitType;
  calculationBasisSource?: KpiCalculationBasisSource;
  candidateKpis: Array<{
    kpiId: string;
    name: string;
    unitType?: KpiUnitType | null;
  }>;
  currentKpiId?: string;
  disabled?: boolean;
}

const additiveUnits = new Set<KpiUnitType>([
  "NUMBER",
  "CURRENCY",
  "COUNT",
  "HOUR",
]);

export function KpiAggregationSelector({
  method,
  onMethodChange,
  basisKpiId,
  onBasisChange,
  weightSource,
  onWeightSourceChange,
  carryPolicy,
  onCarryPolicyChange,
  unitType,
  calculationBasisSource = "NONE",
  candidateKpis,
  currentKpiId,
  disabled = false,
}: KpiAggregationSelectorProps) {
  const percentageCompatible = unitType === "PERCENT" || unitType === "RATIO";
  const weighted = method === "DENOMINATOR_WEIGHTED_AVERAGE";
  const directBasis = calculationBasisSource === "DIRECT_VALUE";
  const linkedBasis = calculationBasisSource === "LINKED_KPI";
  const needsStandaloneBasis = weighted && !directBasis && !linkedBasis;
  const weightedMethodLabel =
    unitType === "RATIO"
      ? "Denominator-weighted ratio average"
      : "Denominator-weighted percentage average";
  const basisOptions = candidateKpis.filter(
    (candidate) =>
      candidate.kpiId !== currentKpiId &&
      candidate.unitType &&
      additiveUnits.has(candidate.unitType),
  );

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-start gap-3">
        <Calculator className="mt-0.5 h-5 w-5 text-slate-600" />
        <div>
          <h3 className="font-semibold text-slate-900">Aggregation calculation</h3>
          <p className="text-sm text-slate-600">
            Configure how immediate child results contribute to this KPI. This is
            independent of Direct, Aggregated, or Hybrid performance mode.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Aggregation method</Label>
          <Select
            value={method}
            disabled={disabled}
            onValueChange={(value) => {
              const next = value as KpiAggregationMethod;
              onMethodChange(next);
              if (next === "DENOMINATOR_WEIGHTED_AVERAGE") {
                onCarryPolicyChange("NONE");
              } else if (calculationBasisSource === "NONE") {
                onBasisChange("");
              }
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SUM">Sum child values</SelectItem>
              <SelectItem value="SIMPLE_AVERAGE">Equal average</SelectItem>
              <SelectItem
                value="DENOMINATOR_WEIGHTED_AVERAGE"
                disabled={!percentageCompatible}
              >
                {unitType === "RATIO"
                  ? "Denominator-weighted ratio average"
                  : "Denominator-weighted percentage average"}
              </SelectItem>
            </SelectContent>
          </Select>
          {weighted && (
            <p className="text-xs text-slate-500">
              {directBasis
                ? "Child numerators and direct denominator values roll up as exact formula components; no linked weighting KPI is required."
                : linkedBasis
                  ? `${weightedMethodLabel} uses the additive KPI selected in Basis calculation above.`
                  : `${weightedMethodLabel} weights each child result using an additive basis KPI. Choose Equal average when every child should contribute equally.`}
            </p>
          )}
          {!percentageCompatible && (
            <p className="text-xs text-slate-500">
              Denominator-weighted averaging is available only for percentage or
              ratio KPIs.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Quarter carry-forward</Label>
          <Select
            value={carryPolicy}
            disabled={disabled || weighted}
            onValueChange={(value) =>
              onCarryPolicyChange(value as KpiCarryPolicy)
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ADDITIVE">Add variance to next quarter</SelectItem>
              <SelectItem value="NONE">No carry-forward</SelectItem>
            </SelectContent>
          </Select>
          {weighted && (
            <p className="text-xs text-slate-500">
              Percentage-point variance is not added to the next quarter.
            </p>
          )}
        </div>
      </div>

      {needsStandaloneBasis && (
        <div className="grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Weighting-basis KPI</Label>
            <Select
              value={basisKpiId || undefined}
              disabled={disabled || basisOptions.length === 0}
              onValueChange={onBasisChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select denominator or additive basis KPI" />
              </SelectTrigger>
              <SelectContent>
                {basisOptions.map((candidate) => (
                  <SelectItem key={candidate.kpiId} value={candidate.kpiId}>
                    {candidate.name} ({candidate.unitType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Performance weight source</Label>
            <Select
              value={weightSource}
              disabled={disabled}
              onValueChange={(value) =>
                onWeightSourceChange(value as KpiAggregationWeightSource)
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED_TARGET">Approved basis target</SelectItem>
                <SelectItem value="APPROVED_ACTUAL">Approved basis actual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {basisOptions.length === 0 && (
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 md:col-span-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              This method needs an additive denominator or weighting basis. Create
              or cascade a KPI such as Revenue, Pipeline, Count, or Hours first, or
              choose Equal average if every child should contribute equally.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
