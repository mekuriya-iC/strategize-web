"use client";
import { useMemo } from "react";
import ChartCard from "./ChartCard";
import { useQuery } from "@apollo/client";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { useStrategicPeriodStore, useAuthStore } from "@/stores";

export default function ChartsSection() {
  const { annualTimeline } = useStrategicPeriodStore();
  const user = useAuthStore((state) => state.user);

  // Fetch objectives with KPIs
  const { data: objectivesData, loading } = useQuery(GET_OBJECTIVES, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
  });

  // Process data for charts based on selected period
  const chartData = useMemo(() => {
    const objectives = objectivesData?.objectives?.items || [];
    
    // Filter by role - admins see only CORPORATE objectives on dashboard
    const filteredByRole = (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
      ? objectives.filter(obj => obj.type === 'CORPORATE')
      : objectives;

    // Filter by timeline if selected
    const filteredObjectives = annualTimeline
      ? filteredByRole.filter(obj =>
          obj.kpis?.some((kpi: any) =>
            kpi.targets?.some((t: any) => 
              t.timeline === annualTimeline || t.timeline.startsWith(`${annualTimeline}-`)
            )
          )
        )
      : filteredByRole;

    // Count KPIs by month (for bar chart)
    const kpisByMonth: Record<string, number> = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    // Count KPIs by category (for donut chart)
    const kpisByCategory: Record<string, number> = {};

    filteredObjectives.forEach(obj => {
      obj.kpis?.forEach((kpi: any) => {
        // Count by month based on creation date
        if (kpi.createdAt) {
          const month = new Date(kpi.createdAt).toLocaleString('en', { month: 'short' });
          if (kpisByMonth[month] !== undefined) {
            kpisByMonth[month]++;
          }
        }

        // Count by objective title (category)
        const category = obj.title || 'Uncategorized';
        kpisByCategory[category] = (kpisByCategory[category] || 0) + 1;
      });
    });

    // Prepare bar chart data
    const barData = {
      labels: Object.keys(kpisByMonth),
      datasets: [
        {
          label: "KPIs",
          data: Object.values(kpisByMonth),
          backgroundColor: "#3838EC",
          borderRadius: 8,
        },
      ],
    };

    // Prepare donut chart data (top 7 categories)
    const sortedCategories = Object.entries(kpisByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7);

    const donutData = {
      labels: sortedCategories.map(([name]) => name),
      datasets: [
        {
          data: sortedCategories.map(([, count]) => count),
          backgroundColor: [
            "#3838EC",
            "#726BEA",
            "#5B5BFF",
            "#A3A3FF",
            "#C7C7FF",
            "#E0E0FF",
            "#F4F4FF",
          ],
          borderWidth: 0,
        },
      ],
    };

    return { barData, donutData };
  }, [objectivesData, annualTimeline, user?.role]);

  if (loading) {
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
        {annualTimeline && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing data for {annualTimeline}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartCard title="KPIs Over Time" chartType="bar" data={chartData.barData} />
        <ChartCard
          title="KPIs by Objective"
          chartType="doughnut"
          data={chartData.donutData}
        />
      </div>
    </section>
  );
}
