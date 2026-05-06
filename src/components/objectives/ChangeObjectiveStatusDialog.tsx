"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";
import type { ObjectiveStatus } from "@/types/graphql";

interface ChangeObjectiveStatusDialogProps {
  children?: React.ReactNode;
  objectiveName?: string;
  objectiveId?: string;
  currentStatus: ObjectiveStatus;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STATUS_OPTIONS: { value: ObjectiveStatus; label: string; description: string }[] = [
  {
    value: "NOT_SUBMITTED",
    label: "Not Submitted",
    description: "Objective is created but not yet submitted for approval",
  },
  {
    value: "PENDING",
    label: "Pending",
    description: "Objective is awaiting approval",
  },
  {
    value: "APPROVED",
    label: "Approved",
    description: "Objective is approved and active",
  },
  {
    value: "REJECTED",
    label: "Rejected",
    description: "Objective was rejected and needs revision",
  },
];

const STATUS_COLORS: Record<ObjectiveStatus, string> = {
  NOT_SUBMITTED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PENDING: "bg-blue-100 text-blue-800 border-blue-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};

export default function ChangeObjectiveStatusDialog({
  children,
  objectiveName = "this objective",
  objectiveId,
  currentStatus,
  onSuccess,
  open: externalOpen,
  onOpenChange: setExternalOpen,
}: ChangeObjectiveStatusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;
  
  const [selectedStatus, setSelectedStatus] = useState<ObjectiveStatus>(currentStatus);
  const { updateObjective, loading } = useObjectiveMutations();

  const handleStatusChange = async () => {
    if (!objectiveId) {
      toast.error("Objective ID is missing. Cannot change status.");
      return;
    }

    if (selectedStatus === currentStatus) {
      toast.info("Status is already set to this value.");
      setOpen(false);
      return;
    }

    try {
      await updateObjective({
        input: {
          objectiveId,
          status: selectedStatus,
        },
      });
      
      toast.success(`Objective status changed to ${selectedStatus.replace("_", " ")}`);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to change objective status:", error);
      toast.error("Failed to change status. Please try again.");
    }
  };

  // Reset selected status when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus);
    }
  }, [open, currentStatus]);

  return (
    <>
      {children && (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Change Objective Status
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Change the status of <strong>&quot;{objectiveName}&quot;</strong>
              </p>
            </div>

            {/* Current Status */}
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className={`px-3 py-2 rounded-md border ${STATUS_COLORS[currentStatus]}`}>
                <span className="font-medium">
                  {currentStatus.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* New Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="status">
                New Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as ObjectiveStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.value === currentStatus}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview New Status */}
            {selectedStatus !== currentStatus && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className={`px-3 py-2 rounded-md border ${STATUS_COLORS[selectedStatus]}`}>
                  <span className="font-medium">
                    {selectedStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            )}

            {/* Warning for APPROVED status */}
            {selectedStatus === "APPROVED" && currentStatus !== "APPROVED" && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Approving this objective will make it read-only. 
                  You won&apos;t be able to edit it or add new KPIs after approval.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleStatusChange}
              disabled={loading || !objectiveId || selectedStatus === currentStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Changing...
                </>
              ) : (
                "Change Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
