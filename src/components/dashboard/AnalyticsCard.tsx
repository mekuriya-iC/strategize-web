import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ReactNode } from "react";

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  change?: string;
  isPositive?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  href?: string; // optional navigation target
  disabled?: boolean; // optional disabled state
}

export default function AnalyticsCard({
  title,
  value,
  change,
  isPositive = true,
  icon,
  loading = false,
  href,
  disabled = false,
}: AnalyticsCardProps) {
  if (loading) {
    return (
      <Card className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 min-w-[180px] min-h-[110px] bg-white dark:bg-[#18181b]">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          {/* Top row skeleton */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          {/* Bottom row skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="w-12 h-5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          </div>
        </div>
      </Card>
    );
  }

  const content = (
    <Card
      className={`p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 min-w-[180px] min-h-[110px] bg-white dark:bg-[#18181b] ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-md transition-shadow"
      }`}
    >
      {/* Top row: Icon and Title */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-400 dark:text-slate-200">{icon}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {title}
        </span>
      </div>
      {/* Middle row: Value and Change Badge */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {value}
        </span>
        {change && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isPositive
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </Card>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
