"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Users,
  Building2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useObjectiveAssignment } from "@/hooks/useObjectiveAssignment";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_ME } from "@/lib/graphql/queries/employees";
import type {
  Objective,
  Kpi,
  Division,
  Department,
  Employee,
  PaginatedDivisions,
  PaginatedDepartments,
} from "@/types/graphql";

interface AssignObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective;
  kpis: Kpi[];
  onSuccess?: () => void;
}

type AssigneeType = "DIVISION" | "DEPARTMENT" | "EMPLOYEE";

export default function AssignObjectiveDialog({
  open,
  onOpenChange,
  objective,
  kpis,
  onSuccess,
}: AssignObjectiveDialogProps) {
  const { assignObjective, loading } = useObjectiveAssignment();

  // State management
  const [assigneeType, setAssigneeType] = useState<AssigneeType>("DIVISION");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignments, setAssignments] = useState<
    Array<{
      assigneeId: string;
      assigneeType: AssigneeType;
      assigneeName: string;
      kpis: string[];
    }>
  >([]);

  // Current user (assigner)
  const { data: meData } = useQuery(GET_ME, { fetchPolicy: "cache-first" });
  const assignerId: string | undefined = meData?.me?.employeeId;

  // Fetch divisions and departments
  const { data: divisionsData } = useQuery<{ divisions: PaginatedDivisions }>(
    GET_DIVISIONS,
    {
      variables: { page: 1, limit: 1000 },
      fetchPolicy: "cache-and-network",
    }
  );

  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
  } = useQuery<{
    departments: PaginatedDepartments;
  }>(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.error("❌ Failed to load departments:", error);
    },
  });

  // Extract employees from department data (workaround for manager permissions)
  const extractedEmployees = useMemo(() => {
    if (!departmentsData?.departments?.items) return [];

    const employeeMap = new Map();

    // Collect all employees from all departments
    departmentsData.departments.items.forEach((dept) => {
      dept.employees?.forEach((emp) => {
        if (!employeeMap.has(emp.employeeId)) {
          // Create employee object with department info
          employeeMap.set(emp.employeeId, {
            ...emp,
            departments: [{ departmentId: dept.departmentId, name: dept.name }],
          });
        } else {
          // Add this department to existing employee
          const existingEmp = employeeMap.get(emp.employeeId) as Employee & {
            departments?: Array<{ departmentId: string; name: string }>;
          };
          (existingEmp.departments ||= []).push({
            departmentId: dept.departmentId,
            name: dept.name,
          });
        }
      });
    });

    const employees = Array.from(employeeMap.values()) as Array<
      Employee & {
        departments?: Array<{ departmentId: string; name: string }>;
      }
    >;
    console.log("✅ Employees extracted from departments:", {
      totalEmployees: employees.length,
      employees: employees.map((emp) => ({
        id: emp.employeeId,
        name: emp.fullName,
        departments: emp.departments?.length || 0,
        departmentNames:
          emp.departments?.map(
            (d: { departmentId: string; name: string }) => d.name
          ) || [],
      })),
    });

    return employees;
  }, [departmentsData]);

  // Use extracted employees instead of direct query
  const employeesLoading = departmentsLoading;
  const employeesError = departmentsError;

  // Initialize selected KPIs with all KPIs when dialog opens
  useEffect(() => {
    if (open && kpis.length > 0) {
      setSelectedKPIs(kpis.map((kpi) => kpi.kpiId));
    }
  }, [open, kpis]);

  // Reset assigneeType to appropriate default based on objective type
  useEffect(() => {
    if (open) {
      if (objective.type === "CORPORATE" && assigneeType === "EMPLOYEE") {
        setAssigneeType("DIVISION");
      } else if (
        objective.type === "DIVISION" &&
        (assigneeType === "DIVISION" || assigneeType === "EMPLOYEE")
      ) {
        setAssigneeType("DEPARTMENT");
      } else if (
        objective.type === "DEPARTMENT" &&
        (assigneeType === "DIVISION" || assigneeType === "DEPARTMENT")
      ) {
        setAssigneeType("EMPLOYEE");
      }
    }
  }, [open, objective.type, assigneeType]);

  // Helper function to get tab count for grid layout
  const getTabCount = () => {
    if (objective.type === "CORPORATE") {
      return 2; // Division, Department
    } else if (objective.type === "DIVISION") {
      return 1; // Department only
    } else if (objective.type === "DEPARTMENT") {
      return 1; // Employee only
    }
    return 1;
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSelectedAssigneeIds([]);
      setSelectedKPIs([]);
      setAssignments([]);
      setAssigneeType("DIVISION");
      setIsSubmitting(false);
    }
  }, [open]);

  // Get available assignees based on type
  const divisions = divisionsData?.divisions?.items || [];
  const departments = departmentsData?.departments?.items || [];
  const employees = extractedEmployees || [];

  // Filter assignees based on organizational hierarchy and search term
  const filteredDivisions = divisions.filter((division: Division) =>
    division.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // For division objectives, show only departments that belong to this division
  const filteredDepartments = departments.filter((department: Department) => {
    const matchesSearch = department.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // If this is a division objective, only show departments under this division
    if (objective.type === "DIVISION" && objective.assigneeId) {
      const belongsToThisDivision =
        department.division?.divisionId === objective.assigneeId;
      console.log(`🏢 Department filtering for ${objective.type} objective:`, {
        departmentName: department.name,
        departmentDivisionId: department.division?.divisionId,
        objectiveAssigneeId: objective.assigneeId,
        belongsToThisDivision,
        willInclude: matchesSearch && belongsToThisDivision,
      });
      return matchesSearch && belongsToThisDivision;
    }

    // For corporate objectives, show all departments
    return matchesSearch;
  });

  // For department objectives, show only employees that belong to this department
  const filteredEmployees = employees.filter((employee: Employee) => {
    const matchesSearch = employee.fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    console.log(`🔍 Employee filtering debug for ${employee.fullName}:`, {
      objectiveType: objective.type,
      objectiveAssigneeId: objective.assigneeId,
      employeeDepartments: employee.departments,
      hasEmployeeDepartments: !!employee.departments,
      departmentCount: employee.departments?.length || 0,
    });

    // If this is a department objective, only show employees in this department
    if (objective.type === "DEPARTMENT" && objective.assigneeId) {
      const belongsToThisDepartment = employee.departments?.some(
        (dept) => dept.departmentId === objective.assigneeId
      );
      console.log(`👤 Department filtering for ${employee.fullName}:`, {
        objectiveAssigneeId: objective.assigneeId,
        employeeDepartments:
          employee.departments?.map((d) => ({
            id: d.departmentId,
            name: d.name,
          })) || [],
        belongsToThisDepartment,
        matchesSearch,
        willInclude: matchesSearch && belongsToThisDepartment,
      });
      return matchesSearch && belongsToThisDepartment;
    }

    // For division objectives, show all employees (they can assign to any employee)
    console.log(
      `👤 Non-department filtering for ${employee.fullName}: matchesSearch = ${matchesSearch}`
    );
    return matchesSearch;
  });

  // Debug: Log filtering summary
  console.log(
    `🎯 Assignment filtering summary for ${objective.type} objective:`,
    {
      objectiveName: objective.name,
      objectiveAssigneeId: objective.assigneeId,
      totalDivisions: divisions.length,
      filteredDivisions: filteredDivisions.length,
      totalDepartments: departments.length,
      filteredDepartments: filteredDepartments.length,
      totalEmployees: employees.length,
      filteredEmployees: filteredEmployees.length,
      allEmployees: employees.map((emp) => ({
        id: emp.employeeId,
        name: emp.fullName,
        departments:
          emp.departments?.map((d: { departmentId: string; name: string }) => ({
            id: d.departmentId,
            name: d.name,
          })) || [],
      })),
    }
  );

  // Helper function to get assignee details by ID and type
  const getAssigneeDetails = (assigneeId: string, type: AssigneeType) => {
    switch (type) {
      case "DIVISION":
        return divisions.find(
          (division: Division) => division.divisionId === assigneeId
        );
      case "DEPARTMENT":
        return departments.find(
          (department: Department) => department.departmentId === assigneeId
        );
      case "EMPLOYEE":
        return employees.find(
          (employee: Employee) => employee.employeeId === assigneeId
        );
      default:
        return null;
    }
  };

  // Helper function to handle multiple assignee selection
  const handleAssigneeSelection = (assigneeId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssigneeIds((prev) => [...prev, assigneeId]);
    } else {
      setSelectedAssigneeIds((prev) => prev.filter((id) => id !== assigneeId));
    }
  };

  // Handle KPI selection
  const handleKPISelection = (kpiId: string, checked: boolean) => {
    if (checked) {
      setSelectedKPIs((prev) => [...prev, kpiId]);
    } else {
      setSelectedKPIs((prev) => prev.filter((id) => id !== kpiId));
    }
  };

  // Handle select all KPIs
  const handleSelectAllKPIs = (checked: boolean) => {
    if (checked) {
      setSelectedKPIs(kpis.map((kpi) => kpi.kpiId));
    } else {
      setSelectedKPIs([]);
    }
  };

  // Add selected assignees to assignment list
  const handleAddToAssignments = () => {
    if (selectedAssigneeIds.length === 0 || selectedKPIs.length === 0) {
      return;
    }

    const newAssignments = selectedAssigneeIds.map((assigneeId) => {
      const assignee = getAssigneeDetails(assigneeId, assigneeType);
      let assigneeName = "";

      if (assigneeType === "EMPLOYEE") {
        assigneeName = (assignee as Employee)?.fullName || "";
      } else {
        assigneeName = (assignee as Division | Department)?.name || "";
      }

      return {
        assigneeId,
        assigneeType,
        assigneeName,
        kpis: [...selectedKPIs],
      };
    });

    setAssignments((prev) => [...prev, ...newAssignments]);

    // Clear current selections
    setSelectedAssigneeIds([]);
    setSelectedKPIs([]);
  };

  // Remove assignment from list
  const handleRemoveAssignment = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission - assign all assignments
  const handleSubmit = async () => {
    if (assignments.length === 0 || !assignerId) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit each assignment individually
      for (const assignment of assignments) {
        const apiAssigneeType =
          assignment.assigneeType === "EMPLOYEE"
            ? "PERSONNEL"
            : assignment.assigneeType;

        await assignObjective({
          objectiveId: objective.objectiveId,
          assigneeId: assignment.assigneeId,
          assignerId,
          assigneeType: apiAssigneeType,
          kpis: assignment.kpis,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Assignment failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = assignments.length > 0 && !!assignerId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Objective
          </DialogTitle>
          <DialogDescription>
            Assign &quot;{objective.name}&quot; to a{" "}
            {objective.type === "CORPORATE"
              ? "division or department"
              : objective.type === "DIVISION"
              ? "department"
              : "employee"}{" "}
            with selected KPIs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignee Type Selection */}
          <Tabs
            value={assigneeType}
            onValueChange={(value) => setAssigneeType(value as AssigneeType)}
          >
            <TabsList
              className={`grid w-full ${
                getTabCount() === 1
                  ? "grid-cols-1"
                  : getTabCount() === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {/* Division tab - only show for CORPORATE objectives */}
              {objective.type === "CORPORATE" && (
                <TabsTrigger
                  value="DIVISION"
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Division
                </TabsTrigger>
              )}

              {/* Department tab - show for CORPORATE and DIVISION objectives */}
              {(objective.type === "CORPORATE" ||
                objective.type === "DIVISION") && (
                <TabsTrigger
                  value="DEPARTMENT"
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Department
                </TabsTrigger>
              )}

              {/* Employee tab - show for DEPARTMENT objectives only */}
              {objective.type === "DEPARTMENT" && (
                <TabsTrigger
                  value="EMPLOYEE"
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Employee
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="DIVISION" className="space-y-4">
              <div className="space-y-2">
                <Label>Search Divisions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search divisions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredDivisions.map((division: Division) => (
                  <div
                    key={division.divisionId}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedAssigneeIds.includes(division.divisionId)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAssigneeIds.includes(
                          division.divisionId
                        )}
                        onCheckedChange={(checked) =>
                          handleAssigneeSelection(
                            division.divisionId,
                            checked as boolean
                          )
                        }
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{division.name}</h4>
                        <p className="text-sm text-gray-500">
                          Manager: {division.manager?.fullName || "No Manager"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Departments: {division.departments?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="DEPARTMENT" className="space-y-4">
              <div className="space-y-2">
                <Label>Search Departments</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredDepartments.map((department: Department) => (
                  <div
                    key={department.departmentId}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedAssigneeIds.includes(department.departmentId)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAssigneeIds.includes(
                          department.departmentId
                        )}
                        onCheckedChange={(checked) =>
                          handleAssigneeSelection(
                            department.departmentId,
                            checked as boolean
                          )
                        }
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{department.name}</h4>
                        <p className="text-sm text-gray-500">
                          Manager:{" "}
                          {department.manager?.fullName || "No Manager"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Division: {department.division?.name || "No Division"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Employees: {department.employees?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="EMPLOYEE" className="space-y-4">
              <div className="space-y-2">
                <Label>Search Employees</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {employeesLoading && (
                  <div className="p-4 text-center text-gray-500">
                    Loading employees...
                  </div>
                )}
                {employeesError && (
                  <div className="p-4 text-center text-red-500">
                    Error loading employees: {employeesError.message}
                  </div>
                )}
                {!employeesLoading &&
                  !employeesError &&
                  filteredEmployees.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No employees found for this department
                    </div>
                  )}
                {filteredEmployees.map((employee: Employee) => (
                  <div
                    key={employee.employeeId}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedAssigneeIds.includes(employee.employeeId)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAssigneeIds.includes(
                          employee.employeeId
                        )}
                        onCheckedChange={(checked) =>
                          handleAssigneeSelection(
                            employee.employeeId,
                            checked as boolean
                          )
                        }
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{employee.fullName}</h4>
                        <p className="text-sm text-gray-500">
                          Email: {employee.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Role: {employee.role}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: {employee.status}
                        </p>
                        {employee.departments &&
                          employee.departments.length > 0 && (
                            <p className="text-sm text-gray-500">
                              Department:{" "}
                              {employee.departments
                                .map((dept) => dept.name)
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Add to Assignment List Button */}
          {selectedAssigneeIds.length > 0 && selectedKPIs.length > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={handleAddToAssignments}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Add {selectedAssigneeIds.length} {assigneeType.toLowerCase()}
                {selectedAssigneeIds.length > 1 ? "s" : ""} with{" "}
                {selectedKPIs.length} KPI{selectedKPIs.length > 1 ? "s" : ""} to
                Assignment List
              </Button>
            </div>
          )}

          <Separator />

          {/* KPI Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select KPIs to Assign</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedKPIs.length === kpis.length && kpis.length > 0
                    }
                    onCheckedChange={handleSelectAllKPIs}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.kpiId}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <Checkbox
                      checked={selectedKPIs.includes(kpi.kpiId)}
                      onCheckedChange={(checked) =>
                        handleKPISelection(kpi.kpiId, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{kpi.name}</h4>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Baseline: {kpi.baseline || "N/A"}</span>
                        <span>Weight: {kpi.weight}%</span>
                        <span>Targets: {kpi.targets?.length || 0}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        kpi.status === "APPROVED" ? "default" : "secondary"
                      }
                    >
                      {kpi.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assignment List */}
          {assignments.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Assignment List ({assignments.length} assignments)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-300"
                          >
                            {assignment.assigneeType}
                          </Badge>
                          <h4 className="font-medium">
                            {assignment.assigneeName}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {assignment.kpis.length} KPI
                          {assignment.kpis.length > 1 ? "s" : ""}:{" "}
                          {assignment.kpis
                            .map((kpiId) => {
                              const kpi = kpis.find((k) => k.kpiId === kpiId);
                              return kpi?.name;
                            })
                            .join(", ")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAssignment(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Warning */}
          {assignments.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">
                Please add at least one assignment to the list before
                submitting.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || loading || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading || isSubmitting
              ? "Assigning..."
              : `Assign to ${assignments.length} ${
                  assignments.length === 1 ? "Entity" : "Entities"
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
