import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskCompletionDashboard } from "./TaskCompletionDashboard";

vi.mock("./TaskCompletionDashboard.module.css", () => ({ default: { dashboard: "dashboard", sections: "sections" } }));
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-15T12:00:00Z"));
});

const state = vi.hoisted(() => ({
  role: "SUPER_ADMIN",
  loading: false,
  error: undefined as Error | undefined,
  calls: [] as {
    name: string;
    options: { skip: boolean; variables: { filters: Record<string, unknown> } };
  }[],
}));
vi.mock("@/stores", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({
      user: { employeeId: "me", role: state.role },
      isLoading: false,
    }),
  useStrategicPeriodStore: (selector: (s: unknown) => unknown) =>
    selector({ selectedPeriod: null, selectionValidated: true }),
}));
vi.mock("@/hooks/strategic-periods/useActiveStrategicPlanPeriods", () => ({
  useActiveStrategicPlanPeriods: () => ({
    strategicPeriods: [],
    loading: false,
  }),
}));
vi.mock("./TaskCompletionInsights", () => ({
  TaskCompletionInsights: () => <div>Trend component</div>,
}));
vi.mock("./CorporateTargetScenario", () => ({
  CorporateTargetScenario: () => <div>Corporate component</div>,
}));
vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@apollo/client")>()),
  useQuery: (
    doc: { definitions: { name?: { value: string } }[] },
    options: { skip: boolean; variables: { filters: Record<string, unknown> } },
  ) => {
    const name = doc.definitions[0].name?.value ?? "";
    state.calls.push({ name, options });
    const result = {
      summary: {
        periodType: "WEEKLY",
        totalTasks: 0,
        completedTasks: 0,
        notDoneTasks: 0,
        postponedTasks: 0,
        cancelledTasks: 0,
        completionRate: 0,
        status: "NO_DATA",
        employeeCount: 1,
        periodCount: 8,
      },
      rows: [],
      series: [],
      availableFilters: { employees: [], departments: [], divisions: [] },
      pageInfo: { page: 1, limit: 25, totalItems: 0, totalPages: 0 },
    };
    return {
      data: options.skip
        ? undefined
        : {
            personalTaskCompletionAnalytics: result,
            hierarchyTaskCompletionAnalytics: result,
          },
      loading: state.loading,
      error: options.skip ? undefined : state.error,
      refetch: vi.fn(),
    };
  },
}));
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  state.role = "SUPER_ADMIN";
  state.loading = false;
  state.error = undefined;
  state.calls = [];
});

describe("task completion live-query regression", () => {
  it("enables the hierarchy request for administrators instead of silently skipping all queries", () => {
    render(<TaskCompletionDashboard />);
    expect(
      state.calls.find((c) => c.name === "HierarchyTaskCompletionAnalytics")
        ?.options.skip,
    ).toBe(false);
    expect(
      state.calls.find((c) => c.name === "PersonalTaskCompletionAnalytics")
        ?.options.skip,
    ).toBe(true);
    expect(screen.getByText("Trend component")).toBeTruthy();
  });
  it("defaults employees to personal but lets a unit head request their server-scoped team", () => {
    state.role = "NORMAL";
    render(<TaskCompletionDashboard />);
    expect(
      state.calls.find((c) => c.name === "PersonalTaskCompletionAnalytics")
        ?.options.skip,
    ).toBe(false);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Team" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(
      state.calls
        .filter((c) => c.name === "HierarchyTaskCompletionAnalytics")
        .at(-1)?.options.skip,
    ).toBe(false);
  });
  it("reports request failures instead of calling them no data", () => {
    state.error = new Error("Server unavailable");
    render(<TaskCompletionDashboard />);
    expect(screen.getByText("Server unavailable")).toBeTruthy();
    expect(screen.queryByText("Trend component")).toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
  it("hides stale results while filters are loading", () => {
    state.loading = true;
    render(<TaskCompletionDashboard />);
    expect(screen.getByRole("status").textContent).toContain(
      "Updating live analytics",
    );
    expect(screen.queryByText("Trend component")).toBeNull();
  });
  it("only applies edited date filters when requested", () => {
    render(<TaskCompletionDashboard />);
    fireEvent.change(screen.getByLabelText("From (inclusive)"), {
      target: { value: "2026-08-01" },
    });
    const before = state.calls
      .filter((c) => c.name === "HierarchyTaskCompletionAnalytics")
      .at(-1);
    expect(before?.options.variables.filters.startDate).not.toBe("2026-08-01");
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(
      state.calls
        .filter((c) => c.name === "HierarchyTaskCompletionAnalytics")
        .at(-1)?.options.variables.filters.startDate,
    ).toBe("2026-08-01");
  });
});
