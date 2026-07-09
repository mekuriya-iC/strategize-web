import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical } from "lucide-react";
import { Kpi } from "@/types/graphql";
import { usesAnnualOnlyKpiTargets } from "@/lib/objectives/kpiWeightScope";
import KPITargetsCell from "./KPITargetsCell";
import KPIActions from "./KPIActions";
import { KpiModeBadge } from "@/components/kpis/KpiModeBadge";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KPITableRowProps {
  kpi: Kpi;
  idx: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onRefresh: () => void;
  showBulkActions: boolean;
  showLevelSpecificColumn: boolean;
  columnHeaders: { firstColumn: string; secondColumn: string | null };
  strategicTargetsById?: Record<string, Record<string, number>>;
  kpiRejectionReasons?: Record<string, string>;
  childQuartersByParentId?: Record<
    string,
    Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>
  >;
  allKpis: Kpi[];
  currentObjectiveType?: string;
  enableSorting?: boolean;
}

const statusColors: Record<string, string> = {
  NOT_SUBMITTED: "bg-pink-100 text-pink-600",
  PENDING: "bg-yellow-100 text-yellow-600",
  APPROVED: "bg-green-100 text-green-600",
  REJECTED: "bg-red-100 text-red-600",
};

const KPITableRow: React.FC<KPITableRowProps> = ({
  kpi,
  idx,
  selected,
  onSelect,
  onEdit,
  onRefresh,
  showBulkActions,
  showLevelSpecificColumn,
  columnHeaders,
  strategicTargetsById,
  kpiRejectionReasons,
  childQuartersByParentId,
  allKpis,
  currentObjectiveType,
  enableSorting = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: kpi.kpiId, disabled: !enableSorting });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : "auto",
    position: "relative" as const,
    backgroundColor: isDragging ? "rgb(239 246 255)" : undefined,
    boxShadow: isDragging ? "0 4px 12px rgba(0, 0, 0, 0.15)" : undefined,
  };

  const isKpiLocked =
    kpi.status === "APPROVED" ||
    kpi.objective?.status === "APPROVED" ||
    (kpi.objective as any)?.cascadeStatus === "approved" ||
    Boolean((kpi.objective as any)?.approvedAt);

  const getFirstColumnContent = (kpi: Kpi) => {
    if (kpi.parent?.name) {
      return kpi.parent.name.trim() || "Unnamed Parent KPI";
    }
    return (kpi.name || "").trim() || "Please add name";
  };

  const getSecondColumnContent = (kpi: Kpi) => {
    if (usesAnnualOnlyKpiTargets(kpi.objective) && !kpi.parent) return "N/A";
    return (kpi.name || "").trim() || "Please add name";
  };

  const getFromText = (kpi: Kpi) => {
    if (kpi.objective?.type === "CORPORATE") return null;
    if (kpi.objective?.type) {
      switch (kpi.objective.type) {
        case "DIVISION":
          return "From: Corporate";
        case "DEPARTMENT":
          return "From: Division";
        case "PERSONNEL":
          return "From: Department";
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-100 dark:border-gray-800 ${
        selected
          ? "bg-blue-50 dark:bg-blue-950/30"
          : idx % 2 === 1
            ? "bg-white dark:bg-transparent"
            : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
      } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isKpiLocked ? "cursor-default" : "cursor-pointer"} ${isDragging ? "ring-2 ring-blue-400" : ""}`}
      onClick={() => {
        if (!isKpiLocked) onEdit(kpi.kpiId);
      }}
    >
      {enableSorting && (
        <TableCell className="px-2 w-10" onClick={(e) => e.stopPropagation()}>
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded touch-none"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
        </TableCell>
      )}

      {showBulkActions && (
        <TableCell
          className="px-6 py-4 w-12"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(kpi.kpiId)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </TableCell>
      )}

      {showLevelSpecificColumn ? (
        <>
          <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 max-w-sm">
            <div className="truncate" title={getFirstColumnContent(kpi)}>
              {getFirstColumnContent(kpi)}
            </div>
            {getFromText(kpi) && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {getFromText(kpi)}
              </div>
            )}
          </TableCell>
          <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
            <div className="truncate" title={getSecondColumnContent(kpi)}>
              {getSecondColumnContent(kpi) === "N/A" ? (
                <span className="text-gray-400 italic text-sm">N/A</span>
              ) : (
                getSecondColumnContent(kpi)
              )}
            </div>
          </TableCell>
        </>
      ) : (
        <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
          <div className="truncate" title={getFirstColumnContent(kpi)}>
            {getFirstColumnContent(kpi)}
          </div>
        </TableCell>
      )}

      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span
            className={
              kpi.baseline === null || kpi.baseline === undefined
                ? "text-gray-400 italic text-sm"
                : ""
            }
          >
            {kpi.baseline === null || kpi.baseline === undefined
              ? "N/A"
              : kpi.baseline}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-1 h-4 uppercase font-bold text-gray-500"
          >
            {kpi.unitType || "NUMBER"}
          </Badge>
        </div>
      </TableCell>

      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
        {kpi.weight}
      </TableCell>

      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
        <KPITargetsCell
          kpi={kpi}
          childQuartersByParentId={childQuartersByParentId}
          strategicTargetsById={strategicTargetsById}
          currentObjectiveType={currentObjectiveType}
          allKpis={allKpis}
        />
      </TableCell>

      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
        <div className="flex flex-col items-start gap-1">
          <KpiModeBadge mode={kpi.kpiMode || "AGGREGATED"} size="sm" />
          {kpi.kpiMode === "HYBRID" &&
            kpi.managerRetentionPercent !== undefined &&
            kpi.managerRetentionPercent !== null && (
              <span className="text-[11px] text-purple-600 dark:text-purple-400 whitespace-nowrap">
                {kpi.managerRetentionPercent}% mgr /{" "}
                {100 - Number(kpi.managerRetentionPercent)}% team
              </span>
            )}
        </div>
      </TableCell>

      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
        <div className="flex flex-col gap-1">
          <Badge
            className={`${
              statusColors[kpi.status] || "bg-gray-100 text-gray-600"
            } rounded-full px-3 py-1 text-xs font-medium border-0 w-fit`}
          >
            {kpi.status ? kpi.status.replace("_", " ") : "Unknown"}
          </Badge>
          {allKpis.some((other) => other.parent?.kpiId === kpi.kpiId) && (
            <span className="text-[10px] font-bold text-purple-600 px-1 uppercase tracking-wider">
              Already Assigned
            </span>
          )}
        </div>
      </TableCell>

      {kpiRejectionReasons && Object.keys(kpiRejectionReasons).length > 0 && (
        <TableCell
          className="px-6 py-4 text-red-600 text-sm max-w-xs truncate"
          title={kpiRejectionReasons[kpi.kpiId]}
        >
          {kpiRejectionReasons[kpi.kpiId] || "-"}
        </TableCell>
      )}

      <TableCell
        className="px-6 py-4 w-16"
        onClick={(e) => e.stopPropagation()}
      >
        <KPIActions
          kpi={kpi}
          onEdit={onEdit}
          onRefresh={onRefresh}
          allKpis={allKpis}
          currentObjectiveType={currentObjectiveType}
        />
      </TableCell>
    </TableRow>
  );
};

export default KPITableRow;
