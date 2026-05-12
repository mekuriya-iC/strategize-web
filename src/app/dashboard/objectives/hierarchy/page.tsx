"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import ObjectiveHierarchyView from "@/components/objectives/ObjectiveHierarchyView";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ObjectiveHierarchyPage() {
  const router = useRouter();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  // Fetch strategic periods
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 100 },
  });

  // Fetch objectives for selected period
  const { data: objectivesData, loading } = useQuery(GET_OBJECTIVES, {
    variables: {
      page: 1,
      limit: 1000,
    },
    skip: !selectedPeriodId,
  });

  const periods = periodsData?.strategicPeriods?.items || [];
  const objectives = objectivesData?.objectives?.items || [];

  // Filter objectives by selected period
  const filteredObjectives = selectedPeriodId
    ? objectives.filter(
        (obj: any) => obj.strategicPeriod?.strategicPeriodId === selectedPeriodId
      )
    : objectives;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Objective Hierarchy
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Visualize objective cascading and alignment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Strategic Period:
        </label>
        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a strategic period" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period: any) => (
              <SelectItem key={period.strategicPeriodId} value={period.strategicPeriodId}>
                {period.name} ({new Date(period.startDate).getFullYear()} -{" "}
                {new Date(period.endDate).getFullYear()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hierarchy View */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading objectives...</p>
          </div>
        </div>
      ) : !selectedPeriodId ? (
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Please select a strategic period to view objectives
            </p>
          </div>
        </div>
      ) : (
        <ObjectiveHierarchyView
          objectives={filteredObjectives}
          strategicPeriodId={selectedPeriodId}
        />
      )}
    </div>
  );
}
