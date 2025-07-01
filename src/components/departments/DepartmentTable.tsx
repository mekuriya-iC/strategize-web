"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Trash2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReusableTableHeader, {
  HeaderColumn,
} from "@/components/ui/table-header";
import { DepartmentTableSkeleton } from "@/components/skeleton";
import DeleteDepartmentDialog from "./DeleteDepartmentDialog";
import EditDepartmentDialog from "./EditDepartmentDialog";

// Department interface matching the design
export interface Department {
  id: number | string;
  departmentName: string;
  createdBy: string;
  createdOn: string;
  managedBy: string;
  division: string;
  members: number;
}

// Additional interfaces for props
interface Manager {
  employeeId: string;
  fullName: string;
}

interface Division {
  divisionId: string;
  name: string;
}

interface Member {
  employeeId: string;
  fullName: string;
}

// Mock data matching the design from the image
const departments: Department[] = [
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
    departmentName: "Relationship Marketing and Sales",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Lorem Ipsum Division",
    members: 11,
  },
  {
    id: 4,
    departmentName: "Knowledge Sharing Platform",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Lorem Ipsum Division",
    members: 8,
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
  {
    id: 6,
    departmentName: "Finance and Investment",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 4,
  },
  {
    id: 7,
    departmentName: "Lorem Ipsum Department",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 9,
  },
  {
    id: 8,
    departmentName: "Lorem Ipsum Department",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 18,
  },
  {
    id: 9,
    departmentName: "Lorem Ipsum Department",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Lorem Ipsum Division",
    members: 23,
  },
  {
    id: 10,
    departmentName: "Cross Border Solution",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    division: "Operation Division",
    members: 32,
  },
];

interface DepartmentTableProps {
  departments?: Department[];
  headers?: HeaderColumn[];
  loading?: boolean;
  error?: string;
  onAddDepartment?: () => void;
  managers?: Manager[];
  divisions?: Division[];
  allMembers?: Member[];
  onDeleteSuccess?: () => void;
  onEditSuccess?: () => void;
}

const DepartmentTable: React.FC<DepartmentTableProps> = ({
  departments: propDepartments,
  headers = [
    { key: "departmentName", label: "DEPARTMENT NAME" },
    { key: "createdBy", label: "CREATED BY" },
    { key: "createdOn", label: "CREATED ON" },
    { key: "managedBy", label: "MANAGED BY" },
    { key: "division", label: "DIVISION" },
    { key: "members", label: "MEMBERS" },
    { key: "action", label: "ACTION" },
  ],
  loading = false,
  error,
  onAddDepartment,
  managers,
  divisions,
  allMembers,
  onDeleteSuccess,
  onEditSuccess,
}) => {
  const router = useRouter();
  const departmentsToShow = propDepartments || departments;

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
            className={`border-b border-gray-100 ${
              idx % 2 === 1 ? "bg-white" : "bg-[#ECECFF]"
            } hover:bg-gray-50 transition-colors`}
          >
            <TableCell className="px-6 py-4 font-medium text-gray-900">
              {dept.departmentName}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {dept.createdBy}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {dept.createdOn}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {dept.managedBy}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {dept.division}
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
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-orange-50"
                      onClick={onAddDepartment}
                    >
                      <Plus className="h-4 w-4" />
                      Add Department
                    </DropdownMenuItem>
                    <EditDepartmentDialog
                      department={{
                        id: dept.id,
                        departmentName: dept.departmentName,
                        managedBy: dept.managedBy,
                        division: dept.division,
                        members: dept.members,
                      }}
                      managers={managers || []}
                      divisions={divisions || []}
                      allMembers={allMembers || []}
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

export default DepartmentTable;
