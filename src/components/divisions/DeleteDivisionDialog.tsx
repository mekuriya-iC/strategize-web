import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDivisionMutations } from "@/hooks/divisions/useDivisionMutations";
import { parseGraphQLError } from "@/lib/utils/error-messages";
import { toast } from "sonner";

interface DeleteDivisionDialogProps {
  children: React.ReactNode;
  divisionName: string;
  divisionId: string | number;
  onDeleteSuccess?: () => void;
}

const DeleteDivisionDialog: React.FC<DeleteDivisionDialogProps> = ({
  children,
  divisionName,
  divisionId,
  onDeleteSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const { removeDivision, loading } = useDivisionMutations();

  const handleDelete = async () => {
    try {
      await removeDivision({
        id: String(divisionId),
      });
      toast.success("Division deleted successfully");
      setOpen(false);
      onDeleteSuccess?.();
    } catch (error) {
      const errorMessage = parseGraphQLError(error);
      toast.error("Failed to delete division", {
        description: errorMessage,
      });
      // Keep dialog open so user can see the error and try again
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[400px] rounded-xl p-0 overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold text-[#0F1327]">
              Delete Division
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 pb-6">
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the division{" "}
              <span className="font-semibold">&quot;{divisionName}&quot;</span>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Make sure all departments are moved to
                other divisions first. You cannot delete a division that still
                has departments assigned to it.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading.remove}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading.remove}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading.remove ? "Deleting..." : "Delete Division"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDivisionDialog;
