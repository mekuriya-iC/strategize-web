"use client";

import { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { GET_MY_KPIS } from "@/lib/graphql/queries/kpis";

export interface LinkedKpiItem {
  kpiId: string;
  name: string;
  parent?: { kpiId: string } | null;
  assigneeType?: string | null;
  objective?: { assigneeType?: string | null; type?: string | null } | null;
}

export function uniqueLinkedKpis<T extends LinkedKpiItem>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.kpiId, item])).values()];
}

// Same-name KPI records may be legitimate separate assignments. Keep their IDs
// distinct and label them rather than silently selecting the first name match.
export function linkedKpiLabel(
  item: LinkedKpiItem,
  items: LinkedKpiItem[],
): string {
  const sameName = items.filter(
    (candidate) =>
      candidate.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
  );
  const level =
    item.assigneeType || item.objective?.assigneeType || item.objective?.type;
  const origin = item.parent?.kpiId ? "Cascaded" : "Standalone";
  const context = level ? ` · ${origin} · ${level.toLowerCase()}` : "";
  return `${item.name}${context}${sameName.length > 1 ? ` · ${item.kpiId}` : ""}`;
}

export function useLinkedKpis<T extends LinkedKpiItem>({
  open,
  userId,
  strategicPeriodId,
  status,
  purpose = "TASK",
}: {
  open: boolean;
  userId?: string;
  strategicPeriodId?: string;
  status?: "APPROVED";
  purpose?: "TASK" | "LOGBOOK";
}) {
  const client = useApolloClient();
  const scope = JSON.stringify([
    open,
    userId,
    strategicPeriodId,
    status,
    purpose,
  ]);
  const [state, setState] = useState<{
    scope: string;
    items: T[];
    loading: boolean;
    error?: Error;
  }>({ scope: "", items: [], loading: false });

  useEffect(() => {
    let cancelled = false;
    if (!open || !userId || !strategicPeriodId) return;
    void (async () => {
      try {
        const items: T[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const result = await client.query<{
            myKpis: { items: T[]; meta: { totalPages: number } };
          }>({
            query: GET_MY_KPIS,
            variables: {
              page,
              limit: 100,
              strategicPeriodId,
              status,
              assignedOnly: true,
              linkPurpose: purpose,
            },
            fetchPolicy: "network-only",
          });
          if (cancelled) return;
          setState({ scope, items: [], loading: true });
          items.push(...result.data.myKpis.items);
          totalPages = result.data.myKpis.meta.totalPages;
          page += 1;
        } while (page <= totalPages);
        setState({ scope, items: uniqueLinkedKpis(items), loading: false });
      } catch (error) {
        if (!cancelled)
          setState({
            scope,
            items: [],
            loading: false,
            error:
              error instanceof Error
                ? error
                : new Error("Could not load assigned KPIs."),
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, open, userId, strategicPeriodId, status, purpose, scope]);

  // Never expose results from the previous user or planning period.
  return state.scope === scope
    ? state
    : {
        items: [] as T[],
        loading: Boolean(open && userId && strategicPeriodId),
        error: undefined,
      };
}
