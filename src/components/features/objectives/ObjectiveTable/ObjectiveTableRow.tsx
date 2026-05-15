import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Eye, GripVertical } from "lucide-react";
import { Objective, Kpi } from "@/types/graphql";
import { usesAnnualOnlyKpiTargets } from "@/lib/objectives/kpiWeightScope";
import ObjectiveActions from "./ObjectiveActions";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ObjectiveTableRowProps {
    objective: Objective;
    idx: number;
    kpis: Kpi[];
    selected: boolean;
    onSelect: (id: string) => void;
    expanded: boolean;
    onExpand: (id: string) => void;
    onObjectiveClick: (objective: Objective) => void;
    onViewObjective?: (objective: Objective) => void;
    onEditSuccess?: () => void;
    onDeleteObjective?: (objective: Objective) => void;
    onAssignSuccess?: () => void;
    showLevelSpecificColumn: boolean;
    columnHeaders: { firstColumn: string; secondColumn: string | null };
    unitNames: Record<string, string>;
    enableSorting: boolean;
    allObjectives: Objective[];
}

const ObjectiveTableRow: React.FC<ObjectiveTableRowProps> = ({
    objective,
    idx,
    kpis,
    selected,
    onSelect,
    expanded,
    onExpand,
    onObjectiveClick,
    onViewObjective,
    onEditSuccess,
    onDeleteObjective,
    onAssignSuccess,
    showLevelSpecificColumn,
    columnHeaders,
    unitNames,
    enableSorting,
    allObjectives,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: objective.objectiveId, disabled: !enableSorting });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : "auto",
        position: "relative" as const,
        backgroundColor: isDragging ? "rgb(239 246 255)" : undefined,
        boxShadow: isDragging ? "0 4px 12px rgba(0, 0, 0, 0.15)" : undefined,
    };

    const objectiveKPIs = kpis.filter(k => k.objective?.objectiveId === objective.objectiveId);
    const totalWeight = objectiveKPIs.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
    const approvedKPIs = objectiveKPIs.filter(k => k.status === "APPROVED").length;

    const getFirstColumnContent = () => {
        if (objective.parent) {
            const parentLabel = (objective.parent.title || objective.parent.name || "").trim();
            return parentLabel || "Unnamed Parent Objective";
        }
        const own = (objective.title || objective.name || "").trim();
        return own || "Please add title";
    };

    const getSecondColumnContent = () => {
        if (usesAnnualOnlyKpiTargets(objective)) return "N/A";
        if (objective.type === "PERSONNEL") {
            return (
                unitNames[objective.assigneeId || ""] ||
                (objective.title || objective.name || "").trim() ||
                "Unnamed Personal Objective"
            );
        }
        const own = (objective.title || objective.name || "").trim();
        return own || "Please add title";
    };

    const getFromText = () => {
        if (objective.type === "CORPORATE") return null;
        if (objective.parent) {
            const parent = allObjectives.find(o => o.objectiveId === objective.parent?.objectiveId);
            if (parent) return `From: ${parent.type.charAt(0) + parent.type.slice(1).toLowerCase()}`;
        }
        return null;
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={`border-b border-gray-100 dark:border-gray-800 ${selected ? "bg-blue-50 dark:bg-blue-950/30" : idx % 2 === 1 ? "bg-white dark:bg-transparent" : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
                } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isDragging ? "ring-2 ring-blue-400" : ""}`}
            onClick={() => onObjectiveClick(objective)}
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

            <TableCell className="px-6 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={selected}
                    onCheckedChange={() => onSelect(objective.objectiveId)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
            </TableCell>

            <TableCell className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100 max-w-sm">
                <div className="flex flex-col">
                    <div className="truncate" title={getFirstColumnContent()}>
                        {getFirstColumnContent()}
                    </div>
                    {getFromText() && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getFromText()}</div>
                    )}
                </div>
            </TableCell>

            {showLevelSpecificColumn && (
                <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 max-w-sm">
                    {objective.type === "PERSONNEL" ? (
                        <div className="flex flex-col">
                            <span className="font-bold text-blue-600">
                                {unitNames[objective.assigneeId || ""] || "Unassigned"}
                            </span>
                            <span className="text-xs text-gray-500 truncate" title={objective.title || objective.name || ""}>
                                {objective.title || objective.name || "Unnamed Objective"}
                            </span>
                        </div>
                    ) : (
                        <div className="truncate" title={getSecondColumnContent() as string}>
                            {getSecondColumnContent() === "N/A" ? (
                                <span className="text-gray-400 italic text-sm">N/A</span>
                            ) : (
                                getSecondColumnContent()
                            )}
                        </div>
                    )}
                </TableCell>
            )}

            <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{objectiveKPIs.length} KPI{objectiveKPIs.length !== 1 ? "s" : ""}</span>
                        {objectiveKPIs.length > 0 && (
                            <Badge variant="outline" className="text-xs">{approvedKPIs} approved</Badge>
                        )}
                    </div>
                    <Badge
                        variant="outline"
                        className={`text-xs font-semibold w-fit ${totalWeight > 100 ? "text-red-600 border-red-200 bg-red-50" : "text-blue-600 border-blue-200 bg-blue-50"}`}
                    >
                        {totalWeight.toFixed(1)}%
                    </Badge>
                </div>
            </TableCell>

            <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
                <Badge
                    className={`${objective.type === "CORPORATE"
                            ? "bg-purple-100 text-purple-600"
                            : objective.type === "DIVISION"
                                ? "bg-blue-100 text-blue-600"
                                : objective.type === "DEPARTMENT"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-orange-100 text-orange-600"
                        } rounded-full px-3 py-1 text-xs font-medium border-0`}
                >
                    {objective.type}
                </Badge>
            </TableCell>

            <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
                <div className="flex flex-col gap-1">
                    {objective.strategicPeriod ? (
                        <span className="text-sm font-medium">
                            {new Date(objective.strategicPeriod.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} - {new Date(objective.strategicPeriod.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400 italic">No period</span>
                    )}
                </div>
            </TableCell>

            <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
                {new Date(objective.createdAt).toLocaleDateString()}
            </TableCell>

            <TableCell className="px-6 py-4 text-gray-600" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                    {onViewObjective && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewObjective(objective)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}

                    <ObjectiveActions
                        objective={objective}
                        kpis={kpis}
                        onView={onViewObjective || (() => { })}
                        onEditSuccess={onEditSuccess}
                        onDelete={onDeleteObjective}
                        onAddKPISuccess={onEditSuccess}
                    />

                    <button
                        onClick={() => onExpand(objective.objectiveId)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors ml-2"
                    >
                        {expanded ? (
                            <ChevronUp className="h-5 w-5 text-blue-600" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                </div>
            </TableCell>
        </TableRow>
    );
};

export default ObjectiveTableRow;
