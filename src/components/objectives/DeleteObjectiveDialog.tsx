"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";

interface DeleteObjectiveDialogProps {
  children?: React.ReactNode;
  objectiveName?: string;
  objectiveId?: string;
  onDeleteSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DeleteObjectiveDialog: React.FC<DeleteObjectiveDialogProps> = ({
  children,
  objectiveName = "this objective",
  objectiveId,
  onDeleteSuccess,
  open: externalOpen,
  onOpenChange: setExternalOpen,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;
  const { deleteObjective, loading } = useObjectiveMutations();

  const handleDelete = async () => {
    if (!objectiveId) {
      toast.error("Objective ID is missing. Cannot delete objective.");
      return;
    }

    try {
      await deleteObjective({ objectiveId });
      toast.success("Objective deleted successfully");
      setOpen(false);
      onDeleteSuccess?.();
    } catch (error) {
      console.error("Failed to delete objective:", error);
      // Error toast is handled by mutation hook if needed
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[320px] sm:max-w-[480px] mx-auto p-6 sm:p-8">
        <DialogHeader className="text-center space-y-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-4">
            <DialogTitle className="text-lg font-semibold text-center text-[#0F1327]">
              Are you sure you want to delete this objective?
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              This action cannot be undone. The objective &quot;{objectiveName}
              &quot; will be permanently removed.
            </p>
          </div>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            No, Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading || !objectiveId}
            className="bg-red-600 hover:bg-red-700 text-white order-1 sm:order-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...
              </>
            ) : (
              "Yes, Delete"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteObjectiveDialog;
