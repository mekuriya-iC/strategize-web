"use client";

import { useState, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEmployeeMutations } from "@/hooks/employees/useEmployeeMutations";
import { toast } from "sonner";

interface DeleteAdminDialogProps {
  children: ReactNode;
  adminName: string;
  adminId: string;
  onDeleteSuccess?: () => void;
}

export default function DeleteAdminDialog({
  children,
  adminName,
  adminId,
  onDeleteSuccess,
}: DeleteAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const { removeEmployee, removeLoading } = useEmployeeMutations();

  const handleDelete = async () => {
    try {
      const result = await removeEmployee(adminId);

      if (result.success) {
        toast.success(`Admin "${adminName}" has been deleted`);
        setOpen(false);
        onDeleteSuccess?.();
      } else {
        toast.error("Failed to delete admin");
      }
    } catch {
      toast.error("Failed to delete admin");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Admin</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{adminName}</strong>? This
            action cannot be undone and will permanently remove the
            administrator account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={removeLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {removeLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}







