"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@apollo/client";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { useDepartmentMutations } from "@/hooks/departments/useDepartmentMutations";
import type { PaginatedDepartments, Department } from "@/types/graphql";
import { Building2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { parseGraphQLError } from "@/utils/errorParsing";

interface AddToDepartmentDialogProps {
  children: React.ReactNode;
  employeeId: string;
  employeeName: string;
  onSuccess?: () => void;
}

const AddToDepartmentDialog: React.FC<AddToDepartmentDialogProps> = ({
  children,
  employeeId,
  employeeName,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  // Fetch departments with their employees to check membership
  const { data: departmentsData, loading: departmentsLoading } = useQuery<{
    departments: PaginatedDepartments;
  }>(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 100 },
    fetchPolicy: "cache-and-network",
    skip: !open,
  });

  const { addEmployeeToDepartment, loading } = useDepartmentMutations();

  const departments = departmentsData?.departments?.items || [];
  const hasDepartments = departments.length > 0;

  // Find which departments the employee is already in
  const currentDepartments = useMemo(() => {
    return departments.filter((dept: Department) =>
      dept.employees?.some((emp) => emp.employeeId === employeeId)
    );
  }, [departments, employeeId]);

  const currentDepartmentIds = currentDepartments.map((d) => d.departmentId);

  // Reset selected department when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedDepartmentId("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartmentId) return;

    // Check if already in this department
    if (currentDepartmentIds.includes(selectedDepartmentId)) {
      const deptName = departments.find(
        (d) => d.departmentId === selectedDepartmentId
      )?.name;
      toast.error("Already in department", {
        description: `${employeeName} is already a member of ${deptName}.`,
      });
      return;
    }

    try {
      // Add to new department
      await addEmployeeToDepartment({
        departmentId: selectedDepartmentId,
        employeeId,
      });

      const deptName = departments.find(
        (d) => d.departmentId === selectedDepartmentId
      )?.name;
      toast.success("Added to department", {
        description: `${employeeName} has been added to ${deptName}.`,
      });

      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check for duplicate key error
      if (errorMessage.includes("duplicate key")) {
        toast.error("Already in department", {
          description: `${employeeName} is already a member of this department.`,
        });
      } else {
        toast.error("Failed to add to department", {
          description: errorMessage,
        });
      }
    }
  };

  const isLoading = loading.addEmployee;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[420px] rounded-xl p-0 overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <DialogHeader className="p-6">
            <DialogTitle className="text-xl font-semibold text-[#0F1327]">
              Add to Department
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="p-6 pt-0">
            {departmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !hasDepartments ? (
              // No departments message
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Departments Created Yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Please create a department first before adding employees to it.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="mt-2"
                >
                  Close
                </Button>
              </div>
            ) : (
              // Department selection form
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select a department to add{" "}
                  <span className="font-medium">{employeeName}</span> to:
                </p>

                {/* Show current departments if any */}
                {currentDepartments.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Current Department{currentDepartments.length > 1 ? "s" : ""}:
                        </p>
                        <p className="text-sm text-blue-700">
                          {currentDepartments.map((d) => d.name).join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={setSelectedDepartmentId}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept: Department) => {
                        const isCurrentDept = currentDepartmentIds.includes(
                          dept.departmentId
                        );
                        return (
                          <SelectItem
                            key={dept.departmentId}
                            value={dept.departmentId}
                            disabled={isCurrentDept}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span>{dept.name}</span>
                              {isCurrentDept && (
                                <span className="text-xs text-green-600 ml-2">
                                  ✓ Already member
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="px-6"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6"
                    disabled={isLoading || !selectedDepartmentId}
                  >
                    {isLoading ? "Adding..." : "Add to Department"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToDepartmentDialog;
