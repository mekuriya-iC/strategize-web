import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Objective as GraphQLObjective, Kpi } from "@/types/graphql";
import EditObjectiveDialog from "./EditObjectiveDialog";
import DeleteObjectiveDialog from "./DeleteObjectiveDialog";

// Re-export the GraphQL Objective type for backward compatibility
export type Objective = GraphQLObjective;

interface ObjectiveTableProps {
  objectives: Objective[];
  kpis: Kpi[];
  selected: string[];
  expanded: string | null;
  onSelect: (id: string) => void;
  onSelectAll?: () => void;
  onExpand: (id: string) => void;
  onObjectiveClick: (objective: Objective) => void;
  onViewObjective?: (objective: Objective) => void;
  onEditSuccess?: () => void;
  onDeleteObjective?: (objective: Objective) => void;
  loading?: boolean;
  error?: string;
}

const statusMap = {
  NOT_SUBMITTED: { label: "Not Submitted", color: "bg-pink-100 text-pink-600" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-600" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-600" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

const ObjectiveTable: React.FC<ObjectiveTableProps> = ({
  objectives,
  kpis,
  selected,
  expanded,
  onSelect,
  onSelectAll,
  onExpand,
  onObjectiveClick,
  onViewObjective,
  onEditSuccess,
  onDeleteObjective,
  loading = false,
  error,
}) => {
  // Calculate if all objectives are selected
  const allSelected =
    objectives.length > 0 &&
    objectives.every((obj) => selected.includes(obj.objectiveId));

  // Helper function to get KPIs for a specific objective
  const getKPIsForObjective = (objectiveId: string) => {
    return kpis.filter((kpi) => kpi.objective?.objectiveId === objectiveId);
  };

  if (loading) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading objectives...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <p className="text-red-600">Error loading objectives: {error}</p>
        </div>
      </div>
    );
  }

  if (objectives.length === 0) {
    return (
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <div className="p-8 text-center">
          <p className="text-gray-600">No objectives found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
      <Table className="border-none">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="px-6 py-3 w-12">
              {onSelectAll && (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              )}
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              STRATEGIC OBJECTIVE
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              TYPE
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              KPIs
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              STRATEGIC PERIOD
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              STATUS
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              ACTIONS
            </TableHead>
            <TableHead className="px-6 py-3 w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectives.map((obj, idx) => {
            const objectiveKPIs = getKPIsForObjective(obj.objectiveId);
            return (
              <React.Fragment key={obj.objectiveId}>
                <TableRow
                  className={`border-b border-gray-100 ${
                    selected.includes(obj.objectiveId)
                      ? "bg-blue-50"
                      : idx % 2 === 1
                      ? "bg-white"
                      : "bg-[#ECECFF]"
                  } hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => onObjectiveClick(obj)}
                >
                  <TableCell
                    className="px-6 py-4 w-12"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.includes(obj.objectiveId)}
                      onCheckedChange={() => onSelect(obj.objectiveId)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                    <div className="truncate" title={obj.name}>
                      {obj.name}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    <Badge
                      className={`${
                        obj.type === "CORPORATE"
                          ? "bg-purple-100 text-purple-600"
                          : obj.type === "DIVISION"
                          ? "bg-blue-100 text-blue-600"
                          : obj.type === "DEPARTMENT"
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      } rounded-full px-3 py-1 text-xs font-medium border-0`}
                    >
                      {obj.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {objectiveKPIs.length} KPI
                        {objectiveKPIs.length !== 1 ? "s" : ""}
                      </span>
                      {objectiveKPIs.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {
                            objectiveKPIs.filter(
                              (kpi) => kpi.status === "APPROVED"
                            ).length
                          }{" "}
                          approved
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    <div className="flex flex-col gap-1">
                      {obj.strategicPeriod ? (
                        <>
                          <span className="text-sm font-medium">
                            {new Date(
                              obj.strategicPeriod.startDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(
                              obj.strategicPeriod.endDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {obj.strategicPeriod.length}{" "}
                            {obj.strategicPeriod.length === 1
                              ? "year"
                              : "years"}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 italic">
                          No period assigned
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      className={`${
                        statusMap[obj.status].color
                      } rounded-full px-3 py-1 text-xs font-medium border-0`}
                    >
                      {statusMap[obj.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="px-6 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewObjective?.(obj)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditObjectiveDialog
                            objective={obj}
                            onEditSuccess={onEditSuccess}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              Edit
                            </DropdownMenuItem>
                          </EditObjectiveDialog>
                          <DropdownMenuSeparator />
                          <DeleteObjectiveDialog
                            objectiveId={obj.objectiveId}
                            objectiveName={obj.name}
                            onDeleteSuccess={() => onDeleteObjective?.(obj)}
                          >
                            <DropdownMenuItem
                              className={`${
                                objectiveKPIs.length > 0
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:text-red-700"
                              }`}
                              disabled={objectiveKPIs.length > 0}
                              onSelect={(e) => e.preventDefault()}
                              title={
                                objectiveKPIs.length > 0
                                  ? `Cannot delete: ${
                                      objectiveKPIs.length
                                    } KPI${
                                      objectiveKPIs.length !== 1 ? "s" : ""
                                    } associated`
                                  : "Delete objective"
                              }
                            >
                              Delete
                              {objectiveKPIs.length > 0 && (
                                <span className="ml-auto text-xs">
                                  ({objectiveKPIs.length} KPI
                                  {objectiveKPIs.length !== 1 ? "s" : ""})
                                </span>
                              )}
                            </DropdownMenuItem>
                          </DeleteObjectiveDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 w-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpand(obj.objectiveId);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {expanded === obj.objectiveId ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>

                {/* Expanded KPI Details */}
                {expanded === obj.objectiveId && objectiveKPIs.length > 0 && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={8} className="px-6 py-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-medium mb-3 text-gray-900">
                          Key Performance Indicators
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  KPI
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Weight
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Baseline
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Targets
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {objectiveKPIs.map((kpi, kpiIdx) => (
                                <tr
                                  key={kpi.kpiId}
                                  className={
                                    kpiIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  }
                                >
                                  <td className="py-2 px-3 font-medium text-gray-900">
                                    {kpi.name}
                                  </td>
                                  <td className="py-2 px-3 text-gray-600">
                                    {kpi.weight}
                                    {kpi.weightType === "PERCENT" ? "%" : ""}
                                  </td>
                                  <td className="py-2 px-3 text-gray-600">
                                    {kpi.baseline}
                                  </td>
                                  <td className="py-2 px-3 text-gray-600">
                                    {kpi.targets && kpi.targets.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {kpi.targets
                                          .slice(0, 3)
                                          .map((t, idx) => (
                                            <div key={idx} className="text-xs">
                                              <span className="font-medium">
                                                {t.timeline}:
                                              </span>{" "}
                                              {t.target}
                                            </div>
                                          ))}
                                        {kpi.targets.length > 3 && (
                                          <span className="text-xs text-gray-500">
                                            +{kpi.targets.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic text-xs">
                                        No targets
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    <Badge
                                      className={`${
                                        statusMap[kpi.status].color
                                      } rounded-full px-2 py-1 text-xs font-medium border-0`}
                                    >
                                      {statusMap[kpi.status].label}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Show message when expanded but no KPIs */}
                {expanded === obj.objectiveId && objectiveKPIs.length === 0 && (
                  <TableRow className="bg-gray-50">
                    <TableCell
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No KPIs have been added to this objective yet.
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ObjectiveTable;
