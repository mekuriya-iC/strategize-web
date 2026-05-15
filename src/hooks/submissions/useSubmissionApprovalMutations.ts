import { useMutation } from "@apollo/client";
import {
  APPROVE_OBJECTIVE_WITH_KPIS,
  UPDATE_SUBMISSION,
} from "@/lib/graphql/mutations/submissions";
import {
  GET_KPI_SUBMISSIONS,
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
import {
  kpiSubmissionsQueryVariables,
  objectiveSubmissionsQueryVariables,
} from "./submissionQueryVariables";

const submissionTypes = ["CORPORATE", "DIVISION", "DEPARTMENT", "PERSONNEL"] as const;

const pendingSubmissionRefetchQueries = [
  ...submissionTypes.map((type) => ({
    query: GET_PENDING_SUBMISSIONS,
    variables: objectiveSubmissionsQueryVariables(type),
  })),
  ...submissionTypes.map((type) => ({
    query: GET_KPI_SUBMISSIONS,
    variables: kpiSubmissionsQueryVariables(type),
  })),
  ...submissionTypes.map((type) => ({
    query: GET_SUBMISSIONS_BY_STATUS,
    variables: objectiveSubmissionsQueryVariables(type),
  })),
  { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
  { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
  { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
  { query: GET_KPIS, variables: { page: 1, limit: 10 } },
  { query: GET_KPIS, variables: { page: 1, limit: 20 } },
  { query: GET_KPIS, variables: { page: 1, limit: 50 } },
];

export const useSubmissionApprovalMutations = () => {
  const [updateSubmission, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_SUBMISSION, {
      onCompleted: () => {
        // Invalidate approval-related caches
        invalidateAfterMutation.approval();
      },
      refetchQueries: pendingSubmissionRefetchQueries,
    });

  const [approveObjectiveWithKpisMutation, { loading: bulkApproveLoading }] =
    useMutation(APPROVE_OBJECTIVE_WITH_KPIS, {
      onCompleted: () => {
        invalidateAfterMutation.approval();
      },
      refetchQueries: pendingSubmissionRefetchQueries,
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

  const handleApproveObjectiveWithKpis = async (
    objectiveSubmissionId: string,
    reason?: string,
    kpiSubmissionIds?: string[]
  ) => {
    try {
      const result = await approveObjectiveWithKpisMutation({
        variables: {
          input: {
            objectiveSubmissionId,
            reason: reason || "Approved by approver",
            ...(kpiSubmissionIds && kpiSubmissionIds.length > 0
              ? { kpiSubmissionIds }
              : {}),
          },
        },
      });
      return result.data?.approveObjectiveWithKpis;
    } catch (error) {
      submissionLogger.error("Error bulk-approving objective with KPIs:", error);
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
    handleApproveObjectiveWithKpis,
    handleRejectSubmission,
    handleApproveSubmissionWithItemUpdate,
    handleRejectSubmissionWithItemUpdate,
    loading: updateLoading || bulkApproveLoading,
    error: updateError,
  };
};
