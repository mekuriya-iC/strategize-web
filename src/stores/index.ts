/**
 * Centralized store exports
 * Import stores from here for cleaner imports
 */

// Auth Store
export {
  useAuthStore,
  useUser,
  useIsAuthenticated,
  useAuthLoading,
} from "./authStore";

// Org Unit Store
export {
  useOrgUnitStore,
  useSelectedUnit,
  useSelectedDivision,
  useSelectedDepartment,
  type OrgUnit,
  type OrgUnitType,
} from "./orgUnitStore";

// Strategic Period Store
export {
  useStrategicPeriodStore,
  useSelectedStrategicPeriod,
  useAnnualTimeline,
  useStrategicPeriodState,
} from "./strategicPeriodStore";

// UI Store
export {
  useUIStore,
  useSidebarOpen,
  useSidebarCollapsed,
  useGlobalLoading,
} from "./uiStore";

// Cache Store
export {
  useCacheStore,
  invalidateAfterMutation,
  usePendingRefetches,
  useInvalidationTimestamp,
  type CacheKey,
} from "./cacheStore";

