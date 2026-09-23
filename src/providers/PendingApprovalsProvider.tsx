"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePendingApprovalsCount as usePendingApprovalsCountQuery } from "@/hooks/submissions/usePendingApprovalsCount";

interface PendingApprovalsContextValue {
  count: number;
  submissionCount: number;
  logbookCount: number;
  loading: boolean;
}

const PendingApprovalsContext =
  createContext<PendingApprovalsContextValue | null>(null);

/**
 * Fetches pending-approval badge data once per dashboard mount.
 * Sidebar and Topbar both read this context instead of each firing
 * the full submission/logbook query fan-out.
 */
export function PendingApprovalsProvider({ children }: { children: ReactNode }) {
  const { count, submissionCount, logbookCount, loading } =
    usePendingApprovalsCountQuery();

  const value = useMemo(
    () => ({ count, submissionCount, logbookCount, loading }),
    [count, submissionCount, logbookCount, loading],
  );

  return (
    <PendingApprovalsContext.Provider value={value}>
      {children}
    </PendingApprovalsContext.Provider>
  );
}

export function usePendingApprovalsBadge(): PendingApprovalsContextValue {
  const context = useContext(PendingApprovalsContext);
  if (!context) {
    return {
      count: 0,
      submissionCount: 0,
      logbookCount: 0,
      loading: false,
    };
  }
  return context;
}
