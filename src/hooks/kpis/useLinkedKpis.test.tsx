import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  linkedKpiLabel,
  uniqueLinkedKpis,
  useLinkedKpis,
} from "./useLinkedKpis";

const { query, client } = vi.hoisted(() => {
  const query = vi.fn();
  return { query, client: { query } };
});
vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@apollo/client")>()),
  useApolloClient: () => client,
}));
const item = (kpiId: string) => ({ kpiId, name: "Delivery rate" });
const response = (ids: string[], totalPages = 1) => ({
  data: { myKpis: { items: ids.map(item), meta: { totalPages } } },
});

describe("linked KPI picker", () => {
  beforeEach(() => query.mockReset());

  it("removes repeated IDs but keeps distinct KPIs with identical names distinguishable", () => {
    const items = uniqueLinkedKpis([item("a"), item("a"), item("b")]);
    expect(items).toHaveLength(2);
    expect(linkedKpiLabel(items[0], items)).not.toBe(
      linkedKpiLabel(items[1], items),
    );
    expect(linkedKpiLabel(item("a"), [item("a")])).toBe("Delivery rate");
  });

  it("loads all assignment-only pages for the selected annual period", async () => {
    query
      .mockResolvedValueOnce(response(["a"], 2))
      .mockResolvedValueOnce(response(["a", "b"], 2));
    const { result } = renderHook(() =>
      useLinkedKpis({
        open: true,
        userId: "user-1",
        strategicPeriodId: "annual-1",
        status: "APPROVED",
      }),
    );
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        variables: {
          page: 2,
          limit: 100,
          strategicPeriodId: "annual-1",
          status: "APPROVED",
          assignedOnly: true,
        },
      }),
    );
  });

  it("does not fall back to an unfiltered list when the user has no assignments", async () => {
    query.mockResolvedValue(response([]));
    const { result } = renderHook(() =>
      useLinkedKpis({
        open: true,
        userId: "user-1",
        strategicPeriodId: "annual-1",
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("ignores a previous user/period request that finishes late", async () => {
    let resolveOld!: (value: ReturnType<typeof response>) => void;
    query
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce(response(["new"]));
    const { result, rerender } = renderHook(
      ({ userId, strategicPeriodId }) =>
        useLinkedKpis({ open: true, userId, strategicPeriodId }),
      {
        initialProps: { userId: "old-user", strategicPeriodId: "old-period" },
      },
    );
    rerender({ userId: "new-user", strategicPeriodId: "new-period" });
    await waitFor(() => expect(result.current.items).toEqual([item("new")]));
    await act(async () => resolveOld(response(["old"])));
    expect(result.current.items).toEqual([item("new")]);
  });

  it("does not query without an authenticated user and selected period", () => {
    renderHook(() => useLinkedKpis({ open: true }));
    expect(query).not.toHaveBeenCalled();
  });
});
