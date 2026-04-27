"use client";
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import EmployeeRoleBadge from "./EmployeeRoleBadge";
import EmployeeActionsMenu from "./EmployeeActionsMenu";
import { Employee as GraphQLEmployee } from "@/types/graphql";

interface Employee {
  id: number;
  fullName: string;
  profilePic: string;
  email: string;
  title: string;
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
}: {
  employee: Employee;
  odd: boolean;
  originalEmployee?: GraphQLEmployee;
}) => {
  return (
    <TableRow className={odd ? "bg-white dark:bg-transparent" : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"}>
      <TableCell className="font-medium px-6 py-4 text-[#11181C] dark:text-gray-100">
        {employee.fullName}
      </TableCell>
      <TableCell className="px-6 py- text-[#11181C] dark:text-gray-100">
        <EmployeeAvatar
          src={employee.profilePic}
          alt={employee.fullName}
          downloadUrl={employee.profilePic}
        />
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C] dark:text-gray-100">
        {employee.email}
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C] dark:text-gray-100">
        {employee.title}
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C] dark:text-gray-100">
        <EmployeeRoleBadge role={employee.department} />
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C] dark:text-gray-100">
        {employee.phone}
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C] dark:text-gray-100">
        {employee.employedOn}
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C] dark:text-gray-100">
        <EmployeeStatusBadge status={employee.status} />
      </TableCell>
      <TableCell className="px-6 py-4 text-[#11181C] dark:text-gray-100">
        <EmployeeActionsMenu
          onView={() => {}}
          employeeName={employee.fullName}
          employeeId={employee.employeeId}
          originalEmployee={originalEmployee}
        />
      </TableCell>
    </TableRow>
  );
};

export default EmployeeTableRow;
