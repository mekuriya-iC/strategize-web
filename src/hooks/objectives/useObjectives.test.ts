import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useObjectives } from "./useObjectives";

const mocks = vi.hoisted(() => ({
  user: { employeeId: "me", organizationId: "org", role: "NORMAL" } as { employeeId: string; organizationId: string; role: string } | null,
  query: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock("@/stores", () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ user: mocks.user }) }));
vi.mock("@/stores/cacheStore", () => ({ useCacheStore: (select: (state: unknown) => unknown) => select({ pendingRefetches: new Set(), markRefetched: vi.fn() }) }));
vi.mock("@apollo/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@apollo/client")>(),
  useQuery: mocks.query,
}));

const rows = [
  { objectiveId: "mine", assigneeType: "PERSONNEL", assigneeId: "me" },
  { objectiveId: "other", assigneeType: "PERSONNEL", assigneeId: "other" },
  { objectiveId: "corporate", assigneeType: null, assigneeId: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { employeeId: "me", organizationId: "org", role: "NORMAL" };
  mocks.query.mockReturnValue({ data: { objectives: { items: rows } }, loading: false, networkStatus: 7, refetch: mocks.refetch });
});

describe("objective query visibility", () => {
  it.each(["NORMAL", "HR"])("scopes both broad lookup and explicit queries for %s and rejects stale corporate rows", (role) => {
    mocks.user!.role = role;
    const { result, rerender } = renderHook(() => useObjectives({ limit: 1000, assigneeId: "other" }));
    expect(mocks.query.mock.lastCall?.[1].variables).toMatchObject({ assigneeId: "me", organizationId: "org" });
    expect(result.current.objectives.map((row) => row.objectiveId)).toEqual(["mine"]);
    const previous = result.current.objectives;
    rerender();
    expect(result.current.objectives).toBe(previous);
  });

  it("keeps corporate and management queries unchanged", () => {
    mocks.user!.role = "SUPER_ADMIN";
    const { result } = renderHook(() => useObjectives());
    expect(result.current.objectives).toEqual(rows);
    expect(mocks.query.mock.lastCall?.[1].variables).not.toHaveProperty("assigneeId");
  });

  it("does not fetch or display an unrestricted cached list before identity is ready", () => {
    mocks.user = null;
    const { result } = renderHook(() => useObjectives());
    expect(mocks.query.mock.lastCall?.[1].skip).toBe(true);
    expect(result.current.objectives).toEqual([]);
  });
});
