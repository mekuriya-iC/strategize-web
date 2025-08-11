"use client";
import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StrategicPeriod } from "@/types/graphql";
import { useStrategicPeriod } from "@/context/StrategicPeriodContext";

export interface YearSelectorProps {
  period: StrategicPeriod;
  className?: string;
}

function buildYearRanges(period: StrategicPeriod): string[] {
  const startYear = new Date(period.startDate).getFullYear();
  const endYear = new Date(period.endDate).getFullYear();
  const years: string[] = [];
  for (let y = startYear; y < endYear; y += 1) {
    const next = (y + 1).toString().slice(-2);
    years.push(`${y}/${next}`);
  }
  return years;
}

export default function YearSelector({
  period,
  className = "",
}: YearSelectorProps) {
  const { selected, setSelected } = useStrategicPeriod();

  const options = useMemo(() => buildYearRanges(period), [period]);

  const value =
    selected?.annualTimeline && options.includes(selected.annualTimeline)
      ? selected.annualTimeline
      : options[0];

  const handleChange = (val: string) => {
    // Update shared year; KPI form listens and syncs all target timelines
    setSelected({ period, annualTimeline: val });
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className={`w-48 ${className}`}>
        <SelectValue placeholder="Select year" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { buildYearRanges };
