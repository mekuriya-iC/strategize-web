"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Submission {
  submissionId: string;
  type: "OBJECTIVE" | "KPI";
  level: "DEPARTMENT" | "DIVISION" | "PERSONNEL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
  submittedBy: {
    employeeId: string;
    fullName: string;
  };
  objective?: {
    objectiveId: string;
    title?: string; // Backend uses 'title'
    name?: string; // Backward compatibility
    type: string;
    status: string;
  };
  kpi?: {
    kpiId: string;
    name: string;
    status: string;
    objective?: {
      objectiveId: string;
      title?: string; // Backend uses 'title'
      name?: string; // Backward compatibility
      type: string;
    };
  };
  createdAt: string;
}

interface ApproveSubmissionDialogProps {
  children: React.ReactNode;
  submission: Submission;
  onApprove: (submissionId: string, reason: string) => Promise<void>;
}

export default function ApproveSubmissionDialog({
  children,
  submission,
  onApprove,
}: ApproveSubmissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submission.submissionId) {
      toast.error("Invalid submission data");
      return;
    }

    setIsSubmitting(true);

    try {
      await onApprove(submission.submissionId, reason.trim());

      toast.success(
        `${
          submission.type === "OBJECTIVE" ? "Objective" : "KPI"
        } approved successfully!`
      );
      setOpen(false);
      setReason(""); // Reset form
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Failed to approve submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setReason(""); // Reset form on cancel
  };

  const getItemName = () => {
    if (submission.type === "OBJECTIVE" && submission.objective) {
      return submission.objective.title || submission.objective.name;
    } else if (submission.type === "KPI" && submission.kpi) {
      return submission.kpi.name;
    }
    return "Unknown item";
  };

  const getItemType = () => {
    return submission.type === "OBJECTIVE" ? "Objective" : "KPI";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[400px] sm:max-w-[500px] mx-auto p-6">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-center text-[#0F1327]">
              Approve {getItemType()}
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              Approve &quot;{getItemName()}&quot; submission
            </p>
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Submitted by: {submission.submittedBy.fullName}</p>
              <p>Level: {submission.level}</p>
              <p>Date: {new Date(submission.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="approval-reason">Approval Reason (Optional)</Label>
            <Input
              id="approval-reason"
              type="text"
              placeholder="e.g., All requirements met, Excellent work..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Optional: Provide a brief explanation for this approval
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
