import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";

export interface Objective {
  id: string;
  title: string;
  kpis: string[];
  weight: number;
  status: "not_submitted" | "pending" | "approved" | "rejected";
}

interface ObjectiveTableProps {
  objectives: Objective[];
  selected: string[];
  expanded: string | null;
  onSelect: (id: string) => void;
  onSelectAll?: () => void;
  onExpand: (id: string) => void;
  onObjectiveClick: (objective: Objective) => void;
  loading?: boolean;
  error?: string;
}

const statusMap = {
  not_submitted: { label: "Not Submitted", color: "bg-pink-100 text-pink-600" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-600" },
  approved: { label: "Approved", color: "bg-green-100 text-green-600" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

const ObjectiveTable: React.FC<ObjectiveTableProps> = ({
  objectives,
  selected,
  expanded,
  onSelect,
  onSelectAll,
  onExpand,
  onObjectiveClick,
  loading = false,
  error,
}) => {
  // Calculate if all objectives are selected
  const allSelected =
    objectives.length > 0 &&
    objectives.every((obj) => selected.includes(obj.id));

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
              KPI
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              WEIGHT
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
              STATUS
            </TableHead>
            <TableHead className="px-6 py-3 w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectives.map((obj, idx) => (
            <React.Fragment key={obj.id}>
              <TableRow
                className={`border-b border-gray-100 ${
                  selected.includes(obj.id)
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
                    checked={selected.includes(obj.id)}
                    onCheckedChange={() => onSelect(obj.id)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </TableCell>
                <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-sm">
                  <div className="truncate" title={obj.title}>
                    {obj.title}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-gray-600">
                  <div className="flex flex-col gap-1">
                    {expanded === obj.id ? (
                      obj.kpis.map((kpi, i) => (
                        <div key={i} className="text-sm">
                          {kpi}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm font-medium">
                        {obj.kpis.length} KPIs
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-gray-600 font-medium">
                  {obj.weight}%
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
                <TableCell className="px-6 py-4 w-12">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpand(obj.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {expanded === obj.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ObjectiveTable;
