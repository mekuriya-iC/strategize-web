import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import ReusableTableHeader, {
  HeaderColumn,
} from "@/components/ui/table-header";

interface EmployeeTableSkeletonProps {
  rows?: number;
  headers?: HeaderColumn[];
}

const EmployeeTableSkeleton: React.FC<EmployeeTableSkeletonProps> = ({
  rows = 5,
  headers = [
    { key: "fullName", label: "FULL NAME" },
    { key: "profilePic", label: "PROFILE PICTURE" },
    { key: "email", label: "EMAIL" },
    { key: "department", label: "DEPARTMENT/ROLE" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "employedOn", label: "EMPLOYED ON" },
    { key: "status", label: "STATUS" },
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
              {/* Full Name */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-32" />
              </TableCell>

              {/* Profile Picture */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-10 w-10 rounded-full" />
              </TableCell>

              {/* Email */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-40" />
              </TableCell>

              {/* Department/Role */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-24" />
              </TableCell>

              {/* Phone Number */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>

              {/* Employed On */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
              </TableCell>

              {/* Status */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>

              {/* Action */}
              <TableCell className="px-6 py-4">
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeTableSkeleton;
