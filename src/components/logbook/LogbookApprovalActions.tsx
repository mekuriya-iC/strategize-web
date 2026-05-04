"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_LOGBOOK_ENTRY } from "@/lib/graphql/mutations/logbook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LogbookApprovalActionsProps {
  logbookEntryId: string;
  activityDescription: string;
  currentStatus: string;
  onSuccess?: () => void;
}

/**
 * Logbook Approval Actions Component
 * Provides approve/reject actions for logbook entries
 */
export function LogbookApprovalActions({
  logbookEntryId,
  activityDescription,
  currentStatus,
  onSuccess,
}: LogbookApprovalActionsProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [updateLogbookEntry, { loading }] = useMutation(UPDATE_LOGBOOK_ENTRY, {
    onCompleted: () => {
      toast.success("Logbook entry updated successfully");
      onSuccess?.();
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(`Failed to update entry: ${error.message}`);
    },
  });

  const handleApprove = async () => {
    try {
      await updateLogbookEntry({
        variables: {
          input: {
            logbookEntryId,
            entryStatus: "APPROVED",
            approvedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error approving logbook entry:", error);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await updateLogbookEntry({
        variables: {
          input: {
            logbookEntryId,
            entryStatus: "REJECTED",
            rejectionReason: rejectionReason.trim(),
          },
        },
      });
    } catch (error) {
      console.error("Error rejecting logbook entry:", error);
    }
  };

  // Only show actions for SUBMITTED entries
  if (currentStatus !== "SUBMITTED") {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={() => setShowApproveDialog(true)}
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => setShowRejectDialog(true)}
        >
          <XCircle className="mr-1.5 h-4 w-4" />
          Reject
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Approve Logbook Entry
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this logbook entry?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Activity:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activityDescription}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Logbook Entry
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this logbook entry.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Activity:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activityDescription}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this entry is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              This reason will be visible to the entry owner.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
