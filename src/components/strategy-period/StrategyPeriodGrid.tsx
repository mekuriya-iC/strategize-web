"use client";
import StrategyPeriodCard from "./StrategyPeriodCard";
import Image from "next/image";
import { useStrategicPeriods } from "@/hooks/useStrategicPeriods";
import { useStrategicPeriodMutations } from "@/hooks/useStrategicPeriodMutations";
import { useRouter } from "next/navigation";
import { StrategicPeriod } from "@/types/graphql";
import { useStrategicPeriod } from "@/context/StrategicPeriodContext";

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
  const { setSelected } = useStrategicPeriod();
  const now = new Date();

  const handlePeriodSelect = (period: StrategicPeriod) => {
    // Update context (which also syncs to sessionStorage)
    setSelected({ period });
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
      <div className="w-full flex flex-col items-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full max-w-4xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-xl h-64"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">Error loading strategic periods</p>
          <p className="text-sm text-gray-600 mt-2">
            {error.message || "Failed to load strategic periods"}
          </p>
        </div>
      </div>
    );
  }

  if (strategicPeriods.length === 0) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">
            No strategic periods found
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Create your first strategic period to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full max-w-4xl mx-auto">
        {strategicPeriods.map((period) => (
          <StrategyPeriodCard
            key={period.strategicPeriodId}
            icon={getStatusIcon(period, now)}
            title={getStatusTitle(period, now)}
            date={formatDateRange(period.startDate, period.endDate)}
            onClick={() => handlePeriodSelect(period)}
            period={period}
            onDelete={() => handlePeriodDelete(period)}
          />
        ))}
      </div>
    </div>
  );
}
