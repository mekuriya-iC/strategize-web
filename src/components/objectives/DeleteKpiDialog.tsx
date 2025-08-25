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
import { useKPIMutations } from "@/hooks/useKPIMutations";

interface DeleteKpiDialogProps {
  children: React.ReactNode;
  kpiName?: string;
  kpiId?: string;
  onDeleteSuccess?: () => void;
}

const DeleteKpiDialog: React.FC<DeleteKpiDialogProps> = ({
  children,
  kpiName = "this KPI",
  kpiId,
  onDeleteSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const { removeKpi } = useKPIMutations();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!kpiId) {
      toast.error("Error", {
        description: "KPI ID is missing. Cannot delete KPI.",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await removeKpi(kpiId);
      toast.success("KPI deleted successfully", {
        description: `${kpiName} has been removed from the system.`,
      });
      setOpen(false);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      console.error("Failed to delete KPI:", error);
      // Error toast is already handled by hook if any
    } finally {
      setIsDeleting(false);
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
              Are you sure you want to delete this KPI?
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              This action cannot be undone. The KPI &quot;{kpiName}&quot; will
              be permanently removed from the system.
            </p>
          </div>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
            className="order-2 sm:order-1"
          >
            No, Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || !kpiId}
            className="bg-red-600 hover:bg-red-700 text-white order-1 sm:order-2"
          >
            {isDeleting ? (
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

export default DeleteKpiDialog;
