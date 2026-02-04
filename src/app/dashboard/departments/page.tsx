"use client";
import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DepartmentTable, {
  Department,
} from "@/components/departments/DepartmentTable";
import DepartmentFilterBar from "@/components/departments/DepartmentFilterBar";
import DepartmentPagination from "@/components/departments/DepartmentPagination";
import AddDepartmentDialog from "@/components/departments/AddDepartmentDialog";
import EmptyState from "@/components/departments/EmptyState";
import { GET_DEPARTMENTS, GET_DEPARTMENT, GET_DEPARTMENT_SAFE } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS, GET_DIVISION, GET_DIVISION_SAFE } from "@/lib/graphql/queries/divisions";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { useDepartmentMutations } from "@/hooks/departments/useDepartmentMutations";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import {
  DepartmentsQueryVariables,
  Department as GraphQLDepartment,
  Employee,
  EmployeeRole,
  PaginatedDepartments,
  PaginatedDivisions,
  PaginatedEmployees,
} from "@/types/graphql";

const DepartmentsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    | "all"
    | "with_manager"
    | "no_manager"
    | "has_members"
    | "no_members"
    | "recent"
  >("all");

  // Get permissions to check if user can access employees
  const { guards, scope, isLoading: permissionsLoading } = usePermissions();
  const canAccessEmployees = guards.isAdmin || guards.isSuperAdmin;
  const isAdmin = guards.isAdmin || guards.isSuperAdmin;
  const isManagement = guards.isDirector || guards.isManager;

  // GraphQL queries
  const {
    data: globalDepartmentsData,
    loading: globalDepartmentsLoading,
    error: globalDepartmentsError,
    refetch: globalRefetch,
  } = useQuery<{ departments: PaginatedDepartments }>(GET_DEPARTMENTS, {
    variables: {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
    } as DepartmentsQueryVariables,
    fetchPolicy: "cache-and-network",
    skip: isManagement,
  });

  // Scoped queries for Directors/Managers
  const {
    data: scopedDivisionData,
    loading: divisionLoading,
    error: divisionError,
    refetch: divisionRefetch,
  } = useQuery<{ division: any }>(GET_DIVISION_SAFE, {
    variables: { divisionId: scope?.managedDivisionIds[0] },
    skip: !guards.isDirector || !scope?.managedDivisionIds?.[0],
    fetchPolicy: "cache-and-network",
  });

  const {
    data: scopedDepartmentData,
    loading: departmentLoading,
    error: departmentError,
    refetch: departmentRefetch,
  } = useQuery<{ department: any }>(GET_DEPARTMENT_SAFE, {
    variables: { departmentId: scope?.managedDepartmentIds[0] },
    skip: !guards.isManager || !scope?.managedDepartmentIds?.[0],
    fetchPolicy: "cache-and-network",
  });

  const { data: divisionsData } = useQuery<{ divisions: PaginatedDivisions }>(
    GET_DIVISIONS,
    {
      variables: { page: 1, limit: 100 },
      skip: !isAdmin,
    }
  );

  // Only fetch employees if user has admin access (backend requires ADMIN or SUPER_ADMIN)
  const { data: employeesData } = useQuery<{ employees: PaginatedEmployees }>(
    GET_EMPLOYEES,
    {
      variables: { page: 1, limit: 100 },
      skip: !canAccessEmployees,
    }
  );

  // Department mutations
  const { createDepartment, loading: mutationLoading } =
    useDepartmentMutations();

  // Add Department Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentManager, setDepartmentManager] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [departmentMembers, setDepartmentMembers] = useState<string[]>([]);

  // Transform GraphQL data to UI format
  const transformDepartment = (dept: any): Department => ({
    id: dept.departmentId,
    departmentName: dept.name,
    createdBy: "System",
    createdOn: new Date(dept.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    managedBy: dept.manager?.fullName || "Unassigned",
    division: dept.division?.name || "Unassigned",
    members: dept.employees?.length || 0,
  });

  // Transform and filter departments
  const departments = React.useMemo(() => {
    let rawItems: any[] = [];
    if (isAdmin) {
      rawItems = globalDepartmentsData?.departments?.items || [];
    } else if (guards.isDirector) {
      rawItems = scopedDivisionData?.division?.departments || [];
    } else if (guards.isManager) {
      rawItems = scopedDepartmentData?.department ? [scopedDepartmentData.department] : [];
    }

    let filteredDepartments = [...rawItems];

    // Local search for non-admins
    if (!isAdmin && searchTerm) {
      filteredDepartments = filteredDepartments.filter((dept: any) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filters (client-side)
    if (filterStatus !== "all") {
      filteredDepartments = filteredDepartments.filter(
        (dept: any) => {
          switch (filterStatus) {
            case "with_manager":
              return dept.manager !== null;
            case "no_manager":
              return dept.manager === null;
            case "has_members":
              return (dept.employees?.length || 0) > 0;
            case "no_members":
              return (dept.employees?.length || 0) === 0;
            case "recent":
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(dept.createdAt) > weekAgo;
            default:
              return true;
          }
        }
      );
    }

    return filteredDepartments.map(transformDepartment);
  }, [globalDepartmentsData, scopedDivisionData, scopedDepartmentData, isAdmin, guards, filterStatus, searchTerm]);

  const totalItems = isAdmin
    ? (globalDepartmentsData?.departments?.meta?.totalItems || 0)
    : departments.length;
  const totalPages = isAdmin
    ? Math.ceil(totalItems / itemsPerPage)
    : 1;

  const refetch = () => {
    if (isAdmin) globalRefetch();
    if (guards.isDirector) divisionRefetch();
    if (guards.isManager) departmentRefetch();
  };

  // Get available divisions for filter
  const divisions = divisionsData?.divisions?.items || [];

  // Get managers (employees with MANAGER role only)
  const managers =
    employeesData?.employees?.items?.filter(
      (emp: Employee) => emp.role === EmployeeRole.MANAGER
    ) || [];

  // Get all employees for member selection (NORMAL role only)
  const allEmployees =
    employeesData?.employees?.items?.filter(
      (emp: Employee) => emp.role === EmployeeRole.NORMAL
    ) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (
    filterValue:
      | "all"
      | "with_manager"
      | "no_manager"
      | "has_members"
      | "no_members"
      | "recent"
  ) => {
    setFilterStatus(filterValue);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleAddDepartment = () => {
    setIsAddDialogOpen(true);
  };

  const handleSubmitDepartment = async () => {
    if (!departmentName.trim()) {
      return;
    }

    try {
      await createDepartment({
        input: {
          name: departmentName.trim(),
          divisionId: selectedDivision || undefined,
          managerId: departmentManager || undefined,
        },
        employeeIds: departmentMembers,
      });

      // Reset form
      setDepartmentName("");
      setDepartmentManager("");
      setSelectedDivision("");
      setDepartmentMembers([]);
      setIsAddDialogOpen(false);

      // Refresh data after everything is complete
      refetch();
    } catch (error) {
      console.error("Failed to create department:", error);
    }
  };

  const loading = (isAdmin ? globalDepartmentsLoading : (divisionLoading || departmentLoading)) || mutationLoading.create;
  const error = isAdmin ? globalDepartmentsError : (divisionError || departmentError);

  if (permissionsLoading || (isManagement && loading && departments.length === 0)) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-10 w-48 bg-gray-200 rounded mb-6" />
          <div className="h-12 w-full bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl text-[#3F3F46] font-bold tracking-tight">
            Departments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? "Manage organization-wide departments" : guards.isDirector ? "Manage departments in your division" : "Manage your department"}
          </p>
        </div>
      </div>

      {/* Only show filter bar and actions when there's data or loading */}
      {(loading || error || departments.length > 0) && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <DepartmentFilterBar
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              searchValue={searchTerm}
              filterValue={filterStatus}
              disabled={loading}
            />
            {/* Only show Add Department button for admins */}
            {canAccessEmployees && (
              <div className="flex gap-2 items-center">
                <Button
                  className="ml-2"
                  onClick={handleAddDepartment}
                  disabled={loading}
                >
                  <Plus width={16} height={16} />
                  Add Department
                </Button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          {(searchTerm || filterStatus !== "all") && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {departments.length} of {totalItems} departments
                {searchTerm && (
                  <span className="ml-1">
                    matching &quot;{searchTerm}&quot;
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span className="ml-1">
                    with status &quot;{filterStatus.replace("_", " ")}&quot;
                  </span>
                )}
              </span>
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            Error loading departments: {error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State or Table */}
      {!loading && !error && departments.length === 0 ? (
        canAccessEmployees ? (
          <EmptyState onAddDepartment={handleAddDepartment} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            No departments found.
          </div>
        )
      ) : (
        <>
          {/* Table */}
          <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
            <DepartmentTable
              departments={departments}
              readOnly={!canAccessEmployees}
              loading={loading}
              error={error?.message}
              onAddDepartment={handleAddDepartment}
              managers={managers}
              divisions={divisions}
              allMembers={allEmployees}
              onDeleteSuccess={() => refetch()}
              onEditSuccess={() => refetch()}
            />
          </div>

          {/* Pagination */}
          <DepartmentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </>
      )}

      {/* Add Department Dialog */}
      <AddDepartmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        departmentName={departmentName}
        setDepartmentName={setDepartmentName}
        departmentManager={departmentManager}
        setDepartmentManager={setDepartmentManager}
        selectedDivision={selectedDivision}
        setSelectedDivision={setSelectedDivision}
        departmentMembers={departmentMembers}
        setDepartmentMembers={setDepartmentMembers}
        managers={managers}
        divisions={divisions}
        allMembers={allEmployees}
        onSubmit={handleSubmitDepartment}
        loading={mutationLoading.create}
      />
    </div>
  );
};

export default DepartmentsPage;
