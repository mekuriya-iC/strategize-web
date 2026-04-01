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
  SubmissionLevel,
  SubmissionType,
} from "@/types/graphql";

interface SubmitDialogProps {
  children: React.ReactNode; // The trigger element (button)
  itemId: string; // objectiveId or kpiId
  itemName: string; // for display purposes
  objectiveType: ObjectiveType; // CORPORATE, DIVISION, DEPARTMENT, PERSONNEL
  itemType: "objective" | "kpi"; // for display purposes
  onSubmitSuccess?: () => void;
}

export default function SubmitDialog({
  children,
  itemId,
  itemName,
  objectiveType,
  itemType,
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
    itemType === "kpi" ? { kpiId: itemId } : { kpiId: "" }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation before submission
    if (!itemId || !itemName || !objectiveType) {
      console.error("❌ Missing required submission data:", {
        itemId,
        itemName,
        objectiveType,
        itemType,
      });
      toast.error("Missing required data. Please refresh and try again.");
      return;
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

      if (kpiData.status !== "NOT_SUBMITTED" && kpiData.status !== "REJECTED") {
        console.error("❌ KPI is not in a submittable state:", {
          kpiId: kpiData.kpiId,
          status: kpiData.status,
        });
        toast.error(
          "This KPI cannot be submitted. It may already be submitted or approved."
        );
        return;
      }

      console.log("✅ KPI validation passed:", {
        kpiId: kpiData.kpiId,
        kpiName: kpiData.name,
        status: kpiData.status,
        hasObjective: !!kpiData.objective,
        objectiveId: kpiData.objective?.objectiveId,
      });
    }

    setIsSubmitting(true);

    // Map ObjectiveType to SubmissionLevel
    const submissionLevel: SubmissionLevel =
      objectiveType === "PERSONNEL"
        ? "PERSONNEL"
        : objectiveType === "DEPARTMENT"
          ? "DEPARTMENT"
          : "DIVISION"; // CORPORATE, DIVISION -> DIVISION level

    // Set submission type based on item type
    const submissionType: SubmissionType =
      itemType === "objective" ? "OBJECTIVE" : "KPI";

    // For KPI submissions, use the KPI ID (as per API documentation)
    const finalItemId = itemId;

    console.log("🔍 Final itemId for submission:", {
      originalItemId: itemId,
      finalItemId,
      itemType,
      hasObjective: !!kpiData?.objective,
      objectiveId: kpiData?.objective?.objectiveId,
    });

    const submissionData = {
      type: submissionType,
      level: submissionLevel,
      itemId: finalItemId,
      reason: reason.trim() || "",
    };

    try {
      console.log("🚀 Submission data being sent:", submissionData);
      console.log("🎯 KPI Submission Type Verification:", {
        itemType,
        submissionType,
        isKpiSubmission: submissionType === "KPI",
        submissionData,
      });
      console.log("🔍 CREATION DEBUG - Final submission details:", {
        itemType,
        submissionType,
        isKpiSubmission: submissionType === "KPI",
        submissionData: {
          type: submissionData.type,
          level: submissionData.level,
          itemId: submissionData.itemId,
          reason: submissionData.reason,
        },
        expectedType: itemType === "kpi" ? "KPI" : "OBJECTIVE",
        actualType: submissionData.type,
        typesMatch:
          (itemType === "kpi" ? "KPI" : "OBJECTIVE") === submissionData.type,
      });
      console.log("🎯 Item details:", {
        itemId,
        itemName,
        objectiveType,
        itemType,
      });
      console.log("👤 User context:", {
        isAuthenticated,
        user: user
          ? { employeeId: user.employeeId, fullName: user.fullName }
          : null,
      });

      const result = await handleSmartSubmission({
        submissionType: submissionType,
        itemId: finalItemId,
        submissionData: submissionData,
        reason: reason.trim() || "Submitting for approval",
        client:
          client as unknown as import("@/utils/smartSubmission").ApolloClient,
      });

      console.log("✅ Submission successful:", result);
      console.log("🔍 BACKEND RESPONSE DEBUG - What backend returned:", {
        submissionId: result?.data?.submissionId,
        type: result?.data?.type,
        level: result?.data?.level,
        status: result?.data?.status,
        reason: result?.data?.reason,
        expectedType: submissionData.type,
        typesMatch: result?.data?.type === submissionData.type,
        fullResponse: result,
      });

      // Note: handleSmartSubmission already updates the KPI status to PENDING
      // No need for additional status update here

      toast.success(
        `${itemType === "objective" ? "Objective" : "KPI"
        } submitted successfully!`
      );
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
