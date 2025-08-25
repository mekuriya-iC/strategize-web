import { useQuery } from "@apollo/client";
import {
  GET_PENDING_SUBMISSIONS,
  GET_KPI_SUBMISSIONS,
} from "@/lib/graphql/queries/submissions";
import type { SubmissionStatus } from "@/types/graphql";
import { useUser } from "@/context/UserContext";
import { useOrgUnit } from "@/context/OrgUnitContext";

interface UseSubmissionApprovalsOptions {
  page?: number;
  limit?: number;
  approverRole: "CORPORATE" | "DIVISION" | "DEPARTMENT"; // Who is doing the approving
  status?: SubmissionStatus;
}

// Helper function to group KPI submissions under their parent objectives
type MinimalSubmission = {
  submissionId: string;
  type: "OBJECTIVE" | "KPI";
  level: "DEPARTMENT" | "DIVISION" | "PERSONNEL";
  status: SubmissionStatus;
  reason?: string;
  submittedBy: { fullName: string };
  objective?: {
    objectiveId: string;
    name?: string;
    type?: string;
    status?: string;
    kpis?: Array<{
      kpiId: string;
      name: string;
      status: string;
      weight: number;
      baseline: number;
    }>;
  } | null;
  kpi?: {
    kpiId: string;
    name?: string;
    objective?: { objectiveId: string } | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

const groupSubmissionsByObjective = (submissions: MinimalSubmission[]) => {
  const objectiveSubmissions = submissions.filter(
    (s) => s.type === "OBJECTIVE"
  );
  const kpiSubmissions = submissions.filter((s) => s.type === "KPI");

  console.log("🔍 GROUPING DEBUG - Input data:", {
    totalSubmissions: submissions.length,
    objectiveSubmissions: objectiveSubmissions.length,
    kpiSubmissions: kpiSubmissions.length,
  });

  // Create a map to group KPI submissions by their objective ID
  const kpisByObjective: { [objectiveId: string]: MinimalSubmission[] } = {};

  kpiSubmissions.forEach((kpiSubmission) => {
    // Prefer nested reference; fall back to top-level objective linkage if provided by API
    const nestedObjectiveId = kpiSubmission.kpi?.objective?.objectiveId;
    const topLevelObjectiveId = kpiSubmission.objective?.objectiveId;
    const objectiveId = nestedObjectiveId || topLevelObjectiveId;

    console.log("🔍 GROUPING DEBUG - Processing KPI submission:", {
      kpiSubmissionId: kpiSubmission.submissionId,
      kpiId: kpiSubmission.kpi?.kpiId,
      nestedObjectiveId,
      topLevelObjectiveId,
      finalObjectiveId: objectiveId,
    });

    if (objectiveId) {
      if (!kpisByObjective[objectiveId]) {
        kpisByObjective[objectiveId] = [];
      }
      kpisByObjective[objectiveId].push(kpiSubmission);
    }
  });

  console.log("🔍 GROUPING DEBUG - KPI grouping result:", {
    kpisByObjective: Object.keys(kpisByObjective).map((key) => ({
      objectiveId: key,
      kpiCount: kpisByObjective[key].length,
      kpiIds: kpisByObjective[key].map((k) => k.kpi?.kpiId),
    })),
  });

  // Enhance objective submissions with their associated KPI submissions
  const groupedSubmissions = objectiveSubmissions.map((objSubmission) => {
    const objectiveId = objSubmission.objective?.objectiveId;
    const associatedKpiSubmissions = objectiveId
      ? kpisByObjective[objectiveId] || []
      : [];

    console.log("🔍 GROUPING DEBUG - Grouping objective:", {
      objectiveId,
      objectiveName: objSubmission.objective?.name,
      associatedKpiCount: associatedKpiSubmissions.length,
    });

    return {
      ...objSubmission,
      associatedKpiSubmissions,
      kpiSubmissionCount: associatedKpiSubmissions.length,
    };
  });

  console.log("🔍 GROUPING DEBUG - Final result:", {
    groupedSubmissionsCount: groupedSubmissions.length,
    groupedSubmissions: groupedSubmissions.map((gs) => ({
      objectiveId: gs.objective?.objectiveId,
      objectiveName: gs.objective?.name,
      kpiCount: gs.kpiSubmissionCount,
    })),
  });

  return groupedSubmissions;
};

export const useSubmissionApprovals = ({
  page = 1,
  limit = 10,
  approverRole,
  status,
}: UseSubmissionApprovalsOptions) => {
  const { user } = useUser();
  const { selectedUnit } = useOrgUnit();

  // Determine what submission types this approver should see
  const getSubmissionTypesToFetch = () => {
    switch (approverRole) {
      case "CORPORATE":
        // Corporate sees submissions FROM divisions and departments
        return ["DIVISION", "DEPARTMENT"];
      case "DIVISION":
        // Division managers see submissions FROM departments under their division and personnel
        return ["DEPARTMENT", "PERSONNEL"];
      case "DEPARTMENT":
        // Department managers see submissions FROM personnel under their department
        return ["PERSONNEL"];
      default:
        return [];
    }
  };

  const submissionTypes = getSubmissionTypesToFetch();

  // FIXED: Use separate queries for objectives and KPIs to get real KPI submissions
  // Use the submissionTypes array to determine what to query
  const queryTypes =
    submissionTypes.length > 0 ? submissionTypes : ["DIVISION"];

  console.log("🔍 QUERY DEBUG - Making queries with variables:", {
    userRole: user?.role,
    selectedUnit: selectedUnit?.__typename,
    submissionTypes,
    queryTypes,
    objectiveQuery: { page: 1, limit: 1000, type: queryTypes[0] },
    kpiQuery: {
      page: 1,
      limit: 1000,
      type: queryTypes[0],
      submissionType: "KPI",
    },
  });

  // Only make queries if user context is loaded
  // For SUPER_ADMIN and ADMIN users, we don't need selectedUnit
  const shouldMakeQueries =
    user &&
    (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || selectedUnit);

  console.log("🔍 USER CONTEXT DEBUG:", {
    user: !!user,
    userRole: user?.role,
    selectedUnit: !!selectedUnit,
    selectedUnitType: selectedUnit?.__typename,
    shouldMakeQueries,
  });

  const {
    data: objectiveData,
    loading: objectiveLoading,
    error: objectiveError,
    refetch: objectiveRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: queryTypes[0] },
    fetchPolicy: "cache-and-network",
    skip: !shouldMakeQueries, // Skip query if user context not loaded
    onError: (error) => {
      console.error("Objective submission query error:", {
        error: error.message,
      });
    },
  });

  const {
    data: kpiData,
    loading: kpiLoading,
    error: kpiError,
    refetch: kpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: queryTypes[0] },
    fetchPolicy: "cache-and-network",
    skip: !shouldMakeQueries, // Skip query if user context not loaded
    onError: (error) => {
      console.error("KPI submission query error:", {
        error: error.message,
      });
    },
  });

  // Get all submissions from both queries
  const objectiveSubmissions =
    (objectiveData?.submissions?.items as MinimalSubmission[]) || [];
  const kpiSubmissions =
    (kpiData?.submissions?.items as MinimalSubmission[]) || [];
  const allSubmissions = [...objectiveSubmissions, ...kpiSubmissions];

  // CRITICAL DEBUG: Log raw query results
  console.log("🚨 RAW QUERY RESULTS:", {
    objectiveSubmissions: objectiveSubmissions.map((s) => ({
      submissionId: s.submissionId,
      type: s.type,
      status: s.status,
      reason: s.reason,
    })),
    kpiSubmissions: kpiSubmissions.map((s) => ({
      submissionId: s.submissionId,
      type: s.type,
      status: s.status,
      reason: s.reason,
      kpiId: s.kpi?.kpiId,
    })),
    objectiveCount: objectiveSubmissions.length,
    kpiCount: kpiSubmissions.length,
    totalCount: allSubmissions.length,
    // Check if we're only getting PENDING submissions
    statusBreakdown: {
      objectives: objectiveSubmissions.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      kpis: kpiSubmissions.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
  });

  // Check if the problematic submission ID exists in the raw results
  const targetSubmissionId = "8d6439e2-84a9-4f7c-9e69-89fc30e164ee";
  const foundInObjectives = objectiveSubmissions.find(
    (s) => s.submissionId === targetSubmissionId
  );
  const foundInKPIs = kpiSubmissions.find(
    (s) => s.submissionId === targetSubmissionId
  );

  console.log("🔍 TARGET SUBMISSION DEBUG:", {
    targetSubmissionId,
    foundInObjectives: foundInObjectives
      ? {
          submissionId: foundInObjectives.submissionId,
          type: foundInObjectives.type,
          status: foundInObjectives.status,
          level: foundInObjectives.level,
        }
      : null,
    foundInKPIs: foundInKPIs
      ? {
          submissionId: foundInKPIs.submissionId,
          type: foundInKPIs.type,
          status: foundInKPIs.status,
          level: foundInKPIs.level,
          kpiId: foundInKPIs.kpi?.kpiId,
        }
      : null,
  });

  // Remove duplicates based on submissionId
  const uniqueSubmissions = allSubmissions.filter(
    (submission, index, self) =>
      index ===
      self.findIndex((s) => s.submissionId === submission.submissionId)
  );

  console.log("🚨 AFTER DEDUPLICATION:", {
    originalCount: allSubmissions.length,
    uniqueCount: uniqueSubmissions.length,
    duplicatesRemoved: allSubmissions.length - uniqueSubmissions.length,
  });

  const loadingState = objectiveLoading || kpiLoading;
  const errorState = objectiveError || kpiError;

  // Filter submissions based on organizational hierarchy
  console.log("🔍 FILTERING DEBUG - Before filtering:", {
    totalSubmissions: uniqueSubmissions.length,
    approverRole,
    selectedUnit: selectedUnit?.__typename,
    submissionsByLevel: uniqueSubmissions.reduce((acc, s) => {
      acc[s.level] = (acc[s.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  });

  const filteredSubmissions = uniqueSubmissions.filter((submission) => {
    const shouldInclude = (() => {
      if (approverRole === "CORPORATE") {
        // Corporate approves all division and department submissions
        return ["DIVISION", "DEPARTMENT"].includes(submission.level);
      }

      if (
        approverRole === "DIVISION" &&
        selectedUnit?.__typename === "Division"
      ) {
        // Division managers approve submissions from departments under their division and personnel
        // TODO: Add proper filtering based on organizational hierarchy
        return ["DEPARTMENT", "PERSONNEL"].includes(submission.level);
      }

      if (
        approverRole === "DEPARTMENT" &&
        selectedUnit?.__typename === "Department"
      ) {
        // Department managers approve submissions from personnel under their department
        // TODO: Add proper filtering based on organizational hierarchy
        return submission.level === "PERSONNEL";
      }

      return false;
    })();

    // Special debug for the target submission
    if (submission.submissionId === "8d6439e2-84a9-4f7c-9e69-89fc30e164ee") {
      console.log("🔍 TARGET SUBMISSION FILTER DEBUG:", {
        submissionId: submission.submissionId,
        type: submission.type,
        level: submission.level,
        approverRole,
        selectedUnit: selectedUnit?.__typename,
        shouldInclude,
        reason: shouldInclude ? "INCLUDED" : "EXCLUDED by level filter",
      });
    }

    console.log("🔍 FILTERING DEBUG - Submission filter result:", {
      submissionId: submission.submissionId,
      type: submission.type,
      level: submission.level,
      approverRole,
      selectedUnit: selectedUnit?.__typename,
      shouldInclude,
    });

    return shouldInclude;
  });

  console.log("🔍 FILTERING DEBUG - After filtering:", {
    totalSubmissions: filteredSubmissions.length,
    submissionsByLevel: filteredSubmissions.reduce((acc, s) => {
      acc[s.level] = (acc[s.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  });

  // Apply status filter – handle both OBJECTIVE and KPI submissions
  console.log("🔍 STATUS FILTER DEBUG - Before status filtering:", {
    status,
    totalSubmissions: filteredSubmissions.length,
    objectiveSubmissions: filteredSubmissions.filter(
      (s) => s.type === "OBJECTIVE"
    ).length,
    kpiSubmissions: filteredSubmissions.filter((s) => s.type === "KPI").length,
  });

  let objectivesForGrouping: MinimalSubmission[];
  if (status) {
    const objectiveSubs = filteredSubmissions.filter(
      (s) => s.type === "OBJECTIVE"
    );
    const kpiSubs = filteredSubmissions.filter((s) => s.type === "KPI");

    const filteredObjectiveSubs = objectiveSubs.filter(
      (s) => s.status === status
    );
    const filteredKpiSubs = kpiSubs.filter((s) => s.status === status);

    objectivesForGrouping = [
      ...filteredObjectiveSubs,
      ...filteredKpiSubs, // Filter KPI submissions by status too
    ];

    console.log("🔍 STATUS FILTER DEBUG - After status filtering:", {
      status,
      originalObjectiveSubs: objectiveSubs.length,
      filteredObjectiveSubs: filteredObjectiveSubs.length,
      originalKpiSubs: kpiSubs.length,
      filteredKpiSubs: filteredKpiSubs.length,
      totalForGrouping: objectivesForGrouping.length,
    });
  } else {
    objectivesForGrouping = filteredSubmissions;
    console.log("🔍 STATUS FILTER DEBUG - No status filter applied:", {
      totalForGrouping: objectivesForGrouping.length,
    });
  }

  // Debug: Log the submissions by type
  console.log("useSubmissionApprovals - Submissions by type:", {
    total: filteredSubmissions.length,
    objectives: filteredSubmissions.filter((s) => s.type === "OBJECTIVE")
      .length,
    kpis: filteredSubmissions.filter((s) => s.type === "KPI").length,
    kpiSubmissions: filteredSubmissions
      .filter((s) => s.type === "KPI")
      .map((s) => ({
        submissionId: s.submissionId,
        status: s.status,
        reason: s.reason,
        kpiId: s.kpi?.kpiId,
        kpiName: s.kpi?.name,
        nestedObjectiveId: s.kpi?.objective?.objectiveId,
        topLevelObjectiveId: s.objective?.objectiveId,
        fullKpiSubmission: s,
      })),
  });

  // CRITICAL DEBUG: Log ALL submissions to see their type field
  console.log(
    "🚨 CRITICAL DEBUG - All submissions with type field:",
    filteredSubmissions.map((s) => ({
      submissionId: s.submissionId,
      type: s.type,
      level: s.level,
      status: s.status,
      reason: s.reason,
      hasObjective: !!s.objective,
      hasKpi: !!s.kpi,
      objectiveId: s.objective?.objectiveId,
      kpiId: s.kpi?.kpiId,
      fullSubmission: s,
    }))
  );

  // Group submissions: combine KPI submissions with their parent objectives
  const groupedSubmissions = groupSubmissionsByObjective(objectivesForGrouping);

  // After grouping, we may still want to hide objective rows that had been filtered out by status (no KPI children)
  // (already handled because they won't appear in objectivesForGrouping)

  // Calculate pagination for filtered results
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedSubmissions = groupedSubmissions.slice(startIndex, endIndex);

  const meta = {
    currentPage: page,
    itemCount: paginatedSubmissions.length,
    itemsPerPage: limit,
    totalItems: groupedSubmissions.length,
    totalPages: Math.ceil(groupedSubmissions.length / limit),
  };

  // Debug logging
  console.log("useSubmissionApprovals Debug:", {
    queryVariables: { page, limit, approverRole, status },
    userRole: user?.role,
    selectedUnit: selectedUnit?.__typename,
    submissionTypesToFetch: submissionTypes,
    allSubmissionsCount: allSubmissions.length,
    uniqueSubmissionsCount: uniqueSubmissions.length,
    filteredSubmissionsCount: filteredSubmissions.length,
    objectivesForGroupingCount: objectivesForGrouping.length,
    groupedSubmissionsCount: groupedSubmissions.length,
    submissionsByType: {
      objectives: filteredSubmissions.filter((s) => s.type === "OBJECTIVE")
        .length,
      kpis: filteredSubmissions.filter((s) => s.type === "KPI").length,
    },
    submissionsByLevel: {
      division: filteredSubmissions.filter((s) => s.level === "DIVISION")
        .length,
      department: filteredSubmissions.filter((s) => s.level === "DEPARTMENT")
        .length,
      personnel: filteredSubmissions.filter((s) => s.level === "PERSONNEL")
        .length,
    },
    groupedSubmissionsWithKpis: groupedSubmissions.map((gs) => ({
      objectiveId: gs.objective?.objectiveId,
      objectiveName: gs.objective?.name,
      kpiCount: gs.kpiSubmissionCount,
      kpiSubmissions: gs.associatedKpiSubmissions?.map((kpi) => kpi.kpi?.name),
    })),
  });

  const refetchFunction = () => {
    console.log("🔄 REFETCH DEBUG - Starting refetch...");
    console.log("🔄 REFETCH DEBUG - Current data:", {
      objectiveCount: objectiveSubmissions.length,
      kpiCount: kpiSubmissions.length,
    });

    objectiveRefetch().then(() => {
      console.log("🔄 REFETCH DEBUG - Objective refetch completed");
    });
    kpiRefetch().then(() => {
      console.log("🔄 REFETCH DEBUG - KPI refetch completed");
    });
  };

  return {
    submissions: paginatedSubmissions,
    meta,
    loading: loadingState,
    error: errorState?.message,
    refetch: refetchFunction,
  };
};
