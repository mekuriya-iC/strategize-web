"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStrategicPeriods } from "@/hooks/objectives/useStrategicPeriods";
import { StrategicPeriod } from "@/types/graphql";
import { useEffect, useState } from "react";
import { useStrategicPeriodStore, useAuthStore } from "@/stores";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StrategicPeriodSelectorProps {
  className?: string;
}

const formatPeriodLabel = (period: StrategicPeriod) => {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  return `${startYear}/${endYear.toString().slice(-2)}`;
};

const getPeriodStatus = (period: StrategicPeriod): "current" | "future" | "past" => {
  const now = new Date();
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  if (now < startDate) return "future";
  if (now >= startDate && now <= endDate) return "current";
  return "past";
};

export default function StrategicPeriodSelector({
  className = "",
}: StrategicPeriodSelectorProps) {
  const { strategicPeriods, loading } = useStrategicPeriods();
  const { selectedPeriod, setSelectedPeriod } = useStrategicPeriodStore();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [selectedValue, setSelectedValue] = useState<string>("");

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (selectedPeriod) {
      setSelectedValue(selectedPeriod.strategicPeriodId);
    }
  }, [selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    if (value === "manage-periods") {
      router.push("/strategy-period");
      return;
    }

    const period = strategicPeriods.find((p) => p.strategicPeriodId === value);
    if (!period) return;

    setSelectedPeriod(period);
    setSelectedValue(value);
    
    const label = formatPeriodLabel(period);
    toast.success(`Switched to strategy period ${label}`);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (strategicPeriods.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedValue || selectedPeriod?.strategicPeriodId}
      onValueChange={handlePeriodChange}
    >
      <SelectTrigger className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border-none hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}>
        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          Strategic Periods
        </div>
        {strategicPeriods.map((period) => {
          const status = getPeriodStatus(period);
          return (
            <SelectItem
              key={period.strategicPeriodId}
              value={period.strategicPeriodId}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <span>{formatPeriodLabel(period)}</span>
                {status === "current" && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                    Current
                  </span>
                )}
                {status === "future" && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    Future
                  </span>
                )}
                {status === "past" && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                    Past
                  </span>
                )}
              </div>
            </SelectItem>
          );
        })}
        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
        <SelectItem value="manage-periods" className="text-primary font-medium">
          <div className="flex items-center gap-2">
            <Plus size={16} />
            {isAdmin ? "Manage Periods" : "View All Periods"}
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
