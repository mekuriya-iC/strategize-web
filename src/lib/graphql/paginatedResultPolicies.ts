import type { TypePolicies } from "@apollo/client";

// A page is owned by its query arguments, not a globally shared entity.
// keyFields: false avoids collapsing different pages into one cache object.
export const paginatedResultPolicies: TypePolicies = {
  PaginatedObjectives: { keyFields: false, merge: false },
  PaginatedKpis: { keyFields: false, merge: false },
  PaginatedSubmissions: { keyFields: false, merge: false },
  PaginatedEmployees: { keyFields: false, merge: false },
  PaginatedDepartments: { keyFields: false, merge: false },
  PaginatedDivisions: { keyFields: false, merge: false },
  PaginatedCheckinoutSessions: { keyFields: false, merge: false },
  PaginatedCheckinoutTasks: { keyFields: false, merge: false },
  PaginatedLogbookEntries: { keyFields: false, merge: false },
  PaginatedNotifications: { keyFields: false, merge: false },
  PaginatedStrategicPeriods: { keyFields: false, merge: false },
  PaginatedStrategicPlans: { keyFields: false, merge: false },
  PaginatedInitiatives: { keyFields: false, merge: false },
};
