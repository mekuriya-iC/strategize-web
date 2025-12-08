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
import { useAuthStore, useOrgUnitStore } from "@/stores";
import { useUserDepartments } from "@/hooks/useUserDepartments";
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

  // Normalize selected unit shape for analytics hook
  // Directors and Managers both need filtered analytics based on their selected unit
  const roleSelectedUnit =
    (user?.role === "MANAGER" || user?.role === "DIRECTOR") && selectedUnit
      ? {
          id: selectedUnit.id,
          type: selectedUnit.type,
        }
      : null;

  // Use the analytics hook with selected unit context and user role
  const analytics = useAnalytics({
    selectedUnit: roleSelectedUnit,
    userRole: user?.role,
  });

  // Build analytics data based on context
  const getAnalyticsData = (): AnalyticsData[] => {
    const baseData = [
      {
        title: "Objectives",
        value: analytics.objectivesCount,
        change: analytics.objectivesGrowth,
        isPositive:
          parseFloat(analytics.objectivesGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Target size={20} />,
        href: "/dashboard/objectives",
        loading: analytics.objectivesLoading,
      },
      {
        title: "KPIs",
        value: analytics.kpisCount,
        change: analytics.kpisGrowth,
        isPositive:
          parseFloat(analytics.kpisGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <BarChart2 size={20} />,
        href: "/dashboard/objectives", // KPIs managed within objectives detail
        loading: analytics.kpisLoading,
      },
    ];

    // For directors, managers and employees, show only objectives and KPIs (they don't have access to other data)
    if (user?.role === "DIRECTOR" || user?.role === "MANAGER" || user?.role === "NORMAL") {
      return baseData; // Only show Objectives and KPIs for these roles
    }

    // Default view (corporate level)
    return [
      ...baseData,
      {
        title: "Initiatives",
        value: analytics.initiativesCount,
        change: analytics.initiativesGrowth,
        isPositive:
          parseFloat(analytics.initiativesGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Flag size={20} />,
        href: undefined,
        disabled: true,
        loading: false, // TODO: Update when initiatives query is available
      },
      {
        title: "Divisions",
        value: analytics.divisionsCount,
        change: analytics.divisionsGrowth,
        isPositive:
          parseFloat(analytics.divisionsGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Building2 size={20} />,
        href: "/dashboard/divisions",
        loading: analytics.divisionsLoading,
      },
      {
        title: "Departments",
        value: analytics.departmentsCount,
        change: analytics.departmentsGrowth,
        isPositive:
          parseFloat(analytics.departmentsGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Building2 size={20} />,
        href: "/dashboard/departments",
        loading: analytics.departmentsLoading,
      },
      {
        title: "Employees",
        value: analytics.employeesCount,
        change: analytics.employeesGrowth,
        isPositive:
          parseFloat(analytics.employeesGrowth.replace(/[^0-9.-]/g, "")) > 0,
        icon: <Users size={20} />,
        href: "/dashboard/employees",
        loading: analytics.employeesLoading,
      },
    ];
  };

  const analyticsData = getAnalyticsData();

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

  // Get context-aware title
  const getAnalyticsTitle = (): string => {
    if (user?.role === "DIRECTOR" && selectedUnit) {
      return "Division Analytics";
    } else if (user?.role === "MANAGER" && selectedUnit) {
      return selectedUnit.type === "division"
        ? "Division Analytics"
        : "Department Analytics";
    } else if (user?.role === "NORMAL") {
      return "My Analytics";
    }
    return "Analytics";
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-semibold text-[#3F3F46]">
            {getAnalyticsTitle()}
          </h2>
          {user?.role === "DIRECTOR" && selectedUnit && (
            <p className="text-sm text-gray-600 mt-1">
              Showing data for selected division
            </p>
          )}
          {user?.role === "MANAGER" && selectedUnit && (
            <p className="text-sm text-gray-600 mt-1">
              Showing data for selected{" "}
              {selectedUnit.type === "division"
                ? "division"
                : "department"}
            </p>
          )}
          {user?.role === "NORMAL" && (
            <div className="mt-1">
              <p className="text-sm text-gray-600">
                Showing data for your personal objectives and KPIs
              </p>
              {(selectedDepartment?.department ||
                departmentNames.length > 0) && (
                <p className="text-xs text-gray-500 mt-1">
                  Department:{" "}
                  {selectedDepartment?.department?.name ||
                    departmentNames.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
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
