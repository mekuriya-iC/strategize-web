import { useCallback, useMemo } from "react";
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
    refetch: refetchPlans,
  } = useStrategicPlansQuery(
    { page: 1, limit: 100, search: "" },
    // Keep the selected plan aligned with the DB (soft-deletes / activation flips).
    { fetchPolicy: "cache-and-network" },
  );

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

  const hasCachedPeriods = periodsQuery.strategicPeriods.length > 0;
  // Keep showing cached periods while background refetches run so the header
  // does not flash "Loading..." on navigation / tab changes.
  const contextReady =
    Boolean(organizationId) &&
    !plansLoading &&
    (!activeStrategicPlan || !periodsQuery.loading || hasCachedPeriods);

  const refetchPeriods = periodsQuery.refetch;
  const refetch = useCallback(async () => {
    await Promise.all([refetchPlans(), refetchPeriods()]);
  }, [refetchPlans, refetchPeriods]);

  return {
    activeStrategicPlan,
    strategicPeriods: activeStrategicPlan
      ? periodsQuery.strategicPeriods
      : [],
    loading: !contextReady,
    error: plansError ?? periodsQuery.error,
    refetch,
    contextReady,
  };
}
