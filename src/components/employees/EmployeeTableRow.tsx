"use client";
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import EmployeeActionsMenu from "./EmployeeActionsMenu";
import { Employee as GraphQLEmployee } from "@/types/graphql";

interface Employee {
  id: number;
  fullName: string;
  profilePic: string;
  email: string;
  department: string;
  phone: string;
  employedOn: string;
  status: string;
  employeeId?: string;
}

const EmployeeTableRow = ({
  employee,
  odd,
  originalEmployee,
  onAddDepartment,
}: {
  employee: Employee;
  odd: boolean;
  originalEmployee?: GraphQLEmployee;
  onAddDepartment?: () => void;
}) => {
  return (
    <TableRow className={odd ? "bg-white" : "bg-[#ECECFF] "}>
      <TableCell className="font-medium px-6 py-4 text-[#11181C]">
        {employee.fullName}
      </TableCell>
      <TableCell className="px-6 py- text-[#11181C]">
        <EmployeeAvatar
          src={employee.profilePic}
          alt={employee.fullName}
          downloadUrl={employee.profilePic}
        />
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C]">
        {employee.email}
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C]">
        {employee.department}
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C]">
        {employee.phone}
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C]">
        {employee.employedOn}
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C]">
        <EmployeeStatusBadge status={employee.status} />
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C]">
        <EmployeeActionsMenu
          onView={() => {}}
          employeeName={employee.fullName}
          employeeId={employee.employeeId}
          originalEmployee={originalEmployee}
          onAddDepartment={onAddDepartment}
        />
      </TableCell>
    </TableRow>
  );
};

export default EmployeeTableRow;
