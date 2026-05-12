"use client";

import React, { useState } from "react";
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
} from "@/components/ui/table";
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
  TrendingDown,
  Minus,
} from "lucide-react";
import { CreateKpiDialog } from "@/components/kpis/CreateKpiDialog";

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

  const [deleteKpiItem, setDeleteKpiItem] = useState<Kpi | null>(null);
  const [editKpi, setEditKpi] = useState<Kpi | null>(null);

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
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50">
              <TableHead className="font-semibold">KPI Name</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Objective</TableHead>
              <TableHead className="font-semibold">Target</TableHead>
              <TableHead className="font-semibold">Frequency</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((kpi) => {
              const typeConf = kpiTypeConfig[kpi.kpiType] ?? { label: kpi.kpiType, className: "bg-gray-100 text-gray-600" };
              const statusConf = kpi.status ? (statusConfig[kpi.status] ?? { label: kpi.status, className: "bg-gray-100 text-gray-600" }) : null;
              const unitLabel = measurementUnitLabel[kpi.measurementUnit] ?? kpi.measurementUnit;

              return (
                <TableRow
                  key={kpi.kpiId}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  onClick={() => router.push(`/dashboard/kpis/${kpi.kpiId}`)}
                >
                  {/* Name */}
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

                  {/* Type */}
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeConf.className}`}>
                      {typeConf.label}
                    </span>
                  </TableCell>

                  {/* Objective */}
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

                  {/* Target */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {kpi.targetValue}
                        <span className="text-gray-400 font-normal ml-1">{unitLabel}</span>
                      </span>
                    </div>
                    {kpi.weight != null && (
                      <p className="text-xs text-gray-400 mt-0.5">Weight: {kpi.weight}%</p>
                    )}
                  </TableCell>

                  {/* Frequency */}
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {frequencyLabel[kpi.frequency] ?? kpi.frequency}
                    </span>
                  </TableCell>

                  {/* Status */}
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

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editKpi && (
        <CreateKpiDialog
          open={!!editKpi}
          onOpenChange={(open: boolean) => { if (!open) setEditKpi(null); }}
          organizationId={organizationId}
          editKpi={editKpi}
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
