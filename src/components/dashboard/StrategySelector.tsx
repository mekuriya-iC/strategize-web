"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStrategicPeriods } from "@/hooks/useStrategicPeriods";
import { StrategicPeriod } from "@/types/graphql";
import { useEffect, useState } from "react";
import React from "react";
import { useStrategicPeriodStore } from "@/stores";

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
  const { strategicPeriods, loading } = useStrategicPeriods();
  const { selectedPeriod: storeSelectedPeriod, setSelectedPeriod: storeSetPeriod } = useStrategicPeriodStore();
  const [selectedPeriod, setSelectedPeriod] = useState<StrategicPeriod | null>(
    null
  );
  const [selectedValue, setSelectedValue] = useState<string>("");

  useEffect(() => {
    if (storeSelectedPeriod) {
      setSelectedPeriod(storeSelectedPeriod);
      setSelectedValue(storeSelectedPeriod.strategicPeriodId);
    }
  }, [storeSelectedPeriod]);

  const handlePeriodChange = (value: string) => {
    const period = strategicPeriods.find((p) => p.strategicPeriodId === value);
    if (!period) return;

    setSelectedPeriod(period);
    setSelectedValue(value);

    storeSetPeriod(period);

    onChange?.(value);
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={`w-full ${className}`}>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
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
      </SelectContent>
    </Select>
  );
}
