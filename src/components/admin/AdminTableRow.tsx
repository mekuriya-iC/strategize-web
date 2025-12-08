"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Employee, ROLE_LABELS } from "@/types/graphql";
import EditAdminDialog from "./EditAdminDialog";
import DeleteAdminDialog from "./DeleteAdminDialog";

interface AdminTableRowProps {
  admin: Employee;
  index: number;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  canManageAdmins?: boolean;
}

export default function AdminTableRow({
  admin,
  index,
  selected,
  onSelect,
  onEditSuccess,
  onDeleteSuccess,
  canManageAdmins = false,
}: AdminTableRowProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  // Generate masked password display
  const maskedPassword = "••••••••••••";

  return (
    <TableRow
      className={`border-b border-gray-100 ${
        index % 2 === 1 ? "bg-white" : "bg-[#F8F8FF]"
      } hover:bg-gray-50 transition-colors`}
    >
      <TableCell className="px-4 py-4">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(!!checked)}
        />
      </TableCell>
      <TableCell className="px-4 py-4 font-medium text-gray-900">
        {admin.fullName}
      </TableCell>
      <TableCell className="px-4 py-4 text-gray-600">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
          {ROLE_LABELS[admin.role] || admin.role}
        </span>
      </TableCell>
      <TableCell className="px-4 py-4 text-[#3838EC]">
        {admin.email.split("@")[0]}
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-gray-500">{maskedPassword}</span>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600"
            title={showPassword ? "Hide" : "Show"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4">{getStatusBadge(admin.status)}</TableCell>
      <TableCell className="px-4 py-4">
        {canManageAdmins ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <EditAdminDialog admin={admin} onEditSuccess={onEditSuccess}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </EditAdminDialog>
              <DeleteAdminDialog
                adminName={admin.fullName}
                adminId={admin.employeeId}
                onDeleteSuccess={onDeleteSuccess}
              >
                <DropdownMenuItem
                  className="text-red-600"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DeleteAdminDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-gray-400 text-sm">View only</span>
        )}
      </TableCell>
    </TableRow>
  );
}



