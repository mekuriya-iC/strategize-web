import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  change: string;
  isPositive: boolean;
  icon?: ReactNode;
}

export default function AnalyticsCard({
  title,
  value,
  change,
  isPositive,
  icon,
}: AnalyticsCardProps) {
  return (
    <Card className="p-5 rounded-xl border border-[#E2E8F0] shadow-[0_3.6px_90px_4.5px_rgba(0,0,0,0.07)] flex flex-col gap-2 min-w-[180px] min-h-[110px] bg-white dark:bg-[#18181b]">
      {/* Top row: Icon and Title */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400 dark:text-gray-200">{icon}</span>
        <span className="text-sm text-gray-700 dark:text-gray-100 font-medium">
          {title}
        </span>
      </div>
      {/* Middle row: Value and Change Badge */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPositive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {change}
        </span>
      </div>
    </Card>
  );
}
