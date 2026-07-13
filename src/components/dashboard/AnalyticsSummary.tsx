"use client";

import type { ReactNode } from "react";
import { BarChart2, Building2, Flag, Target, Users } from "lucide-react";
import AnalyticsCard from "./AnalyticsCard";
import { useAnalytics } from "@/hooks/objectives/useAnalytics";
import { useAuthStore, useOrgUnitStore, useStrategicPeriodStore } from "@/stores";

interface PortfolioMetric {
  title: string;
  value: number;
  icon: ReactNode;
  href: string;
  loading?: boolean;
}

export default function AnalyticsSummary() {
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);
  const user = useAuthStore((state) => state.user);
  const { annualTimeline, selectedPeriod } = useStrategicPeriodStore();

  const roleSelectedUnit =
    (user?.role === "MANAGER" || user?.role === "DIRECTOR") && selectedUnit
      ? { id: selectedUnit.id, type: selectedUnit.type }
      : null;

  const analytics = useAnalytics({
    selectedUnit: roleSelectedUnit,
    userRole: user?.role,
    userId: user?.employeeId,
    annualTimeline,
    selectedPeriodId: selectedPeriod?.strategicPeriodId,
  });

  const metrics: PortfolioMetric[] = [
    {
      title: "Objectives",
      value: analytics.objectivesCount,
      icon: <Target size={19} />,
      href: "/dashboard/objectives",
      loading: analytics.objectivesLoading,
    },
    {
      title: "KPIs",
      value: analytics.kpisCount,
      icon: <BarChart2 size={19} />,
      href: "/dashboard/kpis",
      loading: analytics.kpisLoading,
    },
  ];

  if (user?.role === "DIRECTOR") {
    metrics.push({
      title: "Departments",
      value: analytics.departmentsCount,
      icon: <Building2 size={19} />,
      href: "/dashboard/departments",
      loading: analytics.departmentsLoading,
    });
  }

  if (user?.role === "MANAGER" || user?.role === "DIRECTOR") {
    metrics.push({
      title: "Employees",
      value: analytics.employeesCount,
      icon: <Users size={19} />,
      href: "/dashboard/employees",
      loading: analytics.employeesLoading,
    });
  }

  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    metrics.push(
      {
        title: "Initiatives",
        value: analytics.initiativesCount,
        icon: <Flag size={19} />,
        href: "/dashboard/initiatives",
        loading: analytics.loading,
      },
      {
        title: "Divisions",
        value: analytics.divisionsCount,
        icon: <Building2 size={19} />,
        href: "/dashboard/divisions",
        loading: analytics.divisionsLoading,
      },
      {
        title: "Departments",
        value: analytics.departmentsCount,
        icon: <Building2 size={19} />,
        href: "/dashboard/departments",
        loading: analytics.departmentsLoading,
      },
      {
        title: "Employees",
        value: analytics.employeesCount,
        icon: <Users size={19} />,
        href: "/dashboard/employees",
        loading: analytics.employeesLoading,
      },
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="portfolio-overview-heading">
      <div>
        <h1 id="portfolio-overview-heading" className="text-xl font-semibold tracking-tight">
          Portfolio overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Real records in your authorized scope for the selected planning period.
        </p>
      </div>

      {analytics.error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Portfolio metrics could not be loaded. Performance data below remains available.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric) => (
            <AnalyticsCard key={metric.title} {...metric} />
          ))}
        </div>
      )}
    </section>
  );
}
