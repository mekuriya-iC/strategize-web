import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DataTableCard,
  DataTableCardHeader,
  DataTableCardMeta,
  DataTableCardMetaRow,
  DataTableCards,
  DataTableDesktop,
} from "@/components/ui/responsive-table";
import EmployeeTableRow from "./EmployeeTableRow";
import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import EmployeeRoleBadge from "./EmployeeRoleBadge";
import EmployeeActionsMenu from "./EmployeeActionsMenu";
import ReusableTableHeader, {
  HeaderColumn,
} from "@/components/ui/table-header";
import { useTableColumnControls } from "@/hooks/table/useTableColumnControls";
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

type EmployeeRow = {
  transformed: LegacyEmployee;
  original?: GraphQLEmployee;
};

// Props interface for the component
interface EmployeeTableProps {
  employees: GraphQLEmployee[] | Employee[] | LegacyEmployee[];
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

const DEFAULT_HEADERS: HeaderColumn[] = [
  { key: "fullName", label: "FULL NAME", filterable: true },
  { key: "profilePic", label: "PROFILE PICTURE", sortable: false, filterable: false },
  { key: "email", label: "EMAIL", filterable: true },
  { key: "title", label: "TITLE", filterable: true },
  {
    key: "department",
    label: "ACCESS ROLE",
    filterable: true,
    filterType: "select",
    filterOptions: Object.keys(ROLE_HIERARCHY).map((role) => ({
      value: role,
      label: role.replace(/_/g, " "),
    })),
  },
  { key: "phone", label: "PHONE NUMBER", filterable: true },
  { key: "employedOn", label: "EMPLOYED ON", filterable: true },
  {
    key: "status",
    label: "STATUS",
    filterable: true,
    filterType: "select",
    filterOptions: [
      { value: "Active", label: "Active" },
      { value: "Deactivated", label: "Deactivated" },
    ],
  },
  { key: "action", label: "ACTION", sortable: false, filterable: false },
];

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  headers = DEFAULT_HEADERS,
  loading = false,
  error,
}) => {
  // Transform GraphQL employees to legacy format for UI compatibility
  const transformedEmployees = useMemo((): EmployeeRow[] => {
    return employees.map(
      (
        employee,
        index
      ): EmployeeRow => {
        if ("employeeId" in employee) {
          // It's a GraphQL employee, transform it
          const graphqlEmployee = employee as Employee;
          return {
            transformed: {
              id: parseInt(graphqlEmployee.employeeId) || index,
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

  const columns = useMemo(
    () => [
      {
        id: "fullName",
        accessor: (row: EmployeeRow) => row.transformed.fullName,
      },
      {
        id: "email",
        accessor: (row: EmployeeRow) => row.transformed.email,
      },
      {
        id: "title",
        accessor: (row: EmployeeRow) => row.transformed.title,
      },
      {
        id: "department",
        accessor: (row: EmployeeRow) => row.transformed.department,
        compare: (a: EmployeeRow, b: EmployeeRow) => {
          const aHierarchy =
            ROLE_HIERARCHY[
              a.transformed.department as keyof typeof ROLE_HIERARCHY
            ] ?? -1;
          const bHierarchy =
            ROLE_HIERARCHY[
              b.transformed.department as keyof typeof ROLE_HIERARCHY
            ] ?? -1;
          return aHierarchy - bHierarchy;
        },
        filterFn: (row: EmployeeRow, value: string) =>
          row.transformed.department === value,
      },
      {
        id: "phone",
        accessor: (row: EmployeeRow) => row.transformed.phone,
      },
      {
        id: "employedOn",
        accessor: (row: EmployeeRow) => row.transformed.employedOn,
        compare: (a: EmployeeRow, b: EmployeeRow) => {
          const aDate =
            a.transformed.employedOn === "N/A"
              ? 0
              : new Date(a.transformed.employedOn).getTime();
          const bDate =
            b.transformed.employedOn === "N/A"
              ? 0
              : new Date(b.transformed.employedOn).getTime();
          return aDate - bDate;
        },
      },
      {
        id: "status",
        accessor: (row: EmployeeRow) => row.transformed.status,
        filterFn: (row: EmployeeRow, value: string) =>
          row.transformed.status === value,
      },
    ],
    [],
  );

  const {
    processedRows: sortedEmployees,
    sortConfig,
    filters,
    toggleSort,
    setFilter,
  } = useTableColumnControls({
    rows: transformedEmployees,
    columns,
    initialSort: { key: "department", direction: "desc" },
    allowUnsorted: false,
  });

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
    <>
      <DataTableDesktop className="overflow-hidden rounded-lg border border-border">
        <Table stickyFirstColumn className="border-none">
          <ReusableTableHeader
            headers={headers}
            sortConfig={sortConfig}
            onSort={toggleSort}
            filters={filters}
            onFilterChange={setFilter}
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
      </DataTableDesktop>

      <DataTableCards className="space-y-3 p-1">
        {sortedEmployees.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No employees found
          </div>
        ) : (
          sortedEmployees.map((employeeData, idx) => {
            const employee = employeeData.transformed;
            return (
              <DataTableCard
                key={employee.employeeId || `employee-card-${idx}`}
              >
                <DataTableCardHeader>
                  <div className="flex min-w-0 items-center gap-3">
                    <EmployeeAvatar
                      src={employee.profilePic}
                      alt={employee.fullName}
                      downloadUrl={employee.profilePic}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {employee.fullName}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {employee.title}
                      </p>
                    </div>
                  </div>
                  <EmployeeActionsMenu
                    employeeName={employee.fullName}
                    employeeId={employee.employeeId}
                    originalEmployee={employeeData.original}
                  />
                </DataTableCardHeader>
                <DataTableCardMeta>
                  <DataTableCardMetaRow label="Email">
                    <span className="break-all">{employee.email}</span>
                  </DataTableCardMetaRow>
                  <DataTableCardMetaRow label="Role">
                    <EmployeeRoleBadge role={employee.department} />
                  </DataTableCardMetaRow>
                  <DataTableCardMetaRow label="Phone">
                    {employee.phone}
                  </DataTableCardMetaRow>
                  <DataTableCardMetaRow label="Employed">
                    {employee.employedOn}
                  </DataTableCardMetaRow>
                  <DataTableCardMetaRow label="Status">
                    <EmployeeStatusBadge status={employee.status} />
                  </DataTableCardMetaRow>
                </DataTableCardMeta>
              </DataTableCard>
            );
          })
        )}
      </DataTableCards>
    </>
  );
};

export default EmployeeTable;
