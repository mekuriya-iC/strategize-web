"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Users, User, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiMode = "AGGREGATED" | "DIRECT" | "HYBRID";

interface KpiModeBadgeProps {
  mode?: KpiMode | string | null;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const MODE_CONFIG = {
  AGGREGATED: {
    label: "Aggregated",
    icon: Users,
    color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    description: "Team Results",
  },
  DIRECT: {
    label: "Direct",
    icon: User,
    color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    description: "Personal Work",
  },
  HYBRID: {
    label: "Hybrid",
    icon: GitMerge,
    color: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    description: "Shared Responsibility",
  },
};

export function KpiModeBadge({ 
  mode = "AGGREGATED", 
  className, 
  showIcon = true,
  size = "sm" 
}: KpiModeBadgeProps) {
  const modeKey = (mode && mode in MODE_CONFIG ? mode : "AGGREGATED") as KpiMode;
  const config = MODE_CONFIG[modeKey];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.color,
        sizeClasses[size],
        "font-medium",
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], "mr-1")} />}
      {config.label}
    </Badge>
  );
}

interface KpiModeIndicatorProps {
  mode?: KpiMode | string | null;
  managerRetentionPercent?: number | null;
  showDetails?: boolean;
  className?: string;
}

export function KpiModeIndicator({ 
  mode = "AGGREGATED", 
  managerRetentionPercent,
  showDetails = false,
  className 
}: KpiModeIndicatorProps) {
  const modeKey = (mode && mode in MODE_CONFIG ? mode : "AGGREGATED") as KpiMode;
  const config = MODE_CONFIG[modeKey];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <KpiModeBadge mode={mode} />
      {showDetails && mode === "HYBRID" && managerRetentionPercent && (
        <span className="text-xs text-muted-foreground">
          ({managerRetentionPercent}% manager / {100 - managerRetentionPercent}% team)
        </span>
      )}
    </div>
  );
}

export default KpiModeBadge;
