/**
 * Cache Invalidation Store
 * Centralized Apollo cache management for data synchronization
 */
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { apolloLogger } from "@/lib/logger";

// Cache keys for different data types
export type CacheKey =
  | "objectives"
  | "kpis"
  | "submissions"
  | "divisions"
  | "departments"
  | "employees"
  | "strategicPeriods"
  | "approvals";

interface CacheState {
  // Track when each cache was last invalidated
  invalidationTimestamps: Record<CacheKey, number>;

  // Track pending refetch requests
  pendingRefetches: Set<CacheKey>;

  // Actions
  invalidate: (key: CacheKey | CacheKey[]) => void;
  invalidateAll: () => void;
  markRefetched: (key: CacheKey) => void;
  shouldRefetch: (key: CacheKey, maxAge?: number) => boolean;
  getLastInvalidation: (key: CacheKey) => number;
}

const initialTimestamps: Record<CacheKey, number> = {
  objectives: 0,
  kpis: 0,
  submissions: 0,
  divisions: 0,
  departments: 0,
  employees: 0,
  strategicPeriods: 0,
  approvals: 0,
};

export const useCacheStore = create<CacheState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    invalidationTimestamps: { ...initialTimestamps },
    pendingRefetches: new Set(),

    // Invalidate one or more cache keys
    invalidate: (key) => {
      const keys = Array.isArray(key) ? key : [key];
      const now = Date.now();

      set((state) => {
        const newTimestamps = { ...state.invalidationTimestamps };
        const newPending = new Set(state.pendingRefetches);

        keys.forEach((k) => {
          newTimestamps[k] = now;
          newPending.add(k);
        });

        return {
          invalidationTimestamps: newTimestamps,
          pendingRefetches: newPending,
        };
      });

      apolloLogger.debug("Cache invalidated", { keys });
    },

    // Invalidate all caches
    invalidateAll: () => {
      const now = Date.now();
      const allKeys = Object.keys(initialTimestamps) as CacheKey[];

      set({
        invalidationTimestamps: Object.fromEntries(
          allKeys.map((k) => [k, now])
        ) as Record<CacheKey, number>,
        pendingRefetches: new Set(allKeys),
      });

      apolloLogger.debug("All caches invalidated");
    },

    // Mark a cache key as refetched
    markRefetched: (key) => {
      set((state) => {
        const newPending = new Set(state.pendingRefetches);
        newPending.delete(key);
        return { pendingRefetches: newPending };
      });

      apolloLogger.debug("Cache refetched", { key });
    },

    // Check if a cache key needs refetching
    shouldRefetch: (key, maxAge = 30000) => {
      const state = get();
      const lastInvalidation = state.invalidationTimestamps[key];
      const isPending = state.pendingRefetches.has(key);

      // Refetch if pending or if last invalidation was recent
      if (isPending) return true;
      if (lastInvalidation === 0) return false;

      const age = Date.now() - lastInvalidation;
      return age < maxAge;
    },

    // Get last invalidation time
    getLastInvalidation: (key) => {
      return get().invalidationTimestamps[key];
    },
  }))
);

// Helper functions for common invalidation patterns
export const invalidateAfterMutation = {
  // After creating/updating/deleting an objective
  objective: () => {
    useCacheStore.getState().invalidate(["objectives", "kpis", "submissions"]);
  },

  // After creating/updating/deleting a KPI
  kpi: () => {
    useCacheStore.getState().invalidate(["kpis", "objectives"]);
  },

  // After creating/updating a submission
  submission: () => {
    useCacheStore.getState().invalidate(["submissions", "approvals", "objectives", "kpis"]);
  },

  // After approval/rejection
  approval: () => {
    useCacheStore.getState().invalidate(["approvals", "submissions", "objectives", "kpis"]);
  },

  // After org structure changes
  orgStructure: () => {
    useCacheStore.getState().invalidate(["divisions", "departments", "employees"]);
  },

  // After employee changes
  employee: () => {
    useCacheStore.getState().invalidate(["employees", "departments"]);
  },
};

// Selector hooks
export const usePendingRefetches = () =>
  useCacheStore((state) => state.pendingRefetches);
export const useInvalidationTimestamp = (key: CacheKey) =>
  useCacheStore((state) => state.invalidationTimestamps[key]);


