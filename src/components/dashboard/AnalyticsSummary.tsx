"use client";
import React from "react";
import AnalyticsCard from "./AnalyticsCard";
import { Button } from "@/components/ui/button";
import {
  Target,
  BarChart2,
  Flag,
  Building2,
  Users,
  Filter,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface AnalyticsData {
  title: string;
  value: number;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
}

export default function AnalyticsSummary() {
  // Use the analytics hook
  const analytics = useAnalytics();

  const analyticsData: AnalyticsData[] = [
    {
      title: "Objectives",
      value: analytics.objectivesCount,
      change: analytics.objectivesGrowth,
      isPositive:
        parseFloat(analytics.objectivesGrowth.replace(/[^0-9.-]/g, "")) > 0,
      icon: <Target size={20} />,
      loading: false, // TODO: Update when objectives query is available
    },
    {
      title: "KPIs",
      value: analytics.kpisCount,
      change: analytics.kpisGrowth,
      isPositive: parseFloat(analytics.kpisGrowth.replace(/[^0-9.-]/g, "")) > 0,
      icon: <BarChart2 size={20} />,
      loading: false, // TODO: Update when KPIs query is available
    },
    {
      title: "Initiatives",
      value: analytics.initiativesCount,
      change: analytics.initiativesGrowth,
      isPositive:
        parseFloat(analytics.initiativesGrowth.replace(/[^0-9.-]/g, "")) > 0,
      icon: <Flag size={20} />,
      loading: false, // TODO: Update when initiatives query is available
    },
    {
      title: "Divisions",
      value: analytics.divisionsCount,
      change: analytics.divisionsGrowth,
      isPositive:
        parseFloat(analytics.divisionsGrowth.replace(/[^0-9.-]/g, "")) > 0,
      icon: <Building2 size={20} />,
      loading: analytics.divisionsLoading,
    },
    {
      title: "Departments",
      value: analytics.departmentsCount,
      change: analytics.departmentsGrowth,
      isPositive:
        parseFloat(analytics.departmentsGrowth.replace(/[^0-9.-]/g, "")) > 0,
      icon: <Building2 size={20} />,
      loading: analytics.departmentsLoading,
    },
    {
      title: "Individuals",
      value: analytics.employeesCount,
      change: analytics.employeesGrowth,
      isPositive:
        parseFloat(analytics.employeesGrowth.replace(/[^0-9.-]/g, "")) > 0,
      icon: <Users size={20} />,
      loading: analytics.employeesLoading,
    },
  ];

  // Show error state if there's an error
  if (analytics.error) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-4xl font-semibold text-[#3F3F46]">
            Analytics
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">
            Error loading analytics: {analytics.error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-4xl font-semibold text-[#3F3F46]">
          Analytics
        </h2>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      {/* Additional Statistics */}
      {/* {!analytics.loading && (
        <div className="mb-4 text-sm text-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Active Divisions:</span>{" "}
              {analytics.activeDivisionsCount} of {analytics.divisionsCount}
            </div>
            <div>
              <span className="font-medium">Departments with Managers:</span>{" "}
              {analytics.departmentsWithManagersCount} of{" "}
              {analytics.departmentsCount}
            </div>
            <div>
              <span className="font-medium">Active Employees:</span>{" "}
              {analytics.activeEmployeesCount} of {analytics.employeesCount}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 items-start">
            <div>
              <span className="font-medium">Managers:</span>{" "}
              {analytics.managerCount}
            </div>
            <div>
              <span className="font-medium">Admins:</span>{" "}
              {analytics.adminCount}
            </div>
          </div>
        </div>
      )} */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {analyticsData.map((item) => (
          <AnalyticsCard key={item.title} {...item} />
        ))}
      </div>

      {/* Growth indicator note */}
      <div className="mt-4 text-xs text-gray-500">
        * Percentage changes are based on items created in the last 7 days
      </div>
    </section>
  );
}
