import { useMutation } from "@apollo/client";
import { UPDATE_SUBMISSION } from "@/lib/graphql/mutations/submissions";
import {
  GET_PENDING_SUBMISSIONS,
  GET_SUBMISSIONS_BY_STATUS,
} from "@/lib/graphql/queries/submissions";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import type {
  SubmissionStatus,
  SubmissionType,
  SubmissionLevel,
} from "@/types/graphql";
import { submissionLogger } from "@/lib/logger";
import { invalidateAfterMutation } from "@/stores/cacheStore";

export const useSubmissionApprovalMutations = () => {
  const [updateSubmission, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_SUBMISSION, {
      onCompleted: () => {
        // Invalidate approval-related caches
        invalidateAfterMutation.approval();
      },
      refetchQueries: [
        // Refetch submissions for all types
        { query: GET_PENDING_SUBMISSIONS, variables: { page: 1, limit: 10, type: "CORPORATE" } },
        { query: GET_PENDING_SUBMISSIONS, variables: { page: 1, limit: 10, type: "DIVISION" } },
        { query: GET_PENDING_SUBMISSIONS, variables: { page: 1, limit: 10, type: "DEPARTMENT" } },
        { query: GET_PENDING_SUBMISSIONS, variables: { page: 1, limit: 10, type: "PERSONNEL" } },
        { query: GET_SUBMISSIONS_BY_STATUS, variables: { page: 1, limit: 10, type: "CORPORATE" } },
        { query: GET_SUBMISSIONS_BY_STATUS, variables: { page: 1, limit: 10, type: "DIVISION" } },
        { query: GET_SUBMISSIONS_BY_STATUS, variables: { page: 1, limit: 10, type: "DEPARTMENT" } },
        { query: GET_SUBMISSIONS_BY_STATUS, variables: { page: 1, limit: 10, type: "PERSONNEL" } },
        // Refetch objectives and KPIs
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
        { query: GET_KPIS, variables: { page: 1, limit: 10 } },
        { query: GET_KPIS, variables: { page: 1, limit: 20 } },
        { query: GET_KPIS, variables: { page: 1, limit: 50 } },
      ],
    });

  const handleApproveSubmission = async (
    submissionId: string,
    reason?: string,
    submission?: MinimalSubmission
  ) => {
    try {
      // For KPI submissions, use updateSubmission with all required fields
      if (submission?.type === "KPI" && submission?.kpi?.kpiId) {
        submissionLogger.debug("Using updateSubmission for KPI with itemId:", submission.kpi.kpiId);

        const result = await updateSubmission({
          variables: {
            input: {
              submissionId,
              status: "APPROVED" as SubmissionStatus,
              reason: reason || "Approved by approver",
              itemId: submission.kpi.kpiId,
              type: "KPI" as SubmissionType,
              level: (submission as MinimalSubmission & { level: SubmissionLevel }).level,
            },
          },
        });

        return result.data?.updateSubmission;
      }

      // For objective submissions, use updateSubmission mutation
      submissionLogger.debug("Using updateSubmission for objective submission");

      const result = await updateSubmission({
        variables: {
          input: {
            submissionId,
            status: "APPROVED" as SubmissionStatus,
            reason: reason || "Approved by approver",
          },
        },
      });

      return result.data?.updateSubmission;
    } catch (error) {
      submissionLogger.error("Error approving submission:", error);
      throw error;
    }
  };

  const handleRejectSubmission = async (
    submissionId: string,
    reason?: string,
    submission?: MinimalSubmission
  ) => {
    try {
      // For KPI submissions, use updateSubmission with all required fields
      if (submission?.type === "KPI" && submission?.kpi?.kpiId) {
        submissionLogger.debug("Using updateSubmission for KPI with itemId:", submission.kpi.kpiId);

        const result = await updateSubmission({
          variables: {
            input: {
              submissionId,
              status: "REJECTED" as SubmissionStatus,
              reason: reason || "Rejected by approver",
              itemId: submission.kpi.kpiId,
              type: "KPI" as SubmissionType,
              level: (submission as MinimalSubmission & { level: SubmissionLevel }).level,
            },
          },
        });

        return result.data?.updateSubmission;
      }

      // For objective submissions, use updateSubmission mutation
      submissionLogger.debug("Using updateSubmission for objective submission");

      const result = await updateSubmission({
        variables: {
          input: {
            submissionId,
            status: "REJECTED" as SubmissionStatus,
            reason: reason || "Rejected by approver",
          },
        },
      });

      return result.data?.updateSubmission;
    } catch (error) {
      submissionLogger.error("Error rejecting submission:", error);
      throw error;
    }
  };

  type MinimalSubmission = {
    submissionId: string;
    type: "OBJECTIVE" | "KPI";
    objective?: { objectiveId: string } | null;
    kpi?: { kpiId: string } | null;
  };

  const handleApproveSubmissionWithItemUpdate = async (
    submission: MinimalSubmission,
    reason?: string
  ) => {
    try {
      // Update submission status (this includes the reason and handles both submission + associated item)
      await handleApproveSubmission(submission.submissionId, reason, submission);
      // The backend handles updating the associated objective/KPI automatically
    } catch (error) {
      submissionLogger.error("Error approving submission with item update:", error);
      throw error;
    }
  };

  const handleRejectSubmissionWithItemUpdate = async (
    submission: MinimalSubmission,
    reason?: string
  ) => {
    try {
      // Update submission status (this includes the reason and handles both submission + associated item)
      await handleRejectSubmission(submission.submissionId, reason, submission);
      // The backend handles updating the associated objective/KPI automatically
    } catch (error) {
      submissionLogger.error("Error rejecting submission with item update:", error);
      throw error;
    }
  };

  return {
    updateSubmission,
    handleApproveSubmission,
    handleRejectSubmission,
    handleApproveSubmissionWithItemUpdate,
    handleRejectSubmissionWithItemUpdate,
    loading: updateLoading,
    error: updateError,
  };
};
