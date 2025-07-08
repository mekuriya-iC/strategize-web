"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteKpiDialog from "./DeleteKpiDialog";
import { Kpi } from "@/types/graphql";

interface KPIListProps {
  kpis: Kpi[];
  onEdit: (kpiId: string) => void;
  onRefresh: () => void;
}

export default function KPIList({ kpis, onEdit, onRefresh }: KPIListProps) {
  const statusColors = {
    NOT_SUBMITTED: "bg-pink-100 text-pink-600",
    PENDING: "bg-yellow-100 text-yellow-600",
    APPROVED: "bg-green-100 text-green-600",
    REJECTED: "bg-red-100 text-red-600",
  };

  const weightTypeLabels = {
    NUMBER: "Number",
    PERCENT: "Percent",
  };

  if (kpis.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No KPIs found for this objective.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              KPI Name
            </TableHead>
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              Baseline
            </TableHead>
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              Weight
            </TableHead>
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              Targets
            </TableHead>
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3">
              Status
            </TableHead>
            <TableHead className="text-[#9E9E9E] text-xs font-medium uppercase tracking-wider px-6 py-3 w-16">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kpis.map((kpi, idx) => (
            <TableRow
              key={kpi.kpiId}
              className={`border-b border-gray-100 ${
                idx % 2 === 1 ? "bg-white" : "bg-[#ECECFF]"
              } hover:bg-gray-50 transition-colors`}
            >
              <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                <div className="truncate" title={kpi.name}>
                  {kpi.name}
                </div>
              </TableCell>

              <TableCell className="px-6 py-4 text-gray-600">
                {kpi.baseline}
              </TableCell>

              <TableCell className="px-6 py-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <span>{kpi.weight}</span>
                  <Badge variant="outline" className="text-xs">
                    {weightTypeLabels[kpi.weightType]}
                  </Badge>
                </div>
              </TableCell>

              <TableCell className="px-6 py-4 text-gray-600">
                <div className="flex flex-col gap-1 max-w-xs">
                  {kpi.targets.length > 0 ? (
                    kpi.targets.slice(0, 2).map((target, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{target.timeline}:</span>{" "}
                        {target.target}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No targets set</span>
                  )}
                  {kpi.targets.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{kpi.targets.length - 2} more
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="px-6 py-4">
                <Badge
                  className={`${
                    statusColors[kpi.status]
                  } rounded-full px-3 py-1 text-xs font-medium border-0`}
                >
                  {kpi.status.replace("_", " ")}
                </Badge>
              </TableCell>

              <TableCell className="px-6 py-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit(kpi.kpiId)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DeleteKpiDialog
                      kpiId={kpi.kpiId}
                      kpiName={kpi.name}
                      onDeleteSuccess={onRefresh}
                    >
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 hover:text-red-700"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DeleteKpiDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
