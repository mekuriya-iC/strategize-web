import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CorporateTargetScenario } from "./CorporateTargetScenario";

const state = vi.hoisted(() => ({
  coverage: 1,
  pending: 0,
  rate: 0.8,
  loading: false,
  error: undefined as Error | undefined,
}));
vi.mock("@/hooks/strategic-periods/useActiveStrategicPlanPeriods", () => ({
  useActiveStrategicPlanPeriods: () => ({
    strategicPeriods: [
      {
        strategicPeriodId: "annual",
        periodType: "ANNUAL",
        startDate: "2026-07-01",
        endDate: "2027-06-30",
      },
    ],
    loading: false,
  }),
}));
vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@apollo/client")>()),
  useQuery: () => ({
    loading: state.loading,
    error: state.error,
    refetch: vi.fn(),
    data: {
      kpiQuarterPerformanceReport: {
        scope: "ORGANIZATION",
        annualStrategicPeriodName: "2026/27",
        summary: {
          kpiCount: 2,
          plannedContributionWeight: 10,
          weightedAchievementRate: state.rate,
          resultCoverageRate: state.coverage,
          pendingResultCount: state.pending,
          provisionalCount: 0,
        },
      },
    },
  }),
}));
afterEach(() => {
  cleanup();
  state.coverage = 1;
  state.pending = 0;
  state.rate = 0.8;
  state.loading = false;
  state.error = undefined;
});

describe("corporate scenario safeguards", () => {
  it("converts authoritative fractional rates to percentages once", () => {
    render(<CorporateTargetScenario periodId="annual" />);
    expect(screen.getAllByText("80.0%").length).toBeGreaterThan(0);
    expect(screen.getByText("100.0%")).toBeTruthy();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "50" } });
    expect(screen.getByText("90.0%")).toBeTruthy();
    expect(screen.getByText("+10.0 pp")).toBeTruthy();
  });
  it("does not extrapolate incomplete results as a full corporate baseline", () => {
    state.coverage = 0.5;
    state.pending = 1;
    render(<CorporateTargetScenario periodId="annual" />);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.getByText("50.0%")).toBeTruthy();
    expect(
      screen.getByText(/Missing results are not treated as zero/),
    ).toBeTruthy();
  });
  it("does not show cached scenarios while a changed quarter loads", () => {
    state.loading = true;
    render(<CorporateTargetScenario periodId="annual" />);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });
  it("separates corporate request failure from task analytics", () => {
    state.error = new Error("offline");
    render(<CorporateTargetScenario periodId="annual" />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Task analytics are unaffected",
    );
    expect(screen.queryByRole("slider")).toBeNull();
  });
});
