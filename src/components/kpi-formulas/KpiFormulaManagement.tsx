"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  Calculator,
  Check,
  FileText,
  Gauge,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type KpiFormulaDefinition,
  type OrganizationKpiFormulaTemplate,
  useKpiFormulas,
} from "@/hooks/kpi-formulas/useKpiFormulas";
import { FormulaTemplateDialog } from "./FormulaTemplateDialog";
import { KpiFormulaDialog } from "./KpiFormulaDialog";
import { MetricDefinitionDialog } from "./MetricDefinitionDialog";
import { enumLabel } from "./options";
import {
  getFormulaKpiDependencies,
  renderCanonicalFormula,
} from "./formulaExpression";

interface KpiFormulaManagementProps {
  organizationId: string;
}

export function KpiFormulaManagement({
  organizationId,
}: KpiFormulaManagementProps) {
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<KpiFormulaDefinition | null>(null);
  const [deletingFormula, setDeletingFormula] = useState<KpiFormulaDefinition | null>(null);
  const [approvingId, setApprovingId] = useState<string>();
  const [pendingApproval, setPendingApproval] =
    useState<KpiFormulaDefinition | null>(null);
  const management = useKpiFormulas(organizationId);

  const approve = async (formula: KpiFormulaDefinition) => {
    setApprovingId(formula.id);
    try {
      await management.approveFormula(formula.id);
      setPendingApproval(null);
    } catch {
      // The hook displays the server error in a toast.
    } finally {
      setApprovingId(undefined);
    }
  };

  const deleteFormula = async (formula: KpiFormulaDefinition) => {
    try {
      await management.removeFormula(formula.id);
      setDeletingFormula(null);
    } catch {
      // The hook displays the server error in a toast.
    }
  };

  const firstError = management.errors[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-sm">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                KPI formula management
              </h1>
              <Badge variant="secondary">Phase 1</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground sm:text-base">
              Govern source metrics, legacy ratio templates, and versioned ratio,
              scalar, or weighted-index KPI formulas.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => void management.refetchAll()}
          disabled={
            management.loading.metrics ||
            management.loading.templates ||
            management.loading.formulas
          }
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {firstError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Formula data could not be loaded</AlertTitle>
          <AlertDescription>
            {firstError.message}. Confirm the KPI formula feature is enabled for
            this organization and try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Ruler}
          label="Metric definitions"
          value={management.metricsMeta?.totalItems ?? management.metrics.length}
          detail={`${management.metrics.filter((metric) => metric.isActive).length} active`}
        />
        <SummaryCard
          icon={FileText}
          label="Formula templates"
          value={management.templatesMeta?.totalItems ?? management.templates.length}
          detail={`${management.templates.filter((template) => template.isActive).length} active`}
        />
        <SummaryCard
          icon={Gauge}
          label="KPI formulas"
          value={management.formulasMeta?.totalItems ?? management.formulas.length}
          detail={`${management.formulas.filter((formula) => formula.status === "DRAFT").length} awaiting approval`}
        />
      </div>

      <Tabs defaultValue="metrics" className="w-full gap-4">
        <TabsList className="grid h-auto w-full grid-cols-3 p-1 lg:w-155">
          <TabsTrigger value="metrics" className="min-h-9">
            <Ruler className="h-4 w-4" />
            <span className="hidden sm:inline">Metrics</span>
            <span className="sm:hidden">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="min-h-9">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Formula templates</span>
            <span className="sm:hidden">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="formulas" className="min-h-9">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">KPI formulas</span>
            <span className="sm:hidden">Formulas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Metric definitions</CardTitle>
              <CardDescription>
                Reusable source data with consistent units and time rollups.
              </CardDescription>
              <CardAction>
                <Button onClick={() => setMetricDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New metric</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Metric</TableHead>
                    <TableHead className="hidden md:table-cell">Unit</TableHead>
                    <TableHead className="hidden lg:table-cell">Temporal rollup</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {management.loading.metrics && management.metrics.length === 0 ? (
                    <LoadingRows columns={4} />
                  ) : management.metrics.length === 0 ? (
                    <EmptyRow
                      columns={4}
                      title="No metric definitions yet"
                      detail="Create a source metric to start building ratio formulas."
                    />
                  ) : (
                    management.metrics.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell className="max-w-[320px] pl-6 whitespace-normal">
                          <div className="font-medium">{metric.name}</div>
                          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {metric.code}
                          </div>
                          {metric.description && (
                            <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {metric.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>{enumLabel(metric.unitType)}</div>
                          <div className="text-xs text-muted-foreground">
                            {enumLabel(metric.measurementUnit)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {enumLabel(metric.temporalRollupMethod)}
                        </TableCell>
                        <TableCell>
                          <ActiveBadge active={metric.isActive} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Formula templates</CardTitle>
              <CardDescription>
                Organization-level ratio patterns backed by governed metrics. The
                template API remains legacy simple-ratio only and does not expose term
                lists; term expressions are configured on KPI formulas.
              </CardDescription>
              <CardAction>
                <Button onClick={() => setTemplateDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New template</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Template</TableHead>
                    <TableHead>Formula</TableHead>
                    <TableHead className="hidden lg:table-cell">Configuration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {management.loading.templates && management.templates.length === 0 ? (
                    <LoadingRows columns={4} />
                  ) : management.templates.length === 0 ? (
                    <EmptyRow
                      columns={4}
                      title="No formula templates yet"
                      detail="Create a template to standardize common metric ratios."
                    />
                  ) : (
                    management.templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="max-w-70 pl-6 whitespace-normal">
                          <div className="font-medium">{template.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {enumLabel(template.calculationType)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-90 whitespace-normal">
                          <FormulaExpression
                            numerator={
                              template.numeratorMetricDefinition?.name ?? "—"
                            }
                            denominator={
                              template.denominatorMetricDefinition?.name ?? "—"
                            }
                            multiplier={template.multiplier}
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div>{enumLabel(template.temporalRollupMethod)}</div>
                          <div className="text-xs text-muted-foreground">
                            {enumLabel(template.resultDirection)}
                          </div>
                          <TargetRangeSummary configuration={template} />
                        </TableCell>
                        <TableCell>
                          <ActiveBadge active={template.isActive} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulas">
          <Card>
            <CardHeader>
              <CardTitle>KPI formulas</CardTitle>
              <CardDescription>
                Versioned definitions move from draft to approved; approving a new
                version archives the previous approved version.
              </CardDescription>
              <CardAction>
                <Button onClick={() => setFormulaDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New formula</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Target KPI</TableHead>
                    <TableHead>Definition</TableHead>
                    <TableHead className="hidden lg:table-cell">Rollup</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {management.loading.formulas && management.formulas.length === 0 ? (
                    <LoadingRows columns={5} />
                  ) : management.formulas.length === 0 ? (
                    <EmptyRow
                      columns={5}
                      title="No KPI formula definitions yet"
                      detail="Create a ratio, scalar, or weighted-index formula and approve it when validation is complete."
                    />
                  ) : (
                    management.formulas.map((formula) => (
                      <TableRow key={formula.id}>
                        <TableCell className="max-w-65 pl-6 whitespace-normal">
                          <div className="font-medium">
                            {formula.kpi?.name ?? formula.kpiId}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Version {formula.version} · {enumLabel(formula.calculationType)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-95 whitespace-normal">
                          {formula.calculationType === "WEIGHTED_INDEX" ? (
                            <WeightedFormulaExpression formula={formula} />
                          ) : (
                            <CanonicalFormulaExpression formula={formula} />
                          )}
                          <FormulaDependencies formula={formula} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div>{enumLabel(formula.temporalRollupMethod)}</div>
                          <div className="text-xs text-muted-foreground">
                            {enumLabel(formula.resultDirection)}
                          </div>
                          <TargetRangeSummary configuration={formula} />
                        </TableCell>
                        <TableCell>
                          <FormulaStatusBadge status={formula.status} />
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          {formula.status === "DRAFT" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPendingApproval(formula)}
                                disabled={Boolean(approvingId)}
                              >
                                {approvingId === formula.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                Approve
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingFormula(formula)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeletingFormula(formula)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {formula.approvedAt
                                ? formatDate(formula.approvedAt)
                                : "No action"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={Boolean(pendingApproval)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !approvingId) setPendingApproval(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this formula definition?</AlertDialogTitle>
            <AlertDialogDescription>
              Approval activates this version and archives the previously approved
              version. The server remains authoritative for cycle validation and
              downstream cascade recalculation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingApproval && (
            <div className="space-y-3">
              <p className="wrap-break-word rounded-md bg-muted p-3 font-mono text-sm">
                {pendingApproval.calculationType === "WEIGHTED_INDEX"
                  ? "Weighted index (ordered components shown in the table)"
                  : renderCanonicalFormula(pendingApproval)}
              </p>
              <FormulaDependencies formula={pendingApproval} expanded />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(approvingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!pendingApproval || Boolean(approvingId)}
              onClick={(event) => {
                event.preventDefault();
                if (pendingApproval) void approve(pendingApproval);
              }}
            >
              {approvingId && <Loader2 className="h-4 w-4 animate-spin" />}
              Approve definition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deletingFormula)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeletingFormula(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this formula definition?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the formula definition. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deletingFormula && (
            <div className="rounded-md bg-muted p-3">
              <p className="font-medium">{deletingFormula.kpi?.name ?? deletingFormula.kpiId}</p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                Version {deletingFormula.version} · {enumLabel(deletingFormula.calculationType)}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!deletingFormula}
              onClick={(event) => {
                event.preventDefault();
                if (deletingFormula) void deleteFormula(deletingFormula);
              }}
            >
              Delete formula
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MetricDefinitionDialog
        open={metricDialogOpen}
        onOpenChange={setMetricDialogOpen}
        organizationId={organizationId}
        pending={management.loading.createMetric}
        onCreate={management.createMetric}
      />
      <FormulaTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        organizationId={organizationId}
        metrics={management.metrics}
        pending={management.loading.createTemplate}
        onCreate={management.createTemplate}
      />
      <KpiFormulaDialog
        open={formulaDialogOpen || Boolean(editingFormula)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setFormulaDialogOpen(false);
            setEditingFormula(null);
          } else {
            setFormulaDialogOpen(nextOpen);
          }
        }}
        organizationId={organizationId}
        metrics={management.metrics}
        kpis={management.kpis}
        pending={management.loading.createFormula || management.loading.updateFormula}
        onCreate={management.createFormula}
        onUpdate={management.updateFormula}
        editingFormula={editingFormula}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card className="gap-3 py-4 shadow-none">
      <CardContent className="flex items-center gap-3 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums">{value}</span>
            <span className="truncate text-sm font-medium">{label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
    >
      Active
    </Badge>
  ) : (
    <Badge variant="secondary">Inactive</Badge>
  );
}

function FormulaStatusBadge({
  status,
}: {
  status: KpiFormulaDefinition["status"];
}) {
  if (status === "APPROVED") {
    return (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
        Approved
      </Badge>
    );
  }
  if (status === "ARCHIVED") return <Badge variant="secondary">Archived</Badge>;
  return (
    <Badge
      variant="outline"
      className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
    >
      Draft
    </Badge>
  );
}

function TargetRangeSummary({
  configuration,
}: {
  configuration: {
    resultDirection: string;
    targetRangeMin?: string | null;
    targetRangeMax?: string | null;
    targetRangeOutsidePolicy: string;
  };
}) {
  if (configuration.resultDirection !== "TARGET_RANGE") return null;
  return (
    <div className="mt-1 space-y-0.5 text-xs text-indigo-700">
      <div className="font-mono">
        [{configuration.targetRangeMin ?? "—"}, {configuration.targetRangeMax ?? "—"}]
      </div>
      <div>{enumLabel(configuration.targetRangeOutsidePolicy)}</div>
    </div>
  );
}

function CanonicalFormulaExpression({
  formula,
}: {
  formula: KpiFormulaDefinition;
}) {
  return (
    <div className="inline-flex max-w-full rounded-md bg-muted px-2 py-1 font-mono text-xs">
      <span className="wrap-break-word" title={renderCanonicalFormula(formula)}>
        {renderCanonicalFormula(formula)}
      </span>
    </div>
  );
}

function FormulaDependencies({
  formula,
  expanded = false,
}: {
  formula: KpiFormulaDefinition;
  expanded?: boolean;
}) {
  const dependencies = getFormulaKpiDependencies(formula);
  return (
    <div className={expanded ? "space-y-2" : "mt-2 space-y-1"}>
      <p className="text-xs font-medium text-muted-foreground">
        Cascade dependencies
      </p>
      <div className="flex flex-wrap gap-1.5">
        {dependencies.length > 0 ? (
          dependencies.map((dependency) => (
            <Badge key={dependency.kpiId} variant="outline">
              KPI · {dependency.name}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No KPI dependencies</span>
        )}
      </div>
    </div>
  );
}

function FormulaExpression({
  numerator,
  denominator,
  multiplier,
}: {
  numerator: string;
  denominator: string;
  multiplier: number;
}) {
  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs">
      <span className="truncate" title={numerator}>
        {numerator}
      </span>
      <span className="text-muted-foreground">÷</span>
      <span className="truncate" title={denominator}>
        {denominator}
      </span>
      <span className="text-muted-foreground">× {Number(multiplier)}</span>
    </div>
  );
}

function WeightedFormulaExpression({
  formula,
}: {
  formula: KpiFormulaDefinition;
}) {
  const components = [...formula.components].sort(
    (left, right) => left.position - right.position,
  );

  return (
    <div className="space-y-1.5">
      {components.map((component) => {
        const source =
          component.sourceType === "KPI"
            ? (component.sourceKpi?.name ?? "Unknown KPI")
            : (component.metricDefinition?.name ?? "Unknown metric");
        return (
          <div
            key={component.id}
            className="flex max-w-full items-center justify-between gap-3 rounded-md bg-muted px-2 py-1 font-mono text-xs"
          >
            <span className="min-w-0 truncate" title={source}>
              {component.position}. {source}
            </span>
            <span className="shrink-0 tabular-nums">{component.weight}%</span>
          </div>
        );
      })}
    </div>
  );
}



function LoadingRows({ columns }: { columns: number }) {
  return Array.from({ length: 3 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell colSpan={columns} className="px-6 py-4">
        <Skeleton className="h-8 w-full" />
      </TableCell>
    </TableRow>
  ));
}

function EmptyRow({
  columns,
  title,
  detail,
}: {
  columns: number;
  title: string;
  detail: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="h-40 text-center">
        <div className="mx-auto max-w-md">
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function templateFormulaLabel(
  template: OrganizationKpiFormulaTemplate,
): string {
  const numerator = template.numeratorMetricDefinition?.name ?? "—";
  const denominator = template.denominatorMetricDefinition?.name ?? "—";
  return `${numerator} / ${denominator} × ${Number(template.multiplier)}`;
}
