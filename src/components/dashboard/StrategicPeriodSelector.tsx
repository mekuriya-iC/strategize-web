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
import { useEffect, useState, useMemo } from "react";
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

const getQuarterLabel = (period: StrategicPeriod): string => {
  const start = new Date(period.startDate);
  const month = start.getMonth(); // 0-11
  
  // Determine quarter based on start month
  if (month >= 0 && month <= 2) return "Q1";
  if (month >= 3 && month <= 5) return "Q2";
  if (month >= 6 && month <= 8) return "Q3";
  return "Q4";
};

export default function StrategicPeriodSelector({
  className = "",
}: StrategicPeriodSelectorProps) {
  const { strategicPeriods, loading } = useStrategicPeriods();
  const { selectedPeriod, setSelectedPeriod } = useStrategicPeriodStore();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Extract unique years from periods
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    strategicPeriods.forEach((period) => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      years.add(formatPeriodLabel(period));
    });
    return Array.from(years).sort();
  }, [strategicPeriods]);

  // Get quarters available for selected year
  const availableQuarters = useMemo(() => {
    if (!selectedYear) return [];
    
    const periodsForYear = strategicPeriods.filter((period) => {
      const label = formatPeriodLabel(period);
      return label === selectedYear;
    });

    const quarters = periodsForYear
      .filter((p) => p.periodType?.toLowerCase() === "quarterly")
      .map((p) => ({
        label: getQuarterLabel(p),
        value: p.strategicPeriodId,
        period: p,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return quarters;
  }, [selectedYear, strategicPeriods]);

  useEffect(() => {
    if (selectedPeriod) {
      setSelectedValue(selectedPeriod.strategicPeriodId);
      const yearLabel = formatPeriodLabel(selectedPeriod);
      setSelectedYear(yearLabel);
      
      if (selectedPeriod.periodType?.toLowerCase() === "quarterly") {
        setSelectedQuarter(selectedPeriod.strategicPeriodId);
      } else {
        setSelectedQuarter("");
      }
    }
  }, [selectedPeriod]);

  const handleYearChange = (yearLabel: string) => {
    setSelectedYear(yearLabel);
    
    // Find the best period for this year with priority:
    // 1. Active status period
    // 2. Current period by date
    // 3. Annual period
    // 4. First quarterly period
    const periodsForYear = strategicPeriods.filter((p) => formatPeriodLabel(p) === yearLabel);
    
    const activePeriod = periodsForYear.find((p) => p.status?.toUpperCase() === "ACTIVE");
    const currentPeriod = periodsForYear.find((p) => getPeriodStatus(p) === "current");
    const annualPeriod = periodsForYear.find((p) => p.periodType?.toLowerCase() === "annual");
    
    const periodToSelect = activePeriod || currentPeriod || annualPeriod || periodsForYear[0];
    
    if (periodToSelect) {
      setSelectedPeriod(periodToSelect);
      setSelectedValue(periodToSelect.strategicPeriodId);
      
      if (periodToSelect.periodType?.toLowerCase() === "quarterly") {
        setSelectedQuarter(periodToSelect.strategicPeriodId);
      } else {
        setSelectedQuarter("");
      }
      
      const periodLabel = periodToSelect.periodType?.toLowerCase() === "quarterly" 
        ? `${getQuarterLabel(periodToSelect)} ${yearLabel}`
        : yearLabel;
      toast.success(`Switched to ${periodLabel}`);
    }
  };

  const handleQuarterChange = (periodId: string) => {
    const period = strategicPeriods.find((p) => p.strategicPeriodId === periodId);
    if (!period) return;

    setSelectedPeriod(period);
    setSelectedValue(periodId);
    setSelectedQuarter(periodId);
    
    const quarter = getQuarterLabel(period);
    toast.success(`Switched to ${quarter} ${selectedYear}`);
  };

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
    <div className="flex items-center gap-2">
      {/* Year Selector */}
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border-none hover:bg-gray-100 dark:hover:bg-gray-700 w-32 ${className}`}>
          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Select Year
          </div>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year}>
              <div className="flex items-center justify-between w-full gap-3">
                <span>{year}</span>
                {selectedYear === year && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    Selected
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <SelectItem value="manage-periods" className="text-primary font-medium">
            <div className="flex items-center gap-2">
              <Plus size={16} />
              {isAdmin ? "Manage Periods" : "View All Periods"}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Quarter Selector - Only show if there are quarters for selected year */}
      {availableQuarters.length > 0 && (
        <Select value={selectedQuarter} onValueChange={handleQuarterChange}>
          <SelectTrigger className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border-none hover:bg-gray-100 dark:hover:bg-gray-700 w-28">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Select Quarter
            </div>
            {availableQuarters.map((quarter) => {
              const status = getPeriodStatus(quarter.period);
              return (
                <SelectItem key={quarter.value} value={quarter.value}>
                  <div className="flex items-center justify-between w-full gap-3">
                    <span>{quarter.label}</span>
                    {status === "current" && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
