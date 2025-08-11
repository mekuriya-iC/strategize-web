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
import { useSubmissionMutations } from "@/hooks/useSubmissionMutations";
import { useMutation } from "@apollo/client";
import { CREATE_SUBMISSION } from "@/lib/graphql/mutations/submissions";
import { useKPIMutations } from "@/hooks/useKPIMutations";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type {
  ObjectiveType,
  SubmissionLevel,
  SubmissionType,
  Kpi,
} from "@/types/graphql";

interface ObjectiveWithKPIsSubmitDialogProps {
  children: React.ReactNode; // The trigger element (button)
  objectiveId: string;
  objectiveName: string;
  objectiveType: ObjectiveType; // DIVISION, DEPARTMENT, PERSONNEL
  associatedKPIs: Kpi[]; // KPIs belonging to this objective
  onSubmitSuccess?: () => void;
}

export default function ObjectiveWithKPIsSubmitDialog({
  children,
  objectiveId,
  objectiveName,
  objectiveType,
  associatedKPIs,
  onSubmitSuccess,
}: ObjectiveWithKPIsSubmitDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createSubmissions } = useSubmissionMutations();
  const [createSingleSubmission] = useMutation(CREATE_SUBMISSION);
  const { updateKpi } = useKPIMutations();
  const { user, isAuthenticated } = useAuth();

  // Initialize with all submittable KPIs selected by default
  useEffect(() => {
    if (open) {
      const submittableKPIs = associatedKPIs
        .filter((kpi) => kpi.status === "NOT_SUBMITTED")
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
      .filter((kpi) => kpi.status === "NOT_SUBMITTED")
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

    // Validate selected KPI IDs
    for (const kpiId of selectedKPIs) {
      if (!uuidRegex.test(kpiId)) {
        console.error("❌ Invalid KPI ID format:", kpiId);
        toast.error("Invalid KPI ID detected. Please refresh and try again.");
        return;
      }

      // Check if KPI still exists in our list
      const kpiExists = associatedKPIs.some((kpi) => kpi.kpiId === kpiId);
      if (!kpiExists) {
        console.error("❌ KPI not found in associated KPIs:", kpiId);
        toast.error(
          "Selected KPI no longer exists. Please refresh and try again."
        );
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

    // Prepare submissions array (objective + selected KPIs)
    const submissionInputs = [];

    // Add the objective submission
    submissionInputs.push({
      type: "OBJECTIVE" as SubmissionType,
      level: submissionLevel,
      itemId: objectiveId,
      reason: reason.trim() || "",
    });

    // Add selected KPI submissions
    console.log("🔍 About to add KPI submissions:", {
      selectedKPIs,
      selectedCount: selectedKPIs.length,
      submittableKPIs: associatedKPIs
        .filter((kpi) => kpi.status === "NOT_SUBMITTED")
        .map((kpi) => ({
          kpiId: kpi.kpiId,
          name: kpi.name,
          status: kpi.status,
        })),
    });

    selectedKPIs.forEach((kpiId) => {
      submissionInputs.push({
        type: "KPI" as SubmissionType,
        level: submissionLevel,
        itemId: kpiId,
        reason: reason.trim() || "",
      });
    });

    console.log("📋 Final submission inputs:", submissionInputs);
    console.log("🔧 Backend Schema Check:", {
      objectiveType,
      mappedSubmissionLevel: submissionLevel,
      backendExpectedLevels: ["DEPARTMENT", "DIVISION", "PERSONNEL"],
      note: "Using actual backend schema levels, not API docs",
    });

    try {
      console.log("🚀 Objective + KPIs submission data:", {
        objectiveId,
        objectiveName,
        selectedKPIsCount: selectedKPIs.length,
        submissionInputs,
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

      let result;

      try {
        // Try bulk submission first
        result = await createSubmissions({
          inputs: submissionInputs,
        });
        console.log("✅ Bulk submission successful:", result);
      } catch (bulkError) {
        console.warn(
          "⚠️ Bulk submission failed, trying individual submissions:",
          bulkError
        );

        // If bulk submission fails, try individual submissions
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

        // Submit objective first
        try {
          const objectiveResult = await createSingleSubmission({
            variables: {
              input: {
                type: "OBJECTIVE" as SubmissionType,
                level: submissionLevel,
                itemId: objectiveId,
                reason: reason.trim() || "",
              },
            },
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

        // Submit each KPI individually
        for (const kpiId of selectedKPIs) {
          try {
            const kpiResult = await createSingleSubmission({
              variables: {
                input: {
                  type: "KPI" as SubmissionType,
                  level: submissionLevel,
                  itemId: kpiId,
                  reason: reason.trim() || "",
                },
              },
            });
            successfulSubmissions.push({
              type: "kpi",
              id: kpiId,
              result: kpiResult,
            });
            console.log(`✅ KPI ${kpiId} submission successful:`, kpiResult);
          } catch (kpiError) {
            failedSubmissions.push({ type: "kpi", id: kpiId, error: kpiError });
            console.error(`❌ KPI ${kpiId} submission failed:`, kpiError);
          }
        }

        // If no submissions succeeded, throw the original error
        if (successfulSubmissions.length === 0) {
          throw bulkError;
        }

        // If some failed, show a partial success message
        if (failedSubmissions.length > 0) {
          const successCount = successfulSubmissions.length;
          const failCount = failedSubmissions.length;
          toast.warning(
            `Partial submission success: ${successCount} items submitted, ${failCount} failed`,
            {
              description:
                "Some items couldn't be submitted due to data constraints. Please refresh and try again for the failed items.",
            }
          );
        }

        result = { successfulSubmissions, failedSubmissions };
      }

      // Update KPI status to PENDING after successful submission
      let successfulKpiIds = selectedKPIs;

      console.log("🔍 KPI Status Update Debug:", {
        originalSelectedKPIs: selectedKPIs,
        usedIndividualSubmissions: !!result.successfulSubmissions,
        bulkResult: result.successfulSubmissions
          ? null
          : "Used bulk submission",
        individualResults: result.successfulSubmissions || null,
      });

      // If we used individual submissions, only update KPIs that succeeded
      if (
        (
          result as {
            successfulSubmissions?: Array<{ type: string; id: string }>;
          }
        ).successfulSubmissions
      ) {
        const ss = (
          result as {
            successfulSubmissions: Array<{ type: string; id: string }>;
          }
        ).successfulSubmissions;
        successfulKpiIds = ss.filter((s) => s.type === "kpi").map((s) => s.id);
        console.log(
          "🔍 Filtered successful KPI IDs from individual submissions:",
          successfulKpiIds
        );
      } else {
        console.log(
          "🔍 Using original selected KPIs from bulk submission:",
          successfulKpiIds
        );
      }

      if (successfulKpiIds.length > 0) {
        console.log("🔄 Updating successful KPI statuses to PENDING...");
        console.log("📋 KPIs to update:", successfulKpiIds);
        try {
          for (const kpiId of successfulKpiIds) {
            console.log(`🔄 Updating KPI ${kpiId} status to PENDING...`);
            const updateResult = await updateKpi({
              input: {
                kpiId,
                status: "PENDING",
              },
            });
            console.log(
              `✅ Updated KPI ${kpiId} status to PENDING:`,
              updateResult
            );
          }
          console.log("✅ All KPI status updates completed successfully");
        } catch (updateError) {
          console.error("❌ Error updating KPI status:", updateError);
          toast.error(
            "Submission successful but KPI status update failed. Please refresh the page."
          );
        }
      } else {
        console.log("ℹ️ No KPIs to update (successfulKpiIds is empty)");
      }

      // Show success message only if we didn't already show a partial success warning
      if (!result.failedSubmissions || result.failedSubmissions.length === 0) {
        const kpiText =
          successfulKpiIds.length > 0
            ? ` with ${successfulKpiIds.length} KPI${
                successfulKpiIds.length !== 1 ? "s" : ""
              }`
            : "";

        toast.success(`Objective${kpiText} submitted successfully!`);
      }
      setOpen(false);
      setReason(""); // Reset form
      setSelectedKPIs([]); // Reset KPI selection
      onSubmitSuccess?.();
    } catch (error) {
      console.error("❌ Submission error:", error);

      // Enhanced error reporting for foreign key constraints
      let errorMessage = "Failed to submit objective";
      let errorDescription = "Please try again";

      if (error instanceof Error) {
        errorDescription = error.message;

        // Check for specific foreign key constraint errors
        if (error.message.includes("foreign key constraint")) {
          if (error.message.includes("FK_fe1545d982d72b6191e19e78629")) {
            errorMessage = "Invalid objective or KPI reference";
            errorDescription =
              "The objective or one of the selected KPIs may have been deleted. Please refresh the page and try again.";
          } else {
            errorMessage = "Database constraint violation";
            errorDescription =
              "There's a data integrity issue. Please contact support if this persists.";
          }
        } else if (error.message.includes("violates")) {
          errorMessage = "Data validation error";
          errorDescription =
            "The submission data doesn't meet the required constraints. Please refresh and try again.";
        }
      }

      toast.error(errorMessage, { description: errorDescription });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter KPIs that can be submitted
  const submittableKPIs = associatedKPIs.filter(
    (kpi) => kpi.status === "NOT_SUBMITTED"
  );
  const nonSubmittableKPIs = associatedKPIs.filter(
    (kpi) => kpi.status !== "NOT_SUBMITTED"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Objective with KPIs for Approval</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Objective Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Objective</h3>
            <p className="text-sm text-blue-700">
              <strong>{objectiveName}</strong> ({objectiveType})
            </p>
          </div>

          {/* KPI Selection */}
          {submittableKPIs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Associated KPIs ({submittableKPIs.length} available)
                </h3>
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

              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {submittableKPIs.map((kpi) => (
                  <div key={kpi.kpiId} className="flex items-center space-x-3">
                    <Checkbox
                      id={`kpi-${kpi.kpiId}`}
                      checked={selectedKPIs.includes(kpi.kpiId)}
                      onCheckedChange={() => handleKPIToggle(kpi.kpiId)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={`kpi-${kpi.kpiId}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {kpi.name}
                    </label>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500">
                {selectedKPIs.length} of {submittableKPIs.length} KPIs selected
                for submission
              </p>
            </div>
          )}

          {/* Show non-submittable KPIs as info */}
          {nonSubmittableKPIs.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                KPIs Not Available for Submission ({nonSubmittableKPIs.length})
              </h4>
              <div className="space-y-1">
                {nonSubmittableKPIs.map((kpi) => (
                  <div
                    key={kpi.kpiId}
                    className="flex justify-between text-xs text-gray-600"
                  >
                    <span>{kpi.name}</span>
                    <span className="text-gray-500">({kpi.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No KPIs message */}
          {submittableKPIs.length === 0 && nonSubmittableKPIs.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                This objective has no associated KPIs. Only the objective will
                be submitted.
              </p>
            </div>
          )}

          {/* Reason field */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Submission (Optional)</Label>
            <Input
              id="reason"
              type="text"
              placeholder="Enter reason for submission..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Send className="w-4 h-4 mr-2" />
              Submit{" "}
              {selectedKPIs.length > 0 &&
                `(1 objective + ${selectedKPIs.length} KPIs)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
