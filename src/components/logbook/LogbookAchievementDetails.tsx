"use client";

import { AttachmentTrigger } from "@/components/files/AttachmentTrigger";
import { Badge } from "@/components/ui/badge";
import type { LogbookApprovalAchievementEntry } from "@/types/logbook";
import { BarChart3, FileText, Target } from "lucide-react";

interface LogbookAchievementDetailsProps {
  entry: LogbookApprovalAchievementEntry;
  compact?: boolean;
  summaryOnly?: boolean;
}

const hasValue = (value: unknown): boolean =>
  value !== null && value !== undefined && value !== "";

const displayNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(
    value,
  );
};

const displayUnit = (entry: LogbookApprovalAchievementEntry): string =>
  entry.linkedKpi?.measurementUnit ||
  entry.linkedKpi?.unitType ||
  entry.contributionUnit ||
  "";

/**
 * Read-only source-of-truth view of the KPI result submitted with a logbook.
 * Values are displayed exactly as returned by the API; no achievement is
 * recomputed in the approval screen.
 */
export function LogbookAchievementDetails({
  entry,
  compact = false,
  summaryOnly = false,
}: LogbookAchievementDetailsProps) {
  const unit = displayUnit(entry);
  const exactComponents =
    hasValue(entry.kpiActualNumeratorExact) ||
    hasValue(entry.kpiActualBasisExact) ||
    hasValue(entry.kpiActualRateExact);
  const hasKpiResult =
    Boolean(entry.linkedKpi) &&
    (hasValue(entry.kpiAchievedValue) ||
      hasValue(entry.kpiCompletionPercent) ||
      exactComponents ||
      Boolean(entry.metricObservations?.length));

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              <Target className="h-4 w-4" /> KPI achievement submitted
            </p>
            <p className="mt-1 font-semibold text-slate-950 dark:text-slate-100">
              {entry.linkedKpi?.name || "No KPI linked to this logbook"}
            </p>
            {entry.owner?.fullName && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {entry.owner.fullName}
                {entry.owner.title ? ` · ${entry.owner.title}` : ""}
              </p>
            )}
          </div>
          {entry.quarterPlan?.quarterNumber ? (
            <Badge variant="outline" className="border-blue-300 bg-white">
              Q{entry.quarterPlan.quarterNumber}
              {entry.quarterPlan.timeline
                ? ` · ${entry.quarterPlan.timeline}`
                : ""}
            </Badge>
          ) : null}
        </div>

        {entry.linkedKpi ? (
          hasKpiResult ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border bg-white p-3 dark:bg-slate-950">
                <p className="text-xs text-slate-500">Submitted actual</p>
                <p className="mt-1 font-mono text-base font-semibold text-slate-950 dark:text-slate-100">
                  {displayNumber(
                    entry.kpiActualRateExact ?? entry.kpiAchievedValue,
                  )}{" "}
                  {unit}
                </p>
              </div>
              <div className="rounded-md border bg-white p-3 dark:bg-slate-950">
                <p className="text-xs text-slate-500">Quarter target</p>
                <p className="mt-1 font-mono text-base font-semibold text-slate-950 dark:text-slate-100">
                  {displayNumber(entry.kpiTargetValue)} {unit}
                </p>
              </div>
              <div className="rounded-md border bg-white p-3 dark:bg-slate-950">
                <p className="text-xs text-slate-500">Achievement</p>
                <p className="mt-1 font-mono text-base font-semibold text-blue-700 dark:text-blue-300">
                  {hasValue(entry.kpiCompletionPercent)
                    ? `${displayNumber(entry.kpiCompletionPercent)}%`
                    : "Calculated after approval"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              This entry is linked to a KPI, but it does not contain a submitted
              achievement value. Review it before making a decision.
            </p>
          )
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            This is an activity-only logbook entry, so it does not contribute a
            KPI achievement.
          </p>
        )}
      </div>

      {!summaryOnly && exactComponents && (
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-indigo-600" /> Exact calculation
            inputs
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">
                {entry.linkedKpi?.numeratorLabel || "Numerator"}
              </p>
              <p className="font-mono text-sm font-medium">
                {displayNumber(entry.kpiActualNumeratorExact)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {entry.linkedKpi?.denominatorLabel || "Denominator / basis"}
              </p>
              <p className="font-mono text-sm font-medium">
                {displayNumber(
                  entry.kpiActualBasisExact ?? entry.kpiActualDenominator,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Derived result</p>
              <p className="font-mono text-sm font-medium">
                {displayNumber(entry.kpiActualRateExact)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!summaryOnly && Boolean(entry.metricObservations?.length) && (
        <div className="rounded-lg border p-4">
          <p className="text-sm font-semibold">Formula observations</p>
          <div className="mt-3 space-y-2">
            {entry.metricObservations?.map((observation) => (
              <div
                key={observation.id}
                className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900"
              >
                <div>
                  <p className="text-sm font-medium">
                    {observation.metricDefinition?.name ||
                      observation.metricDefinitionId}
                  </p>
                  <p className="text-xs text-slate-500">
                    {observation.metricDefinition?.code}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold">
                  {observation.value}{" "}
                  {observation.metricDefinition?.measurementUnit || ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!summaryOnly && entry.evidenceDescription && (
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" /> Achievement description
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
            {entry.evidenceDescription}
          </p>
        </div>
      )}

      {!summaryOnly &&
        (Boolean(entry.evidenceItems?.length) || entry.evidenceUrl) && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Supporting evidence</p>
            <div className="mt-3 space-y-2">
              {entry.evidenceItems?.map((evidence, index) =>
                evidence.type === "EMAIL" ? (
                  <div
                    key={`${evidence.type}-${index}`}
                    className="rounded-md bg-slate-50 p-3 text-sm whitespace-pre-wrap dark:bg-slate-900"
                  >
                    {evidence.value}
                  </div>
                ) : (
                  <AttachmentTrigger
                    key={`${evidence.type}-${evidence.value}-${index}`}
                    url={evidence.value}
                    name={evidence.name || evidence.value}
                    mimeType={evidence.mimeType}
                    evidenceType={evidence.type}
                    variant="link"
                  />
                ),
              )}
              {!entry.evidenceItems?.length && entry.evidenceUrl && (
                <AttachmentTrigger
                  url={entry.evidenceUrl}
                  name={entry.evidenceUrl}
                  variant="link"
                />
              )}
            </div>
          </div>
        )}
    </div>
  );
}
