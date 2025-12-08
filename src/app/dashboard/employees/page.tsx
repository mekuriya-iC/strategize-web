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
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/auth/RequirePermission";
import { useDepartmentMutations } from "@/hooks/useDepartmentMutations";
import { useRouter } from "next/navigation";
import {
  PaginatedDivisions,
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

  // Use new RBAC system
  const { employees: employeePermissions, isLoading: permissionsLoading } = usePermissions();

  const { data, loading, error } = useQuery(GET_EMPLOYEES, {
    variables: {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
    },
    errorPolicy: "all",
    skip: !employeePermissions.canView(), // Don't fetch if no permission
  });

  // Fetch divisions for department creation
  const { data: divisionsData } = useQuery<{ divisions: PaginatedDivisions }>(
    GET_DIVISIONS,
    {
      variables: { page: 1, limit: 100 },
    }
  );

  // Department mutations
  const { createDepartment, loading: departmentMutationLoading } =
    useDepartmentMutations();

  const employees = data?.employees?.items || [];
  const meta = data?.employees?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || 0;

  // Apply client-side filtering for status and sorting (search is handled server-side)
  const filteredEmployees = employees
    .filter(
      (employee: {
        fullName?: string;
        email?: string;
        phoneNumber?: string;
        role?: string;
        status?: string;
      }) => {
        // Status filter (client-side since it's not in the GraphQL schema)
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && employee.status === "ACTIVE") ||
          (filterStatus === "inactive" &&
            (employee.status === "INACTIVE" || employee.status === "DISABLED"));

        return matchesStatus;
      }
    )
    .sort(
      (
        a: {
          fullName?: string;
          email?: string;
          phoneNumber?: string;
          role?: string;
          status?: string;
        },
        b: {
          fullName?: string;
          email?: string;
          phoneNumber?: string;
          role?: string;
          status?: string;
        }
      ) => {
        if (sortOrder === "none") return 0;

        const nameA = a.fullName?.toLowerCase() || "";
        const nameB = b.fullName?.toLowerCase() || "";

        if (sortOrder === "asc") {
          return nameA.localeCompare(nameB);
        } else if (sortOrder === "desc") {
          return nameB.localeCompare(nameA);
        }

        return 0;
      }
    );

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
          managerId: departmentManager || undefined,
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
    employees?.filter(
      (emp: { role?: string }) => emp.role === EmployeeRole.MANAGER
    ) || [];

  // Permission checks using new RBAC
  const canAddEmployee = employeePermissions.canCreate();

  // Show loading while checking permissions
  if (permissionsLoading) {
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

  // Check if user has permission to view employees
  if (!employeePermissions.canView()) {
    return (
      <AccessDenied
        title="Access Denied"
        message="You do not have permission to view employees. This area is restricted to administrators only."
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

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
        <h1 className="text-2xl md:text-4xl text-[#3F3F46] font-bold tracking-tight">
          Employees
        </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organization&apos;s employees
          </p>
        </div>
      </div>

      {/* Only show filter bar and actions when there's data or loading */}
      {/* Always show search and filter controls, except when there are truly no employees */}
      {!(employees.length === 0 && !searchTerm && !loading && !error) && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <EmployeeFilterBar
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              searchValue={searchTerm}
              filterValue={filterStatus}
              sortValue={sortOrder}
              disabled={loading}
            />
            <div className="flex gap-2 items-center">
              {canAddEmployee && (
                <AddEmployeeDialog>
                  <Button className="ml-2 bg-[#3838EC] hover:bg-[#2828DC]">
                    <Plus width={16} height={16} />
                    Add Employee
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
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredEmployees.length} of {employees.length}{" "}
                employees
                {searchTerm && (
                  <span className="ml-1">
                    matching &quot;{searchTerm}&quot;
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span className="ml-1">
                    with status &quot;{filterStatus}&quot;
                  </span>
                )}
                {sortOrder !== "none" && (
                  <span className="ml-1">
                    sorted {sortOrder === "asc" ? "A to Z" : "Z to A"}
                  </span>
                )}
              </span>
            </div>
          )}
        </>
      )}

      {/* Empty State or Table */}
      {!loading && !error && employees.length === 0 && !searchTerm ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Image
            src="/images/dashboard/objective-empty.png"
            alt="No employees"
            width={320}
            height={240}
            className="mb-12"
            priority
          />
          <h2 className="text-2xl font-semibold text-[#3F3F46] dark:text-gray-100 mb-4 max-w-xl">
            It seems you don&apos;t have added any employees yet
          </h2>
          <p className="text-[#BABABA] dark:text-gray-400 mb-8 md:mb-12 text-lg max-w-sm">
            Start building your team by adding employees.
          </p>
          {canAddEmployee && (
            <AddEmployeeDialog>
              <Button className="px-6 py-3 text-base bg-[#3838EC] hover:bg-[#3838EC]/90 text-white rounded-md font-medium transition-colors cursor-pointer">
                <Plus className="w-4 h-4 mr-1" /> Add Employee
              </Button>
            </AddEmployeeDialog>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
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
        managers={managers.map(
          (m: { employeeId?: string; fullName?: string }) => ({
            employeeId: m.employeeId,
            fullName: m.fullName,
          })
        )}
        divisions={divisions.map((d: GraphQLDivision) => ({
          divisionId: d.divisionId,
          name: d.name,
        }))}
        allMembers={employees.filter(
          (emp: { role?: string }) => emp.role === EmployeeRole.NORMAL
        )}
        onSubmit={handleSubmitDepartment}
        loading={departmentMutationLoading.create}
      />
    </div>
  );
};

export default EmployeesPage;
