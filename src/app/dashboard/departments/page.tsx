"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { useDepartmentMutations } from "@/hooks/useDepartmentMutations";
import {
  DepartmentsQueryVariables,
  Department as GraphQLDepartment,
  Division,
  Employee,
  EmployeeRole,
  PaginatedDepartments,
  PaginatedDivisions,
  PaginatedEmployees,
} from "@/types/graphql";

const DepartmentsPage = () => {
  const router = useRouter();
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

  // GraphQL queries
  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
    refetch,
  } = useQuery<{ departments: PaginatedDepartments }>(GET_DEPARTMENTS, {
    variables: {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
    } as DepartmentsQueryVariables,
    fetchPolicy: "cache-and-network",
  });

  const { data: divisionsData } = useQuery<{ divisions: PaginatedDivisions }>(
    GET_DIVISIONS,
    {
      variables: { page: 1, limit: 100 },
    }
  );

  const { data: employeesData } = useQuery<{ employees: PaginatedEmployees }>(
    GET_EMPLOYEES,
    {
      variables: { page: 1, limit: 100 },
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
  const transformDepartment = (dept: GraphQLDepartment): Department => ({
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
    if (!departmentsData?.departments?.items) return [];

    let filteredDepartments = departmentsData.departments.items;

    // Apply status filters (client-side)
    if (filterStatus !== "all") {
      filteredDepartments = filteredDepartments.filter(
        (dept: GraphQLDepartment) => {
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
  }, [departmentsData, filterStatus]);
  const totalItems = departmentsData?.departments?.meta?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get available divisions for filter
  const divisions = divisionsData?.divisions?.items || [];

  // Get managers (employees with MANAGER, ADMIN, or SUPER_ADMIN roles)
  const managers =
    employeesData?.employees?.items?.filter(
      (emp: Employee) =>
        emp.role === EmployeeRole.MANAGER ||
        emp.role === EmployeeRole.ADMIN ||
        emp.role === EmployeeRole.SUPER_ADMIN
    ) || [];

  // Get all employees for member selection
  const allEmployees = employeesData?.employees?.items || [];

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
      setIsAddDialogOpen(false);

      // Refresh data after everything is complete
      refetch();
    } catch (error) {
      console.error("Failed to create department:", error);
    }
  };

  const loading = departmentsLoading || mutationLoading.create;

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-4xl text-[#3F3F46] font-bold tracking-tight">
          Departments
        </h1>
      </div>

      {/* Only show filter bar and actions when there's data or loading */}
      {(departmentsLoading || departmentsError || departments.length > 0) && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <DepartmentFilterBar
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              searchValue={searchTerm}
              filterValue={filterStatus}
              disabled={loading}
            />
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
          </div>

          {/* Results Summary */}
          {(searchTerm || filterStatus !== "all") && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {departments.length} of {totalItems} departments
                {searchTerm && (
                  <span className="ml-1">matching "{searchTerm}"</span>
                )}
                {filterStatus !== "all" && (
                  <span className="ml-1">
                    with status "{filterStatus.replace("_", " ")}"
                  </span>
                )}
              </span>
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {departmentsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            Error loading departments: {departmentsError.message}
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
      {!departmentsLoading && !departmentsError && departments.length === 0 ? (
        <EmptyState onAddDepartment={handleAddDepartment} />
      ) : (
        <>
          {/* Table */}
          <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
            <DepartmentTable
              departments={departments}
              loading={departmentsLoading}
              error={departmentsError?.message}
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
