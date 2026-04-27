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
import { DivisionTableSkeleton } from "@/components/skeleton";
import DeleteDivisionDialog from "./DeleteDivisionDialog";
import EditDivisionDialog from "./EditDivisionDialog";
import { useDivisionMutations } from "@/hooks/divisions/useDivisionMutations";
import { toast } from "sonner";

// Division interface matching the design
export interface Division {
  id: string | number;
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

interface Department {
  departmentId: string;
  name: string;
  divisionId?: string | null;
}

interface DivisionTableProps {
  divisions?: Division[];
  loading?: boolean;
  error?: string;
  managers?: Manager[];
  allDepartments?: Department[];
  onAddDepartment?: () => void;
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
  readOnly?: boolean;
}

const DivisionTable: React.FC<DivisionTableProps> = ({
  divisions: propDivisions = [],
  loading = false,
  error,
  managers = [],
  allDepartments = [],
  onAddDepartment,
  onEditSuccess,
  onDeleteSuccess,
  readOnly = false,
}) => {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set()
  );
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { removeDivision } = useDivisionMutations();

  const divisionsToShow = propDivisions;

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(divisionsToShow.map((d) => d.id)));
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
    divisionsToShow.length > 0 &&
    divisionsToShow.every((d) => selectedIds.has(d.id));

  const someSelected = selectedIds.size > 0;

  // Bulk delete handler
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const result = await removeDivision({ id: String(id) });
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
      toast.success(`Successfully deleted ${successCount} division(s)`);
      onDeleteSuccess?.();
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} division(s)`);
    }
  };

  if (loading) {
    return <DivisionTableSkeleton rows={6} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading divisions: {error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Selection Action Bar - only show for admins */}
      {!readOnly && someSelected && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            {selectedIds.size} division{selectedIds.size !== 1 ? "s" : ""}{" "}
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
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              DIVISION NAME
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              CREATED BY
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              CREATED ON
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              DIRECTOR
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              DEPARTMENTS
            </TableHead>
            <TableHead className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {divisionsToShow.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-12 text-gray-500 dark:text-gray-400"
              >
                No divisions found
              </TableCell>
            </TableRow>
          ) : (
            divisionsToShow.map((division, idx) => (
              <TableRow
                key={division.id}
                className={`border-b border-gray-100 dark:border-gray-800 ${selectedIds.has(division.id)
                    ? "bg-blue-50 dark:bg-blue-950/30"
                    : idx % 2 === 1
                      ? "bg-white dark:bg-transparent"
                      : "bg-[#ECECFF] dark:bg-[#1e1e3f]/40"
                  } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer`}
                onClick={() =>
                  router.push(`/dashboard/divisions/${division.id}`)
                }
              >
                {/* Only show checkbox for admins */}
                {!readOnly && (
                  <TableCell
                    className="px-4 py-4 w-12"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.has(division.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(division.id, !!checked)
                      }
                    />
                  </TableCell>
                )}
                <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                  {division.divisionName}
                </TableCell>
                <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
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
                <TableCell
                  className="px-6 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
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
                          <EditDivisionDialog
                            division={{
                              id: division.id,
                              divisionName: division.divisionName,
                              managedBy: division.managedBy,
                            }}
                            managers={managers}
                            allDepartments={allDepartments}
                            currentDepartmentIds={allDepartments
                              .filter((d) => d.divisionId === String(division.id))
                              .map((d) => d.departmentId)}
                            onEditSuccess={onEditSuccess}
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
                            onDeleteSuccess={onDeleteSuccess}
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
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete {selectedIds.size} Division
              {selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected division{selectedIds.size !== 1 ? "s" : ""} and may
              affect associated departments.
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

export default DivisionTable;
