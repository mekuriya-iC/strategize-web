"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIndividualKpiWeightAchievement } from "@/hooks/kpi-weight/useIndividualKpiWeightAchievement";
import { useTeamKpiWeightAchievement } from "@/hooks/kpi-weight/useTeamKpiWeightAchievement";
import { useUser } from "@/stores/authStore";
import { AlertCircle, TrendingUp, Users, User, Target } from "lucide-react";

interface KpiWeightAchievementDashboardProps {
  periodId: string;
}

export function KpiWeightAchievementDashboard({
  periodId,
}: KpiWeightAchievementDashboardProps) {
  const currentUser = useUser();
  const [activeTab, setActiveTab] = useState<"individual" | "team">(
    "individual",
  );

  // Fetch individual data
  const {
    data: individualData,
    loading: individualLoading,
    error: individualError,
  } = useIndividualKpiWeightAchievement({
    employeeId: currentUser?.employeeId || "",
    periodId,
    skip: !currentUser?.employeeId || !periodId,
  });

  // Fetch team data (if user is a manager)
  const userDepartment = currentUser?.departments?.[0]?.departmentId;
  const {
    data: teamData,
    loading: teamLoading,
    error: teamError,
  } = useTeamKpiWeightAchievement({
    departmentId: userDepartment || "",
    periodId,
    skip: !userDepartment || !periodId || activeTab !== "team",
  });

  const isManager =
    currentUser?.departments && currentUser.departments.length > 0;

  if (!periodId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a strategic period to view KPI weight achievement.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            KPI Weight Achievement
          </h2>
          <p className="text-muted-foreground">
            Real-time tracking of KPI weight achievements using parent weight
            allocations
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "individual" | "team")}
      >
        <TabsList>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Achievement
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Achievement
            </TabsTrigger>
          )}
        </TabsList>

        {/* Individual Tab */}
        <TabsContent value="individual" className="space-y-4">
          {individualLoading ? (
            <LoadingSkeleton />
          ) : individualError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load individual achievement data.{" "}
                {individualError.message}
              </AlertDescription>
            </Alert>
          ) : individualData ? (
            <IndividualAchievementView data={individualData} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No KPI assignments found for the selected period.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Team Tab */}
        {isManager && (
          <TabsContent value="team" className="space-y-4">
            {teamLoading ? (
              <LoadingSkeleton />
            ) : teamError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load team achievement data. {teamError.message}
                </AlertDescription>
              </Alert>
            ) : teamData ? (
              <TeamAchievementView data={teamData} />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No team member data found for the selected period.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function IndividualAchievementView({ data }: { data: any }) {
  // Ensure all numeric values are parsed as numbers
  const totalWeightPossible = parseFloat(data.totalWeightPossible) || 0;
  const totalWeightAchieved = parseFloat(data.totalWeightAchieved) || 0;
  const totalParentContribution = parseFloat(data.totalParentContribution) || 0;
  const achievementPercentage = parseFloat(data.achievementPercentage) || 0;

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Weight Possible
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalWeightPossible.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sum of all KPI weights assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weight Achieved (Local)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalWeightAchieved.toFixed(2)}%
            </div>
            <Progress value={achievementPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {achievementPercentage.toFixed(1)}% achievement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Parent Contribution
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalParentContribution.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Your contribution to manager/department scorecard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Breakdown</CardTitle>
          <CardDescription>
            Detailed view of each KPI's weight achievement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.kpis.map((kpi: any) => {
              const kpiAchievementPercentage =
                parseFloat(kpi.achievementPercentage) || 0;
              const kpiLocalWeight = parseFloat(kpi.localWeight) || 0;
              const kpiParentWeightAllocation =
                parseFloat(kpi.parentWeightAllocation) || 0;
              const kpiTargetValue = parseFloat(kpi.targetValue) || 0;
              const kpiAchievedValue = parseFloat(kpi.achievedValue) || 0;
              const kpiLocalWeightAchieved =
                parseFloat(kpi.localWeightAchieved) || 0;
              const kpiParentWeightContribution =
                parseFloat(kpi.parentWeightContribution) || 0;

              return (
                <div
                  key={kpi.kpiId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{kpi.kpiName}</h4>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <span>Target: {kpiTargetValue}</span>
                        <span>•</span>
                        <span>Achieved: {kpiAchievedValue}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        kpiAchievementPercentage >= 100
                          ? "default"
                          : "secondary"
                      }
                    >
                      {kpiAchievementPercentage.toFixed(1)}%
                    </Badge>
                  </div>

                  <Progress value={Math.min(kpiAchievementPercentage, 100)} />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Local Weight</div>
                      <div className="font-medium">{kpiLocalWeight}%</div>
                      <div className="text-xs text-muted-foreground">
                        Achieved: {kpiLocalWeightAchieved.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        Parent Weight Allocation
                      </div>
                      <div className="font-medium">
                        {kpiParentWeightAllocation}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Contribution: {kpiParentWeightContribution.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TeamAchievementView({ data }: { data: any }) {
  const totalWeightPossible = parseFloat(data.totalWeightPossible) || 0;
  const totalWeightAchieved = parseFloat(data.totalWeightAchieved) || 0;
  const achievementPercentage = parseFloat(data.achievementPercentage) || 0;

  return (
    <>
      {/* Team Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Team Summary</CardTitle>
          <CardDescription>
            Mode-aware department KPI achievement. Employee cards below show
            subordinate contribution details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {totalWeightAchieved.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  out of {totalWeightPossible.toFixed(2)}% possible
                </div>
              </div>
              <Badge
                variant={achievementPercentage >= 80 ? "default" : "secondary"}
                className="text-lg px-4 py-2"
              >
                {achievementPercentage.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={achievementPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <div className="grid gap-4">
        {data.teamMembers.map((member: any) => {
          const memberTotalWeightPossible =
            parseFloat(member.totalWeightPossible) || 0;
          const memberTotalWeightAchieved =
            parseFloat(member.totalWeightAchieved) || 0;
          const memberAchievementPercentage =
            parseFloat(member.achievementPercentage) || 0;

          return (
            <Card key={member.employeeId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {member.employeeName}
                  </CardTitle>
                  <Badge
                    variant={
                      memberAchievementPercentage >= 80
                        ? "default"
                        : "secondary"
                    }
                  >
                    {memberAchievementPercentage.toFixed(1)}%
                  </Badge>
                </div>
                <CardDescription>
                  {memberTotalWeightAchieved.toFixed(2)}% /{" "}
                  {memberTotalWeightPossible.toFixed(2)}% weight achieved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  value={memberAchievementPercentage}
                  className="mb-4"
                />

                <div className="space-y-3">
                  {member.kpis.map((kpi: any) => {
                    const kpiParentWeightAllocation =
                      parseFloat(kpi.parentWeightAllocation) || 0;
                    const kpiTargetValue = parseFloat(kpi.targetValue) || 0;
                    const kpiAchievedValue = parseFloat(kpi.achievedValue) || 0;
                    const kpiAchievementPercentage =
                      parseFloat(kpi.achievementPercentage) || 0;
                    const kpiParentWeightContribution =
                      parseFloat(kpi.parentWeightContribution) || 0;

                    return (
                      <div
                        key={kpi.kpiId}
                        className="flex items-center justify-between text-sm border-b pb-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{kpi.kpiName}</div>
                          <div className="text-xs text-muted-foreground">
                            {kpiAchievedValue} / {kpiTargetValue} (
                            {kpiAchievementPercentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {kpiParentWeightAllocation}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Contrib: {kpiParentWeightContribution.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
