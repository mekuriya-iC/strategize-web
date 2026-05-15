import {
  CREATE_SUBMISSION,
  UPDATE_SUBMISSION,
} from "@/lib/graphql/mutations/submissions";
import {
  GET_SUBMISSIONS,
  GET_KPI_SUBMISSIONS,
  GET_PENDING_SUBMISSIONS,
} from "@/lib/graphql/queries/submissions";
import {
  GET_OBJECTIVES,
  GET_OBJECTIVE,
} from "@/lib/graphql/queries/objectives";
import { GET_KPIS, GET_KPI } from "@/lib/graphql/queries/kpis";
import { UPDATE_OBJECTIVE } from "@/lib/graphql/mutations/objectives";
import { UPDATE_KPI } from "@/lib/graphql/mutations/kpis";
import { submissionLogger } from "@/lib/logger";
import {
  kpiSubmissionsQueryVariables,
  objectiveSubmissionsQueryVariables,
} from "@/hooks/submissions/submissionQueryVariables";

const SUBMISSION_INBOX_TYPES = [
  "CORPORATE",
  "DIVISION",
  "DEPARTMENT",
  "PERSONNEL",
] as const;

function submissionInboxRefetchQueries(limit = 1000) {
  return [
    ...SUBMISSION_INBOX_TYPES.flatMap((type) => [
      {
        query: GET_SUBMISSIONS,
        variables: { ...objectiveSubmissionsQueryVariables(type), limit },
      },
      {
        query: GET_KPI_SUBMISSIONS,
        variables: { ...kpiSubmissionsQueryVariables(type), limit },
      },
      {
        query: GET_PENDING_SUBMISSIONS,
        variables: { ...objectiveSubmissionsQueryVariables(type), limit },
      },
    ]),
  ];
}

interface SubmissionData {
  [key: string]: unknown;
}

interface Submission {
  submissionId: string;
  type: string;
  status: string;
  kpi?: { kpiId: string; name?: string };
  objective?: { objectiveId: string; name?: string };
}

export interface ApolloClient {
  query: (options: {
    query: unknown;
    variables: Record<string, unknown>;
    fetchPolicy: string;
  }) => Promise<{ data: { submissions?: { items?: unknown[] } } }>;
  mutate: (options: {
    mutation: unknown;
    variables: Record<string, unknown>;
    refetchQueries?: Array<{
      query: unknown;
      variables: Record<string, unknown>;
    }>;
    fetchPolicy?: string;
  }) => Promise<{ data: Record<string, unknown> }>;
  refetchQueries?: (options: {
    include: Array<{ query: unknown; variables: Record<string, unknown> }>;
  }) => Promise<unknown>;
}

export async function handleSmartSubmission({
  submissionType,
  itemId,
  submissionData,
  reason,
  client,
  userRole,
}: {
  submissionType: "KPI" | "OBJECTIVE";
  itemId: string;
  submissionData: SubmissionData;
  reason: string;
  client: ApolloClient;
  userRole?: string;
}) {
  try {
    // Check if user is SUPER_ADMIN or ADMIN for auto-approval
    const shouldAutoApprove = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
    
    submissionLogger.debug("Submission initiated", {
      submissionType,
      itemId,
      userRole,
      shouldAutoApprove,
    });

    // If SUPER_ADMIN or ADMIN, directly approve the item without creating submission
    if (shouldAutoApprove) {
      submissionLogger.debug("Auto-approving for SUPER_ADMIN/ADMIN");

      // Update the item status directly to APPROVED
      if (submissionType === "OBJECTIVE") {
        try {
          await client.mutate({
            mutation: UPDATE_OBJECTIVE,
            variables: {
              input: {
                objectiveId: itemId,
                status: "APPROVED",
              },
            },
            fetchPolicy: "network-only",
            refetchQueries: [
              { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
              { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
              { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
              { query: GET_OBJECTIVES, variables: { page: 1, limit: 1000 } },
              { query: GET_OBJECTIVE, variables: { objectiveId: itemId } },
            ],
          });
          submissionLogger.debug("Objective auto-approved by SUPER_ADMIN/ADMIN");
          
          return {
            data: {
              autoApproved: true,
              type: submissionType,
              itemId,
            },
          };
        } catch (error) {
          submissionLogger.error("Failed to auto-approve objective:", error);
          throw error;
        }
      }

      if (submissionType === "KPI") {
        try {
          await client.mutate({
            mutation: UPDATE_KPI,
            variables: {
              input: {
                kpiId: itemId,
                status: "APPROVED",
              },
            },
            fetchPolicy: "network-only",
            refetchQueries: [
              { query: GET_KPIS, variables: { page: 1, limit: 10 } },
              { query: GET_KPIS, variables: { page: 1, limit: 20 } },
              { query: GET_KPIS, variables: { page: 1, limit: 50 } },
              { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
              { query: GET_KPI, variables: { kpiId: itemId } },
            ],
          });
          submissionLogger.debug("KPI auto-approved by SUPER_ADMIN/ADMIN");
          
          return {
            data: {
              autoApproved: true,
              type: submissionType,
              itemId,
            },
          };
        } catch (error) {
          submissionLogger.error("Failed to auto-approve KPI:", error);
          throw error;
        }
      }
    }

    // For non-admin users, proceed with normal submission workflow
    // 1. Fetch existing submissions using the SAME queries as the objectives page
    const allSubmissions: Submission[] = [];

    // Fetch KPI submissions (same as objectives page)
    for (const type of SUBMISSION_INBOX_TYPES) {
      try {
        const { data } = await client.query({
          query: GET_KPI_SUBMISSIONS,
          variables: kpiSubmissionsQueryVariables(type),
          fetchPolicy: "network-only",
        });

        if (data?.submissions?.items) {
          allSubmissions.push(...(data.submissions.items as Submission[]));
        }
      } catch (error) {
        submissionLogger.warn(`Failed to fetch KPI submissions for type ${type}:`, error);
      }
    }

    // Fetch objective submissions (GET_PENDING_SUBMISSIONS)
    for (const type of SUBMISSION_INBOX_TYPES) {
      try {
        const { data } = await client.query({
          query: GET_PENDING_SUBMISSIONS,
          variables: objectiveSubmissionsQueryVariables(type),
          fetchPolicy: "network-only",
        });

        if (data?.submissions?.items) {
          allSubmissions.push(...(data.submissions.items as Submission[]));
        }
      } catch (error) {
        submissionLogger.warn(`Failed to fetch objective submissions for type ${type}:`, error);
      }
    }

    const existingSubmissions = allSubmissions;

    submissionLogger.debug("Existing submissions for matching:", 
      existingSubmissions.map((s: Submission) => ({
        submissionId: s.submissionId,
        type: s.type,
        status: s.status,
        kpiId: s.kpi?.kpiId,
        objectiveId: s.objective?.objectiveId,
      }))
    );

    submissionLogger.debug("Looking for:", { submissionType, itemId, status: "REJECTED" });

    // 2. Find existing submission to update (REJECTED for both, APPROVED for KPIs only)
    const existingSubmission = existingSubmissions.find((sub: Submission) => {
      // For KPIs: Check both REJECTED and APPROVED status (two-phase approval)
      if (submissionType === "KPI" && sub.kpi && sub.kpi.kpiId === itemId) {
        if (sub.status === "REJECTED" || sub.status === "APPROVED") {
          submissionLogger.debug("Found existing KPI submission:", {
            submissionId: sub.submissionId,
            kpiId: sub.kpi.kpiId,
            type: sub.type,
            status: sub.status,
          });
          return true;
        }
      }

      // For OBJECTIVE submissions: Only check REJECTED status
      if (
        submissionType === "OBJECTIVE" &&
        sub.objective &&
        sub.objective.objectiveId === itemId
      ) {
        if (sub.status === "REJECTED") {
          submissionLogger.debug("Found rejected OBJECTIVE submission:", {
            submissionId: sub.submissionId,
            objectiveId: sub.objective.objectiveId,
            type: sub.type,
            status: sub.status,
          });
          return true;
        }
      }

      return false;
    });

    // 3. Update or Create
    if (existingSubmission) {
      submissionLogger.debug("Updating existing submission", {
        submissionId: existingSubmission.submissionId,
        type: submissionType,
        itemId,
        currentStatus: existingSubmission.status,
      });

      // Update submission status
      const submissionResult = await client.mutate({
        mutation: UPDATE_SUBMISSION,
        variables: {
          input: {
            submissionId: existingSubmission.submissionId,
            status: "PENDING",
            reason: reason,
          },
        },
        fetchPolicy: "network-only",
        refetchQueries: [
          ...submissionInboxRefetchQueries(1000),
          ...submissionInboxRefetchQueries(10),
          // Refetch objectives and KPIs
          { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
          { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
          { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
          { query: GET_OBJECTIVES, variables: { page: 1, limit: 1000 } },
          { query: GET_KPIS, variables: { page: 1, limit: 10 } },
          { query: GET_KPIS, variables: { page: 1, limit: 20 } },
          { query: GET_KPIS, variables: { page: 1, limit: 50 } },
          { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
          { query: GET_OBJECTIVE, variables: { objectiveId: itemId } },
          { query: GET_KPI, variables: { kpiId: itemId } },
        ],
      });

      submissionLogger.debug("Submission status updated to PENDING");

      // Also update objective/KPI status
      if (submissionType === "OBJECTIVE") {
        try {
          await client.mutate({
            mutation: UPDATE_OBJECTIVE,
            variables: {
              input: {
                objectiveId: itemId,
                status: "PENDING",
              },
            },
            fetchPolicy: "network-only",
            refetchQueries: [
              { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
              { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
              { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
              { query: GET_OBJECTIVES, variables: { page: 1, limit: 1000 } },
              { query: GET_OBJECTIVE, variables: { objectiveId: itemId } },
            ],
          });
          submissionLogger.debug("Objective status updated to PENDING");
        } catch (error) {
          submissionLogger.warn("Failed to update objective status:", error);
        }
      }

      if (submissionType === "KPI") {
        try {
          await client.mutate({
            mutation: UPDATE_KPI,
            variables: {
              input: {
                kpiId: itemId,
                status: "PENDING",
              },
            },
            fetchPolicy: "network-only",
            refetchQueries: [
              { query: GET_KPIS, variables: { page: 1, limit: 10 } },
              { query: GET_KPIS, variables: { page: 1, limit: 20 } },
              { query: GET_KPIS, variables: { page: 1, limit: 50 } },
              { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
              { query: GET_KPI, variables: { kpiId: itemId } },
            ],
          });
          submissionLogger.debug("KPI status updated to PENDING");
        } catch (error) {
          submissionLogger.error("Failed to update KPI status:", error);
        }
      }

      // Force cache invalidation for better UI updates
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));

        try {
          for (const type of SUBMISSION_INBOX_TYPES) {
            await client.query({
              query: GET_PENDING_SUBMISSIONS,
              variables: objectiveSubmissionsQueryVariables(type),
              fetchPolicy: "network-only",
            });
            await client.query({
              query: GET_KPI_SUBMISSIONS,
              variables: kpiSubmissionsQueryVariables(type),
              fetchPolicy: "network-only",
            });
          }
        } catch (cacheError) {
          submissionLogger.warn("Cache invalidation error:", cacheError);
        }

        if (client.refetchQueries) {
          await client.refetchQueries({
            include: [
              { query: GET_OBJECTIVE, variables: { objectiveId: itemId } },
              { query: GET_KPI, variables: { kpiId: itemId } },
            ],
          });
        }
      } catch (error) {
        submissionLogger.warn("Cache refetch failed:", error);
      }

      return submissionResult;
    } else {
      submissionLogger.debug("Creating new submission", { type: submissionType, itemId });

      return client.mutate({
        mutation: CREATE_SUBMISSION,
        variables: { input: submissionData },
        fetchPolicy: "network-only",
        refetchQueries: [
          ...submissionInboxRefetchQueries(1000),
          { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
          { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
          { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
          { query: GET_OBJECTIVES, variables: { page: 1, limit: 1000 } },
          { query: GET_KPIS, variables: { page: 1, limit: 10 } },
          { query: GET_KPIS, variables: { page: 1, limit: 20 } },
          { query: GET_KPIS, variables: { page: 1, limit: 50 } },
          { query: GET_KPIS, variables: { page: 1, limit: 1000 } },
          { query: GET_OBJECTIVE, variables: { objectiveId: itemId } },
          { query: GET_KPI, variables: { kpiId: itemId } },
        ],
      });
    }
  } catch (error) {
    submissionLogger.error("Smart submission error:", error);
    throw error;
  }
}
