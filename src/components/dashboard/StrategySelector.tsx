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
import React from "react";
import { useStrategicPeriodStore } from "@/stores";
import NewStrategyPeriodModal from "./NewStrategyPeriodModal";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface StrategySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const formatPeriodLabel = (period: StrategicPeriod) => {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  return `Strategy ${startYear}/${endYear.toString().slice(-2)}`;
};

export default function StrategySelector({
  value,
  onChange,
  className = "",
}: StrategySelectorProps) {
  const [mounted, setMounted] = useState(false);
  const { strategicPeriods, loading } = useStrategicPeriods();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { selectedPeriod: storeSelectedPeriod, setSelectedPeriod: storeSetPeriod } = useStrategicPeriodStore();
  const [selectedPeriod, setSelectedPeriod] = useState<StrategicPeriod | null>(
    null
  );
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [showNewStrategyModal, setShowNewStrategyModal] = useState(false);

  useEffect(() => {
    if (storeSelectedPeriod) {
      setSelectedPeriod(storeSelectedPeriod);
      setSelectedValue(storeSelectedPeriod.strategicPeriodId);
    }
  }, [storeSelectedPeriod]);

  const handlePeriodChange = (value: string) => {
    if (value === "new-strategy") {
      setShowNewStrategyModal(true);
      return;
    }

    const period = strategicPeriods.find((p) => p.strategicPeriodId === value);
    if (!period) return;

    setSelectedPeriod(period);
    setSelectedValue(value);

    storeSetPeriod(period);

    onChange?.(value);
  };

  const handleAddNewStrategy = (startDate: Date, timelineYears: number) => {
    // Calculate end date based on timeline years
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + timelineYears);

    toast.success(`New strategy period created: ${startDate.getFullYear()}/${endDate.getFullYear().toString().slice(-2)}`);
    
    // TODO: Call API to create new strategic period
    // For now, just close the modal
    setShowNewStrategyModal(false);
  };

  if (!mounted || loading) {
    return (
      <div className={`h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ${className}`}>
        <span className="text-muted-foreground">
          {loading ? "Loading..." : ""}
        </span>
      </div>
    );
  }

  return (
    <>
      <Select
        value={selectedValue || selectedPeriod?.strategicPeriodId || value}
        onValueChange={handlePeriodChange}
        defaultValue={
          selectedValue ||
          selectedPeriod?.strategicPeriodId ||
          strategicPeriods[0]?.strategicPeriodId
        }
      >
        <SelectTrigger className={`w-full ${className}`}>
          <SelectValue placeholder="Select strategy period" />
        </SelectTrigger>
        <SelectContent>
          {strategicPeriods.map((period) => (
            <SelectItem
              key={period.strategicPeriodId}
              value={period.strategicPeriodId}
            >
              {formatPeriodLabel(period)}
            </SelectItem>
          ))}
          <SelectItem value="new-strategy" className="text-primary font-medium">
            <div className="flex items-center gap-2">
              <Plus size={16} />
              New Strategy
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <NewStrategyPeriodModal
        isOpen={showNewStrategyModal}
        onClose={() => setShowNewStrategyModal(false)}
        onAdd={handleAddNewStrategy}
      />
    </>
  );
}
