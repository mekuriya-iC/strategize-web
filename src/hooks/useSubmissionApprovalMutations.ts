import { useMutation, useQuery } from "@apollo/client";
import { UPDATE_SUBMISSION } from "@/lib/graphql/mutations/submissions";
import {
  GET_PENDING_SUBMISSIONS,
  GET_SUBMISSIONS_BY_STATUS,
} from "@/lib/graphql/queries/submissions";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import { useObjectiveMutations } from "./useObjectiveMutations";
import { useKPIMutations } from "./useKPIMutations";
import type { SubmissionStatus, KpiTargetInput } from "@/types/graphql";

export const useSubmissionApprovalMutations = () => {
  const { updateObjective } = useObjectiveMutations();
  const { updateKpi } = useKPIMutations();

  // Fetch all KPIs and objectives for propagation logic with no cache to ensure fresh data
  const { refetch: refetchKpis } = useQuery(GET_KPIS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "no-cache",
    notifyOnNetworkStatusChange: true,
  });
  const { refetch: refetchObjectives } = useQuery(GET_OBJECTIVES, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "no-cache",
    notifyOnNetworkStatusChange: true,
  });

  // const allKpis = allKpisData?.kpis?.items || [];
  // const allObjectives = allObjectivesData?.objectives?.items || [];

  // Function to propagate quarterly values up the hierarchy
  const propagateQuarterlyValues = async (approvedKpiId: string) => {
    try {
      console.log("🔄 Starting quarterly propagation for KPI:", approvedKpiId);

      // Fetch fresh data before propagation to ensure we have latest values
      console.log("🔄 Fetching fresh data for propagation...");
      const [freshKpisData, freshObjectivesData] = await Promise.all([
        refetchKpis(),
        refetchObjectives(),
      ]);

      const freshKpis = freshKpisData.data?.kpis?.items || [];
      const freshObjectives = freshObjectivesData.data?.objectives?.items || [];

      // Find the approved KPI
      const approvedKpi = freshKpis.find(
        (k: { kpiId: string; objective?: { objectiveId: string } | null }) =>
          k.kpiId === approvedKpiId
      );
      if (!approvedKpi?.objective) {
        console.log("❌ No objective found for approved KPI");
        return;
      }

      // Find the objective and check if it has a parent
      const childObjective = freshObjectives.find(
        (obj: {
          objectiveId: string;
          parent?: { objectiveId: string; name?: string } | null;
        }) => obj.objectiveId === approvedKpi.objective!.objectiveId
      );

      if (!childObjective?.parent) {
        console.log("✅ No parent objective found, propagation complete");
        return;
      }

      console.log("📊 Found parent objective:", childObjective.parent.name);

      // Find all child objectives that inherit from the same parent
      const siblingObjectives = freshObjectives.filter(
        (obj: { parent?: { objectiveId: string } | null }) =>
          obj.parent?.objectiveId === childObjective.parent!.objectiveId
      );

      // Find KPIs for the parent objective
      const parentKpis = freshKpis.filter(
        (k: { objective?: { objectiveId: string } | null }) =>
          k.objective?.objectiveId === childObjective.parent!.objectiveId
      );

      // Find the index of the approved KPI within its objective's KPIs
      const childObjectiveKpis = freshKpis.filter(
        (k: { objective?: { objectiveId: string } | null }) =>
          k.objective?.objectiveId === childObjective.objectiveId
      );
      const kpiIndex = childObjectiveKpis.findIndex(
        (k: { kpiId: string }) => k.kpiId === approvedKpiId
      );

      if (kpiIndex === -1 || !parentKpis[kpiIndex]) {
        console.log("❌ Could not find corresponding parent KPI");
        return;
      }

      const parentKpi = parentKpis[kpiIndex] as {
        kpiId: string;
        name?: string;
        targets?: Array<{ timeline: string; target: number }>;
      };
      console.log("🎯 Updating parent KPI:", parentKpi.name);
      console.log(
        "📊 Current parent targets before aggregation:",
        parentKpi.targets
      );

      // Aggregate quarterly values from all approved child KPIs
      const aggregatedTargets: Record<
        string,
        { q1: number; q2: number; q3: number; q4: number }
      > = {};

      // Initialize with zeros for all years that exist in parent
      const parentYears = Array.from(
        new Set((parentKpi.targets || []).map((t) => t.timeline.split("-")[0]))
      );
      parentYears.forEach((year) => {
        aggregatedTargets[year] = { q1: 0, q2: 0, q3: 0, q4: 0 };
      });

      console.log("🔍 Found sibling objectives:", siblingObjectives.length);

      siblingObjectives.forEach(
        (siblingObj: { objectiveId: string; name?: string }) => {
          const siblingKpis = freshKpis.filter(
            (k: { objective?: { objectiveId: string } | null }) =>
              k.objective?.objectiveId === siblingObj.objectiveId
          );
          const siblingKpi = siblingKpis[kpiIndex] as
            | {
                status?: string;
                targets?: Array<{ timeline: string; target: number }>;
              }
            | undefined; // Same index position

          console.log(`📋 Checking sibling KPI (${siblingObj.name}):`, {
            hasKpi: !!siblingKpi,
            kpiStatus: siblingKpi?.status,
            kpiTargets: siblingKpi?.targets?.length || 0,
          });

          if (siblingKpi?.status === "APPROVED" && siblingKpi.targets) {
            siblingKpi.targets.forEach(
              (target: { timeline: string; target: number }) => {
                const parts = target.timeline.split("-");
                if (parts.length === 2) {
                  const [year, quarter] = parts;
                  if (quarter.startsWith("Q")) {
                    if (!aggregatedTargets[year]) {
                      aggregatedTargets[year] = { q1: 0, q2: 0, q3: 0, q4: 0 };
                    }
                    const quarterNum = quarter.toLowerCase() as
                      | "q1"
                      | "q2"
                      | "q3"
                      | "q4";
                    const targetValue = Number(target.target || 0);
                    aggregatedTargets[year][quarterNum] += targetValue;

                    console.log(
                      `➕ Adding ${targetValue} to ${year}-${quarter.toUpperCase()}`
                    );
                  }
                }
              }
            );
          }
        }
      );

      // Convert aggregated quarters back to target format
      const newTargets: KpiTargetInput[] = [];
      Object.entries(aggregatedTargets).forEach(([year, quarters]) => {
        // 1. Add yearly total entry first
        const yearlyTotal =
          (quarters.q1 || 0) +
          (quarters.q2 || 0) +
          (quarters.q3 || 0) +
          (quarters.q4 || 0);
        if (yearlyTotal > 0) {
          newTargets.push({ timeline: year, target: yearlyTotal });
        }

        // 2. Add individual quarterly entries
        (["q1", "q2", "q3", "q4"] as const).forEach((qKey, idx) => {
          const val = quarters[qKey] || 0;
          if (val > 0) {
            newTargets.push({
              timeline: `${year}-Q${idx + 1}`.toUpperCase(),
              target: val,
            });
          }
        });
      });

      if (newTargets.length > 0) {
        console.log(
          "📝 Updating parent KPI with aggregated targets:",
          newTargets
        );
        console.log("🎯 Parent KPI ID:", parentKpi.kpiId);
        console.log("📊 Aggregated data:", aggregatedTargets);

        // Update the parent KPI with aggregated quarterly values
        await updateKpi({
          input: {
            kpiId: parentKpi.kpiId,
            status: "APPROVED",
            targets: newTargets,
          },
        });

        console.log("✅ Parent KPI updated successfully");

        // Force fresh data after update so UI layers immediately see new totals
        await Promise.all([refetchKpis(), refetchObjectives()]);

        // Add a small delay to ensure the update is processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force another refetch to ensure absolute freshness
        await Promise.all([refetchKpis(), refetchObjectives()]);

        // Recursively propagate to the next level up
        await propagateQuarterlyValues(parentKpi.kpiId);
      } else {
        console.log("⚠️ No targets to aggregate, skipping parent update");
      }
    } catch (error) {
      console.error("❌ Error in quarterly propagation:", error);
    }
  };

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
    reason?: string
  ) => {
    try {
      // Update submission status to APPROVED
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
      console.error("Error approving submission:", error);
      throw error;
    }
  };

  const handleRejectSubmission = async (
    submissionId: string,
    reason?: string
  ) => {
    try {
      // Update submission status to REJECTED
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
      // 1. Update submission status
      await handleApproveSubmission(submission.submissionId, reason);

      // 2. Update linked objective/KPI status
      if (submission.type === "OBJECTIVE" && submission.objective) {
        await updateObjective({
          input: {
            objectiveId: submission.objective.objectiveId,
            status: "APPROVED",
          },
        });
      } else if (submission.type === "KPI" && submission.kpi) {
        await updateKpi({
          input: {
            kpiId: submission.kpi.kpiId,
            status: "APPROVED",
          },
        });

        // 3. Propagate quarterly values up the hierarchy for KPI approvals
        console.log(
          "🔄 Starting quarterly propagation for approved KPI:",
          submission.kpi.kpiId
        );
        await propagateQuarterlyValues(submission.kpi.kpiId);
      }
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
      // 1. Update submission status
      await handleRejectSubmission(submission.submissionId, reason);

      // 2. Update linked objective/KPI status
      if (submission.type === "OBJECTIVE" && submission.objective) {
        await updateObjective({
          input: {
            objectiveId: submission.objective.objectiveId,
            status: "REJECTED",
          },
        });
      } else if (submission.type === "KPI" && submission.kpi) {
        await updateKpi({
          input: {
            kpiId: submission.kpi.kpiId,
            status: "REJECTED",
          },
        });
      }
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
    propagateQuarterlyValues,
    loading: updateLoading,
    error: updateError,
  };
};
