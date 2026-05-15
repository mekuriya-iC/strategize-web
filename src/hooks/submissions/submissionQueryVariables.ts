import type { ObjectiveType } from "@/types/graphql";

const base = { page: 1, limit: 1000 } as const;

/** Objective submission inbox queries */
export function objectiveSubmissionsQueryVariables(type: ObjectiveType) {
  return {
    ...base,
    type,
    submissionType: "OBJECTIVE" as const,
  };
}

/** KPI submission inbox queries */
export function kpiSubmissionsQueryVariables(type: ObjectiveType) {
  return {
    ...base,
    type,
    submissionType: "KPI" as const,
  };
}
