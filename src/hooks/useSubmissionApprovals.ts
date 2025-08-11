import { useQuery } from "@apollo/client";
import { GET_PENDING_SUBMISSIONS } from "@/lib/graphql/queries/submissions";
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
  objective?: { objectiveId: string; name?: string } | null;
  kpi?: {
    kpiId: string;
    name?: string;
    objective?: { objectiveId: string } | null;
  } | null;
};

const groupSubmissionsByObjective = (submissions: MinimalSubmission[]) => {
  const objectiveSubmissions = submissions.filter(
    (s) => s.type === "OBJECTIVE"
  );
  const kpiSubmissions = submissions.filter((s) => s.type === "KPI");

  // Create a map to group KPI submissions by their objective ID
  const kpisByObjective: { [objectiveId: string]: MinimalSubmission[] } = {};

  kpiSubmissions.forEach((kpiSubmission) => {
    // Prefer nested reference; fall back to top-level objective linkage if provided by API
    const nestedObjectiveId = kpiSubmission.kpi?.objective?.objectiveId;
    const topLevelObjectiveId = kpiSubmission.objective?.objectiveId;
    const objectiveId = nestedObjectiveId || topLevelObjectiveId;

    if (objectiveId) {
      if (!kpisByObjective[objectiveId]) {
        kpisByObjective[objectiveId] = [];
      }
      kpisByObjective[objectiveId].push(kpiSubmission);
    }
  });

  // Enhance objective submissions with their associated KPI submissions
  const groupedSubmissions = objectiveSubmissions.map((objSubmission) => {
    const objectiveId = objSubmission.objective?.objectiveId;
    const associatedKpiSubmissions = objectiveId
      ? kpisByObjective[objectiveId] || []
      : [];

    return {
      ...objSubmission,
      associatedKpiSubmissions,
      kpiSubmissionCount: associatedKpiSubmissions.length,
    };
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

  // IMPORTANT: Hooks must be called in the same order every render.
  // Never create a dynamic number of useQuery calls.
  // Query all relevant types consistently, then filter client-side.
  // We need to fetch both OBJECTIVE and KPI submissions for each type
  const qDivision = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DIVISION" },
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.error("Submission approval query error for type DIVISION:", {
        error: error.message,
      });
    },
  });
  const qDepartment = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DEPARTMENT" },
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.error("Submission approval query error for type DEPARTMENT:", {
        error: error.message,
      });
    },
  });
  const qPersonnel = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "PERSONNEL" },
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.error("Submission approval query error for type PERSONNEL:", {
        error: error.message,
      });
    },
  });

  const queries = [qDivision, qDepartment, qPersonnel];

  // Combine all submissions from different types
  const allSubmissions = queries.reduce((acc, query) => {
    return [
      ...acc,
      ...((query.data?.submissions?.items as MinimalSubmission[]) || []),
    ];
  }, [] as MinimalSubmission[]);

  const loading = queries.some((query) => query.loading);
  const error = queries.find((query) => query.error)?.error;

  // Filter submissions based on organizational hierarchy
  const filteredSubmissions = allSubmissions.filter((submission) => {
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
  });

  // Apply status filter – ONLY to OBJECTIVE submissions so their KPI children still appear
  let objectivesForGrouping: MinimalSubmission[];
  if (status) {
    const objectiveSubs = filteredSubmissions.filter(
      (s) => s.type === "OBJECTIVE"
    );
    const kpiSubs = filteredSubmissions.filter((s) => s.type === "KPI");
    objectivesForGrouping = [
      ...objectiveSubs.filter((s) => s.status === status),
      ...kpiSubs, // always include KPI subs regardless of status so counts are correct
    ];
  } else {
    objectivesForGrouping = filteredSubmissions;
  }

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
    filteredSubmissionsCount: filteredSubmissions.length,
    objectivesForGroupingCount: objectivesForGrouping.length,
    groupedSubmissionsCount: groupedSubmissions.length,
    submissionsByType: {
      objectives: allSubmissions.filter((s) => s.type === "OBJECTIVE").length,
      kpis: allSubmissions.filter((s) => s.type === "KPI").length,
    },
    submissionsByLevel: {
      division: allSubmissions.filter((s) => s.level === "DIVISION").length,
      department: allSubmissions.filter((s) => s.level === "DEPARTMENT").length,
      personnel: allSubmissions.filter((s) => s.level === "PERSONNEL").length,
    },
    groupedSubmissionsWithKpis: groupedSubmissions.map((gs) => ({
      objectiveId: gs.objective?.objectiveId,
      objectiveName: gs.objective?.name,
      kpiCount: gs.kpiSubmissionCount,
      kpiSubmissions: gs.associatedKpiSubmissions?.map((kpi) => kpi.kpi?.name),
    })),
  });

  const refetch = () => {
    queries.forEach((query) => query.refetch());
  };

  return {
    submissions: paginatedSubmissions,
    meta,
    loading,
    error: error?.message,
    refetch,
  };
};
