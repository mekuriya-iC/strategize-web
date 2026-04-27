import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ReactNode } from "react";

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  change: string;
  isPositive: boolean;
  icon?: ReactNode;
  loading?: boolean;
  href?: string; // optional navigation target
  disabled?: boolean; // optional disabled state
}

export default function AnalyticsCard({
  title,
  value,
  change,
  isPositive,
  icon,
  loading = false,
  href,
  disabled = false,
}: AnalyticsCardProps) {
  if (loading) {
    return (
      <Card className="p-5 rounded-xl border border-[#E2E8F0] dark:border-gray-800 shadow-[0_3.6px_90px_4.5px_rgba(0,0,0,0.07)] flex flex-col gap-2 min-w-[180px] min-h-[110px] bg-white dark:bg-[#18181b]">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          {/* Top row skeleton */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          {/* Bottom row skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-12 h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </Card>
    );
  }

  const content = (
    <Card
      className={`p-5 rounded-xl border border-[#E2E8F0] dark:border-gray-800 shadow-[0_3.6px_90px_4.5px_rgba(0,0,0,0.07)] flex flex-col gap-2 min-w-[180px] min-h-[110px] bg-white dark:bg-[#18181b] ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-md transition"
      }`}
    >
      {/* Top row: Icon and Title */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400 dark:text-gray-200">{icon}</span>
        <span className="text-xl text-[#09090B] dark:text-gray-100 font-medium">
          {title}
        </span>
      </div>
      {/* Middle row: Value and Change Badge */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-[#3838EC] dark:text-gray-100">
          {value}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPositive
              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
          }`}
        >
          {change}
        </span>
      </div>
    </Card>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
