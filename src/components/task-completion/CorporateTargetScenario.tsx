"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import {
  findEnclosingAnnualPeriod,
  findReportingQuarterForAnnual,
  getQuarterLabelForPeriod,
  isQuarterlyPeriod,
} from "@/lib/strategic-periods/periodDates";
import { GET_TASK_CORPORATE_BASELINE } from "@/lib/graphql/queries/task-completion";
import type { KpiQuarterPerformanceReport } from "@/types/graphql";
import { projectScoreGap } from "./projections";

export function CorporateTargetScenario({ periodId }: { periodId?: string }) {
  const { strategicPeriods, loading } = useActiveStrategicPlanPeriods();
  const period = strategicPeriods.find((p) => p.strategicPeriodId === periodId);
  const annual = period
    ? findEnclosingAnnualPeriod(period, strategicPeriods)
    : null;
  const quarter =
    period && isQuarterlyPeriod(period)
      ? period
      : annual
        ? findReportingQuarterForAnnual(annual, strategicPeriods)
        : null;
  const initialQuarter = quarter
    ? Number(
        getQuarterLabelForPeriod(quarter, strategicPeriods).replace("Q", ""),
      )
    : 1;
  return (
    <CorporateScenarioPanel
      key={`${periodId}-${initialQuarter}`}
      annualId={annual?.strategicPeriodId}
      initialQuarter={initialQuarter}
      periodsLoading={loading}
    />
  );
}

function CorporateScenarioPanel({
  annualId,
  initialQuarter,
  periodsLoading,
}: {
  annualId?: string;
  initialQuarter: number;
  periodsLoading: boolean;
}) {
  const [quarterNumber, setQuarterNumber] = useState(
    initialQuarter >= 1 && initialQuarter <= 4 ? initialQuarter : 1,
  );
  const [gapClosed, setGapClosed] = useState(0);
  const { data, loading, error, refetch } = useQuery<{
    kpiQuarterPerformanceReport: Pick<
      KpiQuarterPerformanceReport,
      "summary" | "scope" | "annualStrategicPeriodName"
    >;
  }>(GET_TASK_CORPORATE_BASELINE, {
    variables: {
      filters: {
        annualStrategicPeriodId: annualId,
        quarterNumber,
        level: "CORPORATE",
        cascadeType: "TARGET_ALLOCATION",
        page: 1,
        limit: 1,
      },
    },
    skip: !annualId,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });
  const report = data?.kpiQuarterPerformanceReport;
  const summary = report?.summary;
  // Missing or partial result coverage is not a zero achievement baseline.
  const ready =
    !loading &&
    !error &&
    summary &&
    summary.kpiCount > 0 &&
    summary.plannedContributionWeight > 0 &&
    summary.pendingResultCount === 0 &&
    summary.resultCoverageRate >= 1 &&
    Number.isFinite(summary.weightedAchievementRate);
  const scenario = ready
    ? projectScoreGap(summary.weightedAchievementRate! * 100, gapClosed)
    : null;
  return (
    <section
      className="rounded-2xl border bg-card p-5"
      aria-labelledby="corporate-scenario-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="corporate-scenario-title"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Target className="size-5 text-primary" />
            Corporate target outlook
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved target-allocation chain only. Support KPIs do not count as
            direct corporate achievement.
          </p>
        </div>
        <label className="text-xs font-medium">
          Scenario quarter
          <select
            className="ml-2 rounded-md border bg-background p-2 text-foreground"
            value={quarterNumber}
            onChange={(e) => {
              setQuarterNumber(Number(e.target.value));
              setGapClosed(0);
            }}
          >
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                Q{q}
              </option>
            ))}
          </select>
        </label>
      </div>
      {periodsLoading || loading ? (
        <p className="mt-5 text-sm text-muted-foreground" role="status">
          Loading authorized corporate results…
        </p>
      ) : !annualId ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Select a planning period above to load its approved corporate
          baseline.
        </p>
      ) : error ? (
        <div className="mt-4 text-sm text-destructive" role="alert">
          <p>
            Corporate results could not be loaded. Task analytics are
            unaffected.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => void refetch()}
          >
            Retry corporate results
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs font-medium text-muted-foreground">
            {report?.annualStrategicPeriodName} · Q{quarterNumber} ·{" "}
            {report?.scope === "ORGANIZATION"
              ? "Organization reporting scope"
              : "Corporate results visible within your authorized scope"}
            . Independent of the employee/status filters above.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Score
              label="Observed weighted achievement"
              value={
                summary &&
                summary.resultCoverageRate > 0 &&
                summary.weightedAchievementRate != null
                  ? `${(summary.weightedAchievementRate * 100).toFixed(1)}%`
                  : "Awaiting results"
              }
            />
            <Score
              label="Result coverage"
              value={
                summary
                  ? `${(summary.resultCoverageRate * 100).toFixed(1)}%`
                  : "—"
              }
            />
            <Score
              label="Corporate KPIs in scope"
              value={String(summary?.kpiCount ?? 0)}
            />
          </div>
          {!scenario ? (
            <p className="mt-4 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              A corporate scenario requires visible approved target allocations
              and complete result coverage. Missing results are not treated as
              zero. Task completion alone cannot establish corporate
              achievement.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                {summary?.provisionalCount
                  ? "Some source results are provisional; this baseline may change. "
                  : ""}
                Explicit what-if: how much of the remaining weighted score gap
                to 100% could be closed? This is a planning assumption, not a
                prediction from task completion or a calculation of future KPI
                actuals.
              </p>
              <label className="block text-sm font-medium">
                Assumed remaining gap closed: {gapClosed}%
                <input
                  aria-label="Assumed corporate score gap closed"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={gapClosed}
                  onChange={(e) => setGapClosed(Number(e.target.value))}
                  className="mt-3 w-full accent-primary"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Score
                  label="Scenario weighted score"
                  value={`${scenario.score.toFixed(1)}%`}
                />
                <Score
                  label="Assumed improvement"
                  value={`+${scenario.improvement.toFixed(1)} pp`}
                />
                <Score
                  label="Remaining gap to 100%"
                  value={`${scenario.remaining.toFixed(1)} pp`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Scenario score = observed score + max(0, 100 − observed score) ×
                assumed gap closure. The denominator, allocations, approved
                actuals and formula calculations remain unchanged. No forecast
                confidence is implied.
              </p>
            </div>
          )}
        </>
      )}
      <Link
        href="/dashboard"
        className="mt-5 inline-block text-sm font-medium text-primary underline underline-offset-4"
      >
        Inspect objective and KPI contributions on the dashboard →
      </Link>
    </section>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-primary">
        {value}
      </p>
    </div>
  );
}
