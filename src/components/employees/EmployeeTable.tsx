import React from "react";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import EmployeeTableRow from "./EmployeeTableRow";
import ReusableTableHeader, {
  HeaderColumn,
} from "@/components/ui/table-header";

// Define the Employee type
export interface Employee {
  id: number;
  fullName: string;
  profilePic: string;
  email: string;
  department: string;
  phone: string;
  employedOn: string;
  status: "Active" | "Deactivated";
}

// Props interface for the component
interface EmployeeTableProps {
  employees: Employee[];
  headers?: HeaderColumn[];
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  headers = [
    { key: "fullName", label: "FULL NAME" },
    { key: "profilePic", label: "PROFILE PICTURE" },
    { key: "email", label: "EMAIL" },
    { key: "department", label: "DEPARTMENT" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "employedOn", label: "EMPLOYED ON" },
    { key: "status", label: "STATUS" },
    { key: "action", label: "ACTION" },
  ],
}) => {
  return (
    <Table className="border-none">
      <ReusableTableHeader headers={headers} />
      <TableBody>
        {employees.map((employee, idx) => (
          <EmployeeTableRow
            key={employee.id}
            employee={employee}
            odd={idx % 2 === 1}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default EmployeeTable;
