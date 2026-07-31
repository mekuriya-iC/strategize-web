"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  KpiCandidate,
  MetricDefinition,
} from "@/hooks/kpi-formulas/useKpiFormulas";
import {
  createFormulaTerm,
  normalizeTermPositions,
  renderCanonicalTerms,
  type ExpressionSourceType,
  type FormulaTermDraft,
  type KpiFormulaExpressionSide,
  type KpiFormulaTermOperator,
} from "./formulaExpression";

interface FormulaTermEditorProps {
  label: string;
  side: KpiFormulaExpressionSide;
  terms: FormulaTermDraft[];
  onChange: (terms: FormulaTermDraft[]) => void;
  metrics: MetricDefinition[];
  kpis: KpiCandidate[];
  targetKpiId?: string;
  single?: boolean;
}

export function FormulaTermEditor({
  label,
  side,
  terms,
  onChange,
  metrics,
  kpis,
  targetKpiId,
  single = false,
}: FormulaTermEditorProps) {
  const update = (index: number, patch: Partial<FormulaTermDraft>) => {
    onChange(
      normalizeTermPositions(
        terms.map((term, termIndex) =>
          termIndex === index ? { ...term, ...patch } : term,
        ),
        side,
      ),
    );
  };

  const changeSourceType = (index: number, sourceType: ExpressionSourceType) => {
    update(index, {
      sourceType,
      metricDefinitionId: sourceType === "METRIC" ? "" : undefined,
      metricDefinition: undefined,
      sourceKpiId: sourceType === "KPI" ? "" : undefined,
      sourceKpi: undefined,
      constantValueExact: sourceType === "CONSTANT" ? "" : undefined,
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= terms.length) return;
    const next = [...terms];
    const [term] = next.splice(from, 1);
    next.splice(to, 0, term);
    onChange(normalizeTermPositions(next, side));
  };

  const metricOptions = metrics.map((metric) => ({
    value: metric.id,
    label: metric.name,
    description: `${metric.code} · ${metric.unitType}`,
  }));
  const kpiOptions = kpis
    .filter((kpi) => kpi.kpiId !== targetKpiId)
    .map((kpi) => ({
      value: kpi.kpiId,
      label: kpi.name,
      description: kpi.measurementUnit ?? kpi.unitType ?? "KPI",
    }));

  return (
    <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label>{label}</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {single
              ? "Exactly one source multiplied by an exact factor."
              : "Terms are evaluated in the audited order shown."}
          </p>
        </div>
        {!single && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange(
                normalizeTermPositions(
                  [...terms, createFormulaTerm(side)],
                  side,
                ),
              )
            }
          >
            <Plus className="h-4 w-4" /> Add term
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {terms.map((term, index) => (
          <div key={term.key} className="rounded-md border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {single ? "Scalar term" : `Term ${index + 1}`}
              </span>
              {!single && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move ${label} term ${index + 1} up`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, index + 1)}
                    disabled={index === terms.length - 1}
                    aria-label={`Move ${label} term ${index + 1} down`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      onChange(
                        normalizeTermPositions(
                          terms.filter((_, termIndex) => termIndex !== index),
                          side,
                        ),
                      )
                    }
                    disabled={terms.length === 1}
                    aria-label={`Remove ${label} term ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {!single && (
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={term.operator}
                    onValueChange={(operator: KpiFormulaTermOperator) =>
                      update(index, { operator })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADD">Add (+)</SelectItem>
                      <SelectItem value="SUBTRACT">Subtract (−)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Source type</Label>
                <Select
                  value={term.sourceType}
                  onValueChange={(value: ExpressionSourceType) =>
                    changeSourceType(index, value)
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="METRIC">Metric</SelectItem>
                    <SelectItem value="KPI">KPI</SelectItem>
                    <SelectItem value="CONSTANT">Constant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Source</Label>
                {term.sourceType === "METRIC" ? (
                  <SearchableSelect
                    options={metricOptions}
                    value={term.metricDefinitionId ?? ""}
                    onValueChange={(metricDefinitionId) => {
                      const metricDefinition = metrics.find(
                        (metric) => metric.id === metricDefinitionId,
                      );
                      update(index, { metricDefinitionId, metricDefinition });
                    }}
                    placeholder="Select metric"
                    searchPlaceholder="Search metrics..."
                    emptyMessage="No active metrics found."
                  />
                ) : term.sourceType === "KPI" ? (
                  <SearchableSelect
                    options={kpiOptions}
                    value={term.sourceKpiId ?? ""}
                    onValueChange={(sourceKpiId) => {
                      const sourceKpi = kpis.find(
                        (kpi) => kpi.kpiId === sourceKpiId,
                      );
                      update(index, { sourceKpiId, sourceKpi });
                    }}
                    placeholder="Select source KPI"
                    searchPlaceholder="Search KPIs..."
                    emptyMessage="No eligible KPI sources found."
                  />
                ) : (
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={term.constantValueExact ?? ""}
                    onChange={(event) =>
                      update(index, { constantValueExact: event.target.value })
                    }
                    placeholder="e.g. 1/3 or 12.5"
                    className="font-mono"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Exact factor</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={term.factorExact}
                  onChange={(event) => update(index, { factorExact: event.target.value })}
                  placeholder="1 or 1/3"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border bg-background px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Canonical {label.toLowerCase()} preview
        </p>
        <p className="mt-1 wrap-break-word font-mono text-sm">
          {renderCanonicalTerms(terms)}
        </p>
      </div>
    </section>
  );
}
