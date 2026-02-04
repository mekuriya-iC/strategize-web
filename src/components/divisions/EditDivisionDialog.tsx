import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useQuery } from "@apollo/client";
import { useDivisionMutations } from "@/hooks/divisions/useDivisionMutations";
import { useDepartmentMutations } from "@/hooks/departments/useDepartmentMutations";
import { GET_DIVISION_BASIC } from "@/lib/graphql/queries/divisions";
import type { GetDivisionResponse, DivisionQueryVariables } from "@/types/graphql";

interface Department {
  departmentId: string;
  name: string;
  divisionId?: string | null;
}

interface EditDivisionDialogProps {
  children: React.ReactNode;
  division: {
    id: string | number;
    divisionName: string;
    managedBy: string;
  };
  managers: Array<{ id: string; name: string }>;
  allDepartments?: Department[];
  currentDepartmentIds?: string[];
  onEditSuccess?: () => void;
}

const EditDivisionDialog: React.FC<EditDivisionDialogProps> = ({
  children,
  division,
  managers,
  allDepartments = [],
  currentDepartmentIds = [],
  onEditSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const { updateDivision, loading } = useDivisionMutations();
  const { updateDepartment, loading: deptLoading } = useDepartmentMutations();

  // Query to get division details when dialog opens
  const { data: divisionData, loading: divisionLoading } = useQuery<
    GetDivisionResponse,
    DivisionQueryVariables
  >(GET_DIVISION_BASIC, {
    variables: { divisionId: String(division.id) },
    skip: !open, // Only run query when dialog is open
    fetchPolicy: "cache-and-network",
  });

  // Form state
  const [divisionName, setDivisionName] = useState("");
  const [divisionManager, setDivisionManager] = useState("");
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);

  // Initialize form with division data when dialog opens
  useEffect(() => {
    if (open && division) {
      setDivisionName(division.divisionName);
      // Initialize with current departments
      setSelectedDepartmentIds(currentDepartmentIds);
    }
  }, [open, division, currentDepartmentIds]);

  // Set manager from division query data (more reliable than matching by name)
  useEffect(() => {
    if (divisionData?.division?.manager) {
      setDivisionManager(divisionData.division.manager.employeeId);
    } else if (divisionData?.division && !divisionData.division.manager) {
      // Division loaded but has no manager
      setDivisionManager("");
    }
  }, [divisionData]);

  // Get departments that can be added (not already in another division or in this division)
  const availableDepartments = allDepartments.filter(
    (dept) =>
      !dept.divisionId || // No division assigned
      dept.divisionId === String(division.id) || // Already in this division
      selectedDepartmentIds.includes(dept.departmentId) // Currently selected
  );

  // Get currently selected department objects for display
  const selectedDepartments = allDepartments.filter((dept) =>
    selectedDepartmentIds.includes(dept.departmentId)
  );

  const handleAddDepartment = (departmentId: string) => {
    if (!selectedDepartmentIds.includes(departmentId)) {
      setSelectedDepartmentIds([...selectedDepartmentIds, departmentId]);
    }
  };

  const handleRemoveDepartment = (departmentId: string) => {
    setSelectedDepartmentIds(
      selectedDepartmentIds.filter((id) => id !== departmentId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!divisionName.trim() || !divisionManager) {
      return;
    }

    try {
      // Update division basic info
      await updateDivision({
        input: {
          divisionId: String(division.id),
          name: divisionName.trim(),
          managerId: divisionManager,
        },
      });

      // Handle department changes
      const departmentsToAdd = selectedDepartmentIds.filter(
        (id) => !currentDepartmentIds.includes(id)
      );
      const departmentsToRemove = currentDepartmentIds.filter(
        (id) => !selectedDepartmentIds.includes(id)
      );

      // Add departments to this division
      if (departmentsToAdd.length > 0) {
        const addPromises = departmentsToAdd.map((deptId) =>
          updateDepartment({
            input: {
              departmentId: deptId,
              divisionId: String(division.id),
            },
          })
        );
        await Promise.all(addPromises);
      }

      // Remove departments from this division (set divisionId to null)
      if (departmentsToRemove.length > 0) {
        const removePromises = departmentsToRemove.map((deptId) =>
          updateDepartment({
            input: {
              departmentId: deptId,
              divisionId: null,
            },
          })
        );
        await Promise.all(removePromises);
      }

      setOpen(false);

      // Call success callback to refresh data
      if (onEditSuccess) {
        onEditSuccess();
      }
    } catch (error) {
      console.error("Failed to update division:", error);
    }
  };

  const isLoading = loading.update || deptLoading.update || divisionLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[550px] rounded-xl p-0 overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <DialogHeader className="p-6">
            <DialogTitle className="text-xl font-semibold text-[#0F1327]">
              Edit Division
            </DialogTitle>
          </DialogHeader>

          {/* Form */}
          <form className="p-6 pt-0 space-y-4" onSubmit={handleSubmit}>
            {/* Division Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division Name
              </label>
              <Input
                placeholder="Division Name"
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                className="w-full"
                required
                disabled={isLoading}
              />
            </div>

            {/* Division Director */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division Director
              </label>
              <Select
                value={divisionManager}
                onValueChange={setDivisionManager}
                disabled={isLoading || managers.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    divisionLoading
                      ? "Loading..."
                      : managers.length === 0
                        ? divisionData?.division?.manager?.fullName || "No directors available"
                        : "Select Director"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {/* Show current manager from division data if not in managers list */}
                  {divisionData?.division?.manager &&
                    !managers.find(m => m.id === divisionData.division?.manager?.employeeId) && (
                      <SelectItem
                        key={divisionData.division.manager.employeeId}
                        value={divisionData.division.manager.employeeId}
                      >
                        {divisionData.division.manager.fullName} (Current)
                      </SelectItem>
                    )}
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departments
              </label>
              <div className="border border-gray-300 rounded-md p-3 min-h-[100px] bg-white">
                {/* Selected Department Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedDepartments.map((dept) => (
                    <div
                      key={dept.departmentId}
                      className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                    >
                      <span>{dept.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDepartment(dept.departmentId)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {selectedDepartments.length === 0 && (
                    <span className="text-gray-400 text-sm">
                      No departments assigned
                    </span>
                  )}
                </div>

                {/* Add Department Dropdown */}
                <Select
                  onValueChange={handleAddDepartment}
                  disabled={isLoading}
                  value=""
                >
                  <SelectTrigger className="w-full border-dashed border-gray-300">
                    <SelectValue placeholder="Add Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments
                      .filter((d) => !selectedDepartmentIds.includes(d.departmentId))
                      .map((dept) => (
                        <SelectItem
                          key={dept.departmentId}
                          value={dept.departmentId}
                        >
                          {dept.name}
                          {dept.divisionId && dept.divisionId !== String(division.id) && (
                            <span className="text-gray-400 ml-2">(in another division)</span>
                          )}
                        </SelectItem>
                      ))}
                    {availableDepartments.filter(
                      (d) => !selectedDepartmentIds.includes(d.departmentId)
                    ).length === 0 && (
                        <div className="p-2 text-sm text-gray-500">
                          No more departments available
                        </div>
                      )}
                  </SelectContent>
                </Select>
              </div>
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
                disabled={isLoading || !divisionName.trim() || !divisionManager}
              >
                {isLoading ? "Updating..." : "Update Division"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDivisionDialog;
