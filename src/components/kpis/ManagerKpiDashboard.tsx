"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, User, GitMerge, Plus, TrendingUp, Target } from "lucide-react";
import { KpiModeBadge, type KpiMode } from "./KpiModeBadge";
import { cn } from "@/lib/utils";

interface Kpi {
  kpiId: string;
  name: string;
  description?: string;
  targetValue: number;
  measurementUnit: string;
  weight?: number;
  kpiMode?: KpiMode;
  managerRetentionPercent?: number;
  // Add more fields as needed
}

interface ManagerKpiDashboardProps {
  kpis: Kpi[];
  currentUserId?: string;
  onCreateKpi?: () => void;
  onViewKpi?: (kpiId: string) => void;
  className?: string;
}

export function ManagerKpiDashboard({ 
  kpis = [], 
  currentUserId,
  onCreateKpi,
  onViewKpi,
  className 
}: ManagerKpiDashboardProps) {
  const groupedKpis = useMemo(() => {
    const aggregated = kpis.filter(k => !k.kpiMode || k.kpiMode === "AGGREGATED");
    const direct = kpis.filter(k => k.kpiMode === "DIRECT");
    const hybrid = kpis.filter(k => k.kpiMode === "HYBRID");

    return { aggregated, direct, hybrid };
  }, [kpis]);

  const stats = useMemo(() => ({
    totalKpis: kpis.length,
    aggregatedCount: groupedKpis.aggregated.length,
    directCount: groupedKpis.direct.length,
    hybridCount: groupedKpis.hybrid.length,
    totalWeight: kpis.reduce((sum, k) => sum + (k.weight || 0), 0),
  }), [kpis, groupedKpis]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKpis}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWeight}% total weight
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Results</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aggregatedCount}</div>
            <p className="text-xs text-muted-foreground">
              Aggregated KPIs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Work</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.directCount}</div>
            <p className="text-xs text-muted-foreground">
              Direct KPIs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared</CardTitle>
            <GitMerge className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hybridCount}</div>
            <p className="text-xs text-muted-foreground">
              Hybrid KPIs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Tabs by Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My KPIs</CardTitle>
              <CardDescription>
                Performance indicators organized by tracking mode
              </CardDescription>
            </div>
            {onCreateKpi && (
              <Button onClick={onCreateKpi} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add KPI
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({stats.totalKpis})
              </TabsTrigger>
              <TabsTrigger value="aggregated">
                <Users className="mr-2 h-4 w-4" />
                Team ({stats.aggregatedCount})
              </TabsTrigger>
              <TabsTrigger value="direct">
                <User className="mr-2 h-4 w-4" />
                Direct ({stats.directCount})
              </TabsTrigger>
              <TabsTrigger value="hybrid">
                <GitMerge className="mr-2 h-4 w-4" />
                Hybrid ({stats.hybridCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              <KpiList kpis={kpis} onViewKpi={onViewKpi} />
            </TabsContent>

            <TabsContent value="aggregated" className="space-y-4 mt-4">
              <div className="mb-4 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Team Results KPIs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your performance is calculated from your team's achievements. Focus on enabling, coaching, and removing blockers.
                </p>
              </div>
              <KpiList kpis={groupedKpis.aggregated} onViewKpi={onViewKpi} emptyMessage="No aggregated KPIs" />
            </TabsContent>

            <TabsContent value="direct" className="space-y-4 mt-4">
              <div className="mb-4 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Direct Work KPIs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Log your personal achievements for these KPIs. Examples: partnerships, board reporting, strategic initiatives.
                </p>
              </div>
              <KpiList kpis={groupedKpis.direct} onViewKpi={onViewKpi} emptyMessage="No direct KPIs" />
            </TabsContent>

            <TabsContent value="hybrid" className="space-y-4 mt-4">
              <div className="mb-4 p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <GitMerge className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Hybrid KPIs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shared responsibility: you log achievements for your retained portion, and your team contributes the rest.
                </p>
              </div>
              <KpiList kpis={groupedKpis.hybrid} onViewKpi={onViewKpi} showHybridSplit emptyMessage="No hybrid KPIs" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface KpiListProps {
  kpis: Kpi[];
  onViewKpi?: (kpiId: string) => void;
  showHybridSplit?: boolean;
  emptyMessage?: string;
}

function KpiList({ kpis, onViewKpi, showHybridSplit, emptyMessage = "No KPIs found" }: KpiListProps) {
  if (kpis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Target className="mx-auto h-12 w-12 mb-3 opacity-20" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.kpiId}
          className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => onViewKpi?.(kpi.kpiId)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{kpi.name}</h4>
                <KpiModeBadge mode={kpi.kpiMode} size="sm" />
                {kpi.weight && (
                  <Badge variant="secondary" className="text-xs">
                    {kpi.weight}%
                  </Badge>
                )}
              </div>
              {kpi.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {kpi.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Target: {kpi.targetValue} {kpi.measurementUnit}</span>
                {showHybridSplit && kpi.kpiMode === "HYBRID" && kpi.managerRetentionPercent && (
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {kpi.managerRetentionPercent}% manager / {100 - kpi.managerRetentionPercent}% team
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {/* Add actual progress here when available */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ManagerKpiDashboard;
