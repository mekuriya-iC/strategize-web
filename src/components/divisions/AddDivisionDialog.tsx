import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface Manager {
  id: string;
  name: string;
}

interface AddDivisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divisionName: string;
  setDivisionName: (name: string) => void;
  divisionManager: string;
  setDivisionManager: (managerId: string) => void;
  departments: string[];
  setDepartments: (departments: string[]) => void;
  managers: Manager[];
  allDepartments: string[];
  onSubmit: () => void;
  loading?: boolean;
}

const AddDivisionDialog: React.FC<AddDivisionDialogProps> = ({
  open,
  onOpenChange,
  divisionName,
  setDivisionName,
  divisionManager,
  setDivisionManager,
  departments,
  setDepartments,
  managers,
  allDepartments,
  onSubmit,
  loading = false,
}) => {
  const handleDepartmentToggle = (department: string) => {
    setDepartments(
      departments.includes(department)
        ? departments.filter((d) => d !== department)
        : [...departments, department]
    );
  };

  const handleRemoveDepartment = (department: string) => {
    setDepartments(departments.filter((d) => d !== department));
  };

  // Get selected manager name for display
  const selectedManagerName =
    managers.find((m) => m.id === divisionManager)?.name || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] sm:max-w-[650px] rounded-xl p-0 overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <DialogHeader className="p-6">
            <div className="flex items-center justify-center relative">
              <DialogTitle className="text-xl font-semibold text-[#0F1327]">
                Add Division
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Form */}
          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {/* Division Name and Manager Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division Name
                </label>
                <Input
                  placeholder="Operation Division"
                  value={divisionName}
                  onChange={(e) => setDivisionName(e.target.value)}
                  className="w-full"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division Manager
                </label>
                <Select
                  value={divisionManager}
                  onValueChange={setDivisionManager}
                  disabled={loading || managers.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Manager">
                      {selectedManagerName ||
                        (managers.length === 0
                          ? "No managers available"
                          : "Select Manager")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {managers.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No managers found. Please ensure there are employees
                        with MANAGER, ADMIN, or SUPER_ADMIN roles.
                      </div>
                    ) : (
                      managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} (ID: {manager.id})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {managers.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No managers available. Please create employees with
                    appropriate roles first.
                  </p>
                )}
              </div>
            </div>

            {/* Department(s) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department(s)
              </label>
              <div className="border border-gray-300 rounded-md p-3 min-h-[100px] bg-white">
                {/* Selected Department Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {departments.map((department) => (
                    <div
                      key={department}
                      className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                    >
                      <span>{department}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDepartment(department)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Department Dropdown */}
                <Select
                  onValueChange={handleDepartmentToggle}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full border-dashed border-gray-300">
                    <SelectValue placeholder="Add Department(s)" />
                  </SelectTrigger>
                  <SelectContent>
                    {allDepartments
                      .filter((d) => !departments.includes(d))
                      .map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="px-6"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6"
                disabled={
                  loading ||
                  !divisionName.trim() ||
                  !divisionManager ||
                  managers.length === 0
                }
              >
                {loading ? "Creating..." : "Add Division"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDivisionDialog;
