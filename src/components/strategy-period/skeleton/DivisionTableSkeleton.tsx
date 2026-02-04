import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import ReusableTableHeader, {
  HeaderColumn,
} from "@/components/ui/table-header";

interface DivisionTableSkeletonProps {
  rows?: number;
  headers?: HeaderColumn[];
}

const DivisionTableSkeleton: React.FC<DivisionTableSkeletonProps> = ({
  rows = 6,
  headers = [
    { key: "divisionName", label: "DIVISION NAME" },
    { key: "createdBy", label: "CREATED BY" },
    { key: "createdOn", label: "CREATED ON" },
    { key: "managedBy", label: "MANAGED BY" },
    { key: "departments", label: "DEPARTMENTS" },
    { key: "action", label: "ACTIONS" },
  ],
}) => {
  return (
    <Table className="border-none">
      <ReusableTableHeader headers={headers} />
      <TableBody>
        {Array.from({ length: rows }).map((_, idx) => (
          <TableRow
            key={idx}
            className={`border-b border-gray-100 ${
              idx % 2 === 1 ? "bg-white" : "bg-[#ECECFF]"
            }`}
          >
            <TableCell className="px-6 py-4">
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell className="px-6 py-4">
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell className="px-6 py-4">
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell className="px-6 py-4">
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell className="px-6 py-4">
              <Skeleton className="h-4 w-8" />
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-8" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DivisionTableSkeleton;
