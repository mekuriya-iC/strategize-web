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
import { useAnalytics } from "@/hooks/objectives/useAnalytics";
import { useAuthStore, useOrgUnitStore, useStrategicPeriodStore } from "@/stores";
import { useUserDepartments } from "@/hooks/org-structure/useUserDepartments";
import { useDepartmentSelection } from "@/context/DepartmentSelectionContext";

interface AnalyticsData {
  title: string;
  value: number;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  href?: string;
  disabled?: boolean;
}

export default function AnalyticsSummary() {
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);
  const user = useAuthStore((state) => state.user);
  const { departmentNames } = useUserDepartments();
  const { selected: selectedDepartment } = useDepartmentSelection();
  const { annualTimeline } = useStrategicPeriodStore();

  // Normalize selected unit shape for analytics hook
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
    annualTimeline,
  });

  const getAnalyticsData = (): AnalyticsData[] => {
    const baseData = [
      {
        title: "Objectives",
        value: analytics.objectivesCount,
        change: analytics.objectivesGrowth,
        isPositive: parseFloat(analytics.objectivesGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Target size={20} />,
        href: "/dashboard/objectives",
        loading: analytics.objectivesLoading,
      },
      {
        title: "KPIs",
        value: analytics.kpisCount,
        change: analytics.kpisGrowth,
        isPositive: parseFloat(analytics.kpisGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <BarChart2 size={20} />,
        href: "/dashboard/objectives",
        loading: analytics.kpisLoading,
      },
    ];

    if (user?.role === "DIRECTOR") {
      baseData.push({
        title: "Departments",
        value: analytics.departmentsCount,
        change: analytics.departmentsGrowth,
        isPositive: true,
        icon: <Building2 size={20} />,
        href: "/dashboard/departments",
        loading: analytics.departmentsLoading,
      });
    }

    if (user?.role === "MANAGER" || user?.role === "DIRECTOR") {
      baseData.push({
        title: "Employees",
        value: analytics.employeesCount,
        change: analytics.employeesGrowth,
        isPositive: true,
        icon: <Users size={20} />,
        href: "/dashboard/employees",
        loading: analytics.employeesLoading,
      });
    }

    const roleIsHigher = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    if (!roleIsHigher) return baseData;

    return [
      ...baseData,
      {
        title: "Initiatives",
        value: analytics.initiativesCount,
        change: analytics.initiativesGrowth,
        isPositive: parseFloat(analytics.initiativesGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Flag size={20} />,
        href: undefined,
        disabled: true,
        loading: false,
      },
      {
        title: "Divisions",
        value: analytics.divisionsCount,
        change: analytics.divisionsGrowth,
        isPositive: parseFloat(analytics.divisionsGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Building2 size={20} />,
        href: "/dashboard/divisions",
        loading: analytics.divisionsLoading,
      },
      {
        title: "Departments",
        value: analytics.departmentsCount,
        change: analytics.departmentsGrowth,
        isPositive: parseFloat(analytics.departmentsGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Building2 size={20} />,
        href: "/dashboard/departments",
        loading: analytics.departmentsLoading,
      },
      {
        title: "Employees",
        value: analytics.employeesCount,
        change: analytics.employeesGrowth,
        isPositive: parseFloat(analytics.employeesGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Users size={20} />,
        href: "/dashboard/employees",
        loading: analytics.employeesLoading,
      },
    ];
  };

  const analyticsData = getAnalyticsData();

  if (analytics.error) {
    return (
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#3F3F46] dark:text-gray-100">
            Analytics
          </h2>
          <Button variant="outline" size="sm" className="flex items-center gap-2 self-start">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-600 dark:text-red-400">Error loading analytics: {analytics.error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </section>
    );
  }

  const getAnalyticsTitle = (): string => {
    if (user?.role === "DIRECTOR" && selectedUnit) return "Division Analytics";
    if (user?.role === "MANAGER" && selectedUnit) {
      return selectedUnit.type === "division" ? "Division Analytics" : "Department Analytics";
    }
    if (user?.role === "NORMAL") return "My Analytics";
    return "Analytics";
  };

  return (
    <section className="mb-6 md:mb-10">
      {/* Header section: Stacks on mobile, side-by-side on tablet (sm) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#11181C] dark:text-gray-100">
            {getAnalyticsTitle()}
          </h2>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {user?.role === "DIRECTOR" && selectedUnit && (
              <p>Showing data for selected division</p>
            )}
            {user?.role === "MANAGER" && selectedUnit && (
              <p>Showing data for selected {selectedUnit.type}</p>
            )}
            {user?.role === "NORMAL" && (
              <>
                <p>Personal performance overview</p>
                {(selectedDepartment?.department || departmentNames.length > 0) && (
                  <p className="text-xs mt-0.5">
                    Dept: {selectedDepartment?.department?.name || departmentNames.join(", ")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      {/* 
        Responsive Grid:
        - Mobile: 1 Column
        - Tablet (Portrait/Small): 2 Columns (sm:grid-cols-2)
        - Laptop/Large Tablet: 3 Columns (lg:grid-cols-3)
        - Large Desktop: 4 Columns (xl:grid-cols-4)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {analyticsData.map((item) => (
          <AnalyticsCard key={item.title} {...item} />
        ))}
      </div>

      <div className="mt-6 text-[11px] md:text-xs text-gray-400 dark:text-gray-500 italic">
        * Growth indicators represent activity within the last 7 days.
      </div>
    </section>
  );
}