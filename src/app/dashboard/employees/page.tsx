"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import EmployeeTable from "@/components/employees/EmployeeTable";
import EmployeeFilterBar from "@/components/employees/EmployeeFilterBar";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import EmployeePagination from "@/components/employees/EmployeePagination";
import AddDepartmentDialog from "@/components/departments/AddDepartmentDialog";
import { Plus } from "lucide-react";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import { useDepartmentMutations } from "@/hooks/departments/useDepartmentMutations";
import { useRouter } from "next/navigation";
import {
  PaginatedDivisions,
  PaginatedEmployees,
  Division as GraphQLDivision,
  EmployeeRole,
} from "@/types/graphql";

const EmployeesPage = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");

  // Department dialog state
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] =
    useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentManager, setDepartmentManager] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [departmentMembers, setDepartmentMembers] = useState<string[]>([]);

  const {
    employees: employeePermissions,
    isLoading: permissionsLoading,
    guards,
    role,
  } = usePermissions();

  const canAccessEmployees = guards.isManagement;
  const isAdmin = guards.isAdmin || guards.isSuperAdmin;
  const hasOrganizationWideAccess = isAdmin || role === EmployeeRole.HR;

  // The backend scopes this query to the caller's role and managed organization unit.
  const { data, loading, error } = useQuery<{
    employees: PaginatedEmployees;
  }>(GET_EMPLOYEES, {
    variables: {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
    },
    errorPolicy: "all",
    skip: !canAccessEmployees,
  });

  // Fetch divisions for department creation
  const { data: divisionsData } = useQuery<{ divisions: PaginatedDivisions }>(
    GET_DIVISIONS,
    {
      variables: { page: 1, limit: 100 },
      skip: !isAdmin,
    }
  );

  // Department mutations
  const { createDepartment, loading: departmentMutationLoading } =
    useDepartmentMutations();

  const rawEmployees = React.useMemo(
    () => data?.employees?.items || [],
    [data],
  );

  const meta = data?.employees?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || 0;

  // Search is server-side; status and sorting remain local to the current page.
  const filteredEmployees = React.useMemo(() => {
    const items = [...rawEmployees];

    return items
      .filter((employee) => {
        // Status filter
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && employee.status === "ACTIVE") ||
          (filterStatus === "inactive" &&
            (employee.status === "DISABLED" || employee.status === "DELETED"));

        return matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === "none") return 0;
        const nameA = a.fullName?.toLowerCase() || "";
        const nameB = b.fullName?.toLowerCase() || "";
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
  }, [rawEmployees, filterStatus, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterValue: "all" | "active" | "inactive") => {
    setFilterStatus(filterValue);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (sortValue: "none" | "asc" | "desc") => {
    setSortOrder(sortValue);
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Department dialog handlers
  const handleSubmitDepartment = async () => {
    if (!departmentName.trim() || !selectedDivision) {
      return;
    }

    try {
      await createDepartment({
        input: {
          name: departmentName.trim(),
          divisionId: selectedDivision,
          headUserId: departmentManager || undefined,
        },
        employeeIds: departmentMembers,
      });

      // Reset form
      setDepartmentName("");
      setDepartmentManager("");
      setSelectedDivision("");
      setDepartmentMembers([]);
      setIsAddDepartmentDialogOpen(false);
    } catch (error) {
      console.error("Failed to create department:", error);
    }
  };

  // Get available divisions for department creation
  const divisions = divisionsData?.divisions?.items || [];

  // Get managers (employees with MANAGER role only)
  const managers =
    rawEmployees?.filter(
      (emp: { role?: string }) => emp.role === EmployeeRole.MANAGER
    ) || [];

  // Show loading while checking permissions or fetching the scoped employee page.
  if (permissionsLoading || (canAccessEmployees && loading)) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
          <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Route policy and page UI both require manager level or above.
  if (!canAccessEmployees) {
    return (
      <AccessDenied
        title="Access Denied"
        message="You do not have permission to view employees."
        action={
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </Button>
        }
      />
    );
  }

  const canAddEmployee = employeePermissions.canCreate();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header and Actions */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="mobile-heading text-[#3F3F46] dark:text-gray-100 font-bold tracking-tight">
            Employees
          </h1>
          <p className="mobile-text text-gray-500 dark:text-gray-400 mt-1">
            {hasOrganizationWideAccess ? "Manage organization-wide employees" : guards.isDirector ? "Manage employees in your division" : "Manage employees in your department"}
          </p>
        </div>
      </div>

      {/* Only show filter bar and actions when there's data or loading */}
      {/* Always show search and filter controls, except when there are truly no employees */}
      {!(filteredEmployees.length === 0 && !searchTerm && !loading && !error) && (
        <>
          <div className="flex flex-col gap-3 sm:gap-4">
            <EmployeeFilterBar
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              searchValue={searchTerm}
              filterValue={filterStatus}
              sortValue={sortOrder}
              disabled={loading}
            />
            <div className="flex gap-2 items-center justify-end sm:justify-start">
              {canAddEmployee && (
                <AddEmployeeDialog>
                  <Button className="bg-[#3838EC] hover:bg-[#2828DC] w-full sm:w-auto">
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Add Employee</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </AddEmployeeDialog>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-red-800 font-medium">
                Unable to load employees
              </h3>
              <p className="text-red-600 text-sm mt-1">
                {error.message || "Please check your connection and try again."}
              </p>
              {error.message?.includes("401") && (
                <p className="text-red-600 text-sm mt-2">
                  <strong>Authentication required:</strong> Please log in to
                  view employees.
                </p>
              )}
              {error.message?.includes("Require one of roles") && (
                <p className="text-red-600 text-sm mt-2">
                  <strong>Access denied:</strong> You don&apos;t have permission
                  to view employees. Contact your administrator.
                </p>
              )}
            </div>
          )}

          {/* Results Summary */}
          {(searchTerm || filterStatus !== "all" || sortOrder !== "none") && (
            <div className="flex items-center justify-between mobile-text text-gray-600 dark:text-gray-400">
              <span className="truncate">
                Showing {filteredEmployees.length} of {rawEmployees.length}{" "}
                employees
                {searchTerm && (
                  <span className="ml-1 hidden sm:inline">
                    matching &quot;{searchTerm}&quot;
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span className="ml-1 hidden sm:inline">
                    with status &quot;{filterStatus}&quot;
                  </span>
                )}
                {sortOrder !== "none" && (
                  <span className="ml-1 hidden sm:inline">
                    sorted {sortOrder === "asc" ? "A to Z" : "Z to A"}
                  </span>
                )}
              </span>
            </div>
          )}
        </>
      )}

      {/* Empty State or Table */}
      {!loading && !error && rawEmployees.length === 0 && !searchTerm ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4">
          <Image
            src="/images/dashboard/objective-empty.png"
            alt="No employees"
            width={320}
            height={240}
            className="mb-8 sm:mb-12 w-48 sm:w-80 h-auto"
            priority
          />
          {rawEmployees.length === 0 && !loading && !hasOrganizationWideAccess && (
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-amber-600 dark:text-amber-400 mb-3 sm:mb-4 max-w-xl px-4">
                No Employees Found
              </h2>
              <p className="mobile-text text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-md px-4">
                You might not have any employees assigned to your {guards.isDirector ? "division" : "department"} yet.
              </p>
            </div>
          )}
          {hasOrganizationWideAccess && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#3F3F46] dark:text-gray-100 mb-3 sm:mb-4 max-w-xl px-4">
                It seems you don&apos;t have added any employees yet
              </h2>
              <p className="mobile-text text-[#BABABA] dark:text-gray-400 mb-6 sm:mb-12 max-w-sm px-4">
                Start building your team by adding employees.
              </p>
              {canAddEmployee && (
                <AddEmployeeDialog>
                  <Button className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-[#3838EC] hover:bg-[#3838EC]/90 text-white rounded-md font-medium transition-colors cursor-pointer w-full sm:w-auto max-w-xs">
                    <Plus className="w-4 h-4 mr-1" /> Add Employee
                  </Button>
                </AddEmployeeDialog>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="dark:bg-muted rounded-lg border table-container">
            <EmployeeTable
              employees={filteredEmployees}
              loading={loading}
              error={error && !loading ? error.message : undefined}
            />
          </div>

          {/* Pagination - show when we have results (server-side search and pagination work together) */}
          {filteredEmployees.length > 0 && (
            <EmployeePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              loading={loading}
            />
          )}
        </>
      )}

      {/* Add Department Dialog */}
      <AddDepartmentDialog
        open={isAddDepartmentDialogOpen}
        onOpenChange={setIsAddDepartmentDialogOpen}
        departmentName={departmentName}
        setDepartmentName={setDepartmentName}
        departmentManager={departmentManager}
        setDepartmentManager={setDepartmentManager}
        selectedDivision={selectedDivision}
        setSelectedDivision={setSelectedDivision}
        departmentMembers={departmentMembers}
        setDepartmentMembers={setDepartmentMembers}
        managers={managers.map((manager) => ({
          employeeId: manager.employeeId,
          fullName: manager.fullName,
        }))}
        divisions={divisions.map((d: GraphQLDivision) => ({
          divisionId: d.divisionId,
          name: d.name,
        }))}
        allMembers={rawEmployees.filter(
          (employee) => employee.role === EmployeeRole.NORMAL
        )}
        onSubmit={handleSubmitDepartment}
        loading={departmentMutationLoading.create}
      />
    </div>
  );
};

export default EmployeesPage;
