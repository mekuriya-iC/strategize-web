"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
import { DivisionTableSkeleton } from "@/components/skeleton";
import DeleteDivisionDialog from "./DeleteDivisionDialog";
import EditDivisionDialog from "./EditDivisionDialog";

// Division interface matching the design
export interface Division {
  id: string | number; // Support both string (GraphQL) and number (mock data)
  divisionName: string;
  createdBy: string;
  createdOn: string;
  managedBy: string;
  departments: number;
}

interface Manager {
  id: string;
  name: string;
}

// Mock data matching the design from the image
const divisions: Division[] = [
  {
    id: 1,
    divisionName: "Operation Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 23,
  },
  {
    id: 2,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 42,
  },
  {
    id: 3,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 67,
  },
  {
    id: 4,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 8,
  },
  {
    id: 5,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 13,
  },
  {
    id: 6,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 54,
  },
  {
    id: 7,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 76,
  },
  {
    id: 8,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 3,
  },
  {
    id: 9,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 5,
  },
  {
    id: 10,
    divisionName: "Lorem Ipsum Division",
    createdBy: "John Doe",
    createdOn: "7 June 2025, 7:38 PM",
    managedBy: "Johnathan Doe",
    departments: 16,
  },
];

interface DivisionTableProps {
  divisions?: Division[];
  headers?: HeaderColumn[];
  loading?: boolean;
  error?: string;
  managers?: Manager[];
  onAddDepartment?: () => void;
}

const DivisionTable: React.FC<DivisionTableProps> = ({
  divisions: propDivisions,
  headers = [
    { key: "divisionName", label: "DIVISION NAME" },
    { key: "createdBy", label: "CREATED BY" },
    { key: "createdOn", label: "CREATED ON" },
    { key: "managedBy", label: "MANAGED BY" },
    { key: "departments", label: "DEPARTMENTS" },
    { key: "action", label: "ACTIONS" },
  ],
  loading = false,
  error,
  managers = [],
  onAddDepartment,
}) => {
  const router = useRouter();
  const divisionsToShow = propDivisions || divisions;

  if (loading) {
    return <DivisionTableSkeleton rows={6} headers={headers} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading divisions: {error}</p>
      </div>
    );
  }

  return (
    <Table className="border-none">
      <ReusableTableHeader headers={headers} />
      <TableBody>
        {divisionsToShow.map((division, idx) => (
          <TableRow
            key={division.id}
            className={`border-b border-gray-100 ${
              idx % 2 === 1 ? "bg-white" : "bg-[#ECECFF]"
            } hover:bg-gray-50 transition-colors`}
          >
            <TableCell className="px-6 py-4 font-medium text-gray-900">
              {division.divisionName}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {division.createdBy}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {division.createdOn}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {division.managedBy}
            </TableCell>
            <TableCell className="px-6 py-4 text-gray-600">
              {division.departments}
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/divisions/${division.id}`)
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
                    <EditDivisionDialog
                      division={{
                        id: division.id,
                        divisionName: division.divisionName,
                        managedBy: division.managedBy,
                      }}
                      managers={managers}
                    >
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </EditDivisionDialog>
                    <DeleteDivisionDialog
                      divisionName={division.divisionName}
                      divisionId={division.id}
                    >
                      <DropdownMenuItem
                        className="text-red-600 flex items-center gap-2"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <Trash2 className="h-4 w-4" color="red" />
                        Delete
                      </DropdownMenuItem>
                    </DeleteDivisionDialog>
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

export default DivisionTable;
