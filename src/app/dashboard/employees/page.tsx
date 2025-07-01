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
import { useAuth } from "@/hooks/useAuth";
import { useDepartmentMutations } from "@/hooks/useDepartmentMutations";
import {
  PaginatedDivisions,
  PaginatedEmployees,
  Division as GraphQLDivision,
  Employee as GraphQLEmployee,
  EmployeeRole,
} from "@/types/graphql";

const EmployeesPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Department dialog state
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] =
    useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentManager, setDepartmentManager] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [departmentMembers, setDepartmentMembers] = useState<string[]>([]);

  const { user } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_EMPLOYEES, {
    variables: {
      page: currentPage,
      limit: itemsPerPage,
    },
    errorPolicy: "all",
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

  // Filter employees based on search and filter criteria
  const filteredEmployees = employees.filter((employee: any) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phoneNumber?.includes(searchTerm) ||
      employee.role?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && employee.status === "ACTIVE") ||
      (filterStatus === "inactive" &&
        (employee.status === "INACTIVE" || employee.status === "DISABLED"));

    return matchesSearch && matchesStatus;
  });

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

  // Department dialog handlers
  const handleAddDepartment = () => {
    setIsAddDepartmentDialogOpen(true);
  };

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

  // Get managers (employees with MANAGER, ADMIN, or SUPER_ADMIN roles)
  const managers =
    employees?.filter(
      (emp: any) =>
        emp.role === EmployeeRole.MANAGER ||
        emp.role === EmployeeRole.ADMIN ||
        emp.role === EmployeeRole.SUPER_ADMIN
    ) || [];

  // Check if user has permission to add employees
  const canAddEmployee = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-4xl text-[#3F3F46] font-bold tracking-tight">
          Employees
        </h1>
      </div>

      {/* Only show filter bar and actions when there's data or loading */}
      {(loading || error || employees.length > 0) && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <EmployeeFilterBar
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              searchValue={searchTerm}
              filterValue={filterStatus}
              disabled={loading}
            />
            <div className="flex gap-2 items-center">
              {canAddEmployee && (
                <AddEmployeeDialog>
                  <Button className="ml-2">
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
                  <strong>Access denied:</strong> You don't have permission to
                  view employees. Contact your administrator.
                </p>
              )}
            </div>
          )}

          {/* Results Summary */}
          {(searchTerm || filterStatus !== "all") && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredEmployees.length} of {employees.length}{" "}
                employees
                {searchTerm && (
                  <span className="ml-1">matching "{searchTerm}"</span>
                )}
                {filterStatus !== "all" && (
                  <span className="ml-1">with status "{filterStatus}"</span>
                )}
              </span>
            </div>
          )}
        </>
      )}

      {/* Empty State or Table */}
      {!loading && !error && employees.length === 0 ? (
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
            It seems you don't have added any employees yet
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
              onAddDepartment={handleAddDepartment}
            />
          </div>

          {/* Pagination - only show if we have unfiltered results or no filters applied */}
          {!searchTerm && filterStatus === "all" && (
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
        managers={managers.map((m: any) => ({
          employeeId: m.employeeId,
          fullName: m.fullName,
        }))}
        divisions={divisions.map((d: GraphQLDivision) => ({
          divisionId: d.divisionId,
          name: d.name,
        }))}
        allMembers={employees}
        onSubmit={handleSubmitDepartment}
        loading={departmentMutationLoading.create}
      />
    </div>
  );
};

export default EmployeesPage;
