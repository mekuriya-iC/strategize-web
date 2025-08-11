import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Objective } from "../objectives/ObjectiveTable";
import { Kpi } from "@/types/graphql";

interface ApprovalTableProps {
  objectives: Objective[];
  kpis: Kpi[];
  selected: string[];
  expanded: string | null;
  onSelect: (id: string) => void;
  onSelectAll?: () => void;
  onExpand: (id: string) => void;
  onApproveObjective: (objective: Objective) => void;
  onRejectObjective: (objective: Objective) => void;
  onApproveKPI: (kpi: Kpi) => void;
  onRejectKPI: (kpi: Kpi) => void;
  loading?: boolean;
  error?: string;
}

const statusMap = {
  NOT_SUBMITTED: { label: "Not Submitted", color: "bg-pink-100 text-pink-600" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-600" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-600" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

const ApprovalTable: React.FC<ApprovalTableProps> = ({
  objectives,
  kpis,
  selected,
  expanded,
  onSelect,
  onSelectAll,
  onExpand,
  onApproveObjective,
  onRejectObjective,
  onApproveKPI,
  onRejectKPI,
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
          <p className="text-gray-600">No objectives found for approval.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-gray-50">
            <TableHead className="px-6 py-4 w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Objective Level
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submit By
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Objective Name
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              KPI
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Linked KPI
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Weight
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </TableHead>
            <TableHead className="px-6 py-4 w-12"></TableHead>
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
                  } hover:bg-gray-50 transition-colors`}
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
                  <TableCell className="px-6 py-4 text-gray-600">
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-200"
                    >
                      {obj.type || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {obj.createdBy?.fullName || "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                    <div className="truncate" title={obj.name}>
                      {obj.name}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {objectiveKPIs.length} KPI
                    {objectiveKPIs.length !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {/* TODO: Add linked objectives when available in API */}0
                    Linked
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {/* TODO: Add weight when available in API */}
                    N/A
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      className={`${
                        statusMap[obj.status as keyof typeof statusMap]
                          ?.color || "bg-gray-100 text-gray-600"
                      } rounded-full px-3 py-1 text-xs font-medium border-0`}
                    >
                      {statusMap[obj.status as keyof typeof statusMap]?.label ||
                        obj.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
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
                        <DropdownMenuItem
                          onClick={() => onApproveObjective(obj)}
                          className="text-green-600 hover:bg-green-50 cursor-pointer"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Objective
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRejectObjective(obj)}
                          className="text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Objective
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="px-6 py-4 w-12">
                    <button
                      onClick={() => onExpand(obj.objectiveId)}
                      className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                    >
                      {expanded === obj.objectiveId ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>

                {/* KPI Expanded Section */}
                {expanded === obj.objectiveId && objectiveKPIs.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="px-0 py-0">
                      <div className="bg-gray-50 border-t border-gray-200">
                        <div className="px-6 py-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Key Performance Indicators
                          </h4>
                          <div className="bg-white rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50">
                                  <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                    KPI
                                  </TableHead>
                                  <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                    Weight
                                  </TableHead>
                                  <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                    Baseline
                                  </TableHead>
                                  <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                    Targets
                                  </TableHead>
                                  <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                    Status
                                  </TableHead>
                                  <TableHead className="px-4 py-3 w-12"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {objectiveKPIs.map((kpi) => (
                                  <TableRow
                                    key={kpi.kpiId}
                                    className="border-b"
                                  >
                                    <TableCell className="px-4 py-3 font-medium text-gray-900">
                                      {kpi.name}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-600">
                                      {kpi.weight}%
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-600">
                                      {kpi.baseline}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-600">
                                      {kpi.targets?.length > 0 ? (
                                        <span className="text-blue-600">
                                          {kpi.targets.length} target
                                          {kpi.targets.length > 1 ? "s" : ""}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          No targets
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                      <Badge
                                        className={`${
                                          statusMap[
                                            kpi.status as keyof typeof statusMap
                                          ]?.color ||
                                          "bg-gray-100 text-gray-600"
                                        } rounded-full px-2 py-1 text-xs font-medium border-0`}
                                      >
                                        {statusMap[
                                          kpi.status as keyof typeof statusMap
                                        ]?.label || kpi.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
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
                                          <DropdownMenuItem
                                            onClick={() => onApproveKPI(kpi)}
                                            className="text-green-600 hover:bg-green-50 cursor-pointer"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Accept KPI
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => onRejectKPI(kpi)}
                                            className="text-red-600 hover:bg-red-50 cursor-pointer"
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject KPI
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
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

export default ApprovalTable;
