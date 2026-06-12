"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Download } from 'lucide-react';

export interface PerformanceFilterState {
  search: string;
  periodId?: string;
  divisionId?: string;
  departmentId?: string;
  role?: string;
  rating?: string;
  sortBy: 'name' | 'score' | 'kpi' | 'competency' | 'activity';
  sortOrder: 'asc' | 'desc';
}

interface PerformanceFiltersProps {
  filters: PerformanceFilterState;
  onFiltersChange: (filters: Partial<PerformanceFilterState>) => void;
  onReset: () => void;
  onExport?: () => void;
  periods?: Array<{ strategicPeriodId: string; name: string; isActive?: boolean }>;
  divisions?: Array<{ divisionId: string; name: string }>;
  departments?: Array<{ departmentId: string; name: string }>;
  showDivisionFilter?: boolean;
  showDepartmentFilter?: boolean;
  showRoleFilter?: boolean;
  isLoading?: boolean;
}

const ROLE_OPTIONS = [
  { value: 'NORMAL', label: 'Employee' },
  { value: 'COORDINATOR', label: 'Coordinator' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'HR', label: 'HR' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

const RATING_OPTIONS = [
  { value: 'exceptional', label: 'Exceptional (≥90%)', color: 'bg-emerald-500' },
  { value: 'exceeds', label: 'Exceeds Expectations (≥80%)', color: 'bg-blue-500' },
  { value: 'meets', label: 'Meets Expectations (≥70%)', color: 'bg-green-500' },
  { value: 'needs', label: 'Needs Improvement (≥60%)', color: 'bg-yellow-500' },
  { value: 'below', label: 'Below Expectations (<60%)', color: 'bg-red-500' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'score', label: 'Overall Score' },
  { value: 'kpi', label: 'KPI Score' },
  { value: 'competency', label: '360° Score' },
  { value: 'activity', label: 'Activity Score' },
];

export function PerformanceFilters({
  filters,
  onFiltersChange,
  onReset,
  onExport,
  periods = [],
  divisions = [],
  departments = [],
  showDivisionFilter = true,
  showDepartmentFilter = true,
  showRoleFilter = true,
  isLoading = false,
}: PerformanceFiltersProps) {
  const activeFilterCount = [
    filters.periodId,
    filters.divisionId,
    filters.departmentId,
    filters.role,
    filters.rating,
    filters.search,
  ].filter(Boolean).length;

  const activePeriod = periods.find((p) => p.isActive);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search and Actions Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, title, or department..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={onReset}>
                  <X className="h-4 w-4 mr-1" />
                  Clear ({activeFilterCount})
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport} disabled={isLoading}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 flex flex-wrap gap-2">
              {/* Period Filter */}
              <Select
                value={filters.periodId || 'all'}
                onValueChange={(value) => onFiltersChange({ periodId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={activePeriod ? `${activePeriod.name} (Active)` : 'All Periods'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.strategicPeriodId} value={period.strategicPeriodId}>
                      {period.name} {period.isActive ? '(Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Division Filter */}
              {showDivisionFilter && divisions.length > 0 && (
                <Select
                  value={filters.divisionId || 'all'}
                  onValueChange={(value) => onFiltersChange({ divisionId: value === 'all' ? undefined : value, departmentId: undefined })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {divisions.map((division) => (
                      <SelectItem key={division.divisionId} value={division.divisionId}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Department Filter */}
              {showDepartmentFilter && departments.length > 0 && (
                <Select
                  value={filters.departmentId || 'all'}
                  onValueChange={(value) => onFiltersChange({ departmentId: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.departmentId} value={department.departmentId}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Role Filter */}
              {showRoleFilter && (
                <Select
                  value={filters.role || 'all'}
                  onValueChange={(value) => onFiltersChange({ role: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Rating Filter */}
              <Select
                value={filters.rating || 'all'}
                onValueChange={(value) => onFiltersChange({ rating: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  {RATING_OPTIONS.map((rating) => (
                    <SelectItem key={rating.value} value={rating.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${rating.color}`} />
                        {rating.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select
                value={filters.sortBy}
                onValueChange={(value: any) => onFiltersChange({ sortBy: value })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((sort) => (
                    <SelectItem key={sort.value} value={sort.value}>
                      Sort by {sort.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
              >
                {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary">
                  Search: {filters.search}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => onFiltersChange({ search: '' })}
                  />
                </Badge>
              )}
              {filters.rating && (
                <Badge variant="secondary">
                  Rating: {RATING_OPTIONS.find((r) => r.value === filters.rating)?.label}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => onFiltersChange({ rating: undefined })}
                  />
                </Badge>
              )}
              {filters.role && (
                <Badge variant="secondary">
                  Role: {ROLE_OPTIONS.find((r) => r.value === filters.role)?.label}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => onFiltersChange({ role: undefined })}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
