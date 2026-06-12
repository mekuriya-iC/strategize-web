"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { AlertCircle, Home, TrendingUp, Target, ChevronLeft } from 'lucide-react';
import { useUser } from '@/stores/authStore';
import {
  useCorporateKpiContributions,
  useDivisionKpiContributions,
  useDepartmentKpiContributions,
  type KpiContributor,
  type HierarchicalKpiBreakdown,
} from '@/hooks/kpi-weight/useHierarchicalKpiContributions';
import { KpiContributorCard } from './KpiContributorCard';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_ORGANIZATION_UNITS = gql`
  query GetOrganizationUnits($organizationId: ID!) {
    divisions(organizationId: $organizationId, limit: 100) {
      items {
        divisionId
        name
      }
    }
    departments(organizationId: $organizationId, limit: 100) {
      items {
        departmentId
        name
      }
    }
  }
`;

const GET_USER_DIVISIONS = gql`
  query GetUserDivisions($organizationId: ID!) {
    divisions(organizationId: $organizationId, limit: 100) {
      items {
        divisionId
        name
        head {
          employeeId
        }
      }
    }
  }
`;

const GET_USER_DEPARTMENTS = gql`
  query GetUserDepartments($organizationId: ID!) {
    departments(organizationId: $organizationId, limit: 100) {
      items {
        departmentId
        name
        head {
          employeeId
        }
      }
    }
  }
`;

interface NavigationLevel {
  level: 'CORPORATE' | 'DIVISION' | 'DEPARTMENT';
  entityId: string;
  entityName: string;
}

interface HierarchicalKpiDashboardProps {
  periodId: string;
}

export function HierarchicalKpiDashboard({ periodId }: HierarchicalKpiDashboardProps) {
  const currentUser = useUser();
  const [navigationStack, setNavigationStack] = useState<NavigationLevel[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [initialContext, setInitialContext] = useState<{
    level: 'CORPORATE' | 'DIVISION' | 'DEPARTMENT';
    entityId: string;
    showUnitSelector: boolean;
  } | null>(null);

  // Fetch user's divisions if they're a director
  const { data: userDivisionsData } = useQuery(GET_USER_DIVISIONS, {
    variables: { organizationId: currentUser?.organizationId },
    skip: !currentUser || currentUser.role !== 'DIRECTOR',
  });

  // Fetch user's departments if they're a manager
  const { data: userDepartmentsData } = useQuery(GET_USER_DEPARTMENTS, {
    variables: { organizationId: currentUser?.organizationId },
    skip: !currentUser || currentUser.role !== 'MANAGER',
  });

  // Determine initial context based on user role and fetched data
  useEffect(() => {
    if (!currentUser) return;

    const role = currentUser.role;
    const organizationId = currentUser.organizationId;

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      setInitialContext({
        level: 'CORPORATE',
        entityId: organizationId || '',
        showUnitSelector: true,
      });
      return;
    }

    // For DIRECTOR, get divisions where they are head
    if (role === 'DIRECTOR' && userDivisionsData?.divisions?.items) {
      const userDivisions = userDivisionsData.divisions.items.filter(
        (div: any) => div.head?.employeeId === currentUser.employeeId
      );
      if (userDivisions.length > 0) {
        setInitialContext({
          level: 'DIVISION',
          entityId: userDivisions[0].divisionId,
          showUnitSelector: userDivisions.length > 1,
        });
      }
      return;
    }

    // For MANAGER, use their department or departments where they are head
    if (role === 'MANAGER') {
      // First try to use their assigned department
      if (currentUser.department?.departmentId) {
        setInitialContext({
          level: 'DEPARTMENT',
          entityId: currentUser.department.departmentId,
          showUnitSelector: false,
        });
        return;
      }
      
      // Otherwise check departments where they are head
      if (userDepartmentsData?.departments?.items) {
        const userDepartments = userDepartmentsData.departments.items.filter(
          (dept: any) => dept.head?.employeeId === currentUser.employeeId
        );
        if (userDepartments.length > 0) {
          setInitialContext({
            level: 'DEPARTMENT',
            entityId: userDepartments[0].departmentId,
            showUnitSelector: userDepartments.length > 1,
          });
        }
      }
      return;
    }
  }, [currentUser, userDivisionsData, userDepartmentsData]);

  const currentLevel = navigationStack.length > 0 
    ? navigationStack[navigationStack.length - 1] 
    : (initialContext ? {
        level: initialContext.level,
        entityId: initialContext.entityId,
        entityName: '',
      } : null);

  // Fetch data based on current level
  const {
    data: corporateData,
    loading: corporateLoading,
    error: corporateError,
  } = useCorporateKpiContributions(
    initialContext?.level === 'CORPORATE' ? (initialContext.entityId || '') : '',
    periodId,
    currentLevel?.level !== 'CORPORATE'
  );

  const {
    data: divisionData,
    loading: divisionLoading,
    error: divisionError,
  } = useDivisionKpiContributions(
    currentLevel?.level === 'DIVISION' ? (currentLevel.entityId || '') : '',
    periodId,
    currentLevel?.level !== 'DIVISION'
  );

  const {
    data: departmentData,
    loading: departmentLoading,
    error: departmentError,
  } = useDepartmentKpiContributions(
    currentLevel?.level === 'DEPARTMENT' ? (currentLevel.entityId || '') : '',
    periodId,
    currentLevel?.level !== 'DEPARTMENT'
  );

  // Get organization units for selector
  const { data: unitsData } = useQuery(GET_ORGANIZATION_UNITS, {
    variables: { organizationId: currentUser?.organizationId },
    skip: !currentUser?.organizationId || !initialContext?.showUnitSelector,
  });

  const handleContributorClick = (contributor: KpiContributor) => {
    const newLevel: NavigationLevel = {
      level: contributor.contributorType === 'DIVISION' ? 'DIVISION' : 'DEPARTMENT',
      entityId: contributor.contributorId,
      entityName: contributor.contributorName,
    };

    setNavigationStack([...navigationStack, newLevel]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go back to initial level
      setNavigationStack([]);
    } else {
      // Go back to specific level
      setNavigationStack(navigationStack.slice(0, index + 1));
    }
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    
    // Determine the level based on initial context
    if (initialContext?.level === 'CORPORATE') {
      // Admin selecting a division
      const division = unitsData?.divisions?.items?.find((d: any) => d.divisionId === unitId);
      if (division) {
        setNavigationStack([{
          level: 'DIVISION',
          entityId: unitId,
          entityName: division.name,
        }]);
      }
    } else if (initialContext?.level === 'DIVISION') {
      // Director switching between divisions
      const userDivisions = userDivisionsData?.divisions?.items?.filter(
        (div: any) => div.head?.employeeId === currentUser?.employeeId
      ) || [];
      const division = userDivisions.find((d: any) => d.divisionId === unitId);
      if (division) {
        setNavigationStack([]);
        setInitialContext({
          level: 'DIVISION',
          entityId: unitId,
          showUnitSelector: true,
        });
      }
    } else if (initialContext?.level === 'DEPARTMENT') {
      // Manager switching between departments
      const userDepartments = userDepartmentsData?.departments?.items?.filter(
        (dept: any) => dept.head?.employeeId === currentUser?.employeeId
      ) || [];
      const department = userDepartments.find((d: any) => d.departmentId === unitId);
      if (department) {
        setNavigationStack([]);
        setInitialContext({
          level: 'DEPARTMENT',
          entityId: unitId,
          showUnitSelector: true,
        });
      }
    }
  };

  if (!currentUser || !initialContext) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to determine your organizational context. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  if (!periodId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a strategic period to view KPI contributions.
        </AlertDescription>
      </Alert>
    );
  }

  // Determine which data to display
  let currentData: HierarchicalKpiBreakdown | undefined;
  let loading: boolean;
  let error: any;

  if (currentLevel?.level === 'CORPORATE') {
    currentData = corporateData;
    loading = corporateLoading;
    error = corporateError;
  } else if (currentLevel?.level === 'DIVISION') {
    currentData = divisionData;
    loading = divisionLoading;
    error = divisionError;
  } else {
    currentData = departmentData;
    loading = departmentLoading;
    error = departmentError;
  }

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb and Summary */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        {navigationStack.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBreadcrumbClick(-1)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => handleBreadcrumbClick(-1)} className="cursor-pointer">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {navigationStack.map((level, index) => (
                  <React.Fragment key={level.entityId}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === navigationStack.length - 1 ? (
                        <BreadcrumbPage>{level.entityName}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          onClick={() => handleBreadcrumbClick(index)}
                          className="cursor-pointer"
                        >
                          {level.entityName}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {/* Header and Unit Selector */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {currentLevel?.level === 'CORPORATE' && 'Corporate KPI Contributions'}
              {currentLevel?.level === 'DIVISION' && 'Division KPI Contributions'}
              {currentLevel?.level === 'DEPARTMENT' && 'Department KPI Contributions'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {currentData?.entityName || 'Loading...'}
            </p>
          </div>

          {/* Unit Selector for Admins/Directors with multiple units */}
          {initialContext?.showUnitSelector && unitsData && (
            <Select value={selectedUnitId} onValueChange={handleUnitChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select unit to view" />
              </SelectTrigger>
              <SelectContent>
                {initialContext.level === 'CORPORATE' && unitsData.divisions?.items?.map((division: any) => (
                  <SelectItem key={division.divisionId} value={division.divisionId}>
                    {division.name}
                  </SelectItem>
                ))}
                {initialContext.level === 'DIVISION' && userDivisionsData?.divisions?.items && (
                  userDivisionsData.divisions.items
                    .filter((div: any) => div.head?.employeeId === currentUser?.employeeId)
                    .map((division: any) => (
                      <SelectItem key={division.divisionId} value={division.divisionId}>
                        {division.name}
                      </SelectItem>
                    ))
                )}
                {initialContext.level === 'DEPARTMENT' && userDepartmentsData?.departments?.items && (
                  userDepartmentsData.departments.items
                    .filter((dept: any) => dept.head?.employeeId === currentUser?.employeeId)
                    .map((department: any) => (
                      <SelectItem key={department.departmentId} value={department.departmentId}>
                        {department.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Summary Cards */}
        {currentData && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Weight Possible</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parseFloat(String(currentData.totalWeightPossible)).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Allocated across all KPIs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weight Achieved</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parseFloat(String(currentData.totalWeightAchieved)).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Current performance level
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Achievement Rate</CardTitle>
                <Badge 
                  variant={
                    parseFloat(String(currentData.achievementPercentage)) >= 100 
                      ? 'default' 
                      : parseFloat(String(currentData.achievementPercentage)) >= 80 
                      ? 'secondary' 
                      : 'destructive'
                  }
                  className="text-base"
                >
                  {parseFloat(String(currentData.achievementPercentage)).toFixed(1)}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parseFloat(String(currentData.achievementPercentage)).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall achievement percentage
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load KPI contribution data. {error.message}
          </AlertDescription>
        </Alert>
      ) : currentData && currentData.kpis.length > 0 ? (
        <div className="grid gap-6">
          {currentData.kpis.map((kpi) => (
            <KpiContributorCard
              key={kpi.kpiId}
              kpi={kpi}
              onContributorClick={handleContributorClick}
              showDrillDown={currentLevel?.level !== 'DEPARTMENT'}
            />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No KPI data found for this period.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
