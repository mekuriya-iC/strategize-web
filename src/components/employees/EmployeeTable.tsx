import React from "react";
import { Table, TableBody } from "@/components/ui/table";
import EmployeeTableRow from "./EmployeeTableRow";
import ReusableTableHeader, {
  HeaderColumn,
} from "@/components/ui/table-header";
import { Employee as GraphQLEmployee } from "@/types/graphql";
import { EmployeeTableSkeleton } from "@/components/skeleton";

// Define the Employee type to match GraphQL API
export interface Employee {
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  picture: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
  startDate: string;
  title: string;
  // Add optional fields for UI compatibility
  profilePic?: string;
  department?: string;
  phone?: string;
  employedOn?: string;
}

// Legacy Employee type for backward compatibility
export interface LegacyEmployee {
  id: number;
  fullName: string;
  profilePic: string;
  email: string;
  department: string;
  phone: string;
  employedOn: string;
  status: "Active" | "Deactivated";
  title: string;
  // Add original employeeId for delete operations
  employeeId?: string;
}

// Props interface for the component
interface EmployeeTableProps {
  employees: Employee[] | LegacyEmployee[];
  headers?: HeaderColumn[];
  loading?: boolean;
  error?: string;
  onAddDepartment?: () => void;
}

// Helper function to format phone number with +251 prefix
const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || phoneNumber === "N/A") return "N/A";

  // If it already has +251, return as is
  if (phoneNumber.startsWith("+251")) {
    return phoneNumber;
  }

  // If it starts with 251, add the +
  if (phoneNumber.startsWith("251")) {
    return `+${phoneNumber}`;
  }

  // Otherwise, add +251 prefix
  return `+251${phoneNumber}`;
};

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  headers = [
    { key: "fullName", label: "FULL NAME" },
    { key: "profilePic", label: "PROFILE PICTURE" },
    { key: "email", label: "EMAIL" },
    { key: "title", label: "TITLE" },
    { key: "department", label: "ACCESS ROLE" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "employedOn", label: "EMPLOYED ON" },
    { key: "status", label: "STATUS" },
    { key: "action", label: "ACTION" },
  ],
  loading = false,
  error,
  onAddDepartment,
}) => {
  if (loading) {
    return <EmployeeTableSkeleton rows={6} headers={headers} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading employees: {error}</p>
      </div>
    );
  }

  // Transform GraphQL employees to legacy format for UI compatibility
  const transformedEmployees = employees.map(
    (
      employee,
      index
    ): { transformed: LegacyEmployee; original?: GraphQLEmployee } => {
      if ("employeeId" in employee) {
        // It's a GraphQL employee, transform it
        const graphqlEmployee = employee as Employee;
        return {
          transformed: {
            id: parseInt(graphqlEmployee.employeeId) || Date.now() + index,
            employeeId: graphqlEmployee.employeeId,
            fullName: graphqlEmployee.fullName,
            profilePic: graphqlEmployee.picture
              ? `/api/storage/${graphqlEmployee.picture.split("/").pop()}`
              : "/avatars/default.png",
            email: graphqlEmployee.email,
            department: graphqlEmployee.role || "Unknown",
            phone: formatPhoneNumber(graphqlEmployee.phoneNumber),
            employedOn: graphqlEmployee.startDate
              ? new Date(graphqlEmployee.startDate).toLocaleDateString()
              : "N/A",
            status:
              graphqlEmployee.status === "ACTIVE" ? "Active" : "Deactivated",
            title: graphqlEmployee.title || "N/A",
          },
          original: graphqlEmployee as GraphQLEmployee,
        };
      } else {
        // It's already a legacy employee, also format its phone number
        const legacyEmployee = employee as LegacyEmployee;
        return {
          transformed: {
            ...legacyEmployee,
            phone: formatPhoneNumber(legacyEmployee.phone),
          },
          original: undefined,
        };
      }
    }
  );

  return (
    <Table className="border-none">
      <ReusableTableHeader headers={headers} />
      <TableBody>
        {transformedEmployees.map((employeeData, idx) => (
          <EmployeeTableRow
            key={employeeData.transformed.employeeId || `employee-${idx}`}
            employee={employeeData.transformed}
            odd={idx % 2 === 1}
            originalEmployee={employeeData.original}
            onAddDepartment={onAddDepartment}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default EmployeeTable;
