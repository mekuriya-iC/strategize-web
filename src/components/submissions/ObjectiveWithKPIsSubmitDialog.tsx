"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { handleSmartSubmission } from "@/utils/smartSubmission";
import { useApolloClient } from "@apollo/client";
import type {
  ObjectiveType,
  SubmissionLevel,
  SubmissionType,
  Kpi,
} from "@/types/graphql";

interface ObjectiveWithKPIsSubmitDialogProps {
  children?: React.ReactNode;
  objectiveId: string;
  objectiveName: string;
  objectiveType: ObjectiveType;
  associatedKPIs: Kpi[];
  onSubmitSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ObjectiveWithKPIsSubmitDialog({
  children,
  objectiveId,
  objectiveName,
  objectiveType,
  associatedKPIs,
  onSubmitSuccess,
  open: externalOpen,
  onOpenChange: setExternalOpen,
}: ObjectiveWithKPIsSubmitDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;
  const [reason, setReason] = useState("");
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const { updateKpi } = useKPIMutations();
  const { user, isAuthenticated } = useAuth();
  const client = useApolloClient();

  // Initialize with all submittable KPIs selected by default
  useEffect(() => {
    if (open) {
      const submittableKPIs = associatedKPIs
        .filter((kpi) => kpi.status === "NOT_SUBMITTED" || kpi.status === "REJECTED")
        .map((kpi) => kpi.kpiId);
      setSelectedKPIs(submittableKPIs);
    }
  }, [open, associatedKPIs]);

  const handleKPIToggle = (kpiId: string) => {
    setSelectedKPIs((prev) =>
      prev.includes(kpiId)
        ? prev.filter((id) => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  const handleSelectAllKPIs = () => {
    const submittableKPIs = associatedKPIs
      .filter((kpi) => kpi.status === "NOT_SUBMITTED" || kpi.status === "REJECTED")
      .map((kpi) => kpi.kpiId);
    setSelectedKPIs(submittableKPIs);
  };

  const handleDeselectAllKPIs = () => {
    setSelectedKPIs([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!objectiveId || !objectiveName || !objectiveType) {
      console.error("❌ Missing required submission data:", {
        objectiveId,
        objectiveName,
        objectiveType,
      });
      toast.error("Missing required data. Please refresh and try again.");
      return;
    }

    if (!isAuthenticated || !user) {
      console.error("❌ User not authenticated:", { isAuthenticated, user });
      toast.error("You must be logged in to submit for approval.");
      return;
    }

    if (objectiveType === "CORPORATE") {
      toast.error(
        "Corporate objectives are automatically approved and cannot be submitted."
      );
      return;
    }

    // Validate objective ID format (should be a valid UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(objectiveId)) {
      console.error("❌ Invalid objective ID format:", objectiveId);
      toast.error("Invalid objective ID. Please refresh and try again.");
      return;
    }

    // Validate selected KPI IDs and Quarterly Split
    for (const kpiId of selectedKPIs) {
      if (!uuidRegex.test(kpiId)) {
        console.error("❌ Invalid KPI ID format:", kpiId);
        toast.error("Invalid KPI ID detected. Please refresh and try again.");
        return;
      }

      // Check if KPI still exists in our list
      const kpi = associatedKPIs.find((k) => k.kpiId === kpiId);
      if (!kpi) {
        console.error("❌ KPI not found in associated KPIs:", kpiId);
        toast.error(
          "Selected KPI no longer exists. Please refresh and try again."
        );
        return;
      }

      // VALIDATION: Quarterly Split Check
      const targetTimelines = kpi.targets?.map(t => t.timeline.toUpperCase()) || [];
      const hasQuarters = targetTimelines.some(tl => tl.includes("-Q1")) &&
        targetTimelines.some(tl => tl.includes("-Q2")) &&
        targetTimelines.some(tl => tl.includes("-Q3")) &&
        targetTimelines.some(tl => tl.includes("-Q4"));

      if (!hasQuarters) {
        toast.error(`KPI "${kpi.name}" must have targets planned for all 4 quarters (Q1-Q4) before submission.`);
        return;
      }
    }

    setIsSubmitting(true);

    // Map ObjectiveType to SubmissionLevel (backend expects DEPARTMENT/DIVISION/PERSONNEL)
    const submissionLevel: SubmissionLevel =
      objectiveType === "PERSONNEL"
        ? "PERSONNEL"
        : objectiveType === "DEPARTMENT"
          ? "DEPARTMENT"
          : "DIVISION"; // DIVISION -> DIVISION level

    try {
      console.log("🚀 Objective + KPIs submission data:", {
        objectiveId,
        objectiveName,
        selectedKPIsCount: selectedKPIs.length,
        associatedKPIsDetails: associatedKPIs.map((kpi) => ({
          kpiId: kpi.kpiId,
          name: kpi.name,
          status: kpi.status,
          objectiveId: kpi.objective?.objectiveId,
        })),
        selectedKPIsDetails: selectedKPIs.map((kpiId) => {
          const kpi = associatedKPIs.find((k) => k.kpiId === kpiId);
          return {
            kpiId,
            name: kpi?.name,
            status: kpi?.status,
            exists: !!kpi,
          };
        }),
      });

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

      // Submit objective using smart submission
      try {
        const objectiveResult = await handleSmartSubmission({
          submissionType: "OBJECTIVE",
          itemId: objectiveId,
          submissionData: {
            type: "OBJECTIVE" as SubmissionType,
            level: submissionLevel,
            itemId: objectiveId,
            reason: reason.trim() || "",
          },
          reason: reason.trim() || "Submitting objective for approval",
          client:
            client as unknown as import("@/utils/smartSubmission").ApolloClient,
        });
        successfulSubmissions.push({
          type: "objective",
          id: objectiveId,
          result: objectiveResult,
        });
        console.log("✅ Objective submission successful:", objectiveResult);
      } catch (objError) {
        failedSubmissions.push({
          type: "objective",
          id: objectiveId,
          error: objError,
        });
        console.error("❌ Objective submission failed:", objError);
      }

      // Submit KPIs using smart submission
      for (const kpiId of selectedKPIs) {
        try {
          const kpiResult = await handleSmartSubmission({
            submissionType: "KPI",
            itemId: kpiId,
            submissionData: {
              type: "KPI" as SubmissionType,
              level: submissionLevel,
              itemId: kpiId,
              reason: reason.trim() || "",
            },
            reason: reason.trim() || "Submitting KPI for approval",
            client:
              client as unknown as import("@/utils/smartSubmission").ApolloClient,
          });
          successfulSubmissions.push({
            type: "kpi",
            id: kpiId,
            result: kpiResult,
          });
          console.log("✅ KPI submission successful:", kpiResult);
        } catch (kpiError) {
          failedSubmissions.push({
            type: "kpi",
            id: kpiId,
            error: kpiError,
          });
          console.error("❌ KPI submission failed:", kpiError);
        }
      }

      // Report results
      if (successfulSubmissions.length > 0) {
        console.log("✅ Some submissions successful:", successfulSubmissions);
        if (failedSubmissions.length > 0) {
          console.warn("⚠️ Some submissions failed:", failedSubmissions);
          toast.warning(
            `${successfulSubmissions.length} submission(s) successful, ${failedSubmissions.length} failed.`
          );
        }
      } else {
        throw new Error("All submissions failed");
      }

      console.log("✅ Smart submissions completed:", {
        successfulCount: successfulSubmissions.length,
        failedCount: failedSubmissions.length,
        successfulSubmissions,
        failedSubmissions,
      });

      // Note: handleSmartSubmission already updates KPI statuses to PENDING
      // No need for additional status updates here

      toast.success(
        `Objective and ${successfulSubmissions.filter((s) => s.type === "kpi").length
        } KPI(s) submitted successfully!`
      );
      setOpen(false);
      setReason(""); // Reset form
      onSubmitSuccess?.();
    } catch (error) {
      console.error("❌ Submission error details:", {
        error,
        objectiveId,
        selectedKPIs,
      });

      // More specific error message
      let errorMessage = "Failed to submit. Please try again.";
      if (
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

  // Get submittable KPIs (those with NOT_SUBMITTED or REJECTED status)
  const submittableKPIs = associatedKPIs.filter(
    (kpi) => kpi.status === "NOT_SUBMITTED" || kpi.status === "REJECTED"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[500px] sm:max-w-[600px] mx-auto p-6">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Send className="h-8 w-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-center text-[#0F1327]">
              Submit Objective with KPIs
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              Submit &quot;{objectiveName}&quot; and selected KPIs for approval
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
              Provide a brief reason for submitting this objective and KPIs for
              approval.
            </p>
          </div>

          {/* KPI Selection Section */}
          {submittableKPIs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Select KPIs to Submit ({selectedKPIs.length} selected)
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllKPIs}
                    disabled={isSubmitting}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllKPIs}
                    disabled={isSubmitting}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                {submittableKPIs.map((kpi) => (
                  <div key={kpi.kpiId} className="flex items-center space-x-2">
                    <Checkbox
                      id={kpi.kpiId}
                      checked={selectedKPIs.includes(kpi.kpiId)}
                      onCheckedChange={() => handleKPIToggle(kpi.kpiId)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={kpi.kpiId}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {kpi.name || "Unnamed KPI"}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm text-gray-900">
              Submission Summary
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Objective: {objectiveName} (will be submitted)</p>
              {selectedKPIs.length > 0 ? (
                <p>• KPIs to submit: {selectedKPIs.length}</p>
              ) : (
                <p>
                  • KPIs to submit: None (KPIs are submitted automatically when
                  created/edited)
                </p>
              )}
              <p>• Total items: {selectedKPIs.length + 1}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Approval
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
