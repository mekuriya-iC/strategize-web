"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Trash2,
  UserPlus,
  MoreHorizontal,
} from "lucide-react";
import { useMutation } from "@apollo/client";
import {
  APPROVE_OBJECTIVE,
  REJECT_OBJECTIVE,
  DELETE_OBJECTIVE,
  UPDATE_OBJECTIVE_STATUS,
} from "@/lib/graphql/mutations/objectives";
import { toast } from "sonner";

interface BulkObjectiveActionsProps {
  selectedObjectiveIds: string[];
  objectives: Array<{
    objectiveId: string;
    title: string;
    status: string;
  }>;
  onSuccess?: () => void;
  onClearSelection?: () => void;
}

export default function BulkObjectiveActions({
  selectedObjectiveIds,
  objectives,
  onSuccess,
  onClearSelection,
}: BulkObjectiveActionsProps) {
  const [action, setAction] = useState<"approve" | "reject" | "delete" | "status" | null>(null);
  const [reason, setReason] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const [approveObjective] = useMutation(APPROVE_OBJECTIVE);
  const [rejectObjective] = useMutation(REJECT_OBJECTIVE);
  const [deleteObjective] = useMutation(DELETE_OBJECTIVE);
  const [updateObjectiveStatus] = useMutation(UPDATE_OBJECTIVE_STATUS);

  const selectedObjectives = objectives.filter((obj) =>
    selectedObjectiveIds.includes(obj.objectiveId)
  );

  const handleBulkApprove = async () => {
    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const obj of selectedObjectives) {
      try {
        await approveObjective({
          variables: {
            objectiveId: obj.objectiveId,
            comment: reason || undefined,
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to approve ${obj.title}:`, error);
        errorCount++;
      }
    }

    setProcessing(false);
    setAction(null);
    setReason("");

    if (successCount > 0) {
      toast.success(`✅ ${successCount} objective(s) approved successfully`);
    }
    if (errorCount > 0) {
      toast.error(`❌ Failed to approve ${errorCount} objective(s)`);
    }

    onSuccess?.();
    onClearSelection?.();
  };

  const handleBulkReject = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const obj of selectedObjectives) {
      try {
        await rejectObjective({
          variables: {
            objectiveId: obj.objectiveId,
            reason,
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to reject ${obj.title}:`, error);
        errorCount++;
      }
    }

    setProcessing(false);
    setAction(null);
    setReason("");

    if (successCount > 0) {
      toast.success(`❌ ${successCount} objective(s) rejected`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to reject ${errorCount} objective(s)`);
    }

    onSuccess?.();
    onClearSelection?.();
  };

  const handleBulkDelete = async () => {
    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const obj of selectedObjectives) {
      try {
        await deleteObjective({
          variables: {
            objectiveId: obj.objectiveId,
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to delete ${obj.title}:`, error);
        errorCount++;
      }
    }

    setProcessing(false);
    setAction(null);

    if (successCount > 0) {
      toast.success(`🗑️ ${successCount} objective(s) deleted successfully`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} objective(s)`);
    }

    onSuccess?.();
    onClearSelection?.();
  };

  const handleBulkStatusUpdate = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const obj of selectedObjectives) {
      try {
        await updateObjectiveStatus({
          variables: {
            objectiveId: obj.objectiveId,
            status: newStatus,
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to update status for ${obj.title}:`, error);
        errorCount++;
      }
    }

    setProcessing(false);
    setAction(null);
    setNewStatus("");

    if (successCount > 0) {
      toast.success(`✅ ${successCount} objective(s) updated successfully`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} objective(s)`);
    }

    onSuccess?.();
    onClearSelection?.();
  };

  if (selectedObjectiveIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
        {selectedObjectiveIds.length} selected
      </span>

      <div className="flex gap-2 ml-auto">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
          onClick={() => setAction("approve")}
        >
          <CheckCircle2 className="w-4 h-4" />
          Approve All
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => setAction("reject")}
        >
          <XCircle className="w-4 h-4" />
          Reject All
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => setAction("status")}
        >
          <MoreHorizontal className="w-4 h-4" />
          Change Status
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => setAction("delete")}
        >
          <Trash2 className="w-4 h-4" />
          Delete All
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={action === "approve"} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Bulk Approve Objectives
            </DialogTitle>
            <DialogDescription>
              You are about to approve {selectedObjectiveIds.length} objective(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-gray-50 rounded-lg">
              {selectedObjectives.map((obj) => (
                <div key={obj.objectiveId} className="text-sm text-gray-700">
                  • {obj.title}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (Optional)</label>
              <Textarea
                placeholder="Add any comments..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? "Processing..." : `Approve ${selectedObjectiveIds.length} Objectives`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={action === "reject"} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Bulk Reject Objectives
            </DialogTitle>
            <DialogDescription>
              You are about to reject {selectedObjectiveIds.length} objective(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-gray-50 rounded-lg">
              {selectedObjectives.map((obj) => (
                <div key={obj.objectiveId} className="text-sm text-gray-700">
                  • {obj.title}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-red-700">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please provide a clear reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="border-red-200"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkReject}
              disabled={processing || !reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? "Processing..." : `Reject ${selectedObjectiveIds.length} Objectives`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={action === "delete"} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              Bulk Delete Objectives
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedObjectiveIds.length} objective(s) and all associated KPIs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-red-50 rounded-lg border border-red-200">
              {selectedObjectives.map((obj) => (
                <div key={obj.objectiveId} className="text-sm text-red-700">
                  • {obj.title}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? "Deleting..." : `Delete ${selectedObjectiveIds.length} Objectives`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={action === "status"} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedObjectiveIds.length} objective(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_SUBMITTED">Not Submitted</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={processing || !newStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {processing ? "Updating..." : `Update ${selectedObjectiveIds.length} Objectives`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
