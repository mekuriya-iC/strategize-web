import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Building2, Eye } from "lucide-react";
import DeleteEmployeeDialog from "./DeleteEmployeeDialog";
import EditEmployeeDialog from "./EditEmployeeDialog";
import ViewEmployeeDialog from "./ViewEmployeeDialog";
import AddToDepartmentDialog from "./AddToDepartmentDialog";
import { Employee as GraphQLEmployee } from "@/types/graphql";

const EmployeeActionsMenu = ({
  employeeName,
  employeeId,
  originalEmployee,
}: {
  employeeName?: string;
  employeeId?: string;
  originalEmployee?: GraphQLEmployee;
}) => {
  const canBeAddedToDepartment =
    originalEmployee?.role === "NORMAL" ||
    originalEmployee?.role === "COORDINATOR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {originalEmployee && (
          <ViewEmployeeDialog employee={originalEmployee}>
            <DropdownMenuItem
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              onSelect={(e) => e.preventDefault()}
            >
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>
          </ViewEmployeeDialog>
        )}
        {employeeId && employeeName && canBeAddedToDepartment && (
          <AddToDepartmentDialog
            employeeId={employeeId}
            employeeName={employeeName}
          >
            <DropdownMenuItem
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-blue-50"
              onSelect={(e) => e.preventDefault()}
            >
              <Building2 className="h-4 w-4" />
              Add to Department
            </DropdownMenuItem>
          </AddToDepartmentDialog>
        )}
        {originalEmployee && (
          <EditEmployeeDialog employee={originalEmployee}>
            <DropdownMenuItem
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              onSelect={(e) => e.preventDefault()}
            >
              <Edit className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </EditEmployeeDialog>
        )}
        <DeleteEmployeeDialog
          employeeName={employeeName}
          employeeId={employeeId}
        >
          <DropdownMenuItem
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onSelect={(e) => e.preventDefault()}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DeleteEmployeeDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmployeeActionsMenu;
