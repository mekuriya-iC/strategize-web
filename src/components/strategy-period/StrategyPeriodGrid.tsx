"use client";
import StrategyPeriodCard from "./StrategyPeriodCard";
import Image from "next/image";
import { useStrategicPeriodMutations } from "@/hooks/objectives/useStrategicPeriodMutations";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { useRouter } from "next/navigation";
import { StrategicPeriod } from "@/types/graphql";
import { useStrategicPeriodStore, useAuthStore } from "@/stores";
import {
  getAnnualPeriods,
  getAnnualTimelineForPeriod,
  getPeriodTimeStatus,
  parseStrategicDate,
} from "@/lib/strategic-periods/periodDates";

const getStatusIcon = (period: StrategicPeriod, now: Date) => {
  const status = getPeriodTimeStatus(period, now);

  if (status === "future") {
    return (
      <Image
        src="/images/choose-strategy/crown.png"
        alt="future"
        width={48}
        height={48}
      />
    );
  } else if (status === "current") {
    return (
      <Image
        src="/images/choose-strategy/award.png"
        alt="current"
        width={48}
        height={48}
      />
    );
  } else {
    return (
      <Image
        src="/images/choose-strategy/stars.png"
        alt="past"
        width={48}
        height={48}
      />
    );
  }
};

const getStatusTitle = (period: StrategicPeriod, now: Date) => {
  const status = getPeriodTimeStatus(period, now);
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDateRange = (startDate: string, endDate: string) => {
  const start = parseStrategicDate(startDate);
  const end = parseStrategicDate(endDate);

  const startFormatted = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const endFormatted = end.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return `${startFormatted} - ${endFormatted}`;
};

export default function StrategyPeriodGrid() {
  const user = useAuthStore((state) => state.user);
  const { strategicPeriods, loading, error, refetch } =
    useActiveStrategicPlanPeriods();
  const { removeStrategicPeriod } = useStrategicPeriodMutations();
  const router = useRouter();
  const { selectPeriodWithTimeline } = useStrategicPeriodStore();
  const canManagePeriods = user?.role === "SUPER_ADMIN";
  const annualPeriods = getAnnualPeriods(strategicPeriods);
  const now = new Date();

  const handlePeriodSelect = (period: StrategicPeriod) => {
    // Update store (which also syncs to sessionStorage)
    selectPeriodWithTimeline(
      period,
      getAnnualTimelineForPeriod(period, strategicPeriods),
    );
    // Only super admins continue into setup; all other roles use periods read-only.
    if (canManagePeriods) {
      router.push("/setup/objectives");
    } else {
      router.push("/dashboard");
    }
  };

  const handlePeriodDelete = async (period: StrategicPeriod) => {
    try {
      await removeStrategicPeriod({
        id: period.strategicPeriodId,
      });
      await refetch(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting period:", error);
      throw error; // Let the DeleteDialog handle the error
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl h-72"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">Error loading strategic periods</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {error.message || "Failed to load strategic periods"}
          </p>
        </div>
      </div>
    );
  }

  if (annualPeriods.length === 0) {
    return (
      <div className="w-full flex justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            No annual strategic periods found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {canManagePeriods
              ? "Create an annual strategic period to get started"
              : "No annual periods are available for the active strategic plan"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
        {annualPeriods.map((period) => (
          <StrategyPeriodCard
            key={period.strategicPeriodId}
            icon={getStatusIcon(period, now)}
            title={period.name}
            context={getStatusTitle(period, now)}
            date={formatDateRange(period.startDate, period.endDate)}
            onClick={() => handlePeriodSelect(period)}
            onDelete={
              canManagePeriods ? () => handlePeriodDelete(period) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
