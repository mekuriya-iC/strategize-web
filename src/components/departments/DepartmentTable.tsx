"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, MoreVertical, Trash2, Plus, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DepartmentTableSkeleton } from "@/components/skeleton";
import DeleteDepartmentDialog from "./DeleteDepartmentDialog";
import EditDepartmentDialog from "./EditDepartmentDialog";
import { useDepartmentMutations } from "@/hooks/useDepartmentMutations";
import { toast } from "sonner";

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

interface DepartmentTableProps {
  departments?: Department[];
  loading?: boolean;
  error?: string;
  onAddDepartment?: () => void;
  managers?: Manager[];
  divisions?: Division[];
  allMembers?: Member[];
  onDeleteSuccess?: () => void;
  onEditSuccess?: () => void;
  readOnly?: boolean;
}

const DepartmentTable: React.FC<DepartmentTableProps> = ({
  departments: propDepartments = [],
  loading = false,
  error,
  onAddDepartment,
  readOnly = false,
  managers,
  divisions,
  allMembers,
  onDeleteSuccess,
  onEditSuccess,
}) => {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set()
  );
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { removeDepartment } = useDepartmentMutations();

  const departmentsToShow = propDepartments;

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(departmentsToShow.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string | number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const allSelected =
    departmentsToShow.length > 0 &&
    departmentsToShow.every((d) => selectedIds.has(d.id));

  const someSelected = selectedIds.size > 0;

  // Bulk delete handler
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const result = await removeDepartment({ id: String(id) });
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} department(s)`);
      onDeleteSuccess?.();
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} department(s)`);
    }
  };

  if (loading) {
    return <DepartmentTableSkeleton rows={6} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading departments: {error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Selection Action Bar - only show for admins */}
      {!readOnly && someSelected && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800 font-medium">
            {selectedIds.size} department{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <Table className="border-none">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            {/* Only show checkbox column for admins */}
            {!readOnly && (
            <TableHead className="px-4 py-3 w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
              />
            </TableHead>
            )}
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              DEPARTMENT NAME
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              CREATED BY
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              CREATED ON
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              MANAGER
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              DIVISION
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              MEMBERS
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departmentsToShow.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                No departments found
              </TableCell>
            </TableRow>
          ) : (
            departmentsToShow.map((dept, idx) => (
              <TableRow
                key={dept.id}
                className={`border-b border-gray-100 ${
                  selectedIds.has(dept.id)
                    ? "bg-blue-50"
                    : idx % 2 === 1
                    ? "bg-white"
                    : "bg-[#ECECFF]"
                } hover:bg-gray-50 transition-colors cursor-pointer`}
                onClick={() => router.push(`/dashboard/departments/${dept.id}`)}
              >
                {/* Only show checkbox for admins */}
                {!readOnly && (
                <TableCell
                  className="px-4 py-4 w-12"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedIds.has(dept.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(dept.id, !!checked)
                    }
                  />
                </TableCell>
                )}
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
                  {dept.division || "—"}
                </TableCell>
                <TableCell className="px-6 py-4 text-gray-600">
                  {dept.members}
                </TableCell>
                <TableCell
                  className="px-6 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
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
                    {/* Only show edit/delete actions for admins */}
                    {!readOnly && (
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
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete {selectedIds.size} Department{selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected department{selectedIds.size !== 1 ? "s" : ""} and may affect
              associated employees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DepartmentTable;
