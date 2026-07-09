"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Building2, Building, User } from "lucide-react";
import type {
  KpiWithContributors,
  KpiContributor,
} from "@/hooks/kpi-weight/useHierarchicalKpiContributions";
import { KpiModeBadge } from "@/components/kpis/KpiModeBadge";

interface KpiContributorCardProps {
  kpi: KpiWithContributors;
  onContributorClick?: (contributor: KpiContributor) => void;
  showDrillDown?: boolean;
}

export function KpiContributorCard({
  kpi,
  onContributorClick,
  showDrillDown = true,
}: KpiContributorCardProps) {
  const getContributorIcon = (type: string) => {
    switch (type) {
      case "DIVISION":
        return <Building2 className="h-4 w-4" />;
      case "DEPARTMENT":
        return <Building className="h-4 w-4" />;
      case "EMPLOYEE":
        return <User className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getContributorColor = (achievementPercentage: number) => {
    if (achievementPercentage >= 100) return "text-green-600";
    if (achievementPercentage >= 80) return "text-blue-600";
    if (achievementPercentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const achievementPercentage =
    parseFloat(String(kpi.achievementPercentage)) || 0;
  const totalWeight = parseFloat(String(kpi.totalWeight)) || 0;
  const targetValue = parseFloat(String(kpi.targetValue)) || 0;
  const achievedValue = parseFloat(String(kpi.achievedValue)) || 0;
  const kpiMode = kpi.kpiMode || "AGGREGATED";
  const managerRetentionPercent =
    parseFloat(String(kpi.managerRetentionPercent ?? 0)) || 0;
  const teamPercent = 100 - managerRetentionPercent;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{kpi.kpiName}</CardTitle>
              <KpiModeBadge mode={kpiMode as any} size="sm" />
              {kpiMode === "HYBRID" && (
                <Badge variant="outline" className="text-xs">
                  {managerRetentionPercent.toFixed(0)}% manager /{" "}
                  {teamPercent.toFixed(0)}% team
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Weight: {totalWeight.toFixed(1)}%</span>
              <span>•</span>
              <span>Target: {targetValue.toLocaleString()}</span>
              <span>•</span>
              <span>Achieved: {achievedValue.toLocaleString()}</span>
            </div>
          </div>
          <Badge
            variant={
              achievementPercentage >= 100
                ? "default"
                : achievementPercentage >= 80
                  ? "secondary"
                  : "destructive"
            }
            className="text-base px-3 py-1"
          >
            {achievementPercentage.toFixed(1)}%
          </Badge>
        </div>
        <Progress
          value={Math.min(achievementPercentage, 100)}
          className="h-2 mt-3"
        />
      </CardHeader>

      <CardContent className="pt-6">
        {!kpi.hasContributors ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No Cascaded Contributors</p>
            <p className="text-xs mt-1">
              This KPI is directly assigned without breakdown
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Contributors ({kpi.contributors.length})
              </h4>
              <span className="text-xs text-muted-foreground">
                Weight Contribution
              </span>
            </div>

            {kpi.contributors.map((contributor) => {
              const contribAchievementPercentage =
                parseFloat(String(contributor.achievementPercentage)) || 0;
              const contribParentWeight =
                parseFloat(String(contributor.parentWeightAllocation)) || 0;
              const contribTargetValue =
                parseFloat(String(contributor.targetValue)) || 0;
              const contribAchievedValue =
                parseFloat(String(contributor.achievedValue)) || 0;
              const contribWeightContribution =
                parseFloat(String(contributor.weightContribution)) || 0;

              return (
                <div
                  key={contributor.contributorId}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-md">
                        {getContributorIcon(contributor.contributorType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium truncate">
                            {contributor.contributorName}
                          </h5>
                          <Badge variant="outline" className="text-xs">
                            {contributor.contributorType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            {contribAchievedValue.toLocaleString()} /{" "}
                            {contribTargetValue.toLocaleString()}
                          </span>
                          <span
                            className={getContributorColor(
                              contribAchievementPercentage,
                            )}
                          >
                            ({contribAchievementPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {contribWeightContribution.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          of {contribParentWeight.toFixed(1)}%
                        </div>
                      </div>
                      {showDrillDown &&
                        onContributorClick &&
                        contributor.contributorType !== "EMPLOYEE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onContributorClick(contributor)}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </div>

                  <Progress
                    value={Math.min(contribAchievementPercentage, 100)}
                    className="h-1.5"
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
