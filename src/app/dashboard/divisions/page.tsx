"use client";
import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DivisionTable from "@/components/divisions/DivisionTable";
import type { Division } from "@/components/divisions/DivisionTable";
import DivisionFilterBar from "@/components/divisions/DivisionFilterBar";
import DivisionPagination from "@/components/divisions/DivisionPagination";
import AddDivisionDialog from "@/components/divisions/AddDivisionDialog";
import AddDepartmentDialog from "@/components/departments/AddDepartmentDialog";
import EmptyState from "@/components/divisions/EmptyState";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { useDivisionMutations } from "@/hooks/divisions/useDivisionMutations";
import { useDepartmentMutations } from "@/hooks/departments/useDepartmentMutations";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import type {
  PaginatedDivisions,
  PaginatedEmployees,
  PaginatedDepartments,
  Division as GraphQLDivision,
  Employee as GraphQLEmployee,
  Department as GraphQLDepartment,
} from "@/types/graphql";

const DivisionsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "managed" | "recent" | "with_departments" | "no_departments"
  >("all");

  // Get permissions to check if user can access employees
  const { guards } = usePermissions();
  const canAccessEmployees = guards.isAdmin || guards.isSuperAdmin;

  // GraphQL queries
  const {
    data: divisionsData,
    loading: divisionsLoading,
    error: divisionsError,
    refetch: refetchDivisions,
  } = useQuery<{ divisions: PaginatedDivisions }>(GET_DIVISIONS, {
    variables: {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  // Fetch employees for director selection (DIRECTOR role for divisions)
  // Only fetch if user has admin access (backend requires ADMIN or SUPER_ADMIN)
  const { data: employeesData } = useQuery<{ employees: PaginatedEmployees }>(
    GET_EMPLOYEES,
    {
      variables: {
        page: 1,
        limit: 100, // Get enough directors for the dropdown
      },
      fetchPolicy: "cache-first",
      skip: !canAccessEmployees,
    }
  );

  // Fetch departments for department selection
  const { data: departmentsData } = useQuery<{
    departments: PaginatedDepartments;
  }>(GET_DEPARTMENTS, {
    variables: {
      page: 1,
      limit: 100, // Get enough departments for the dropdown
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  // Division mutations
  const { createDivision, loading: mutationLoading } = useDivisionMutations();

  // Department mutations
  const {
    createDepartment,
    updateDepartment,
    loading: departmentMutationLoading,
  } = useDepartmentMutations();

  // Add Division Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [divisionName, setDivisionName] = useState("");
  const [divisionManager, setDivisionManager] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Add Department Dialog state
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] =
    useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentManager, setDepartmentManager] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departmentMembers, setDepartmentMembers] = useState<string[]>([]);

  // Transform GraphQL data to match UI interface and apply filters
  const transformedDivisions: Division[] = React.useMemo(() => {
    if (!divisionsData?.divisions.items) return [];

    let filteredDivisions = divisionsData.divisions.items;

    // Apply filters
    if (filterType !== "all") {
      filteredDivisions = filteredDivisions.filter(
        (division: GraphQLDivision) => {
          switch (filterType) {
            case "managed":
              return division.manager !== null;
            case "recent":
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(division.createdAt) > weekAgo;
            case "with_departments":
              return (division.departments?.length || 0) > 0;
            case "no_departments":
              return (division.departments?.length || 0) === 0;
            default:
              return true;
          }
        }
      );
    }

    return filteredDivisions.map((graphqlDivision: GraphQLDivision) => ({
      id: graphqlDivision.divisionId, // Keep as string ID
      divisionName: graphqlDivision.name,
      createdBy: "System", // GraphQL doesn't provide createdBy info
      createdOn: new Date(graphqlDivision.createdAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      ),
      managedBy: graphqlDivision.manager?.fullName || "No Manager",
      departments: graphqlDivision.departments?.length || 0,
    }));
  }, [divisionsData, filterType]);

  // Filter directors (DIRECTOR role only) for division management
  const managers = React.useMemo(() => {
    if (!employeesData?.employees.items) return [];

    return employeesData.employees.items
      .filter((employee: GraphQLEmployee) => employee.role === "DIRECTOR")
      .map((employee: GraphQLEmployee) => ({
        id: employee.employeeId,
        name: employee.fullName,
      }));
  }, [employeesData]);

  // Transform departments data for UI
  const allDepartments = React.useMemo(() => {
    if (!departmentsData?.departments.items) return [];

    return departmentsData.departments.items.map(
      (department: GraphQLDepartment) => department.name
    );
  }, [departmentsData]);

  // Transform employees data for department members (NORMAL role only)
  const allMembers = React.useMemo(() => {
    if (!employeesData?.employees.items) return [];

    return employeesData.employees.items
      .filter((employee: GraphQLEmployee) => employee.role === "NORMAL")
      .map((employee: GraphQLEmployee) => ({
        employeeId: employee.employeeId,
        fullName: employee.fullName,
      }));
  }, [employeesData]);

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
      | "managed"
      | "recent"
      | "with_departments"
      | "no_departments"
  ) => {
    setFilterType(filterValue);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleAddDivision = () => {
    setIsAddDialogOpen(true);
  };

  const handleSubmitDivision = async () => {
    if (!divisionName.trim() || !divisionManager) {
      return;
    }

    try {
      // First create the division
      const createdDivision = await createDivision({
        input: {
          name: divisionName.trim(),
          managerId: divisionManager,
        },
      });

      // If departments were selected and division was created successfully, assign them
      if (createdDivision && selectedDepartments.length > 0) {
        console.log(
          `Assigning ${selectedDepartments.length} departments to division ${createdDivision.divisionId}`
        );

        // Find the department IDs for the selected department names
        const departmentIds =
          departmentsData?.departments.items
            .filter((dept) => selectedDepartments.includes(dept.name))
            .map((dept) => dept.departmentId) || [];

        // Update each department to assign it to the new division
        const updatePromises = departmentIds.map((departmentId) =>
          updateDepartment({
            input: {
              departmentId,
              divisionId: createdDivision.divisionId,
            },
          })
        );

        // Wait for all department updates to complete
        await Promise.all(updatePromises);
        console.log(
          `Successfully assigned ${departmentIds.length} departments to division`
        );
      }

      // Reset form
      setDivisionName("");
      setDivisionManager("");
      setSelectedDepartments([]);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error creating division:", error);
    }
  };

  const handleAddDepartment = () => {
    setIsAddDepartmentDialogOpen(true);
  };

  const handleSubmitDepartment = async () => {
    if (!departmentName.trim() || !departmentManager || !selectedDepartment) {
      return;
    }

    try {
      await createDepartment({
        input: {
          name: departmentName.trim(),
          managerId: departmentManager,
          divisionId: selectedDepartment,
        },
        employeeIds: departmentMembers, // Assign selected members
      });

      // Reset form
      setDepartmentName("");
      setDepartmentManager("");
      setSelectedDepartment("");
      setDepartmentMembers([]);
      setIsAddDepartmentDialogOpen(false);
    } catch (error) {
      console.error("Error creating department:", error);
    }
  };

  // Loading state
  const loading =
    divisionsLoading ||
    mutationLoading.create ||
    departmentMutationLoading.create ||
    departmentMutationLoading.update;

  // Error state
  if (divisionsError) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="p-8 text-center">
          <p className="text-red-600">
            Error loading divisions: {String(divisionsError)}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalItems = divisionsData?.divisions.meta.totalItems || 0;
  const totalPages = divisionsData?.divisions.meta.totalPages || 0;

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-4xl text-[#3F3F46] font-bold tracking-tight">
          Divisions
        </h1>
      </div>

      {/* Only show filter bar and actions when there's data or loading */}
      {(divisionsLoading ||
        divisionsError ||
        transformedDivisions.length > 0) && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <DivisionFilterBar
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
                searchValue={searchTerm}
                filterValue={filterType}
                disabled={loading}
              />
              {/* Only show Add Division button for admins */}
              {canAccessEmployees && (
                <div className="flex gap-2 items-center">
                  <Button
                    className="ml-2"
                    onClick={handleAddDivision}
                    disabled={loading}
                  >
                    <Plus width={16} height={16} />
                    Add Division
                  </Button>
                </div>
              )}
            </div>

            {/* Results Summary */}
            {(searchTerm || filterType !== "all") && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {transformedDivisions.length} of {totalItems} divisions
                  {searchTerm && (
                    <span className="ml-1">
                      matching &quot;{searchTerm}&quot;
                    </span>
                  )}
                </span>
              </div>
            )}
          </>
        )}

      {/* Empty State or Table */}
      {!divisionsLoading &&
        !divisionsError &&
        transformedDivisions.length === 0 ? (
        canAccessEmployees ? (
          <EmptyState onAddDivision={handleAddDivision} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            No divisions found.
          </div>
        )
      ) : (
        <>
          {/* Table */}
          <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
            <DivisionTable
              divisions={transformedDivisions}
              loading={loading}
              error={divisionsError ? String(divisionsError) : undefined}
              managers={managers}
              allDepartments={departmentsData?.departments?.items?.map((d) => ({
                departmentId: d.departmentId,
                name: d.name,
                divisionId: d.division?.divisionId || null,
              })) || []}
              onAddDepartment={handleAddDepartment}
              onEditSuccess={() => {
                refetchDivisions();
              }}
              readOnly={!canAccessEmployees}
            />
          </div>

          {/* Pagination */}
          <DivisionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </>
      )}

      {/* Add Division Dialog */}
      <AddDivisionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        divisionName={divisionName}
        setDivisionName={setDivisionName}
        divisionManager={divisionManager}
        setDivisionManager={setDivisionManager}
        departments={selectedDepartments}
        setDepartments={setSelectedDepartments}
        managers={managers}
        allDepartments={allDepartments}
        onSubmit={handleSubmitDivision}
        loading={mutationLoading.create}
      />

      {/* Add Department Dialog */}
      <AddDepartmentDialog
        open={isAddDepartmentDialogOpen}
        onOpenChange={setIsAddDepartmentDialogOpen}
        departmentName={departmentName}
        setDepartmentName={setDepartmentName}
        departmentManager={departmentManager}
        setDepartmentManager={setDepartmentManager}
        selectedDivision={selectedDepartment}
        setSelectedDivision={setSelectedDepartment}
        departmentMembers={departmentMembers}
        setDepartmentMembers={setDepartmentMembers}
        managers={managers.map((m) => ({ employeeId: m.id, fullName: m.name }))}
        divisions={
          divisionsData?.divisions.items.map((d) => ({
            divisionId: d.divisionId,
            name: d.name,
          })) || []
        }
        allMembers={allMembers}
        onSubmit={handleSubmitDepartment}
      />
    </div>
  );
};

export default DivisionsPage;
