export interface LogbookQuarterPlanReference {
  quarterNumber: number;
  status: string;
}

export interface LogbookSubmissionBlock {
  title: string;
  description: string;
}

export function getQuarterPlanSubmissionBlock(
  linkedKpiId?: string | null,
  quarterPlan?: LogbookQuarterPlanReference | null,
): LogbookSubmissionBlock | null {
  if (!linkedKpiId) return null;
  if (!quarterPlan) {
    return {
      title: "Quarter plan required",
      description:
        "This KPI has no quarterly target plan for the logbook date. Configure and approve the quarterly breakdown before submitting the achievement.",
    };
  }

  const label = `Q${quarterPlan.quarterNumber}`;
  const status = String(quarterPlan.status || "DRAFT").toUpperCase();
  if (status === "APPROVED") return null;
  if (status === "PENDING") {
    return {
      title: `${label} target plan is awaiting approval`,
      description:
        "The achievement can be edited now, but it can only be submitted after the quarterly target plan is approved.",
    };
  }
  if (status === "REJECTED") {
    return {
      title: `${label} target plan was rejected`,
      description:
        "Revise and resubmit the KPI quarterly breakdown, then wait for approval before submitting this achievement.",
    };
  }
  if (status === "LOCKED") {
    return {
      title: `${label} is finalized`,
      description:
        "This quarter no longer accepts new achievement submissions. Contact the KPI administrator if this entry belongs to a different quarter.",
    };
  }

  return {
    title: `${label} target plan is ${status.toLowerCase()}`,
    description:
      "Submitting weekly tasks does not approve KPI targets. Submit the KPI quarterly breakdown for approval and wait for approval before submitting this achievement.",
  };
}

export function isQuarterPlanSubmissionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const normalized = message.toLowerCase();
  return (
    normalized.includes(
      "logbook achievement cannot be submitted or approved while",
    ) ||
    normalized.includes(
      "valid quarterly plan is required before this logbook achievement",
    )
  );
}
