"use client";
import StrategyPeriodCard from "./StrategyPeriodCard";
import Image from "next/image";
import { useStrategicPeriods } from "@/hooks/objectives/useStrategicPeriods";
import { useStrategicPeriodMutations } from "@/hooks/objectives/useStrategicPeriodMutations";
import { useRouter } from "next/navigation";
import { StrategicPeriod } from "@/types/graphql";
import { useStrategicPeriodStore, useAuthStore } from "@/stores";

const getStatusIcon = (period: StrategicPeriod, now: Date) => {
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  if (now < startDate) {
    return (
      <Image
        src="/images/choose-strategy/crown.png"
        alt="future"
        width={48}
        height={48}
      />
    );
  } else if (now >= startDate && now <= endDate) {
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
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  if (now < startDate) {
    return "Future";
  } else if (now >= startDate && now <= endDate) {
    return "Current";
  } else {
    return "Past";
  }
};

const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

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
  const { strategicPeriods, loading, error, refetch } = useStrategicPeriods();
  const { removeStrategicPeriod } = useStrategicPeriodMutations();
  const router = useRouter();
  const { setSelectedPeriod } = useStrategicPeriodStore();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const now = new Date();

  const handlePeriodSelect = (period: StrategicPeriod) => {
    // Update store (which also syncs to sessionStorage)
    setSelectedPeriod(period);
    router.push("/dashboard");
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

  if (strategicPeriods.length === 0) {
    return (
      <div className="w-full flex justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            No strategic periods found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Create your first strategic period to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
        {strategicPeriods.map((period) => (
          <StrategyPeriodCard
            key={period.strategicPeriodId}
            icon={getStatusIcon(period, now)}
            title={getStatusTitle(period, now)}
            date={formatDateRange(period.startDate, period.endDate)}
            onClick={() => handlePeriodSelect(period)}
            period={period}
            onDelete={isAdmin ? () => handlePeriodDelete(period) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
