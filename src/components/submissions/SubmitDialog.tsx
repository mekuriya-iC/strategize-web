"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { useKPIMutations } from "@/hooks/useKPIMutations";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";
import { useKPI } from "@/hooks/objectives/useKPIs";
import { handleSmartSubmission } from "@/utils/smartSubmission";
import { useApolloClient } from "@apollo/client";
import type {
  ObjectiveType,
  SubmissionType,
} from "@/types/graphql";
import {
  isKpiSubmittable,
  resolveSubmissionLevel,
} from "@/lib/objectives/submissionLevel";

interface SubmitDialogProps {
  children: React.ReactNode; // The trigger element (button)
  itemId: string; // objectiveId or kpiId
  itemName: string; // for display purposes
  objectiveType: ObjectiveType; // CORPORATE, DIVISION, DEPARTMENT, PERSONNEL
  assigneeType?: string | null;
  parentId?: string | null;
  itemType: "objective" | "kpi"; // for display purposes
  /** Status from the list row; avoids mismatch when single-KPI query is stale */
  knownKpiStatus?: string | null;
  onSubmitSuccess?: () => void;
}

export default function SubmitDialog({
  children,
  itemId,
  itemName,
  objectiveType,
  assigneeType,
  parentId,
  itemType,
  knownKpiStatus,
  onSubmitSuccess,
}: SubmitDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const { updateKpi } = useKPIMutations();
  const { user, isAuthenticated } = useAuth();
  const client = useApolloClient();

  // Validate KPI exists (only for KPI submissions)
  const { kpi: kpiData, loading: kpiLoading } = useKPI(
    itemType === "kpi" && open ? { kpiId: itemId } : { kpiId: "" }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation before submission
    if (!itemId || !itemName) {
      console.error("❌ Missing required submission data:", {
        itemId,
        itemName,
        objectiveType,
        itemType,
      });
      toast.error("Missing required data. Please refresh and try again.");
      return;
    }

    // Validate objectiveType - if missing, try to infer or use default
    let validObjectiveType = objectiveType;
    if (!validObjectiveType) {
      console.warn("⚠️ objectiveType is missing, using PERSONNEL as default");
      validObjectiveType = "PERSONNEL";
    }

    // Check authentication before submitting
    if (!isAuthenticated || !user) {
      console.error("❌ User not authenticated:", { isAuthenticated, user });
      toast.error("You must be logged in to submit for approval.");
      return;
    }

    // Validate item exists and is in correct state
    if (!itemId || itemId.trim() === "") {
      toast.error("Invalid item ID. Please refresh and try again.");
      return;
    }

    // For KPI submissions, validate the KPI exists and is in correct state
    if (itemType === "kpi") {
      if (kpiLoading) {
        toast.error("Please wait while we validate the KPI...");
        return;
      }

      if (!kpiData) {
        console.error("❌ KPI not found in database:", { itemId, itemName });
        toast.error(
          "KPI not found. It may have been deleted or you may not have permission to access it."
        );
        return;
      }

      const isAdminUser =
        user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
      const effectiveStatus = kpiData.status ?? knownKpiStatus;

      if (!isAdminUser && !isKpiSubmittable(effectiveStatus)) {
        toast.error(
          `This KPI cannot be submitted (current status: ${effectiveStatus ?? "unknown"}).`
        );
        return;
      }

      // KPI validation passed for ${kpiData.kpiId}: ${kpiData.name} (User: ${user?.role})
    }

    setIsSubmitting(true);

    const submissionLevel = resolveSubmissionLevel(
      itemType === "kpi" && kpiData?.objective
        ? {
            type: kpiData.objective.type,
            assigneeType: kpiData.objective.assigneeType,
            assigneeId: kpiData.objective.assigneeId,
            parentId: kpiData.objective.parent?.objectiveId,
          }
        : {
            type: validObjectiveType,
            assigneeType: assigneeType ?? null,
            parentId: parentId ?? null,
          }
    );

    // Set submission type based on item type
    const submissionType: SubmissionType =
      itemType === "objective" ? "OBJECTIVE" : "KPI";

    // For KPI submissions, use the KPI ID (as per API documentation)
    const finalItemId = itemId;

    // Final itemId for submission: ${finalItemId} (${itemType})

    const submissionData = {
      type: submissionType,
      level: submissionLevel,
      itemId: finalItemId,
      reason: reason.trim() || "",
    };

    try {
      // Submission data being sent: ${submissionType} for ${itemType}
      // KPI Submission Type Verification: expected ${itemType === "kpi" ? "KPI" : "OBJECTIVE"}, actual ${submissionData.type}
      // Item details: ${itemId} - ${itemName} (${objectiveType})
      // User context: ${user ? user.fullName : 'Not authenticated'} (${user?.role || 'No role'})

      const result = await handleSmartSubmission({
        submissionType: submissionType,
        itemId: finalItemId,
        submissionData: submissionData,
        reason: reason.trim() || "Submitting for approval",
        client:
          client as unknown as import("@/utils/smartSubmission").ApolloClient,
        userRole: user?.role, // Pass user role for auto-approval logic
      });

      // Check if it was auto-approved
      const wasAutoApproved = result?.data?.autoApproved === true;

      if (wasAutoApproved) {
        toast.success(
          `${itemType === "objective" ? "Objective" : "KPI"} auto-approved! (${user?.role})`
        );
      } else {
        toast.success(
          `${itemType === "objective" ? "Objective" : "KPI"} submitted successfully!`
        );
      }

      setOpen(false);
      setReason(""); // Reset form
      onSubmitSuccess?.();
    } catch (error) {
      console.error("❌ Submission error details:", {
        error,
        submissionData,
      });

      // More specific error message
      let errorMessage = "Failed to submit. Please try again.";
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string" &&
        (error as { message: string }).message.includes(
          "foreign key constraint"
        )
      ) {
        errorMessage = `Unable to submit ${itemType}. The ${itemType} may not exist or you may not have permission to submit it.`;
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setReason(""); // Reset form on cancel
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[400px] sm:max-w-[500px] mx-auto p-6">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Send className="h-8 w-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-center text-[#0F1327]">
              Submit {itemType === "objective" ? "Objective" : "KPI"}
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              Submit &quot;{itemName}&quot; for approval
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Submission</Label>
            <Input
              id="reason"
              type="text"
              placeholder="e.g., Completed milestone 1, Ready for review..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Optional: Provide a brief explanation for this submission
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
              className="bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
