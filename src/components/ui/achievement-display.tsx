/**
 * Achievement Display Component
 * 
 * Displays achievement percentage with hybrid approach:
 * - Shows capped achievement at 150% for consistent rating scale
 * - Shows bonus-eligible percentage when achievement exceeds 150%
 * 
 * Example: "150% (+50% bonus eligible)"
 */

import { cn } from "@/lib/utils";

interface AchievementDisplayProps {
  displayAchievement: number;
  bonusEligiblePercentage: number;
  isBonusEligible: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showBonusLabel?: boolean;
  className?: string;
}

export function AchievementDisplay({
  displayAchievement,
  bonusEligiblePercentage,
  isBonusEligible,
  size = "md",
  showBonusLabel = true,
  className,
}: AchievementDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  const bonusClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      <span className={cn("font-semibold", sizeClasses[size])}>
        {displayAchievement.toFixed(1)}%
      </span>
      {isBonusEligible && (
        <span
          className={cn(
            "font-medium text-green-600 dark:text-green-400",
            bonusClasses[size]
          )}
          title={`Earned ${bonusEligiblePercentage.toFixed(1)}% beyond the 150% achievement cap`}
        >
          (+{bonusEligiblePercentage.toFixed(1)}%{showBonusLabel && " bonus"})
        </span>
      )}
    </div>
  );
}

/**
 * Simple achievement badge variant
 */
export function AchievementBadge({
  displayAchievement,
  isBonusEligible,
  className,
}: Pick<
  AchievementDisplayProps,
  "displayAchievement" | "isBonusEligible" | "className"
>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isBonusEligible
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : displayAchievement >= 100
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        className
      )}
    >
      {displayAchievement.toFixed(1)}%
      {isBonusEligible && (
        <span className="text-[10px] opacity-75">+bonus</span>
      )}
    </div>
  );
}
