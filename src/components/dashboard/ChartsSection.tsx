"use client";

import { useMemo } from "react";
import ChartCard from "./ChartCard";
import { useAuthStore, useOrgUnitStore, useStrategicPeriodStore } from "@/stores";
import { useAnalytics } from "@/hooks/objectives/useAnalytics";
import { buildDashboardChartData } from "@/lib/dashboard/buildDashboardChartData";

export default function ChartsSection() {
  const user = useAuthStore((state) => state.user);
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);
  const { annualTimeline, selectedPeriod } = useStrategicPeriodStore();

  const roleSelectedUnit =
    (user?.role === "MANAGER" || user?.role === "DIRECTOR") && selectedUnit
      ? {
          id: selectedUnit.id,
          type: selectedUnit.type,
        }
      : null;

  const analytics = useAnalytics({
    selectedUnit: roleSelectedUnit,
    userRole: user?.role,
    userId: user?.employeeId,
    annualTimeline,
    selectedPeriodId: selectedPeriod?.strategicPeriodId,
  });

  const chartData = useMemo(
    () =>
      buildDashboardChartData(analytics.filteredObjectives, annualTimeline),
    [analytics.filteredObjectives, annualTimeline]
  );

  if (analytics.loading) {
    return (
      <section className="mb-10">
        <h2 className="text-2xl md:text-4xl font-semibold text-[#3F3F46] dark:text-gray-100 mb-6">
          Charts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-4xl font-semibold text-[#3F3F46] dark:text-gray-100">
          Charts
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
          {annualTimeline && <p>Timeline: {annualTimeline}</p>}
          {selectedPeriod?.name && <p>Period: {selectedPeriod.name}</p>}
          {roleSelectedUnit && selectedUnit && (
            <p>
              Unit: {selectedUnit.name} ({selectedUnit.type})
            </p>
          )}
          <p>{chartData.totalKpis} KPIs in scope</p>
        </div>
      </div>
      {chartData.totalKpis === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No KPI data for your current filters. Try another strategic period or
          org unit.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartCard
            title="KPIs Over Time"
            chartType="bar"
            data={chartData.barData}
          />
          <ChartCard
            title="KPIs by Objective"
            chartType="doughnut"
            data={chartData.donutData}
          />
        </div>
      )}
    </section>
  );
}
