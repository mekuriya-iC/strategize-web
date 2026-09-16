import type { TypePolicies } from "@apollo/client";

// A page is owned by its query arguments, not a globally shared entity.
// keyFields: [] produces one TypeName:{} cache ID for every scope and page.
export const paginatedResultPolicies: TypePolicies = {
  PaginatedObjectives: { keyFields: false, merge: false },
  PaginatedKpis: { keyFields: false, merge: false },
};
