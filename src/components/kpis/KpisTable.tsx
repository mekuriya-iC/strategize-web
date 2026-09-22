"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Kpi, useKpiMutations } from "@/hooks/kpis/useKpis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableActions,
  tableIconButtonClassName,
} from "@/components/ui/table";
import {
  DataTableCard,
  DataTableCardActions,
  DataTableCardHeader,
  DataTableCardMeta,
  DataTableCardMetaRow,
  DataTableCards,
  DataTableDesktop,
} from "@/components/ui/responsive-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Target,
  Loader2,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { CreateKpiDialog } from "@/components/kpis/CreateKpiDialog";
import KpiAssignmentDialog from "@/components/kpis/KpiAssignmentDialog";
import { KpiModeBadge } from "@/components/kpis/KpiModeBadge";
import { useSelectedStrategicPeriod } from "@/stores/strategicPeriodStore";
import { SortableFilterableHeader } from "@/components/ui/sortable-filterable-header";
import { useTableColumnControls } from "@/hooks/table/useTableColumnControls";

interface KpisTableProps {
  kpis: Kpi[];
  loading: boolean;
  organizationId: string;
}

const measurementUnitLabel: Record<string, string> = {
  percentage: "%",
  number: "#",
  currency: "$",
  boolean: "Yes/No",
  rating: "★",
  custom: "Custom",
};

const frequencyLabel: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  NOT_SUBMITTED: { label: "Not Submitted", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const kpiTypeConfig: Record<string, { label: string; className: string }> = {
  individual: { label: "Individual", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  shared: { label: "Shared", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
};

export default function KpisTable({ kpis, loading, organizationId }: KpisTableProps) {
  const router = useRouter();
  const { deleteKpi, loading: mutLoading } = useKpiMutations();
  const selectedPeriod = useSelectedStrategicPeriod();

  const [deleteKpiItem, setDeleteKpiItem] = useState<Kpi | null>(null);
  const [editKpi, setEditKpi] = useState<Kpi | null>(null);
  const [assignKpi, setAssignKpi] = useState<Kpi | null>(null);

  const columns = useMemo(
    () => [
      { id: "name", accessor: (kpi: Kpi) => kpi.name },
      {
        id: "kpiType",
        accessor: (kpi: Kpi) => kpi.kpiType,
        filterFn: (kpi: Kpi, value: string) => kpi.kpiType === value,
      },
      {
        id: "kpiMode",
        accessor: (kpi: Kpi) => kpi.kpiMode ?? "",
        filterFn: (kpi: Kpi, value: string) => (kpi.kpiMode ?? "") === value,
      },
      {
        id: "objective",
        accessor: (kpi: Kpi) => kpi.objective?.title ?? "",
      },
      {
        id: "target",
        accessor: (kpi: Kpi) => kpi.assignedTargetValue ?? kpi.targetValue,
      },
      {
        id: "frequency",
        accessor: (kpi: Kpi) => kpi.frequency,
        filterFn: (kpi: Kpi, value: string) => kpi.frequency === value,
      },
      {
        id: "status",
        accessor: (kpi: Kpi) =>
          kpi.status ?? (kpi.isActive ? "ACTIVE" : "INACTIVE"),
        filterFn: (kpi: Kpi, value: string) =>
          (kpi.status ?? (kpi.isActive ? "ACTIVE" : "INACTIVE")) === value,
      },
    ],
    [],
  );

  const { processedRows, getHeaderProps } = useTableColumnControls({
    rows: kpis,
    columns,
  });

  const handleDelete = async () => {
    if (!deleteKpiItem) return;
    try {
      await deleteKpi(deleteKpiItem.kpiId);
      setDeleteKpiItem(null);
    } catch {
      /* handled by hook */
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="animate-pulse p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!kpis.length) {
    return (
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No KPIs yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Create your first KPI to start tracking performance metrics.
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTableDesktop className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#18181b]">
        <Table stickyFirstColumn>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50">
              <TableHead className="font-semibold">
                <SortableFilterableHeader label="KPI Name" {...getHeaderProps("name")} />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableFilterableHeader
                  label="Type"
                  filterType="select"
                  filterOptions={Object.entries(kpiTypeConfig).map(([value, conf]) => ({
                    value,
                    label: conf.label,
                  }))}
                  {...getHeaderProps("kpiType")}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableFilterableHeader
                  label="Mode"
                  filterType="select"
                  filterOptions={[
                    { value: "DIRECT", label: "Direct" },
                    { value: "SHARED", label: "Shared" },
                    { value: "HYBRID", label: "Hybrid" },
                    { value: "CASCADING", label: "Cascading" },
                  ]}
                  {...getHeaderProps("kpiMode")}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableFilterableHeader label="Objective" {...getHeaderProps("objective")} />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableFilterableHeader
                  label="Target"
                  filterable={false}
                  {...getHeaderProps("target")}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableFilterableHeader
                  label="Frequency"
                  filterType="select"
                  filterOptions={Object.entries(frequencyLabel).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  {...getHeaderProps("frequency")}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableFilterableHeader
                  label="Status"
                  filterType="select"
                  filterOptions={[
                    ...Object.entries(statusConfig).map(([value, conf]) => ({
                      value,
                      label: conf.label,
                    })),
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                  {...getHeaderProps("status")}
                />
              </TableHead>
              <TableHead className="font-semibold w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No KPIs match the current filters.
                </TableCell>
              </TableRow>
            ) : (
            processedRows.map((kpi) => {
              const typeConf = kpiTypeConfig[kpi.kpiType] ?? { label: kpi.kpiType, className: "bg-gray-100 text-gray-600" };
              const statusConf = kpi.status ? (statusConfig[kpi.status] ?? { label: kpi.status, className: "bg-gray-100 text-gray-600" }) : null;
              const unitLabel = measurementUnitLabel[kpi.measurementUnit] ?? kpi.measurementUnit;

              return (
                <TableRow
                  key={kpi.kpiId}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  onClick={() => router.push(`/dashboard/kpis/${kpi.kpiId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                          {kpi.name}
                        </p>
                        {kpi.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {kpi.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeConf.className}`}>
                      {typeConf.label}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <KpiModeBadge mode={kpi.kpiMode as any} size="sm" />
                      {kpi.kpiMode === "HYBRID" && kpi.managerRetentionPercent && (
                        <span className="text-xs text-purple-600 dark:text-purple-400">
                          {kpi.managerRetentionPercent}% mgr / {100 - kpi.managerRetentionPercent}% team
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {kpi.objective ? (
                      <div className="max-w-[180px]">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                          {kpi.objective.title}
                        </p>
                        {kpi.objective.level && (
                          <p className="text-xs text-gray-400">{kpi.objective.level}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {kpi.assignedTargetValue ?? kpi.targetValue}
                        <span className="text-gray-400 font-normal ml-1">{unitLabel}</span>
                      </span>
                    </div>
                    {kpi.weight != null && (
                      <p className="text-xs text-gray-400 mt-0.5">Weight: {kpi.weight}%</p>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {frequencyLabel[kpi.frequency] ?? kpi.frequency}
                    </span>
                  </TableCell>

                  <TableCell>
                    {statusConf ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConf.className}`}>
                        {statusConf.label}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${kpi.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {kpi.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </TableCell>

                  <TableActions>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className={tableIconButtonClassName}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/kpis/${kpi.kpiId}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditKpi(kpi);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignKpi(kpi);
                          }}
                          disabled={!selectedPeriod || (kpi as any).kpiMode === "DIRECT"}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {(kpi as any).kpiMode === "DIRECT" ? "Assign (DIRECT mode)" : "Assign"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteKpiItem(kpi);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableActions>
                </TableRow>
              );
            })
            )}
          </TableBody>
        </Table>
      </DataTableDesktop>

      <DataTableCards>
        {processedRows.map((kpi) => {
          const typeConf = kpiTypeConfig[kpi.kpiType] ?? { label: kpi.kpiType, className: "bg-gray-100 text-gray-600" };
          const statusConf = kpi.status ? (statusConfig[kpi.status] ?? { label: kpi.status, className: "bg-gray-100 text-gray-600" }) : null;
          const unitLabel = measurementUnitLabel[kpi.measurementUnit] ?? kpi.measurementUnit;

          return (
            <DataTableCard
              key={kpi.kpiId}
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/kpis/${kpi.kpiId}`)}
            >
              <DataTableCardHeader>
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-medium text-foreground">
                      {kpi.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${typeConf.className}`}>
                        {typeConf.label}
                      </span>
                      {statusConf && (
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusConf.className}`}>
                          {statusConf.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className={tableIconButtonClassName}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/kpis/${kpi.kpiId}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditKpi(kpi);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignKpi(kpi);
                      }}
                      disabled={!selectedPeriod || (kpi as any).kpiMode === "DIRECT"}
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Assign
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteKpiItem(kpi);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DataTableCardHeader>
              <DataTableCardMeta>
                <DataTableCardMetaRow label="Mode">
                  <KpiModeBadge mode={kpi.kpiMode as any} size="sm" />
                </DataTableCardMetaRow>
                <DataTableCardMetaRow label="Objective">
                  {kpi.objective?.title ?? "—"}
                </DataTableCardMetaRow>
                <DataTableCardMetaRow label="Target">
                  {kpi.assignedTargetValue ?? kpi.targetValue} {unitLabel}
                </DataTableCardMetaRow>
                <DataTableCardMetaRow label="Frequency">
                  {frequencyLabel[kpi.frequency] ?? kpi.frequency}
                </DataTableCardMetaRow>
              </DataTableCardMeta>
              <DataTableCardActions className="justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9 touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/kpis/${kpi.kpiId}`);
                  }}
                >
                  View
                </Button>
              </DataTableCardActions>
            </DataTableCard>
          );
        })}
      </DataTableCards>

      {/* Edit Dialog */}
      {editKpi && (
        <CreateKpiDialog
          open={!!editKpi}
          onOpenChange={(open: boolean) => { if (!open) setEditKpi(null); }}
          organizationId={organizationId}
          editKpi={editKpi}
        />
      )}

      {/* Assignment Dialog */}
      {assignKpi && selectedPeriod && (
        <KpiAssignmentDialog
          kpi={{
            kpiId: assignKpi.kpiId,
            name: assignKpi.name,
            targetValue: assignKpi.assignedTargetValue ?? assignKpi.targetValue,
            measurementUnit: assignKpi.measurementUnit,
            unitType: assignKpi.unitType,
            calculationBasisSource: assignKpi.calculationBasisSource,
          }}
          strategicPeriodId={selectedPeriod.strategicPeriodId}
          onSuccess={() => setAssignKpi(null)}
          open={!!assignKpi}
          onOpenChange={(open: boolean) => { if (!open) setAssignKpi(null); }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKpiItem} onOpenChange={(open) => !open && setDeleteKpiItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete KPI</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteKpiItem?.name}&quot;</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={mutLoading.delete}
            >
              {mutLoading.delete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
