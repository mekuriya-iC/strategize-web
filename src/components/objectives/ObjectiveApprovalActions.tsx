"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_SUBMISSIONS } from "@/lib/graphql/queries/submissions";
import { UPDATE_SUBMISSION } from "@/lib/graphql/mutations/submissions";
import { toast } from "sonner";

interface ObjectiveApprovalActionsProps {
  objectiveId: string;
  objectiveTitle: string;
  currentStatus: string;
  objectiveType: string; // CORPORATE, DIVISION, DEPARTMENT, PERSONNEL
  onSuccess?: () => void;
}

export default function ObjectiveApprovalActions({
  objectiveId,
  objectiveTitle,
  currentStatus,
  objectiveType,
  onSuccess,
}: ObjectiveApprovalActionsProps) {
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");

  // Find the submission for this objective
  const { data: submissionsData } = useQuery(GET_SUBMISSIONS, {
    variables: {
      page: 1,
      limit: 1000,
      type: objectiveType,
      submissionType: "OBJECTIVE",
    },
  });

  const submission = submissionsData?.submissions?.items?.find(
    (sub: any) => sub.objective?.objectiveId === objectiveId
  );

  const [updateSubmission, { loading }] = useMutation(UPDATE_SUBMISSION, {
    refetchQueries: [
      {
        query: GET_SUBMISSIONS,
        variables: {
          page: 1,
          limit: 1000,
          type: objectiveType,
          submissionType: "OBJECTIVE",
        },
      },
    ],
    onCompleted: () => {
      onSuccess?.();
    },
  });

  const handleApprove = async () => {
    if (!submission) {
      toast.error("No submission found for this objective");
      return;
    }

    try {
      await updateSubmission({
        variables: {
          input: {
            submissionId: submission.submissionId,
            status: "APPROVED",
            reason: comment || undefined,
          },
        },
      });
      toast.success(`✅ Objective "${objectiveTitle}" approved successfully`);
      setApproveDialogOpen(false);
      setComment("");
    } catch (error: any) {
      toast.error(`Failed to approve objective: ${error.message}`);
    }
  };

  const handleReject = async () => {
    if (!submission) {
      toast.error("No submission found for this objective");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await updateSubmission({
        variables: {
          input: {
            submissionId: submission.submissionId,
            status: "REJECTED",
            reason,
          },
        },
      });
      toast.success(`❌ Objective "${objectiveTitle}" rejected`);
      setRejectDialogOpen(false);
      setReason("");
    } catch (error: any) {
      toast.error(`Failed to reject objective: ${error.message}`);
    }
  };

  // Only show actions for pending objectives
  if (currentStatus !== "PENDING" && currentStatus !== "NOT_SUBMITTED") {
    return null;
  }

  // Only show if submission exists
  if (!submission) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
        onClick={() => setApproveDialogOpen(true)}
      >
        <CheckCircle2 className="w-4 h-4" />
        Approve
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
        onClick={() => setRejectDialogOpen(true)}
      >
        <XCircle className="w-4 h-4" />
        Reject
      </Button>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Approve Objective
            </DialogTitle>
            <DialogDescription>
              You are about to approve the objective: <strong>{objectiveTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comment (Optional)
              </label>
              <Textarea
                placeholder="Add any comments or feedback..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Approving..." : "Approve Objective"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Reject Objective
            </DialogTitle>
            <DialogDescription>
              You are about to reject the objective: <strong>{objectiveTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-red-700">
                <MessageSquare className="w-4 h-4" />
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please provide a clear reason for rejection..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none border-red-200 focus:border-red-400"
                required
              />
              <p className="text-xs text-gray-500">
                This reason will be visible to the objective owner
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading || !reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Rejecting..." : "Reject Objective"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
