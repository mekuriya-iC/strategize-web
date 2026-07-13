import type { KpiQuarterPlan, KpiQuarterPlanStatus } from "@/types/graphql";

const STATUS_ORDER: KpiQuarterPlanStatus[] = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "LOCKED",
];

export function summarizeQuarterPlans(
  plans: Pick<KpiQuarterPlan, "status">[] | null | undefined,
): string {
  if (!plans?.length) return "No quarterly plan";

  const counts = plans.reduce<Partial<Record<KpiQuarterPlanStatus, number>>>(
    (result, plan) => {
      result[plan.status] = (result[plan.status] ?? 0) + 1;
      return result;
    },
    {},
  );

  return STATUS_ORDER.filter((status) => counts[status])
    .map((status) => `${counts[status]} ${formatStatus(status)}`)
    .join(" / ");
}

function formatStatus(status: KpiQuarterPlanStatus): string {
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return label;
}
