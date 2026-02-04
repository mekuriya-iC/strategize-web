import React, { useState, useMemo } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import EmployeeTableRow from "./EmployeeTableRow";
import ReusableTableHeader, {
  HeaderColumn,
  SortConfig,
} from "@/components/ui/table-header";
import { Employee as GraphQLEmployee } from "@/types/graphql";
import { EmployeeTableSkeleton } from "@/components/skeleton";
import { ROLE_HIERARCHY } from "@/lib/rbac/roles";

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
    { key: "profilePic", label: "PROFILE PICTURE", sortable: false },
    { key: "email", label: "EMAIL" },
    { key: "title", label: "TITLE" },
    { key: "department", label: "ACCESS ROLE" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "employedOn", label: "EMPLOYED ON" },
    { key: "status", label: "STATUS" },
    { key: "action", label: "ACTION", sortable: false },
  ],
  loading = false,
  error,
}) => {
  // Sorting state - default to role in descending order (highest role first)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "department", // department field contains the role
    direction: "desc",
  });

  // Transform GraphQL employees to legacy format for UI compatibility
  const transformedEmployees = useMemo(() => {
    return employees.map(
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
  }, [employees]);

  // Sorting logic
  const sortedEmployees = useMemo(() => {
    if (!sortConfig) return transformedEmployees;

    const sorted = [...transformedEmployees].sort((a, b) => {
      const aValue = a.transformed[sortConfig.key as keyof LegacyEmployee];
      const bValue = b.transformed[sortConfig.key as keyof LegacyEmployee];

      // Special handling for role/department field
      if (sortConfig.key === "department") {
        const aRole = a.transformed.department as string;
        const bRole = b.transformed.department as string;

        // Get role hierarchy values (higher number = higher role)
        const aHierarchy = ROLE_HIERARCHY[aRole as keyof typeof ROLE_HIERARCHY] ?? -1;
        const bHierarchy = ROLE_HIERARCHY[bRole as keyof typeof ROLE_HIERARCHY] ?? -1;

        if (sortConfig.direction === "asc") {
          return aHierarchy - bHierarchy; // NORMAL → SUPER_ADMIN
        } else {
          return bHierarchy - aHierarchy; // SUPER_ADMIN → NORMAL
        }
      }

      // Special handling for date fields
      if (sortConfig.key === "employedOn") {
        const aDate = aValue === "N/A" ? new Date(0) : new Date(aValue as string);
        const bDate = bValue === "N/A" ? new Date(0) : new Date(bValue as string);

        if (sortConfig.direction === "asc") {
          return aDate.getTime() - bDate.getTime();
        } else {
          return bDate.getTime() - aDate.getTime();
        }
      }

      // Handle null/undefined values
      if (!aValue) return 1;
      if (!bValue) return -1;

      // String comparison for other fields
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (sortConfig.direction === "asc") {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    });

    return sorted;
  }, [transformedEmployees, sortConfig]);

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => {
      // If clicking the same column, toggle direction
      if (prevConfig?.key === key) {
        if (prevConfig.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prevConfig.direction === "desc") {
          return { key, direction: "asc" };
        }
      }
      // If clicking a new column, start with ascending
      return { key, direction: "asc" };
    });
  };

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

  return (
    <Table className="border-none">
      <ReusableTableHeader
        headers={headers}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
      <TableBody>
        {sortedEmployees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={headers.length} className="text-center py-8">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <p className="text-lg font-medium mb-2">No employees found</p>
                <p className="text-sm">
                  {error
                    ? "Error loading employees. Try adjusting your search and filters"
                    : "Try adjusting your search and filters"}
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          sortedEmployees.map((employeeData, idx) => (
            <EmployeeTableRow
              key={employeeData.transformed.employeeId || `employee-${idx}`}
              employee={employeeData.transformed}
              odd={idx % 2 === 1}
              originalEmployee={employeeData.original}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default EmployeeTable;
