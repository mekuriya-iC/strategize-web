"use client";
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import EmployeeActionsMenu from "./EmployeeActionsMenu";

interface Employee {
  id: number;
  fullName: string;
  profilePic: string;
  email: string;
  phone: string;
  employedOn: string;
  status: string;
}

const EmployeeTableRow = ({
  employee,
  odd,
}: {
  employee: Employee;
  odd: boolean;
}) => {
  return (
    <TableRow className={odd ? "bg-muted/50" : "bg-white dark:bg-muted"}>
      <TableCell className="font-medium">{employee.fullName}</TableCell>
      <TableCell>
        <EmployeeAvatar
          src={employee.profilePic}
          alt={employee.fullName}
          downloadUrl={employee.profilePic}
        />
      </TableCell>
      <TableCell>{employee.email}</TableCell>
      <TableCell>{employee.phone}</TableCell>
      <TableCell>{employee.employedOn}</TableCell>
      <TableCell>
        <EmployeeStatusBadge status={employee.status} />
      </TableCell>
      <TableCell>
        <EmployeeActionsMenu onView={() => {}} />
      </TableCell>
    </TableRow>
  );
};

export default EmployeeTableRow;
