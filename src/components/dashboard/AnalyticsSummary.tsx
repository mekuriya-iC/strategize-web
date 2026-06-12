"use client";
import React, { useState } from "react";
import AnalyticsCard from "./AnalyticsCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  BarChart2,
  Flag,
  Building2,
  Users,
  Filter,
  X,
  Calendar,
  TrendingUp,
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
  const { annualTimeline, selectedPeriod } = useStrategicPeriodStore();

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [metricFilter, setMetricFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [displayMode, setDisplayMode] = useState<string>("grid");

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
    userId: user?.employeeId,
    annualTimeline,
    selectedPeriodId: selectedPeriod?.strategicPeriodId,
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

  // Apply filters
  const filteredAnalytics = React.useMemo(() => {
    let filtered = [...analyticsData];

    // Metric type filter
    if (metricFilter !== "all") {
      filtered = filtered.filter((item) => {
        switch (metricFilter) {
          case "performance":
            return ["Objectives", "KPIs", "Initiatives"].includes(item.title);
          case "organization":
            return ["Divisions", "Departments"].includes(item.title);
          case "people":
            return item.title === "Employees";
          default:
            return true;
        }
      });
    }

    // Sort
    if (sortBy === "value-desc") {
      filtered.sort((a, b) => b.value - a.value);
    } else if (sortBy === "value-asc") {
      filtered.sort((a, b) => a.value - b.value);
    } else if (sortBy === "growth-desc") {
      filtered.sort((a, b) => {
        const growthA = parseFloat(a.change.replace(/[^0-9.-]/g, ""));
        const growthB = parseFloat(b.change.replace(/[^0-9.-]/g, ""));
        return growthB - growthA;
      });
    } else if (sortBy === "growth-asc") {
      filtered.sort((a, b) => {
        const growthA = parseFloat(a.change.replace(/[^0-9.-]/g, ""));
        const growthB = parseFloat(b.change.replace(/[^0-9.-]/g, ""));
        return growthA - growthB;
      });
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [analyticsData, metricFilter, sortBy]);

  const hasActiveFilters = metricFilter !== "all" || sortBy !== "default";

  const clearFilters = () => {
    setMetricFilter("all");
    setSortBy("default");
  };

  if (analytics.error) {
    return (
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#3F3F46] dark:text-gray-100">
            Analytics
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 self-start"
            disabled
          >
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

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Filters"}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {[metricFilter !== "all", sortBy !== "default"].filter(Boolean).length}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-gray-600 dark:text-gray-400"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Metric Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Metric Type
                </label>
                <Select value={metricFilter} onValueChange={setMetricFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All metrics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metrics</SelectItem>
                    <SelectItem value="performance">Performance (Objectives, KPIs)</SelectItem>
                    <SelectItem value="organization">Organization (Divisions, Depts)</SelectItem>
                    <SelectItem value="people">People (Employees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Default order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Order</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="value-desc">Value (High to Low)</SelectItem>
                    <SelectItem value="value-asc">Value (Low to High)</SelectItem>
                    <SelectItem value="growth-desc">Growth (High to Low)</SelectItem>
                    <SelectItem value="growth-asc">Growth (Low to High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Display Mode */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Display
                </label>
                <Select value={displayMode} onValueChange={setDisplayMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grid view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="compact">Compact View</SelectItem>
                    <SelectItem value="detailed">Detailed View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Summary */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Active filters:</span>
                  {metricFilter !== "all" && (
                    <Badge variant="outline" className="gap-1">
                      Type: {metricFilter}
                    </Badge>
                  )}
                  {sortBy !== "default" && (
                    <Badge variant="outline" className="gap-1">
                      Sort: {sortBy.replace("-", " ")}
                    </Badge>
                  )}
                  <span className="ml-auto">
                    Showing <span className="font-bold">{filteredAnalytics.length}</span> of{" "}
                    <span className="font-bold">{analyticsData.length}</span> metrics
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 
        Responsive Grid:
        - Mobile: 1 Column
        - Tablet (Portrait/Small): 2 Columns (sm:grid-cols-2)
        - Laptop/Large Tablet: 3 Columns (lg:grid-cols-3)
        - Large Desktop: 4 Columns (xl:grid-cols-4)
      */}
      <div className={`grid gap-4 md:gap-6 ${
        displayMode === "compact" 
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          : displayMode === "detailed"
          ? "grid-cols-1 lg:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }`}>
        {filteredAnalytics.map((item) => (
          <AnalyticsCard key={item.title} {...item} />
        ))}
      </div>

      {filteredAnalytics.length === 0 && (
        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <Filter className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No metrics match your filters</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">Try adjusting your filter settings</p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      <div className="mt-6 text-[11px] md:text-xs text-gray-400 dark:text-gray-500 italic">
        * Growth indicators represent activity within the last 7 days.
      </div>
    </section>
  );
}