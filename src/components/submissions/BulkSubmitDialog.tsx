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
import { useKPIMutations } from "@/hooks/objectives/useKPIMutations";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";
import { useKPI } from "@/hooks/objectives/useKPIs";
import { useObjective } from "@/hooks/objectives/useObjectives";
import { handleSmartSubmission } from "@/utils/smartSubmission";
import { useApolloClient } from "@apollo/client";
import type {
  ObjectiveType,
  SubmissionLevel,
  SubmissionType,
} from "@/types/graphql";

interface BulkSubmissionItem {
  itemId: string; // objectiveId or kpiId
  itemName: string; // for display
  objectiveType: ObjectiveType; // CORPORATE, DIVISION, DEPARTMENT, PERSONNEL
  itemType: "objective" | "kpi"; // for determining submission type
}

interface BulkSubmitDialogProps {
  children: React.ReactNode; // The trigger element (button)
  items: BulkSubmissionItem[];
  itemType: "objectives" | "kpis" | "mixed"; // for display purposes
  onSubmitSuccess?: () => void;
}

export default function BulkSubmitDialog({
  children,
  items,
  itemType,
  onSubmitSuccess,
}: BulkSubmitDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateKpi } = useKPIMutations();
  const { user, isAuthenticated } = useAuth();
  const client = useApolloClient();

  // Validate first KPI exists (for debugging)
  const firstKPIId =
    items.length > 0 && items[0].itemType === "kpi" ? items[0].itemId : "";
  const { kpi: firstKPI, loading: kpiLoading } = useKPI(
    firstKPIId ? { kpiId: firstKPIId } : { kpiId: "" }
  );

  // Validate objective exists (for debugging)
  const objectiveId = firstKPI?.objective?.objectiveId;
  const { objective: objectiveData, loading: objectiveLoading } = useObjective(
    objectiveId ? { objectiveId } : { objectiveId: "" }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("No items selected for submission");
      return;
    }

    // Check authentication before submitting
    if (!isAuthenticated || !user) {
      console.error("❌ User not authenticated for bulk submission:", {
        isAuthenticated,
        user,
      });
      toast.error("You must be logged in to submit for approval.");
      return;
    }

    // Validate all items have valid IDs
    const invalidItems = items.filter(
      (item) => !item.itemId || item.itemId.trim() === ""
    );
    if (invalidItems.length > 0) {
      toast.error(
        `${invalidItems.length} item(s) have invalid IDs. Please refresh and try again.`
      );
      return;
    }

    // Additional validation for KPIs
    if (itemType === "kpis") {
      for (const item of items) {
        // KPI ${item.itemId}: ${item.itemName} (${item.objectiveType})
      }

      // Check if first KPI exists in database
      if (firstKPIId) {
        // KPI validation: ${firstKPIId}, loading: ${kpiLoading}, exists: ${!!firstKPI}

        // Check if objective exists in database
        if (objectiveId) {
          // Objective validation: ${objectiveId}, loading: ${objectiveLoading}, exists: ${!!objectiveData}
        }
      }
    }

    setIsSubmitting(true);

    // Create submission inputs for each item
    const submissionInputs = items.map((item) => {
      // Note: CORPORATE objectives should never reach here as they are auto-approved
      const submissionLevel: SubmissionLevel =
        item.objectiveType === "PERSONNEL"
          ? "PERSONNEL"
          : item.objectiveType === "DEPARTMENT"
            ? "DEPARTMENT"
            : "DIVISION"; // DIVISION maps to DIVISION level

      // Set submission type based on item type
      const submissionType: SubmissionType =
        item.itemType === "objective" ? "OBJECTIVE" : "KPI";

      // Submission mapping: ${item.objectiveType} -> ${submissionLevel}, ${item.itemType} -> ${submissionType}

      // For KPI submissions, use the KPI ID (as per API documentation)
      const finalItemId = item.itemId;

      // Final itemId for submission: ${finalItemId} (${item.itemType})

      return {
        type: submissionType,
        level: submissionLevel,
        itemId: finalItemId,
        reason: reason.trim() || "",
      };
    });

    try {
      // Bulk submission starting for ${itemType}: ${items[0]?.objectiveType}

      const successfulSubmissions: Array<{
        type: "objective" | "kpi";
        id: string;
        result: unknown;
      }> = [];
      const failedSubmissions: Array<{
        type: "objective" | "kpi";
        id: string;
        error: unknown;
      }> = [];

      // Submit each item using smart submission
      for (const item of items) {
        try {
          const submissionData = submissionInputs.find(
            (input) => input.itemId === item.itemId
          );

          if (!submissionData) {
            console.error("❌ Submission data not found for item:", item);
            continue;
          }

          const result = await handleSmartSubmission({
            submissionType: submissionData.type as "KPI" | "OBJECTIVE",
            itemId: item.itemId,
            submissionData: submissionData,
            reason: reason.trim() || "Submitting for approval",
            client:
              client as unknown as import("@/utils/smartSubmission").ApolloClient,
          });

          successfulSubmissions.push({
            type: item.itemType,
            id: item.itemId,
            result: result,
          });
        } catch (error) {
          failedSubmissions.push({
            type: item.itemType,
            id: item.itemId,
            error: error,
          });
          console.error(`❌ ${item.itemType} submission failed:`, error);
        }
      }

      // Report results
      if (successfulSubmissions.length > 0) {
        if (failedSubmissions.length > 0) {
          console.warn("⚠️ Some submissions failed:", failedSubmissions);
          toast.warning(
            `${successfulSubmissions.length} submission(s) successful, ${failedSubmissions.length} failed.`
          );
        }
      } else {
        throw new Error("All submissions failed");
      }

      // Bulk submission results: ${successfulSubmissions.length} successful, ${failedSubmissions.length} failed

      // Update KPI status to PENDING after successful submission
      for (const submission of successfulSubmissions) {
        if (submission.type === "kpi") {
          try {
            await updateKpi({
              kpiId: submission.id,
              status: "PENDING",
            });
          } catch (updateError) {
            console.error("❌ Error updating KPI status:", updateError);
            // Don't fail the submission if status update fails
          }
        }
      }

      const itemTypeLabel =
        itemType === "objectives"
          ? "objectives"
          : itemType === "kpis"
            ? "KPIs"
            : "items";

      toast.success(`${items.length} ${itemTypeLabel} submitted successfully!`);
      setOpen(false);
      setReason(""); // Reset form
      onSubmitSuccess?.();
    } catch (error) {
      console.error("❌ Bulk submission error details:", {
        error,
        submissionInputs,
        items,
      });

      // More specific error message
      let errorMessage = "Failed to submit items. Please try again.";
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string" &&
        (error as { message: string }).message.includes(
          "foreign key constraint"
        )
      ) {
        errorMessage = `Unable to submit ${itemType}. Some items may not exist or you may not have permission to submit them.`;
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

  const getDisplayText = () => {
    if (items.length === 0) return "No items selected";
    if (items.length === 1) return `1 ${itemType.slice(0, -1)}`; // Remove 's' for singular
    return `${items.length} ${itemType}`;
  };

  const getItemsList = () => {
    if (items.length <= 3) {
      return items.map((item) => item.itemName).join(", ");
    }
    return `${items
      .slice(0, 2)
      .map((item) => item.itemName)
      .join(", ")} and ${items.length - 2} more`;
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
              Submit {getDisplayText()}
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              Submit the following for approval:
            </p>
            <p className="text-sm font-medium text-gray-800 text-center">
              {getItemsList()}
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="bulk-reason">Reason for Submission</Label>
            <Input
              id="bulk-reason"
              type="text"
              placeholder="e.g., Completed all milestones, Ready for quarterly review..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Optional: This reason will be applied to all {items.length}{" "}
              selected items
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
              disabled={isSubmitting || items.length === 0}
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
                  Submit All ({items.length})
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
