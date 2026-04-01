import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import ReusableTableHeader, {
  HeaderColumn,
} from "@/components/ui/table-header";

interface DepartmentTableSkeletonProps {
  rows?: number;
  headers?: HeaderColumn[];
}

const DepartmentTableSkeleton: React.FC<DepartmentTableSkeletonProps> = ({
  rows = 5,
  headers = [
    { key: "departmentName", label: "DEPARTMENT NAME" },
    { key: "createdBy", label: "CREATED BY" },
    { key: "createdOn", label: "CREATED ON" },
    { key: "managedBy", label: "MANAGED BY" },
    { key: "division", label: "DIVISION" },
    { key: "members", label: "MEMBERS" },
    { key: "action", label: "ACTION" },
  ],
}) => {
  return (
    <div className="space-y-4">
      <Table className="border-none">
        <ReusableTableHeader headers={headers} />
        <TableBody>
          {Array.from({ length: rows }).map((_, idx) => (
            <TableRow
              key={idx}
              className={`border-b border-gray-100 ${
                idx % 2 === 1 ? "bg-gray-50" : "bg-white"
              } hover:bg-gray-50`}
            >
              {/* Department Name */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-48" />
              </TableCell>

              {/* Created By */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-24" />
              </TableCell>

              {/* Created On */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-32" />
              </TableCell>

              {/* Managed By */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>

              {/* Division */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-36" />
              </TableCell>

              {/* Members */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-8" />
              </TableCell>

              {/* Action */}
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DepartmentTableSkeleton;
