"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import type {
  LogbookKpiCalculationType,
  LogbookFormulaForContextQueryData,
} from "@/types/logbook";

interface FormulaConfigurationCardProps {
  calculationType: LogbookKpiCalculationType;
  formula?: LogbookFormulaForContextQueryData["logbookFormulaForContext"];
  unitType?: string;
  measurementUnit?: string;
  numeratorLabel?: string | null;
  denominatorLabel?: string | null;
}

export function FormulaConfigurationCard({
  calculationType,
  formula,
  unitType,
  measurementUnit,
  numeratorLabel,
  denominatorLabel,
}: FormulaConfigurationCardProps) {
  const getCalculationTypeLabel = () => {
    switch (calculationType) {
      case "RATIO_FORMULA":
        return "Ratio Formula";
      case "SCALAR_FORMULA":
        return "Scalar Formula";
      case "WEIGHTED_INDEX":
        return "Weighted Index";
      case "MANUAL_VALUE":
        return "Direct Value Entry";
      default:
        return calculationType;
    }
  };

  const getCalculationDescription = () => {
    switch (calculationType) {
      case "RATIO_FORMULA":
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Formula: <span className="font-mono font-semibold">Numerator ÷ Denominator × {formula?.multiplier || 100}</span>
            </p>
            
            {formula?.numeratorSourceType && (
              <div className="pl-4 border-l-2 border-blue-500">
                <p className="text-sm font-medium">
                  Numerator: {numeratorLabel || formula?.numeratorMetricDefinition?.name || "Value"}
                </p>
                {formula.numeratorSourceType === "METRIC" && formula.numeratorMetricDefinition && (
                  <p className="text-xs text-muted-foreground">
                    Metric: {formula.numeratorMetricDefinition.name}
                  </p>
                )}
                {!formula.numeratorMetricDefinition && !formula.numeratorKpi && (
                  <p className="text-xs text-muted-foreground">
                    Enter your numerator value manually
                  </p>
                )}
              </div>
            )}
            
            {formula?.denominatorSourceType && (
              <div className="pl-4 border-l-2 border-amber-500">
                <p className="text-sm font-medium">
                  Denominator: {denominatorLabel || formula?.denominatorMetricDefinition?.name || "Total"}
                </p>
                {formula.denominatorSourceType === "METRIC" && formula.denominatorMetricDefinition && (
                  <p className="text-xs text-muted-foreground">
                    Metric: {formula.denominatorMetricDefinition.name}
                  </p>
                )}
                {!formula.denominatorMetricDefinition && !formula.denominatorKpi && (
                  <p className="text-xs text-muted-foreground">
                    Enter your denominator value manually
                  </p>
                )}
              </div>
            )}

            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                📝 Example:
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {numeratorLabel && denominatorLabel ? (
                  <>
                    If you {numeratorLabel.toLowerCase()} = <span className="font-semibold">3</span> and {denominatorLabel.toLowerCase()} = <span className="font-semibold">10</span>
                    <br />
                    Result: 3 ÷ 10 × {formula?.multiplier || 100} = <span className="font-semibold">{((3 / 10) * (formula?.multiplier || 100)).toFixed(1)}{unitType === "PERCENT" ? "%" : ""}</span>
                  </>
                ) : (
                  <>
                    If numerator = <span className="font-semibold">75</span> and denominator = <span className="font-semibold">100</span>
                    <br />
                    Result: 75 ÷ 100 × {formula?.multiplier || 100} = <span className="font-semibold">75{unitType === "PERCENT" ? "%" : ""}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        );

      case "SCALAR_FORMULA":
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter the required metric observations. The system will calculate the result using the configured formula.
            </p>
            {formula?.expressionTerms && formula.expressionTerms.length > 0 && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Required Metrics:
                </p>
                <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                  {formula.expressionTerms
                    .filter((term) => term.metricDefinition)
                    .map((term, idx) => (
                      <li key={idx}>
                        {term.metricDefinition?.name} ({term.metricDefinition?.unitType})
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "WEIGHTED_INDEX":
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Weighted average of multiple components. Enter values for each component.
            </p>
            {formula?.components && formula.components.length > 0 && (
              <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-md">
                <p className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Components:
                </p>
                <div className="space-y-2">
                  {formula.components.map((component, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-purple-800 dark:text-purple-200">
                        {component.metricDefinition?.name || `Component ${idx + 1}`}
                      </span>
                      <span className="font-semibold text-purple-900 dark:text-purple-100">
                        Weight: {(Number(component.weight || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "MANUAL_VALUE":
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter your actual achievement value directly.
            </p>
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-md">
              <p className="text-xs text-green-800 dark:text-green-200">
                Simply input the value that represents your achievement for this period.
                {unitType && (
                  <>
                    {" "}
                    Unit: <span className="font-semibold">{measurementUnit || unitType}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>How to log this KPI</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Calculation Type</p>
          <p className="text-sm font-medium">{getCalculationTypeLabel()}</p>
        </div>
        
        {getCalculationDescription()}
      </CardContent>
    </Card>
  );
}
