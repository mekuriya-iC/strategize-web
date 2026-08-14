"use client";

import React from "react";
import { useQuery } from "@apollo/client";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GET_MY_FLAGGED_KPI_COUNT } from "@/lib/graphql/queries/kpi-performance";

/**
 * Flagged KPI Badge Component
 * 
 * Displays a warning badge when employee has KPIs flagged for poor performance
 * (5+ consecutive weeks unmet)
 * 
 * Shows:
 * - Count of flagged KPIs
 * - Warning icon
 * - Tooltip with details
 * 
 * Used in: Dashboard header, navigation, KPI pages
 */
export function FlaggedKpiBadge() {
  const { data, loading, error } = useQuery(GET_MY_FLAGGED_KPI_COUNT, {
    pollInterval: 60000, // Refresh every minute
  });

  // Don't show badge if no flagged KPIs
  if (loading || error || !data?.myFlaggedKpiCount || data.myFlaggedKpiCount === 0) {
    return null;
  }

  const count = data.myFlaggedKpiCount;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="destructive"
            className="flex items-center gap-1 cursor-pointer hover:bg-red-700"
          >
            <AlertCircle className="h-3 w-3" />
            <span>{count} KPI{count > 1 ? "s" : ""} Need Attention</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold">⚠️ Performance Alert</p>
          <p className="text-sm mt-1">
            You have {count} KPI{count > 1 ? "s" : ""} that {count > 1 ? "have" : "has"} been 
            unmet for 5 or more consecutive weeks.
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Click to view details and take action
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Supervisor Team Flagged KPI Badge
 * 
 * Shows count of flagged KPIs across supervisor's team
 * Used in supervisor dashboard
 */
export function TeamFlaggedKpiBadge() {
  const { data, loading, error } = useQuery(
    gql`
      query GetTeamFlaggedKpiCount {
        teamFlaggedKpiCount
      }
    `,
    {
      pollInterval: 60000,
    }
  );

  if (loading || error || !data?.teamFlaggedKpiCount || data.teamFlaggedKpiCount === 0) {
    return null;
  }

  const count = data.teamFlaggedKpiCount;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-orange-500 text-orange-600 cursor-pointer hover:bg-orange-50"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Team: {count} Flagged KPI{count > 1 ? "s" : ""}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold">👥 Team Performance Alert</p>
          <p className="text-sm mt-1">
            {count} KPI{count > 1 ? "s" : ""} in your team {count > 1 ? "need" : "needs"} attention
            (unmet for 5+ weeks)
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Click to review team performance
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Import gql from @apollo/client for the inline query
import { gql } from "@apollo/client";
