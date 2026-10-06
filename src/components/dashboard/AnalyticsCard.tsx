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
  href?: string;
  disabled?: boolean;
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
      <Card className="flex min-h-[108px] min-w-[170px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-zinc-900/80">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="h-7 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
      </Card>
    );
  }

  const cardContent = (
    <Card
      className={`group relative flex min-h-[108px] min-w-[170px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-4.5 shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-white/[0.08] dark:from-zinc-900 dark:to-zinc-900/60 ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5 dark:hover:border-indigo-400/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          {title}
        </span>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50/80 text-indigo-600 transition-colors duration-200 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/50 dark:text-indigo-400 dark:group-hover:bg-indigo-500 dark:group-hover:text-white">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-zinc-100 sm:text-3xl">
          {value}
        </span>
        {change && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </Card>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className="block transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

