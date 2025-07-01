import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AssignDivisionDialog from "./AssignDivisionDialog";

// Type for KPI details
interface KPIDetail {
  kpi: string;
  baseline: number | string;
  weight: string;
  targets: { [year: string]: number | string };
  assignedTo?: string;
}

interface KPIDetailsViewProps {
  objective: {
    id: string;
    title: string;
    kpis: string[];
    weight: number;
    // Optionally, you can add more fields as needed
  };
  onBack: () => void;
}

// Mock KPI details for demonstration
const mockKPIDetails: KPIDetail[] = [
  {
    kpi: "Revenue from LS(4 line) in million",
    baseline: 12,
    weight: "10%",
    targets: { "2023/24": 25, "2024/25": 40, "2025/26": 30 },
    assignedTo: "Assign",
  },
  {
    kpi: "Revenue from RAS(5 line) in million",
    baseline: 12,
    weight: "10%",
    targets: { "2023/24": 25, "2024/25": 40, "2025/26": 30 },
    assignedTo: "Assign",
  },
  {
    kpi: "Revenue from KSP in million",
    baseline: 12,
    weight: "10%",
    targets: { "2023/24": 25, "2024/25": 40, "2025/26": 30 },
    assignedTo: "Assign",
  },
];

const years = ["2023/24", "2024/25", "2025/26"];

export default function KPIDetailsView({
  objective,
  onBack,
}: KPIDetailsViewProps) {
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [selectedKPI, setSelectedKPI] = React.useState<string | null>(null);
  // Map KPI name to assigned divisions
  const [assignedDivisions, setAssignedDivisions] = React.useState<
    Record<string, string[]>
  >({
    "Revenue from LS(4 line) in million": ["OD", "RAS"],
    "Revenue from RAS(5 line) in million": ["OD"],
    "Revenue from KSP in million": [],
  });

  const handleAssign = (division: string) => {
    if (!selectedKPI) return;
    setAssignedDivisions((prev) => ({
      ...prev,
      [selectedKPI]: prev[selectedKPI]
        ? Array.from(new Set([...prev[selectedKPI], division]))
        : [division],
    }));
  };

  const handleRemove = (division: string) => {
    if (!selectedKPI) return;
    setAssignedDivisions((prev) => ({
      ...prev,
      [selectedKPI]: prev[selectedKPI]?.filter((d) => d !== division) || [],
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header with Back Button and Title */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-semibold">{objective.title}</h2>
      </div>
      {/* Search Bar */}
      <div className="mb-4">
        <Input placeholder="Search..." className="w-1/3" />
      </div>
      {/* KPI Table */}
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className=" text-[#9E9E9E] text-[14px] px-6 py-3">
                KPI
              </TableHead>
              <TableHead className="text-[#9E9E9E] text-[14px] px-6 py-3">
                Baseline
              </TableHead>
              <TableHead className="text-[#9E9E9E] text-[14px] px-6 py-3">
                Weight
              </TableHead>
              {years.map((year) => (
                <TableHead
                  key={year}
                  className="text-[#9E9E9E] text-[14px] px-6 py-3"
                >
                  Target {year}
                </TableHead>
              ))}
              <TableHead className="text-[#9E9E9E] text-[14px] px-6 py-3">
                Assigned To
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockKPIDetails.map((kpi, idx) => (
              <TableRow
                key={kpi.kpi}
                className={idx % 2 === 0 ? "bg-white" : "bg-[#ECECFF]"}
              >
                <TableCell className="  px-6 py-4 text-gray-600 font-medium">
                  {kpi.kpi}
                </TableCell>
                <TableCell className="px-6 py-4 text-gray-600 font-medium">
                  {kpi.baseline}
                </TableCell>
                <TableCell className="px-6 py-4 text-gray-600 font-medium">
                  {kpi.weight}
                </TableCell>
                {years.map((year) => (
                  <TableCell key={year} className="px-6 py-4 text-gray-600 font-medium">
                    {kpi.targets[year] ?? "-"}
                  </TableCell>
                ))}
                <TableCell className="px-6 py-4 text-gray-600 font-medium">
                  <Button
                    variant="link"
                    className="text-primary px-0 h-auto"
                    onClick={() => {
                      setSelectedKPI(kpi.kpi);
                      setAssignDialogOpen(true);
                    }}
                  >
                    Assign
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Assign Division Dialog */}
      <AssignDivisionDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        kpi={selectedKPI}
        assignedDivisions={
          selectedKPI ? assignedDivisions[selectedKPI] || [] : []
        }
        onAssign={handleAssign}
        onRemove={handleRemove}
      />
      {/* Pagination (mock) */}
      <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
        <span>Showing Page 1 of 1</span>
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="sm">
            &lt; Previous
          </Button>
          <span className="px-2 py-1 rounded bg-muted/30">1</span>
          <Button variant="ghost" size="sm">
            Next &gt;
          </Button>
        </div>
      </div>
    </div>
  );
}
