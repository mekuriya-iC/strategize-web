import { useMemo } from "react";
import { useStrategicPeriods } from "@/hooks/objectives/useStrategicPeriods";
import { useStrategicPlansQuery } from "@/hooks/strategic-plans/useStrategicPlans";
import { useAuthStore } from "@/stores";

interface StrategicPlanCandidate {
  strategicPlanId: string;
  isActive: boolean;
  archivedAt?: string | null;
  createdAt: string;
  organization: {
    organizationId: string;
  };
}

const timestamp = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export function selectLatestActiveStrategicPlan<
  T extends StrategicPlanCandidate,
>(plans: T[], organizationId?: string): T | undefined {
  if (!organizationId) return undefined;

  return [...plans]
    .filter(
      (plan) =>
        plan.organization?.organizationId === organizationId &&
        plan.isActive &&
        !plan.archivedAt,
    )
    .sort((a, b) => {
      const createdAtDifference = timestamp(b.createdAt) - timestamp(a.createdAt);
      if (createdAtDifference !== 0) return createdAtDifference;

      return b.strategicPlanId.localeCompare(a.strategicPlanId);
    })[0];
}

export function useActiveStrategicPlanPeriods() {
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const {
    strategicPlans,
    loading: plansLoading,
    error: plansError,
  } = useStrategicPlansQuery({ page: 1, limit: 1000, search: "" });

  const activeStrategicPlan = useMemo(
    () =>
      selectLatestActiveStrategicPlan(
        strategicPlans as Array<
          (typeof strategicPlans)[number] & { archivedAt?: string | null }
        >,
        organizationId,
      ),
    [organizationId, strategicPlans],
  );

  const shouldSkipPeriods =
    !organizationId || plansLoading || !activeStrategicPlan;
  const periodsQuery = useStrategicPeriods(
    {
      limit: 1000,
      organizationId,
      strategicPlanId: activeStrategicPlan?.strategicPlanId,
    },
    { skip: shouldSkipPeriods },
  );

  const contextReady =
    Boolean(organizationId) &&
    !plansLoading &&
    (!activeStrategicPlan || !periodsQuery.loading);

  return {
    activeStrategicPlan,
    strategicPeriods:
      contextReady && activeStrategicPlan ? periodsQuery.strategicPeriods : [],
    loading: !contextReady,
    error: plansError ?? periodsQuery.error,
    refetch: periodsQuery.refetch,
    contextReady,
  };
}
