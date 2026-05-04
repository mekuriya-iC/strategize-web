"use client";

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
import { useInitiativeMutations, type Initiative } from "@/hooks/initiatives/useInitiatives";
import { Loader2 } from "lucide-react";

interface DeleteInitiativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiative: Initiative | null;
}

export default function DeleteInitiativeDialog({
  open,
  onOpenChange,
  initiative,
}: DeleteInitiativeDialogProps) {
  const { removeInitiative, loading } = useInitiativeMutations();

  const handleDelete = async () => {
    if (!initiative) return;
    try {
      await removeInitiative(initiative.initiativeId);
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Initiative</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>&quot;{initiative?.title}&quot;</strong>?
            This action cannot be undone and all associated activities will also be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={loading.remove}
          >
            {loading.remove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
