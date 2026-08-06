export type PreviewPeriodType = "ANNUAL" | "QUARTERLY" | "MONTHLY";
export type PreviewPeriodStatus = "active" | "current" | "upcoming" | "past";

export function getPreviewPeriodStatus(
  type: PreviewPeriodType,
  startDate: Date,
  endDate: Date,
  referenceDate: Date = new Date(),
): PreviewPeriodStatus {
  if (referenceDate < startDate) return "upcoming";
  if (referenceDate > endDate) return "past";

  return type === "ANNUAL" ? "active" : "current";
}
