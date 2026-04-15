import React from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReusableTableHeader, {
} from "@/components/ui/table-header";
import { DepartmentTableSkeleton } from "@/components/skeleton";
import EditDepartmentDialog from "@/components/departments/EditDepartmentDialog";
import DeleteDepartmentDialog from "@/components/departments/DeleteDepartmentDialog";

export interface Department {
  id: string | number;
  departmentName: string;
  createdBy: string;
  createdOn: string;
  managedBy: string;
  division: string;
  members: number;
}

const mockDepartments: Department[] = [
  {
    id: 1,
    departmentName: "Research and Advisory Solution",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 6,
  },
  {
    id: 2,
    departmentName: "Learning solutions",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 3,
  },
  {
    id: 3,
    departmentName: "Knowledge Sharing Platform",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Lorem Ipsum Division",
    members: 8,
  },
  {
    id: 4,
    departmentName: "Relationship Marketing and Sales",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 11,
  },
  {
    id: 5,
    departmentName: "Capital Market Services",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 21,
  },
];

interface DivisionDetailsTableProps {
  departments?: Department[];
  loading?: boolean;
  error?: string;
  managers?: Array<{ employeeId: string; fullName: string }>;
  divisions?: Array<{ divisionId: string; name: string }>;
  allMembers?: Array<{ employeeId: string; fullName: string }>;
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

const DivisionDetailsTable: React.FC<DivisionDetailsTableProps> = ({
  departments: propDepartments,
  loading = false,
  error,
  managers = [],
  divisions = [],
  allMembers = [],
  onEditSuccess,
  onDeleteSuccess,
}) => {
  const router = useRouter();
  const departmentsToShow = propDepartments || mockDepartments;

  const headers = [
    { key: "departmentName", label: "DEPARTMENT NAME" },
    { key: "createdBy", label: "CREATED BY" },
    { key: "createdOn", label: "CREATED ON" },
    { key: "managedBy", label: "MANAGER" },
    { key: "members", label: "MEMBERS" },
    { key: "action", label: "ACTION" },
  ];

  if (loading) {
    return <DepartmentTableSkeleton rows={6} headers={headers} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading departments: {error}</p>
      </div>
    );
  }

  return (
    <Table className="border-none">
      <ReusableTableHeader headers={headers} />
      <TableBody>
        {departmentsToShow.map((dept, idx) => (
          <TableRow
            key={dept.id}
            className={`border-b border-gray-100 dark:border-gray-800 ${idx % 2 === 1 ? "bg-white dark:bg-transparent" : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
              } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
          >
            <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
              {dept.departmentName}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
              {dept.createdBy}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {dept.createdOn}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {dept.managedBy}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {dept.members}
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/departments/${dept.id}`)
                  }
                  className="text-primary hover:text-primary/80"
                >
                  View
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <EditDepartmentDialog
                      department={{
                        id: dept.id,
                        departmentName: dept.departmentName,
                        managedBy: dept.managedBy,
                        division: dept.division,
                        members: dept.members,
                      }}
                      managers={managers}
                      divisions={divisions}
                      allMembers={allMembers}
                      onEditSuccess={onEditSuccess}
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </EditDepartmentDialog>
                    <DeleteDepartmentDialog
                      departmentName={dept.departmentName}
                      departmentId={dept.id}
                      onDeleteSuccess={onDeleteSuccess}
                    >
                      <DropdownMenuItem
                        className="text-red-600"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <Trash2 className="h-4 w-4" color="red" />
                        Delete
                      </DropdownMenuItem>
                    </DeleteDepartmentDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DivisionDetailsTable;
