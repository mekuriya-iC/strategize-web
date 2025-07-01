import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Plus } from "lucide-react";
import DeleteEmployeeDialog from "./DeleteEmployeeDialog";
import EditEmployeeDialog from "./EditEmployeeDialog";
import { Employee as GraphQLEmployee } from "@/types/graphql";

const EmployeeActionsMenu = ({
  onView,
  employeeName,
  employeeId,
  originalEmployee,
  onAddDepartment,
}: {
  onView: () => void;
  employeeName?: string;
  employeeId?: string;
  originalEmployee?: GraphQLEmployee;
  onAddDepartment?: () => void;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button variant="link" size="sm" onClick={onView} className="px-0">
        View
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-orange-50"
            onClick={onAddDepartment}
          >
            <Plus className="h-4 w-4" />
            Add Department
          </DropdownMenuItem>
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
    </div>
  );
};

export default EmployeeActionsMenu;
