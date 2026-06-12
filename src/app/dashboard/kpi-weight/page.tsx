"use client";

import React from 'react';
import { KpiWeightAchievementDashboard } from '@/components/kpi-weight/KpiWeightAchievementDashboard';
import { HierarchicalKpiDashboard } from '@/components/kpi-weight/HierarchicalKpiDashboard';
import { useStrategicPeriodStore } from '@/stores/strategicPeriodStore';
import { useUser } from '@/stores/authStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, BarChart3, Users } from 'lucide-react';

export default function KpiWeightPage() {
  const { selectedPeriod } = useStrategicPeriodStore();
  const currentUser = useUser();

  if (!selectedPeriod) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a strategic period from the dashboard to view KPI weight achievements.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Loading user information...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Determine if user should see hierarchical view
  const canViewHierarchical = 
    currentUser.role === 'SUPER_ADMIN' || 
    currentUser.role === 'ADMIN' || 
    currentUser.role === 'DIRECTOR' ||
    currentUser.role === 'MANAGER';

  const isManagerOrHigher = canViewHierarchical;

  return (
    <div className="container mx-auto p-6">
      {isManagerOrHigher ? (
        <Tabs defaultValue="hierarchical" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="hierarchical" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Hierarchical View
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Personal View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchical">
            <HierarchicalKpiDashboard periodId={selectedPeriod.strategicPeriodId} />
          </TabsContent>

          <TabsContent value="personal">
            <KpiWeightAchievementDashboard periodId={selectedPeriod.strategicPeriodId} />
          </TabsContent>
        </Tabs>
      ) : (
        // Regular employees only see personal view
        <KpiWeightAchievementDashboard periodId={selectedPeriod.strategicPeriodId} />
      )}
    </div>
  );
}
