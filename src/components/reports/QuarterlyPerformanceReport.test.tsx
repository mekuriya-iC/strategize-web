import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@apollo/client";
import type {
  KpiQuarterPerformanceReport,
  KpiQuarterReportSummary,
} from "@/types/graphql";
import { summaryAchievement } from "@/lib/dashboard/performanceDashboard";
import QuarterlyPerformanceReport from "./QuarterlyPerformanceReport";

vi.mock("@apollo/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@apollo/client")>(),
  useQuery: vi.fn(),
}));
vi.mock("@/stores", () => ({
  useStrategicPeriodStore: (selector: (state: unknown) => unknown) => selector({
    selectedPeriod: { strategicPeriodId: "annual", name: "2026/27", periodType: "annual" },
  }),
}));
vi.mock("@/hooks/permissions/usePermissions", () => ({
  usePermissions: () => ({ can: () => false }),
}));
vi.mock("@/lib/utils/exportReport", () => ({ exportReport: vi.fn() }));

const quarter: KpiQuarterReportSummary = {
  rowCount: 14,
  kpiCount: 14,
  originalTarget: 100,
  effectiveTarget: 100,
  carryIn: 0,
  actual: 0,
  // The eight reported rates from the regression: their equal-weight mean
  // differs from the score-weighted total with six pending plans.
  averageAchievementRate: (1.05 + 1 + 0.8 + 0.95 + 0.35 + 0.75 + 0.75 + 0.55) / 8,
  weightedAchievementRate: 9.8625 / 20.255,
  plannedContributionWeight: 20.255,
  achievedContributionWeight: 9.8625,
  annualContribution: 9.8625,
  resultCoverageRate: 8 / 14,
  carryOut: 180,
  finalCount: 0,
  provisionalCount: 8,
  pendingResultCount: 6,
};

function makeReport(): KpiQuarterPerformanceReport {
  const pending: KpiQuarterReportSummary = {
    ...quarter,
    averageAchievementRate: 0,
    weightedAchievementRate: 0,
    achievedContributionWeight: 0,
    annualContribution: 0,
    resultCoverageRate: 0,
    provisionalCount: 0,
    pendingResultCount: 14,
    carryOut: 0,
  };
  return {
    annualStrategicPeriodId: "annual",
    annualStrategicPeriodName: "2026/27",
    scope: "SELF",
    availableFilters: { divisions: [], departments: [], employees: [] },
    summary: {
      ...quarter,
      rowCount: 56,
      plannedContributionWeight: quarter.plannedContributionWeight * 4,
      weightedAchievementRate: quarter.weightedAchievementRate / 4,
      resultCoverageRate: 8 / 56,
      pendingResultCount: 48,
    },
    quarterSummaries: [1, 2, 3, 4].map((quarterNumber) => ({
      ...(quarterNumber === 1 ? quarter : pending), quarterNumber,
    })),
    rollups: [],
    kpiRollups: [],
    kpiQuarterRollups: [],
    entityQuarterRollups: [],
    entityKpiRollups: [],
    // Deliberately no page rows: summaries must use the full server scope.
    rows: [],
    totalItems: 56,
    currentPage: 1,
    itemsPerPage: 50,
    totalPages: 2,
  };
}

let report: KpiQuarterPerformanceReport;
beforeEach(() => {
  report = makeReport();
  vi.mocked(useQuery).mockImplementation((_query, options) => {
    const selectedQuarter = options?.variables?.filters?.quarterNumber;
    return {
      data: {
        kpiQuarterPerformanceReport: {
          ...report,
          summary: selectedQuarter
            ? report.quarterSummaries.find((item) => item.quarterNumber === selectedQuarter)
            : report.summary,
        },
      },
      loading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>;
  });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("quarterly report achievement semantics", () => {
  it("shows not-due quarters separately from pending results and final-result coverage", () => {
    report.quarterSummaries[0] = { ...report.quarterSummaries[0], provisionalCount: 9, pendingResultCount: 3, notDueCount: 2, resultCoverageRate: 0.75 };
    report.quarterSummaries[1] = { ...report.quarterSummaries[1], pendingResultCount: 0, notDueCount: 14 };
    render(<QuarterlyPerformanceReport />);
    const q1 = within(screen.getByRole("button", { name: "View Q1 performance" }));
    expect(q1.getByText("75% · 3 pending · 2 not due")).toBeTruthy();
    expect(q1.getByText("0/12 final")).toBeTruthy();
    expect(within(screen.getByRole("button", { name: "View Q2 performance" })).getByText("Not due this quarter")).toBeTruthy();
  });
  it("matches the dashboard weighted quarter measure and labels the simple mean separately", () => {
    render(<QuarterlyPerformanceReport />);
    const q1 = within(screen.getByRole("button", { name: "View Q1 performance" }));
    const expected = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
      .format(summaryAchievement(quarter));
    expect(q1.getByText(`${expected}%`)).toBeTruthy();
    expect(q1.queryByText("77.5%")).toBeNull();
    expect(q1.getByText("57.14% · 6 pending")).toBeTruthy();
    expect(screen.getByText(/Reported-result average \(unweighted\)/).textContent)
      .toContain("77.5%");
    expect(screen.getByText("Annual weighted achievement")).toBeTruthy();
    expect(screen.getByText("12.17%")).toBeTruthy();
    expect(screen.getByText(/annual card includes all four quarters/)).toBeTruthy();
  });

  it("shows missing quarter outcomes as dashes, not measured zeros", () => {
    render(<QuarterlyPerformanceReport />);
    for (const q of [2, 3, 4]) {
      const card = within(screen.getByRole("button", { name: `View Q${q} performance` }));
      expect(card.getAllByText("—")).toHaveLength(2);
      expect(card.queryByText("0%")).toBeNull();
      expect(card.getByText("0% · 14 pending")).toBeTruthy();
    }
  });

  it("does not present an entirely pending report as a measured zero", () => {
    report.summary = {
      ...report.summary,
      provisionalCount: 0,
      pendingResultCount: 56,
      achievedContributionWeight: 0,
      averageAchievementRate: 0,
      weightedAchievementRate: 0,
    };
    render(<QuarterlyPerformanceReport />);
    const annualCard = screen.getByText("Annual weighted achievement")
      .closest('[data-slot="card"]') as HTMLElement;
    expect(within(annualCard).getByText("—")).toBeTruthy();
    expect(screen.getByText(/Reported-result average \(unweighted\)/).textContent)
      .toContain("—");
  });

  it("preserves a calculated zero and distinguishes a zero-weight denominator", () => {
    report.quarterSummaries[0] = {
      ...report.quarterSummaries[0], achievedContributionWeight: 0,
      annualContribution: 0, weightedAchievementRate: 0,
    };
    report.quarterSummaries[1] = {
      ...report.quarterSummaries[1], provisionalCount: 1,
      pendingResultCount: 13, plannedContributionWeight: 0,
    };
    render(<QuarterlyPerformanceReport />);
    expect(within(screen.getByRole("button", { name: "View Q1 performance" })).getAllByText("0%"))
      .toHaveLength(2);
    expect(within(screen.getByRole("button", { name: "View Q2 performance" })).getAllByText("—"))
      .toHaveLength(1);
  });

  it("switches the headline to the selected quarter without changing the summary denominator", () => {
    render(<QuarterlyPerformanceReport />);
    fireEvent.click(screen.getByRole("button", { name: "View Q1 performance" }));
    expect(screen.getByText("Q1 weighted achievement")).toBeTruthy();
    expect(screen.getAllByText("48.69%")).toHaveLength(2);
    expect(screen.queryByText("12.17%")).toBeNull();
  });

  it("uses weighted achievement for entity rollups and does not sum mixed-unit carry", () => {
    report.rollups = [
      { ...quarter, level: "INDIVIDUAL", entityId: "employee-1", entityName: "Employee One" },
      { ...report.quarterSummaries[1], level: "INDIVIDUAL", entityId: "employee-2", entityName: "Employee Two" },
    ];
    render(<QuarterlyPerformanceReport />);
    const measured = screen.getByText("Employee One").closest("tr")!;
    expect(within(measured).getByText("48.69%")).toBeTruthy();
    const pending = screen.getByText("Employee Two").closest("tr")!;
    expect(within(pending).getAllByText("—")).toHaveLength(2);
    expect(screen.queryByText("Carry balance")).toBeNull();
    expect(screen.queryByText("+180")).toBeNull();
  });
});
