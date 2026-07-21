"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_KPI, GET_KPI_UPDATES } from "@/lib/graphql/queries/kpis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, TrendingUp, Calendar } from "lucide-react";
import {
  KpiProgressDialog,
  KpiProgressHistory,
  KpiPerformanceChart,
  KpiAssignmentDialog,
  SharedKpiParticipants,
} from "@/components/kpis";
import { getUnitLabel, getUnitName } from "@/utils/kpi-format";
import { GET_KPI_FORMULA_ANNUAL_ACTUAL } from "@/lib/graphql/queries/kpi-formula-planning";
import { useAuthStore } from "@/stores";

const KPI_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  shared: "Shared",
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
};

type KpiDetail = {
  customUnitLabel?: string | null;
  measurementUnit?: string | null;
  unitType?: string | null;
};

const getMeasurementUnitDisplay = (kpi: KpiDetail) => {
  if (kpi.customUnitLabel?.trim()) {
    return {
      valueLabel: kpi.customUnitLabel.trim(),
      fullName: kpi.customUnitLabel.trim(),
    };
  }

  if (kpi.unitType) {
    const valueLabel = getUnitLabel(kpi.unitType);
    const fullName = getUnitName(kpi.unitType);

    return {
      valueLabel: valueLabel || kpi.measurementUnit || "",
      fullName:
        fullName && fullName !== "Unknown"
          ? fullName
          : (kpi.measurementUnit ?? "Not set"),
    };
  }

  switch (kpi.measurementUnit) {
    case "percentage":
      return { valueLabel: "%", fullName: "Percentage" };
    case "currency":
      return { valueLabel: "ETB", fullName: "Currency (ETB)" };
    case "hour":
      return { valueLabel: "hrs", fullName: "Hours" };
    case "rating":
      return { valueLabel: "Rating", fullName: "Rating" };
    case "boolean":
      return { valueLabel: "Yes/No", fullName: "Boolean" };
    case "number":
      return { valueLabel: "", fullName: "Number" };
    default:
      return {
        valueLabel: kpi.measurementUnit ?? "",
        fullName: kpi.measurementUnit ?? "Not set",
      };
  }
};

const formatValueWithUnit = (value: number, unitLabel: string) => {
  if (!unitLabel) {
    return value.toString();
  }

  if (unitLabel === "%") {
    return `${value}%`;
  }

  if (unitLabel === "ETB") {
    return `${value.toLocaleString()} ETB`;
  }

  return `${value} ${unitLabel}`;
};

export default function KpiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const kpiId = params.id as string;

  // Fetch KPI details
  const { data: kpiData, loading: kpiLoading } = useQuery(GET_KPI, {
    variables: { kpiId },
  });

  // Fetch KPI updates
  const { data: updatesData } = useQuery(GET_KPI_UPDATES, {
    variables: {
      kpiId,
      page: 1,
      limit: 100,
    },
  });

  const kpi = kpiData?.kpi;
  const updates = updatesData?.kpiUpdates?.items || [];
  const strategicPeriodId = kpi?.objective?.strategicPeriod?.strategicPeriodId;
  const { data: annualFormulaData } = useQuery(GET_KPI_FORMULA_ANNUAL_ACTUAL, {
    variables: {
      organizationId: currentUser?.organizationId ?? "",
      kpiId,
      annualPeriodId: strategicPeriodId ?? "",
    },
    skip:
      (kpi?.calculationType !== "RATIO_FORMULA" &&
        kpi?.calculationType !== "WEIGHTED_INDEX") ||
      !currentUser?.organizationId ||
      !strategicPeriodId,
  });
  const annualFormulaActual = annualFormulaData?.kpiFormulaAnnualActual;

  // Debug: Log KPI data to see what's being returned
  if (kpi) {
    console.log("🎯 KPI Data:", {
      kpiId: kpi.kpiId,
      name: kpi.name,
      targetValue: kpi.targetValue,
      baselineValue: kpi.baselineValue,
      baseline: kpi.baseline,
      weight: kpi.weight,
      measurementUnit: kpi.measurementUnit,
    });
  }

  if (kpiLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KPI details...</p>
        </div>
      </div>
    );
  }

  if (!kpi) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">KPI not found</p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "NOT_SUBMITTED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const measurementUnitDisplay = getMeasurementUnitDisplay(kpi);
  const kpiTypeLabel = KPI_TYPE_LABELS[kpi.kpiType] ?? kpi.kpiType;
  const frequencyLabel = FREQUENCY_LABELS[kpi.frequency] ?? kpi.frequency;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {kpi.name}
                </h1>
                {kpi.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {kpi.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-14">
              <Badge variant="outline" className={getStatusColor(kpi.status)}>
                {kpi.status?.replace(/_/g, " ")}
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {kpiTypeLabel}
              </Badge>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                {frequencyLabel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {strategicPeriodId && (
            <>
              <KpiProgressDialog
                kpi={{
                  kpiId: kpi.kpiId,
                  name: kpi.name,
                  targetValue: kpi.targetValue,
                  measurementUnit: kpi.measurementUnit,
                  baselineValue: kpi.baselineValue,
                  unitType: kpi.unitType,
                  calculationBasisSource: kpi.calculationBasisSource,
                  directBasisValue: kpi.directBasisValue,
                  numeratorLabel: kpi.numeratorLabel,
                  denominatorLabel: kpi.denominatorLabel,
                  basisUnitType: kpi.basisUnitType,
                }}
                strategicPeriodId={strategicPeriodId}
              />
              <KpiAssignmentDialog
                kpi={{
                  kpiId: kpi.kpiId,
                  name: kpi.name,
                  targetValue: kpi.targetValue,
                  measurementUnit: kpi.measurementUnit,
                }}
                strategicPeriodId={strategicPeriodId}
              />
            </>
          )}
        </div>
      </div>

      {/* KPI Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-blue-600" />
            KPI Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Target Value
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {kpi.targetValue !== null && kpi.targetValue !== undefined ? (
                  formatValueWithUnit(
                    kpi.targetValue,
                    measurementUnitDisplay.valueLabel,
                  )
                ) : (
                  <span className="text-gray-400 text-base">Not set</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Baseline
              </p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {kpi.baselineValue !== null &&
                kpi.baselineValue !== undefined ? (
                  formatValueWithUnit(
                    kpi.baselineValue,
                    measurementUnitDisplay.valueLabel,
                  )
                ) : kpi.baseline !== null && kpi.baseline !== undefined ? (
                  formatValueWithUnit(
                    kpi.baseline,
                    measurementUnitDisplay.valueLabel,
                  )
                ) : (
                  <span className="text-gray-400 text-base">Not set</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Weight
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {kpi.weight !== null && kpi.weight !== undefined ? (
                  `${kpi.weight}%`
                ) : (
                  <span className="text-gray-400 text-base">Not set</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Measurement Unit
              </p>
              <p className="text-2xl font-bold text-green-600">
                {measurementUnitDisplay.fullName || (
                  <span className="text-gray-400 text-base">Not set</span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-gray-200 pt-6 md:grid-cols-4 dark:border-gray-700">
            <div>
              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                Local calculation
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {kpi.calculationType === "RATIO_FORMULA"
                  ? "Ratio formula"
                  : kpi.calculationType === "WEIGHTED_INDEX"
                    ? "Weighted index"
                    : "Manual value"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                Child aggregation
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {kpi.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE"
                  ? "Denominator-weighted average"
                  : kpi.aggregationMethod === "SIMPLE_AVERAGE"
                    ? "Equal average"
                    : "Sum"}
              </p>
            </div>
            {kpi.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE" && (
              <>
                <div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    Weighting basis
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {kpi.calculationBasisSource === "DIRECT_VALUE"
                      ? "Direct basis values"
                      : kpi.weightingBasisKpi?.name || "Not configured"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    Weight source
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {kpi.aggregationWeightSource === "APPROVED_ACTUAL"
                      ? "Approved basis actual"
                      : "Approved basis target"}
                  </p>
                </div>
              </>
            )}
          </div>

          {(kpi.calculationBasisSource === "DIRECT_VALUE" ||
            kpi.calculationBasisSource === "LINKED_KPI") && (
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
              <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Basis formula
              </p>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="font-medium">
                    {kpi.calculationBasisSource === "DIRECT_VALUE"
                      ? "Direct value"
                      : "Linked KPI"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Formula</p>
                  <p className="font-medium">
                    {kpi.numeratorLabel || "Numerator"} ÷ {kpi.denominatorLabel || "Denominator"}
                    {kpi.unitType === "PERCENT" ? " × 100" : ""}
                  </p>
                </div>
                {kpi.calculationBasisSource === "DIRECT_VALUE" && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Annual basis</p>
                      <p className="font-medium">
                        {Number(kpi.directBasisValue || 0).toLocaleString()} {kpi.basisUnitType || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quarter basis</p>
                      <p className="font-medium">
                        {(kpi.quarterPlans || [])
                          .map((plan: { quarterNumber: number; directBasisTarget?: string | null }) =>
                            `Q${plan.quarterNumber}: ${Number(plan.directBasisTarget || 0).toLocaleString()}`,
                          )
                          .join(" · ") || "Generated by the backend"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {kpi.objective && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Linked Objective
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{kpi.objective.level}</Badge>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {kpi.objective.title}
                </span>
              </div>
            </div>
          )}

          {kpi.createdBy && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                Created by {kpi.createdBy.fullName} on{" "}
                {new Date(kpi.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {(kpi.calculationType === "RATIO_FORMULA" ||
        kpi.calculationType === "WEIGHTED_INDEX") &&
        annualFormulaActual && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Exact annual formula actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">
                  {annualFormulaActual.status.replaceAll("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {kpi.calculationType === "WEIGHTED_INDEX"
                    ? "Weighted numerator"
                    : "Numerator"}
                </p>
                <p className="font-mono font-medium">
                  {annualFormulaActual.numeratorDecimal ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {kpi.calculationType === "WEIGHTED_INDEX"
                    ? "Total weight"
                    : "Denominator"}
                </p>
                <p className="font-mono font-medium">
                  {annualFormulaActual.denominatorDecimal ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Annual result</p>
                <p className="font-mono font-medium">
                  {annualFormulaActual.resultDecimal ?? "—"}
                </p>
              </div>
            </div>
            {annualFormulaActual.resultExact && (
              <p className="break-all rounded-md bg-muted/40 p-3 font-mono text-xs">
                {annualFormulaActual.numeratorExact ?? "—"} ÷{" "}
                {annualFormulaActual.denominatorExact ?? "—"} ={" "}
                {annualFormulaActual.resultExact}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {annualFormulaActual.completedQuarterCount}/4 quarter snapshots
              are calculable.{" "}
              {annualFormulaActual.message ??
                "No intermediate values were rounded."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Performance Visualization */}
      {updates.length > 0 && (
        <KpiPerformanceChart
          kpi={{
            kpiId: kpi.kpiId,
            name: kpi.name,
            targetValue: kpi.targetValue,
            baselineValue: kpi.baselineValue,
            measurementUnit: kpi.measurementUnit,
          }}
          updates={updates}
        />
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress History */}
        <KpiProgressHistory
          kpiId={kpi.kpiId}
          kpiName={kpi.name}
          targetValue={kpi.targetValue}
          measurementUnit={kpi.measurementUnit}
          strategicPeriodId={strategicPeriodId}
        />

        {/* Shared KPI Participants */}
        {strategicPeriodId && (
          <SharedKpiParticipants
            kpiId={kpi.kpiId}
            strategicPeriodId={strategicPeriodId}
          />
        )}
      </div>

      {/* Targets Timeline */}
      {kpi.targets && kpi.targets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Target Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpi.targets.map((target: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                    {target.timeline}
                  </p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatValueWithUnit(
                      target.target,
                      measurementUnitDisplay.valueLabel,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
