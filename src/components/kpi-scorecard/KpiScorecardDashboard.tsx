"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import IndividualScorecard from "./IndividualScorecard";
import DepartmentScorecard from "./DepartmentScorecard";
import DivisionScorecard from "./DivisionScorecard";
import CorporateScorecard from "./CorporateScorecard";
import CascadeMappingManager from "./CascadeMappingManager";
import { useAuthStore } from '@/stores';

export default function KpiScorecardDashboard() {
  const { can } = usePermissions();
  const role = useAuthStore((state) => state.user?.role);
  const canManageKpis = role !== 'CEO'; // Preserve existing roles; CEO is an observer.
  const canReadAll = can("evaluations:read_all");

  const [activeTab, setActiveTab] = useState(role === 'CEO' ? 'corporate' : 'individual');
  const [capFinalScore, setCapFinalScore] = useState(false);

  // Fetch active period for display
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 50 },
  });

  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((p: any) => p.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">KPI Scorecard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track and analyze KPI performance across all organizational levels
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            ✨ Scores are calculated automatically from approved logbook entries in real-time
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={capFinalScore}
              onChange={(event) => setCapFinalScore(event.target.checked)}
              className="h-4 w-4"
            />
            Cap final result at 100%
          </label>
        </div>
      </div>

      {/* Information Banner */}
      {activePeriod && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500" />
                <p className="text-sm font-medium">
                  Active Period:{" "}
                  <span className="text-primary">{activePeriod.name}</span>
                </p>
              </div>
              <span className="text-sm text-muted-foreground sm:ml-4">
                {new Date(activePeriod.startDate).toLocaleDateString()} -{" "}
                {new Date(activePeriod.endDate).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Different Scorecard Views */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="w-full">
          <TabsTrigger value="individual" className="shrink-0 text-xs sm:text-sm">
            Individual
          </TabsTrigger>
          <TabsTrigger
            value="department"
            disabled={!canReadAll}
            className="shrink-0 text-xs sm:text-sm"
          >
            Department
          </TabsTrigger>
          <TabsTrigger
            value="division"
            disabled={!canReadAll}
            className="shrink-0 text-xs sm:text-sm"
          >
            Division
          </TabsTrigger>
          <TabsTrigger
            value="corporate"
            disabled={!canReadAll}
            className="shrink-0 text-xs sm:text-sm"
          >
            Corporate
          </TabsTrigger>
          {canManageKpis && <TabsTrigger
            value="mappings"
            className="shrink-0 text-xs sm:text-sm"
          >
            Mappings
          </TabsTrigger>}
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <IndividualScorecard capFinalScore={capFinalScore} />
        </TabsContent>

        <TabsContent value="department" className="space-y-6">
          {canReadAll ? (
            <DepartmentScorecard capFinalScore={capFinalScore} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  You need administrative permissions to view department
                  scorecards.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="division" className="space-y-6">
          {canReadAll ? (
            <DivisionScorecard capFinalScore={capFinalScore} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  You need administrative permissions to view division
                  scorecards.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="corporate" className="space-y-6">
          {canReadAll ? (
            <CorporateScorecard capFinalScore={capFinalScore} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  You need administrative permissions to view corporate
                  scorecards.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mappings" className="space-y-6">
          {canManageKpis ? (
            <CascadeMappingManager />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  You need KPI management permissions to manage cascade
                  mappings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="border-muted">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Understanding KPI Scorecards</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Individual Scorecard</h4>
              <p className="text-muted-foreground">
                View your personal KPI performance based on approved logbook
                entries. Scores are calculated using your assigned targets and
                weights.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Department Scorecard</h4>
              <p className="text-muted-foreground">
                Aggregated performance from individual employees. Department
                actuals are summed from individuals, then scored against
                department targets.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Division Scorecard</h4>
              <p className="text-muted-foreground">
                Executive view aggregating department performance. Division
                actuals are summed from departments, then scored against
                division targets.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Corporate Scorecard</h4>
              <p className="text-muted-foreground">
                Enterprise view aggregating mapped lower-level actuals into
                corporate KPIs, then scoring them against organization-level
                targets.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cascade Mappings</h4>
              <p className="text-muted-foreground">
                Define how KPIs cascade between levels. Map individual KPIs to
                departments, departments to divisions, and divisions to
                corporate for proper aggregation.
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded text-xs">
            <strong>Key Principle:</strong> Actuals cascade upward (Individual →
            Department → Division → Corporate), but scores are calculated
            independently at each level using level-specific targets and
            weights. Formula: Score = Weight × min(Actual / Target, Cap)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
