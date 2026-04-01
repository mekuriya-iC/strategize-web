import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

export interface DepartmentDetail {
  corporateKPI: string;
  kpi: string;
  baseline: string | number;
  weight: string;
  target2023: string | number;
  target2024: string | number;
  target2025: string | number;
  finalTarget: string | number;
  assignedTo: string;
}

const DepartmentDetailsRow = ({
  detail,
  odd,
}: {
  detail: DepartmentDetail;
  odd: boolean;
}) => {
  return (
    <TableRow className={odd ? "bg-muted/50" : "bg-white dark:bg-muted"}>
      <TableCell>{detail.corporateKPI}</TableCell>
      <TableCell>{detail.kpi}</TableCell>
      <TableCell>{detail.baseline}</TableCell>
      <TableCell>{detail.weight}</TableCell>
      <TableCell>{detail.target2023}</TableCell>
      <TableCell>{detail.target2024}</TableCell>
      <TableCell>{detail.target2025}</TableCell>
      <TableCell>{detail.finalTarget}</TableCell>
      <TableCell className="flex items-center gap-2">
        {detail.assignedTo}
        <ExternalLink className="size-4 text-muted-foreground" />
      </TableCell>
    </TableRow>
  );
};

export default DepartmentDetailsRow;
