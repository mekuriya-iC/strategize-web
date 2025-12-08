import React from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import ReusableTableHeader from "@/components/ui/table-header";
import { DepartmentTableSkeleton } from "@/components/skeleton";
import type { Department, Employee } from "@/types/graphql";

export interface DepartmentDetailsRow {
  id: string;
  departmentName: string;
  createdBy: string;
  createdOn: string;
  managedBy: string;
  division: string;
  members: string; // Changed from number to string to show member names
}

// Transform department data to table format
const transformDepartmentToTableData = (
  department: Department
): DepartmentDetailsRow => {
  const memberNames =
    department.employees
      ?.map((employee: Employee) => employee.fullName)
      .join(", ") || "No members";

  return {
    id: department.departmentId,
    departmentName: department.name,
    createdBy: "System", // GraphQL doesn't provide createdBy info
    createdOn: new Date(department.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    managedBy: department.manager?.fullName || "No Manager",
    division: department.division?.name || "No Division",
    members: memberNames,
  };
};

interface DepartmentDetailsTableProps {
  department?: Department;
  loading?: boolean;
  error?: string;
}

const DepartmentDetailsTable: React.FC<DepartmentDetailsTableProps> = ({
  department,
  loading = false,
  error,
}) => {
  // Transform department to table data
  const departmentData = department
    ? transformDepartmentToTableData(department)
    : null;

  const headers = [
    { key: "departmentName", label: "DEPARTMENT NAME" },
    { key: "createdBy", label: "CREATED BY" },
    { key: "createdOn", label: "CREATED ON" },
    { key: "managedBy", label: "MANAGER" },
    { key: "division", label: "DIVISION" },
    { key: "members", label: "MEMBERS" },
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

  if (!departmentData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No department data available</p>
      </div>
    );
  }

  return (
    <Table className="border-none">
      <ReusableTableHeader headers={headers} />
      <TableBody>
        <TableRow className="border-b border-gray-100 bg-[#ECECFF] hover:bg-gray-50 transition-colors">
          <TableCell className="px-6 py-4 font-medium text-gray-900">
            {departmentData.departmentName}
          </TableCell>
          <TableCell className="px-6 py-4 text-gray-600">
            {departmentData.createdBy}
          </TableCell>
          <TableCell className="px-6 py-4 text-gray-600">
            {departmentData.createdOn}
          </TableCell>
          <TableCell className="px-6 py-4 text-gray-600">
            {departmentData.managedBy}
          </TableCell>
          <TableCell className="px-6 py-4 text-gray-600">
            {departmentData.division}
          </TableCell>
          <TableCell className="px-6 py-4 text-gray-600 max-w-[300px]">
            <div className="truncate" title={departmentData.members}>
              {departmentData.members}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default DepartmentDetailsTable;
