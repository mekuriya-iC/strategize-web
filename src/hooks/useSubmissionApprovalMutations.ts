import { useMutation } from "@apollo/client";
import { UPDATE_SUBMISSION } from "@/lib/graphql/mutations/submissions";
import {
  GET_PENDING_SUBMISSIONS,
  GET_SUBMISSIONS_BY_STATUS,
} from "@/lib/graphql/queries/submissions";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
// Removed unused imports: useObjectiveMutations, useKPIMutations
import type {
  SubmissionStatus,
  SubmissionType,
  SubmissionLevel,
} from "@/types/graphql";

export const useSubmissionApprovalMutations = () => {
  // Removed unused refetchKpis and refetchObjectives variables

  // const allKpis = allKpisData?.kpis?.items || [];
  // const allObjectives = allObjectivesData?.objectives?.items || [];

  const [updateSubmission, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_SUBMISSION, {
      refetchQueries: [
        // Refetch submissions for all types
        {
          query: GET_PENDING_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "CORPORATE" },
        },
        {
          query: GET_PENDING_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "DIVISION" },
        },
        {
          query: GET_PENDING_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "DEPARTMENT" },
        },
        {
          query: GET_PENDING_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "PERSONNEL" },
        },
        {
          query: GET_SUBMISSIONS_BY_STATUS,
          variables: {
            page: 1,
            limit: 10,
            type: "CORPORATE",
            status: "APPROVED",
          },
        },
        {
          query: GET_SUBMISSIONS_BY_STATUS,
          variables: {
            page: 1,
            limit: 10,
            type: "DIVISION",
            status: "APPROVED",
          },
        },
        {
          query: GET_SUBMISSIONS_BY_STATUS,
          variables: {
            page: 1,
            limit: 10,
            type: "DEPARTMENT",
            status: "APPROVED",
          },
        },
        {
          query: GET_SUBMISSIONS_BY_STATUS,
          variables: {
            page: 1,
            limit: 10,
            type: "PERSONNEL",
            status: "APPROVED",
          },
        },
        {
          query: GET_SUBMISSIONS_BY_STATUS,
          variables: {
            page: 1,
            limit: 10,
            type: "CORPORATE",
            status: "REJECTED",
          },
        },
        {
          query: GET_SUBMISSIONS_BY_STATUS,
          variables: {
            page: 1,
            limit: 10,
            type: "DIVISION",
            status: "REJECTED",
          },
        },
        {
          query: GET_SUBMISSIONS_BY_STATUS,
          variables: {
            page: 1,
            limit: 10,
            type: "DEPARTMENT",
            status: "REJECTED",
          },
        },
        {
          query: GET_SUBMISSIONS_BY_STATUS,
          variables: {
            page: 1,
            limit: 10,
            type: "PERSONNEL",
            status: "REJECTED",
          },
        },
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
      // console.log("🔍 HOOK DEBUG - handleApproveSubmission called with:", {
      //   submissionId,
      //   reason: reason || "Approved by approver",
      //   submissionType: submission?.type,
      //   kpiId: submission?.kpi?.kpiId,
      // });

      // For KPI submissions, use updateSubmission with all required fields
      if (submission?.type === "KPI" && submission?.kpi?.kpiId) {
        console.log(
          "🔍 HOOK DEBUG - Using updateSubmission for KPI with itemId:",
          submission.kpi.kpiId
        );

        const result = await updateSubmission({
          variables: {
            input: {
              submissionId,
              status: "APPROVED" as SubmissionStatus,
              reason: reason || "Approved by approver",
              itemId: submission.kpi.kpiId,
              type: "KPI" as SubmissionType,
              level: (
                submission as MinimalSubmission & { level: SubmissionLevel }
              ).level,
            },
          },
        });

        return result.data?.updateSubmission;
      }

      // For objective submissions, use updateSubmission mutation
      console.log(
        "🔍 HOOK DEBUG - Using updateSubmission for objective submission"
      );

      const result = await updateSubmission({
        variables: {
          input: {
            submissionId,
            status: "APPROVED" as SubmissionStatus,
            reason: reason || "Approved by approver",
          },
        },
      });

      console.log("🔍 HOOK DEBUG - updateSubmission result:", result);

      return result.data?.updateSubmission;
    } catch (error) {
      console.error("Error approving submission:", error);
      throw error;
    }
  };

  const handleRejectSubmission = async (
    submissionId: string,
    reason?: string,
    submission?: MinimalSubmission
  ) => {
    try {
      // console.log("🔍 HOOK DEBUG - handleRejectSubmission called with:", {
      //   submissionId,
      //   reason: reason || "Rejected by approver",
      //   submissionType: submission?.type,
      //   kpiId: submission?.kpi?.kpiId,
      // });

      // For KPI submissions, use updateSubmission with all required fields
      if (submission?.type === "KPI" && submission?.kpi?.kpiId) {
        console.log(
          "🔍 HOOK DEBUG - Using updateSubmission for KPI with itemId:",
          submission.kpi.kpiId
        );

        const result = await updateSubmission({
          variables: {
            input: {
              submissionId,
              status: "REJECTED" as SubmissionStatus,
              reason: reason || "Rejected by approver",
              itemId: submission.kpi.kpiId,
              type: "KPI" as SubmissionType,
              level: (
                submission as MinimalSubmission & { level: SubmissionLevel }
              ).level,
            },
          },
        });

        return result.data?.updateSubmission;
      }

      // For objective submissions, use updateSubmission mutation
      console.log(
        "🔍 HOOK DEBUG - Using updateSubmission for objective submission"
      );

      const result = await updateSubmission({
        variables: {
          input: {
            submissionId,
            status: "REJECTED" as SubmissionStatus,
            reason: reason || "Rejected by approver",
          },
        },
      });

      console.log("🔍 HOOK DEBUG - updateSubmission result:", result);

      return result.data?.updateSubmission;
    } catch (error) {
      console.error("Error rejecting submission:", error);
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
      // console.log(
      //   "🔍 HOOK DEBUG - handleApproveSubmissionWithItemUpdate called with:",
      //   {
      //     submissionId: submission.submissionId,
      //     type: submission.type,
      //     reason,
      //   }
      // );

      // Update submission status (this includes the reason and handles both submission + associated item)
      await handleApproveSubmission(
        submission.submissionId,
        reason,
        submission
      );

      // console.log(
      //   "🔍 HOOK DEBUG - handleApproveSubmission completed successfully"
      // );

      // The backend handles updating the associated objective/KPI automatically
      // No need for separate updateObjective or updateKpi calls
    } catch (error) {
      console.error("Error approving submission with item update:", error);
      throw error;
    }
  };

  const handleRejectSubmissionWithItemUpdate = async (
    submission: MinimalSubmission,
    reason?: string
  ) => {
    try {
      // console.log(
      //   "🔍 HOOK DEBUG - handleRejectSubmissionWithItemUpdate called with:",
      //   {
      //     submissionId: submission.submissionId,
      //     type: submission.type,
      //     reason,
      //   }
      // );

      // Update submission status (this includes the reason and handles both submission + associated item)
      await handleRejectSubmission(submission.submissionId, reason, submission);

      // console.log(
      //   "🔍 HOOK DEBUG - handleRejectSubmission completed successfully"
      // );

      // The backend handles updating the associated objective/KPI automatically
      // No need for separate updateObjective or updateKpi calls
    } catch (error) {
      console.error("Error rejecting submission with item update:", error);
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
