"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useEvaluationCycles } from "@/hooks/evaluations/useEvaluationCycles";
import { EvaluationCycleStatus } from "@/types/evaluation";
import EvaluationOverview from "@/components/evaluations/EvaluationOverview";
import MyEvaluations from "@/components/evaluations/MyEvaluations";
import EvaluationResults from "@/components/evaluations/EvaluationResults";
import TeamResults from "@/components/evaluations/TeamResults";
import AdminSetup from "@/components/evaluations/AdminSetup";

function EvaluationsContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview",
  );
  const { cycles } = useEvaluationCycles(
    1,
    1,
    "",
    EvaluationCycleStatus.ACTIVE,
  );
  const activeCycle = cycles?.[0];

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const canManageEvaluations = can("evaluations:manage");
  const canReadDepartment =
    can("evaluations:read_department") ||
    can("evaluations:read_division") ||
    can("evaluations:read_all");

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export evaluation data");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            360° Behavioral Competence Evaluation
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600">
              {activeCycle?.name || "No active cycle"}
            </span>
            {activeCycle && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            )}
          </div>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-white border-b border-gray-200 w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 px-4 py-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="my-evaluations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 px-4 py-3"
          >
            My Evaluations
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 px-4 py-3"
          >
            Results
          </TabsTrigger>
          {canReadDepartment && (
            <TabsTrigger
              value="team-results"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 px-4 py-3"
            >
              Team Results
            </TabsTrigger>
          )}
          {canManageEvaluations && (
            <TabsTrigger
              value="admin-setup"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 px-4 py-3"
            >
              Admin Setup
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <EvaluationOverview />
        </TabsContent>

        <TabsContent value="my-evaluations" className="mt-6">
          <MyEvaluations />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <EvaluationResults />
        </TabsContent>

        {canReadDepartment && (
          <TabsContent value="team-results" className="mt-6">
            <TeamResults />
          </TabsContent>
        )}

        {canManageEvaluations && (
          <TabsContent value="admin-setup" className="mt-6">
            <AdminSetup />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function EvaluationsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <EvaluationsContent />
    </Suspense>
  );
}
