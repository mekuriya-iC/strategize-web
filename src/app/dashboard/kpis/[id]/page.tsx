"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import {
  Activity,
  ArrowLeft,
  Building2,
  Calculator,
  CalendarDays,
  Clock3,
  Database,
  Flag,
  Layers3,
  Network,
  Scale,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { GET_KPI, GET_KPI_UPDATES } from "@/lib/graphql/queries/kpis";
import { GET_KPI_ASSIGNMENT_BREAKDOWN } from "@/lib/graphql/queries/kpi-detail";
import { GET_KPI_FORMULA_DEFINITIONS } from "@/lib/graphql/queries/kpi-formulas";
import { GET_EMPLOYEES_BY_ID } from "@/lib/graphql/queries/employees";
import { GET_DEPARTMENTS_BY_ID } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS_BY_ID } from "@/lib/graphql/queries/divisions";
import {
  GET_KPI_FORMULA_ANNUAL_ACTUAL,
  GET_KPI_FORMULA_QUARTER_PLANS,
} from "@/lib/graphql/queries/kpi-formula-planning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KpiPerformanceChart,
  KpiProgressHistory,
  SharedKpiParticipants,
} from "@/components/kpis";
import { getUnitLabel, getUnitName } from "@/utils/kpi-format";

const labelize = (value?: string | null) =>
  value
    ? value
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not configured";

const statusClass = (status?: string | null) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "FINALIZED":
    case "CALCULATED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300";
    case "PENDING":
    case "SUBMITTED":
    case "PARTIAL":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300";
    case "REJECTED":
    case "FAILED":
    case "NOT_CALCULABLE":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
  }
};

type UnitContext = {
  customUnitLabel?: string | null;
  measurementUnit?: string | null;
  unitType?: string | null;
};

type FormulaSource = {
  id?: string;
  position?: number;
  side?: string;
  operator?: string;
  sourceType?: string;
  weight?: string | number;
  factorExact?: string;
  constantValueExact?: string | null;
  metricDefinition?: { name?: string; unitType?: string } | null;
  sourceKpi?: { name?: string; unitType?: string } | null;
  numeratorMetricDefinition?: { name?: string } | null;
  numeratorKpi?: { name?: string } | null;
  denominatorMetricDefinition?: { name?: string } | null;
  denominatorKpi?: { name?: string } | null;
};

type FormulaDefinition = FormulaSource & {
  calculationType?: string;
  temporalRollupMethod?: string;
  resultDirection?: string;
  zeroDenominatorPolicy?: string;
  targetRangeMin?: string | null;
  targetRangeMax?: string | null;
  targetRangeOutsidePolicy?: string;
  multiplier?: number;
  status?: string;
  version?: number;
  effectiveFrom?: string | null;
  approvedAt?: string | null;
  expressionTerms?: FormulaSource[];
  components?: FormulaSource[];
};

type FormulaQuarterPlan = {
  quarterPlanId?: string;
  quarterPlan?: { quarterNumber?: number };
  calculatedTargetExact?: string | null;
  calculatedTargetDecimal?: string | null;
  validationMessage?: string | null;
  components?: Array<{
    id: string;
    plannedValue?: string | number | null;
    formulaComponent?: FormulaSource;
  }>;
  expressionTermPlans?: Array<{
    id: string;
    plannedValue?: string | number | null;
    formulaExpressionTerm?: FormulaSource;
  }>;
};

type QuarterPlan = {
  kpiQuarterPlanId?: string;
  quarterNumber?: number;
  timeline?: string;
  originalTarget?: number | string | null;
  carryIn?: number | string | null;
  effectiveTarget?: number | string | null;
  directBasisTarget?: number | string | null;
  status?: string;
};

type QuarterResult = {
  quarterPlanId?: string;
  quarterNumber?: number;
  status?: string;
  finalActual?: number | string | null;
  finalAchievementRate?: number | string | null;
  calculationMode?: string;
  rollupNumeratorExact?: string | null;
  rollupDenominatorExact?: string | null;
};

type DirectAssigneeType =
  | "CORPORATE"
  | "DIVISION"
  | "DEPARTMENT"
  | "PERSONNEL"
  | "EMPLOYEE";

type AssignmentLookup = {
  organization?: { organizationId?: string } | null;
  division?: { divisionId?: string } | null;
  department?: { departmentId?: string } | null;
  employee?: { employeeId?: string } | null;
};

type AssignmentRow = {
  id: string;
  level: string;
  source: "Direct owner" | "Distribution";
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  detail?: string | null;
  targetValue?: number | null;
  weight?: number | null;
  parentWeightAllocation?: number | null;
  cap?: number | null;
  createdAt?: string;
  assignedBy?: { fullName?: string } | null;
  strategicPeriod?: { name?: string } | null;
};

type KpiTarget = { timeline?: string; target?: number | string | null };

const getUnitDisplay = (kpi: UnitContext) => {
  if (kpi.customUnitLabel?.trim()) {
    const label = kpi.customUnitLabel.trim();
    return { short: label, full: label };
  }
  if (kpi.unitType) {
    const short = getUnitLabel(kpi.unitType);
    const full = getUnitName(kpi.unitType);
    return {
      short: short || kpi.measurementUnit || "",
      full: full && full !== "Unknown" ? full : labelize(kpi.measurementUnit),
    };
  }
  const unit = kpi.measurementUnit?.toUpperCase();
  if (unit === "PERCENTAGE") return { short: "%", full: "Percentage" };
  if (unit === "CURRENCY") return { short: "ETB", full: "Currency (ETB)" };
  if (unit === "HOUR") return { short: "hrs", full: "Hours" };
  return { short: "", full: labelize(kpi.measurementUnit) };
};

const numeric = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value: unknown, maximumFractionDigits = 2) => {
  const parsed = numeric(value);
  return parsed === null
    ? "—"
    : parsed.toLocaleString(undefined, { maximumFractionDigits });
};

const formatValue = (value: unknown, unit: string) => {
  const rendered = formatNumber(value, 4);
  if (rendered === "—" || !unit) return rendered;
  if (unit === "%") return `${rendered}%`;
  if (unit === "ETB") return `${rendered} ETB`;
  return `${rendered} ${unit}`;
};

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value))
    : "—";

const sourceName = (source?: FormulaSource | null) =>
  source?.metricDefinition?.name ||
  source?.sourceKpi?.name ||
  source?.numeratorMetricDefinition?.name ||
  source?.numeratorKpi?.name ||
  source?.denominatorMetricDefinition?.name ||
  source?.denominatorKpi?.name ||
  source?.constantValueExact ||
  "Unconfigured source";

const operatorSymbol = (operator?: string | null) => {
  switch (operator) {
    case "SUBTRACT":
      return "−";
    case "MULTIPLY":
      return "×";
    case "DIVIDE":
      return "÷";
    default:
      return "+";
  }
};

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "blue" | "green" | "purple" | "amber";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    green:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    purple:
      "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  };
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
          {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
        </div>
        <div className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 wrap-break-word text-sm font-semibold text-foreground">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function KpiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kpiId = params.id as string;

  const { data: kpiData, loading: kpiLoading, error: kpiError } = useQuery(GET_KPI, {
    variables: { kpiId },
  });
  const kpi = kpiData?.kpi;
  const strategicPeriodId = kpi?.objective?.strategicPeriod?.strategicPeriodId;
  const organizationId = kpi?.organizationId;
  const assigneeType = kpi?.assigneeType?.toUpperCase() as
    | DirectAssigneeType
    | undefined;
  const assigneeId = kpi?.assigneeId;
  const hasEmployeeOwner =
    assigneeType === "PERSONNEL" || assigneeType === "EMPLOYEE";

  const { data: employeeOwnerData } = useQuery(GET_EMPLOYEES_BY_ID, {
    variables: { employeeId: assigneeId || "" },
    skip: !hasEmployeeOwner || !assigneeId,
  });
  const { data: departmentOwnerData } = useQuery(GET_DEPARTMENTS_BY_ID, {
    variables: { departmentId: assigneeId || "" },
    skip: assigneeType !== "DEPARTMENT" || !assigneeId,
  });
  const { data: divisionOwnerData } = useQuery(GET_DIVISIONS_BY_ID, {
    variables: { divisionId: assigneeId || "" },
    skip: assigneeType !== "DIVISION" || !assigneeId,
  });

  const { data: updatesData } = useQuery(GET_KPI_UPDATES, {
    variables: { kpiId, page: 1, limit: 100 },
  });
  const { data: assignmentsData, loading: assignmentsLoading } = useQuery(
    GET_KPI_ASSIGNMENT_BREAKDOWN,
    {
      variables: {
        kpiId,
        strategicPeriodId: strategicPeriodId || undefined,
        page: 1,
        limit: 500,
      },
      skip: !kpiId,
    },
  );
  const { data: formulaDefinitionsData } = useQuery(
    GET_KPI_FORMULA_DEFINITIONS,
    {
      variables: { organizationId: organizationId || "", kpiId, page: 1, limit: 20 },
      skip: !organizationId,
    },
  );
  const { data: formulaQuarterData } = useQuery(
    GET_KPI_FORMULA_QUARTER_PLANS,
    {
      variables: {
        organizationId: organizationId || "",
        kpiId,
        annualPeriodId: strategicPeriodId || undefined,
      },
      skip: !organizationId || !strategicPeriodId,
    },
  );
  const formulaEnabled =
    kpi?.calculationType && kpi.calculationType !== "MANUAL_VALUE";
  const { data: annualFormulaData } = useQuery(GET_KPI_FORMULA_ANNUAL_ACTUAL, {
    variables: {
      organizationId: organizationId || "",
      kpiId,
      annualPeriodId: strategicPeriodId || "",
    },
    skip: !formulaEnabled || !organizationId || !strategicPeriodId,
  });

  const updates = updatesData?.kpiUpdates?.items || [];
  const formulaDefinitions = (
    formulaDefinitionsData?.kpiFormulaDefinitions?.items || []
  ) as FormulaDefinition[];
  const formulaDefinition =
    formulaDefinitions.find((item) => item.status === "APPROVED") ||
    formulaDefinitions[0];
  const formulaExpressionTerms = formulaDefinition?.expressionTerms || [];
  const formulaComponents = formulaDefinition?.components || [];
  const formulaQuarterPlans = useMemo(
    () =>
      (formulaQuarterData?.kpiFormulaQuarterPlans || []) as FormulaQuarterPlan[],
    [formulaQuarterData],
  );
  const annualFormulaActual = annualFormulaData?.kpiFormulaAnnualActual;
  const directOwnerName =
    employeeOwnerData?.employee?.fullName ||
    departmentOwnerData?.department?.name ||
    divisionOwnerData?.division?.name ||
    (assigneeType === "CORPORATE" ? "Organization" : null);

  const assignments = useMemo(() => {
    const rows: AssignmentRow[] = [];
    for (const item of assignmentsData?.corporateAssignments?.items || []) {
      rows.push({
        id: item.kpiAssignmentCorporateId,
        level: "Corporate",
        source: "Distribution",
        icon: Building2,
        name: item.organization?.name || "Organization",
        detail: "Organization-wide accountability",
        ...item,
      });
    }
    for (const item of assignmentsData?.divisionAssignments?.items || []) {
      rows.push({
        id: item.kpiAssignmentDivisionId,
        level: "Division",
        source: "Distribution",
        icon: Network,
        name: item.division?.name || "Division",
        detail: item.division?.description,
        ...item,
      });
    }
    for (const item of assignmentsData?.departmentAssignments?.items || []) {
      rows.push({
        id: item.kpiAssignmentDepartmentId,
        level: "Department",
        source: "Distribution",
        icon: Layers3,
        name: item.department?.name || "Department",
        detail: item.department?.description,
        ...item,
      });
    }
    for (const item of assignmentsData?.employeeAssignments?.items || []) {
      rows.push({
        id: item.kpiAssignmentEmployeeId,
        level: "Employee",
        source: "Distribution",
        icon: UserRound,
        name: item.employee?.fullName || "Employee",
        detail: item.employee?.title || item.employee?.email,
        ...item,
      });
    }

    const hasMatchingDistribution = (() => {
      if (!assigneeId) return false;
      if (assigneeType === "CORPORATE") {
        return (assignmentsData?.corporateAssignments?.items || []).some(
          (item: AssignmentLookup) =>
            item.organization?.organizationId === assigneeId,
        );
      }
      if (assigneeType === "DIVISION") {
        return (assignmentsData?.divisionAssignments?.items || []).some(
          (item: AssignmentLookup) => item.division?.divisionId === assigneeId,
        );
      }
      if (assigneeType === "DEPARTMENT") {
        return (assignmentsData?.departmentAssignments?.items || []).some(
          (item: AssignmentLookup) =>
            item.department?.departmentId === assigneeId,
        );
      }
      if (hasEmployeeOwner) {
        return (assignmentsData?.employeeAssignments?.items || []).some(
          (item: AssignmentLookup) => item.employee?.employeeId === assigneeId,
        );
      }
      return false;
    })();

    if (assigneeId && assigneeType && !hasMatchingDistribution) {
      const directOwnerConfigs: Record<
        DirectAssigneeType,
        Pick<AssignmentRow, "level" | "icon">
      > = {
        CORPORATE: { level: "Corporate", icon: Building2 },
        DIVISION: { level: "Division", icon: Network },
        DEPARTMENT: { level: "Department", icon: Layers3 },
        PERSONNEL: { level: "Employee", icon: UserRound },
        EMPLOYEE: { level: "Employee", icon: UserRound },
      };
      const directOwnerConfig = directOwnerConfigs[assigneeType];

      if (directOwnerConfig) {
        rows.unshift({
          id: `direct-${kpi.kpiId}-${assigneeId}`,
          level: directOwnerConfig.level,
          source: "Direct owner",
          icon: directOwnerConfig.icon,
          name: directOwnerName || "Assigned organizational unit",
          detail: "Ownership is stored directly on this KPI",
          targetValue: kpi.targetValue,
          weight: kpi.weight,
          parentWeightAllocation: null,
          cap: null,
          createdAt: kpi.createdAt,
          assignedBy:
            kpi.assignerId && kpi.assignerId === kpi.createdBy?.employeeId
              ? kpi.createdBy
              : null,
          strategicPeriod: kpi.objective?.strategicPeriod,
        });
      }
    }

    return rows;
  }, [
    assigneeId,
    assigneeType,
    assignmentsData,
    directOwnerName,
    hasEmployeeOwner,
    kpi,
  ]);

  const quarters = useMemo(
    () =>
      [1, 2, 3, 4].map((quarterNumber) => {
        const plan = ((kpi?.quarterPlans || []) as QuarterPlan[]).find(
          (item) => item.quarterNumber === quarterNumber,
        );
        const result = ((kpi?.quarterResults || []) as QuarterResult[]).find(
          (item) =>
            item.quarterPlanId === plan?.kpiQuarterPlanId ||
            item.quarterNumber === quarterNumber,
        );
        const formulaPlan = formulaQuarterPlans.find(
          (item) =>
            item.quarterPlanId === plan?.kpiQuarterPlanId ||
            item.quarterPlan?.quarterNumber === quarterNumber,
        );
        return { quarterNumber, plan, result, formulaPlan };
      }),
    [formulaQuarterPlans, kpi?.quarterPlans, kpi?.quarterResults],
  );

  if (kpiLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-muted border-t-[#3838EC]" />
          <p className="text-sm text-muted-foreground">Loading complete KPI profile…</p>
        </div>
      </div>
    );
  }

  if (!kpi || kpiError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <Target className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
          <h1 className="text-xl font-bold">KPI not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {kpiError?.message || "This KPI could not be found or you do not have access."}
          </p>
          <Button className="mt-5" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const unit = getUnitDisplay(kpi);
  const currentActual = kpi.latestUpdate?.achievedValue;
  const declaredOwner = directOwnerName;
  const expectedOutcome = (() => {
    const direction = formulaDefinition?.resultDirection;
    if (direction === "LOWER_IS_BETTER")
      return `Keep the result at or below ${formatValue(kpi.targetValue, unit.short)}.`;
    if (direction === "TARGET_RANGE")
      return `Keep the result between ${formatValue(formulaDefinition?.targetRangeMin, unit.short)} and ${formatValue(formulaDefinition?.targetRangeMax, unit.short)}.`;
    return `Reach or exceed ${formatValue(kpi.targetValue, unit.short)} by the end of the strategic period.`;
  })();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-linear-to-r from-[#3838EC]/10 via-background to-purple-500/10 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="mt-1 shrink-0 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge className={statusClass(kpi.status)} variant="outline">
                    {labelize(kpi.status)}
                  </Badge>
                  <Badge variant="outline">{labelize(kpi.kpiType)}</Badge>
                  <Badge variant="outline">{labelize(kpi.frequency)}</Badge>
                  <Badge variant="outline">{labelize(kpi.calculationType)}</Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {kpi.name}
                </h1>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                  {kpi.description || "No KPI description has been provided."}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {kpi.objective?.strategicPeriod?.name || "No strategic period"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5" />
                    {kpi.objective?.title || "No linked objective"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    Updated {formatDate(kpi.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <MetricTile
            label="Annual target"
            value={formatValue(kpi.targetValue, unit.short)}
            detail={`${unit.full} · ${labelize(kpi.quarterlyAggregationMethod)} across quarters`}
            icon={Target}
          />
          <MetricTile
            label="Baseline"
            value={formatValue(kpi.baselineValue ?? kpi.baseline, unit.short)}
            detail="Starting point for performance comparison"
            icon={Activity}
            tone="amber"
          />
          <MetricTile
            label="Latest actual"
            value={formatValue(currentActual, unit.short)}
            detail={
              kpi.latestUpdate
                ? `${formatNumber(kpi.latestUpdate.progressPercentage)}% progress · ${formatDate(kpi.latestUpdate.reportingDate)}`
                : "No progress value recorded"
            }
            icon={TrendingUp}
            tone="green"
          />
          <MetricTile
            label="Performance weight"
            value={kpi.weight === null || kpi.weight === undefined ? "—" : `${formatNumber(kpi.weight)}%`}
            detail="Assignment-specific achievement caps are shown below"
            icon={Scale}
            tone="purple"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flag className="h-5 w-5 text-[#3838EC]" />
              What is expected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-[#3838EC]/20 bg-[#3838EC]/5 p-4">
              <p className="text-sm font-semibold text-[#3838EC]">Success expectation</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                System interpretation from the configured target and result direction
              </p>
              <p className="mt-1 text-sm leading-6">{expectedOutcome}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Measurement frequency" value={labelize(kpi.frequency)} />
              <DetailItem label="Measurement unit" value={unit.full} />
              <DetailItem label="KPI mode" value={labelize(kpi.kpiMode)} />
              <DetailItem label="Annual rollup" value={labelize(kpi.quarterlyAggregationMethod)} />
              <DetailItem label="Child aggregation" value={labelize(kpi.aggregationMethod)} />
              <DetailItem label="Carry-forward policy" value={labelize(kpi.carryPolicy)} />
              <DetailItem label="Target approval" value={labelize(kpi.targetStatus)} />
              <DetailItem label="Active" value={kpi.isActive ? "Yes" : "No"} />
              <DetailItem label="Display order" value={kpi.order} />
            </div>
            {kpi.objective && (
              <div className="border-t pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Strategic alignment
                </p>
                <div className="mt-2 rounded-lg bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{labelize(kpi.objective.level)}</Badge>
                    <Badge variant="outline">{labelize(kpi.objective.type)}</Badge>
                    <span className="font-semibold">{kpi.objective.title}</span>
                  </div>
                  {kpi.objective.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {kpi.objective.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5 text-purple-600" />
              Ownership and governance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <DetailItem label="Declared assignee type" value={labelize(kpi.assigneeType)} />
            <DetailItem label="Direct owner" value={declaredOwner || "Not directly assigned"} />
            <DetailItem label="Declared assignee ID" value={kpi.assigneeId ? <span className="font-mono text-xs">{kpi.assigneeId}</span> : "Not recorded"} />
            <DetailItem label="Assigner ID" value={kpi.assignerId || "Not recorded"} />
            <DetailItem
              label="Created by"
              value={
                kpi.createdBy
                  ? `${kpi.createdBy.fullName}${kpi.createdBy.title ? ` · ${kpi.createdBy.title}` : ""}`
                  : "Not recorded"
              }
            />
            <DetailItem label="Created" value={formatDate(kpi.createdAt)} />
            {kpi.parent && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Cascaded from parent KPI</p>
                <p className="mt-1 font-semibold">{kpi.parent.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Parent target: {formatValue(kpi.parent.targetValue, unit.short)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Assignment breakdown
            </CardTitle>
            <Badge variant="outline">{assignments.length} assignment{assignments.length === 1 ? "" : "s"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading assignment values…</p>
          ) : assignments.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Users className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-semibold">No assignment records</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This KPI may be owned directly through its objective or has not yet been distributed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-245 text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Assigned to</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3 text-right">Target</th>
                    <th className="px-4 py-3 text-right">Local weight</th>
                    <th className="px-4 py-3 text-right">Parent allocation</th>
                    <th className="px-4 py-3 text-right">Achievement cap</th>
                    <th className="px-4 py-3">Assigned by</th>
                    <th className="px-4 py-3">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.map((assignment) => {
                    const Icon = assignment.icon;
                    return (
                      <tr key={`${assignment.level}-${assignment.id}`} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-muted p-2"><Icon className="h-4 w-4" /></div>
                            <div>
                              <p className="font-semibold">{assignment.name}</p>
                              {assignment.detail && <p className="max-w-xs truncate text-xs text-muted-foreground">{assignment.detail}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline">{assignment.level}</Badge>
                            <Badge variant={assignment.source === "Direct owner" ? "default" : "secondary"}>
                              {assignment.source}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">{formatValue(assignment.targetValue, unit.short)}</td>
                        <td className="px-4 py-3 text-right">{assignment.weight == null ? "—" : `${formatNumber(assignment.weight)}%`}</td>
                        <td className="px-4 py-3 text-right">{assignment.parentWeightAllocation == null ? "—" : `${formatNumber(assignment.parentWeightAllocation)}%`}</td>
                        <td className="px-4 py-3 text-right">{assignment.cap == null ? "—" : `${formatNumber(Number(assignment.cap) * 100)}%`}</td>
                        <td className="px-4 py-3">{assignment.assignedBy?.fullName || "—"}</td>
                        <td className="px-4 py-3">
                          <p>{assignment.strategicPeriod?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(assignment.createdAt)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            Quarterly expectations and results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-4">
            {quarters.map(({ quarterNumber, plan, result, formulaPlan }) => (
              <div key={quarterNumber} className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                  <div>
                    <p className="font-bold">Quarter {quarterNumber}</p>
                    <p className="text-xs text-muted-foreground">{plan?.timeline || `Q${quarterNumber}`}</p>
                  </div>
                  <Badge variant="outline" className={statusClass(result?.status || plan?.status)}>
                    {labelize(result?.status || plan?.status || "NOT_PLANNED")}
                  </Badge>
                </div>
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="Original target" value={formatValue(plan?.originalTarget, unit.short)} />
                    <DetailItem label="Carry-in" value={formatValue(plan?.carryIn, unit.short)} />
                    <DetailItem label="Effective target" value={formatValue(plan?.effectiveTarget, unit.short)} />
                    <DetailItem label="Actual" value={formatValue(result?.finalActual, unit.short)} />
                    <DetailItem label="Achievement" value={result?.finalAchievementRate == null ? "—" : `${formatNumber(result.finalAchievementRate)}%`} />
                    <DetailItem label="Calculation" value={labelize(result?.calculationMode || kpi.calculationType)} />
                  </div>
                  {plan?.directBasisTarget != null && (
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Quarter denominator/basis target</p>
                      <p className="mt-1 font-mono font-semibold">{formatNumber(plan.directBasisTarget, 6)} {kpi.basisUnitType ? labelize(kpi.basisUnitType) : ""}</p>
                    </div>
                  )}
                  {formulaPlan && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Formula plan</p>
                      <p className="rounded-md bg-muted/40 p-2 font-mono text-xs">
                        {formulaPlan.calculatedTargetExact || formulaPlan.calculatedTargetDecimal || "Not calculable"}
                      </p>
                      {(formulaPlan.components || []).map((component) => (
                        <div key={component.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-muted-foreground">{sourceName(component.formulaComponent)}</span>
                          <span className="font-mono">{formatNumber(component.plannedValue, 6)}</span>
                        </div>
                      ))}
                      {(formulaPlan.expressionTermPlans || []).map((term) => (
                        <div key={term.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-muted-foreground">{labelize(term.formulaExpressionTerm?.side)} · {sourceName(term.formulaExpressionTerm)}</span>
                          <span className="font-mono">{formatNumber(term.plannedValue, 6)}</span>
                        </div>
                      ))}
                      {formulaPlan.validationMessage && <p className="text-xs text-amber-700">{formulaPlan.validationMessage}</p>}
                    </div>
                  )}
                  {result?.rollupNumeratorExact && (
                    <p className="break-all rounded-md border p-2 font-mono text-[11px] text-muted-foreground">
                      {result.rollupNumeratorExact} ÷ {result.rollupDenominatorExact || "—"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-purple-600" />
              Formula and calculation methodology
            </CardTitle>
            {formulaDefinition && (
              <div className="flex gap-2">
                <Badge variant="outline" className={statusClass(formulaDefinition.status)}>{labelize(formulaDefinition.status)}</Badge>
                <Badge variant="outline">Version {formulaDefinition.version}</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!formulaDefinition && kpi.calculationType === "MANUAL_VALUE" ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <Calculator className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-semibold">Manual value KPI</p>
              <p className="mt-1 text-sm text-muted-foreground">Approved achievement values are entered directly; no advanced formula definition is configured.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem label="Calculation type" value={labelize(formulaDefinition?.calculationType || kpi.calculationType)} />
                <DetailItem label="Temporal rollup" value={labelize(formulaDefinition?.temporalRollupMethod)} />
                <DetailItem label="Result direction" value={labelize(formulaDefinition?.resultDirection)} />
                <DetailItem label="Zero denominator" value={labelize(formulaDefinition?.zeroDenominatorPolicy || kpi.zeroDenominatorPolicy)} />
                <DetailItem label="Multiplier" value={formulaDefinition?.multiplier ?? (kpi.unitType === "PERCENT" ? 100 : 1)} />
                <DetailItem label="Outside-range policy" value={labelize(formulaDefinition?.targetRangeOutsidePolicy)} />
                <DetailItem label="Effective from" value={formatDate(formulaDefinition?.effectiveFrom)} />
                <DetailItem label="Approved" value={formatDate(formulaDefinition?.approvedAt)} />
              </div>

              {formulaExpressionTerms.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">Exact expression</p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {["NUMERATOR", "DENOMINATOR"].map((side) => {
                      const terms = formulaExpressionTerms
                        .filter((term) => term.side === side)
                        .sort((a, b) => (a.position || 0) - (b.position || 0));
                      return (
                        <div key={side} className="rounded-xl border bg-muted/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labelize(side)}</p>
                          <p className="mt-3 wrap-break-word font-mono text-sm">
                            {terms.length
                              ? terms.map((term, index) => `${index ? `${operatorSymbol(term.operator)} ` : ""}${term.factorExact && term.factorExact !== "1/1" ? `(${term.factorExact} × ` : ""}${sourceName(term)}${term.factorExact && term.factorExact !== "1/1" ? ")" : ""}`).join(" ")
                              : "No terms configured"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 rounded-lg bg-[#3838EC]/5 p-3 text-center font-mono text-sm font-semibold">
                    Numerator ÷ Denominator{Number(formulaDefinition.multiplier) !== 1 ? ` × ${formatNumber(formulaDefinition.multiplier)}` : ""}
                  </p>
                </div>
              )}

              {formulaComponents.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">Weighted components</p>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-175 text-sm">
                      <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr><th className="px-4 py-3">Position</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3 text-right">Weight</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {formulaComponents.map((component) => (
                          <tr key={component.id}>
                            <td className="px-4 py-3">{component.position}</td>
                            <td className="px-4 py-3 font-semibold">{sourceName(component)}</td>
                            <td className="px-4 py-3">{labelize(component.sourceType)}</td>
                            <td className="px-4 py-3">{labelize(component.metricDefinition?.unitType || component.sourceKpi?.unitType)}</td>
                            <td className="px-4 py-3 text-right font-mono">{formatNumber(component.weight, 6)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {formulaExpressionTerms.length === 0 && formulaComponents.length === 0 && (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm font-semibold">Configured basis formula</p>
                  <p className="mt-2 font-mono text-sm">
                    {kpi.numeratorLabel || "Achievement"} ÷ {kpi.denominatorLabel || "Basis"}{kpi.unitType === "PERCENT" ? " × 100" : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Denominator source: {labelize(kpi.calculationBasisSource)} · Actual source: {labelize(kpi.actualBasisSource)}
                  </p>
                </div>
              )}
            </>
          )}

          {annualFormulaActual && (
            <div className="border-t pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Exact annual formula result</p>
                <Badge variant="outline" className={statusClass(annualFormulaActual.status)}>{labelize(annualFormulaActual.status)}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Numerator</p><p className="mt-1 break-all font-mono font-semibold">{annualFormulaActual.numeratorExact || annualFormulaActual.numeratorDecimal || "—"}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Denominator</p><p className="mt-1 break-all font-mono font-semibold">{annualFormulaActual.denominatorExact || annualFormulaActual.denominatorDecimal || "—"}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Annual result</p><p className="mt-1 break-all font-mono font-semibold">{annualFormulaActual.resultExact || annualFormulaActual.resultDecimal || "—"}</p></div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{annualFormulaActual.completedQuarterCount}/4 quarter snapshots are calculable. {annualFormulaActual.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {kpi.targets?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5 text-green-600" />Additional target timeline</CardTitle></CardHeader>
          <CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(kpi.targets as KpiTarget[]).map((target, index) => <div key={`${target.timeline}-${index}`} className="rounded-xl border bg-emerald-50/50 p-4 dark:bg-emerald-950/20"><p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{target.timeline}</p><p className="mt-2 text-xl font-bold">{formatValue(target.target, unit.short)}</p></div>)}</div></CardContent>
        </Card>
      )}

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

      <div className="grid gap-6 xl:grid-cols-2">
        <KpiProgressHistory
          kpiId={kpi.kpiId}
          kpiName={kpi.name}
          targetValue={kpi.targetValue}
          measurementUnit={kpi.measurementUnit}
          strategicPeriodId={strategicPeriodId}
        />
        {strategicPeriodId && kpi.kpiType?.toUpperCase() === "SHARED" ? (
          <SharedKpiParticipants kpiId={kpi.kpiId} strategicPeriodId={strategicPeriodId} />
        ) : (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Database className="h-5 w-5 text-slate-600" />Record metadata</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="KPI ID" value={<span className="font-mono text-xs">{kpi.kpiId}</span>} />
              <DetailItem label="Organization ID" value={<span className="font-mono text-xs">{kpi.organizationId}</span>} />
              <DetailItem label="Created" value={formatDate(kpi.createdAt)} />
              <DetailItem label="Last updated" value={formatDate(kpi.updatedAt)} />
              <DetailItem label="Formula definitions" value={formulaDefinitions.length} />
              <DetailItem label="Quarter plans" value={kpi.quarterPlans?.length || 0} />
              <DetailItem label="Quarter results" value={kpi.quarterResults?.length || 0} />
              <DetailItem label="Assignment records" value={assignments.length} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
