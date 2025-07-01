import React from "react";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Trash2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReusableTableHeader, {
} from "@/components/ui/table-header";
import { DepartmentTableSkeleton } from "@/components/skeleton";

export interface DepartmentDetail {
  id?: number;
  corporateKPI: string;
  kpi: string;
  baseline: number;
  weight: string;
  target2023: number;
  target2024: number;
  target2025: number;
  finalTarget: number;
  assignedTo: string;
}

const mockDetails: DepartmentDetail[] = [
  {
    id: 1,
    corporateKPI: "200+ employees trained in Q1",
    kpi: "Over 200 team members completed training in the first month",
    baseline: 12,
    weight: "10%",
    target2023: 25,
    target2024: 40,
    target2025: 30,
    finalTarget: 45,
    assignedTo: "John Doe",
  },
  {
    id: 2,
    corporateKPI: "Implement a training platform throughout...",
    kpi: "Over 200 staff members completed training in the first month",
    baseline: 12,
    weight: "10%",
    target2023: 25,
    target2024: 40,
    target2025: 30,
    finalTarget: 45,
    assignedTo: "Jane Doe",
  },
  {
    id: 3,
    corporateKPI: "Deploy a learning management system across 3 departments",
    kpi: "New training modules launched for leadership development",
    baseline: 12,
    weight: "10%",
    target2023: 25,
    target2024: 40,
    target2025: 30,
    finalTarget: 45,
    assignedTo: "Bill Doe",
  },
  {
    id: 4,
    corporateKPI: "Complete digital transformation initiative",
    kpi: "System integration across all departments",
    baseline: 8,
    weight: "15%",
    target2023: 20,
    target2024: 35,
    target2025: 28,
    finalTarget: 40,
    assignedTo: "Sarah Smith",
  },
  {
    id: 5,
    corporateKPI: "Enhance customer satisfaction metrics",
    kpi: "Improve response time and service quality",
    baseline: 15,
    weight: "12%",
    target2023: 30,
    target2024: 45,
    target2025: 35,
    finalTarget: 50,
    assignedTo: "Mike Johnson",
  },
];

interface DepartmentDetailsTableProps {
  details?: DepartmentDetail[];
  loading?: boolean;
  error?: string;
}

const DepartmentDetailsTable: React.FC<DepartmentDetailsTableProps> = ({
  details: propDetails,
  loading = false,
  error,
}) => {
  const detailsToShow = propDetails || mockDetails;

  const headers = [
    { key: "corporateKPI", label: "CORPORATE KPI" },
    { key: "kpi", label: "KPI" },
    { key: "baseline", label: "BASELINE" },
    { key: "weight", label: "WEIGHT" },
    { key: "target2023", label: "TARGET 2023/24" },
    { key: "target2024", label: "2024/25" },
    { key: "target2025", label: "2025/26" },
    { key: "finalTarget", label: "FINAL TARGET" },
    { key: "assignedTo", label: "ASSIGNED TO" },
    { key: "action", label: "ACTION" },
  ];

  if (loading) {
    return <DepartmentTableSkeleton rows={6} headers={headers} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">
          Error loading department details: {error}
        </p>
      </div>
    );
  }

  return (
    <Table className="border-none">
      <ReusableTableHeader headers={headers} />
      <TableBody>
        {detailsToShow.map((detail, idx) => (
          <TableRow
            key={detail.id || idx}
            className={`border-b border-gray-100 ${
              idx % 2 === 1 ? "bg-white" : "bg-[#ECECFF]"
            } hover:bg-gray-50 transition-colors`}
          >
            <TableCell className="px-6 py-4 font-medium text-gray-900 max-w-[200px]">
              <div className="truncate" title={detail.corporateKPI}>
                {detail.corporateKPI}
              </div>
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600 max-w-[250px]">
              <div className="truncate" title={detail.kpi}>
                {detail.kpi}
              </div>
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600 text-center">
              {detail.baseline}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600 text-center">
              {detail.weight}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600 text-center">
              {detail.target2023}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600 text-center">
              {detail.target2024}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600 text-center">
              {detail.target2025}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600 text-center">
              {detail.finalTarget}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {detail.assignedTo}
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                >
                  View
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-orange-50">
                      <Plus className="h-4 w-4" />
                      Add KPI
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" color="red" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DepartmentDetailsTable;
