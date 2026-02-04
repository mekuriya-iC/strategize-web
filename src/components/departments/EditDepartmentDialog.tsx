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
import { useDepartmentMutations } from "@/hooks/departments/useDepartmentMutations";
import { GET_DEPARTMENT } from "@/lib/graphql/queries/departments";
import {
  GetDepartmentResponse,
  DepartmentQueryVariables,
} from "@/types/graphql";

interface EditDepartmentDialogProps {
  children: React.ReactNode;
  department: {
    id: string | number;
    departmentName: string;
    managedBy: string;
    division: string;
    members: number;
  };
  managers: Array<{ employeeId: string; fullName: string }>;
  divisions: Array<{ divisionId: string; name: string }>;
  allMembers: Array<{ employeeId: string; fullName: string }>;
  onEditSuccess?: () => void;
}

const EditDepartmentDialog: React.FC<EditDepartmentDialogProps> = ({
  children,
  department,
  managers,
  divisions,
  allMembers,
  onEditSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const { updateDepartment, loading } = useDepartmentMutations();

  // Form state
  const [departmentName, setDepartmentName] = useState<string>("");
  const [departmentManager, setDepartmentManager] = useState<
    string | undefined
  >("");
  const [selectedDivision, setSelectedDivision] = useState<string | undefined>(
    ""
  );
  const [departmentMembers, setDepartmentMembers] = useState<string[]>([]);
  const [currentMemberIds, setCurrentMemberIds] = useState<string[]>([]);

  // Query to get department details when dialog opens
  const { data: departmentData, loading: departmentLoading } = useQuery<
    GetDepartmentResponse,
    DepartmentQueryVariables
  >(GET_DEPARTMENT, {
    variables: { departmentId: String(department.id) },
    skip: !open, // Only run query when dialog is open
    fetchPolicy: "cache-and-network",
  });

  // Initialize form with department data when dialog opens
  useEffect(() => {
    if (open && department) {
      setDepartmentName(department.departmentName);

      // Find division ID by name - use undefined if not found to avoid empty string
      const division = divisions.find((d) => d.name === department.division);
      setSelectedDivision(division?.divisionId || undefined);
    }
  }, [open, department, divisions]);

  // Set manager from department query data (more reliable than matching by name)
  useEffect(() => {
    if (departmentData?.department?.manager) {
      setDepartmentManager(departmentData.department.manager.employeeId);
    } else if (departmentData?.department && !departmentData.department.manager) {
      // Department loaded but has no manager
      setDepartmentManager(undefined);
    }
  }, [departmentData]);

  // Load current members when department data is fetched
  useEffect(() => {
    if (departmentData?.department?.employees) {
      const memberIds = departmentData.department.employees.map(
        (emp) => emp.employeeId
      );
      setCurrentMemberIds(memberIds);
      setDepartmentMembers(memberIds); // Initialize with current members
    }
  }, [departmentData]);

  const handleMemberToggle = (memberId: string) => {
    setDepartmentMembers(
      departmentMembers.includes(memberId)
        ? departmentMembers.filter((m) => m !== memberId)
        : [...departmentMembers, memberId]
    );
  };

  const handleRemoveMember = (memberId: string) => {
    setDepartmentMembers(departmentMembers.filter((m) => m !== memberId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentName.trim()) {
      return;
    }

    try {
      await updateDepartment({
        input: {
          departmentId: String(department.id),
          name: departmentName.trim(),
          // Use null to explicitly remove division association, undefined if not changing
          divisionId: selectedDivision === undefined ? null : selectedDivision,
          managerId: departmentManager || undefined,
        },
        employeeIds: departmentMembers, // New member IDs
        currentEmployeeIds: currentMemberIds, // Current member IDs
      });

      setOpen(false);

      // Call the success callback to refresh data
      if (onEditSuccess) {
        onEditSuccess();
      }
    } catch (error) {
      console.error("Failed to update department:", error);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[320px] sm:max-w-[650px] rounded-xl p-0 overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <DialogHeader className="p-6">
            <div className="flex items-center justify-center relative">
              <DialogTitle className="text-xl font-semibold text-[#0F1327]">
                Edit Department
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Form */}
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            {/* Department Name and Manager Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <Input
                  placeholder="Learning Solutions"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full"
                  required
                  disabled={loading.update}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Manager
                </label>
                <Select
                  value={departmentManager || ""}
                  onValueChange={(value) =>
                    setDepartmentManager(value || undefined)
                  }
                  disabled={loading.update || managers.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      departmentLoading
                        ? "Loading..."
                        : managers.length === 0
                          ? departmentData?.department?.manager?.fullName || "No managers available"
                          : "Select Manager"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Show current manager from department data if not in managers list */}
                    {departmentData?.department?.manager &&
                      !managers.find(m => m.employeeId === departmentData.department?.manager?.employeeId) && (
                        <SelectItem
                          key={departmentData.department.manager.employeeId}
                          value={departmentData.department.manager.employeeId}
                        >
                          {departmentData.department.manager.fullName} (Current)
                        </SelectItem>
                      )}
                    {managers.map((manager) => (
                      <SelectItem
                        key={manager.employeeId}
                        value={manager.employeeId}
                      >
                        {manager.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Division */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division{" "}
                <span className="text-sm font-normal text-gray-500">
                  (Optional)
                </span>
              </label>
              <Select
                value={selectedDivision || "none"}
                onValueChange={(value) =>
                  setSelectedDivision(value === "none" ? undefined : value)
                }
                disabled={loading.update}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-gray-500">
                    None (No Division)
                  </SelectItem>
                  {divisions.map((division) => (
                    <SelectItem
                      key={division.divisionId}
                      value={division.divisionId}
                    >
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Member(s) - Note: This is simplified for now */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add/Remove Member(s)
              </label>
              <div className="border border-gray-300 rounded-md p-3 min-h-[100px] bg-white">
                {/* Selected Members Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {departmentMembers.map((memberId) => {
                    // First try to find the member in the department data (for current members)
                    const departmentMember =
                      departmentData?.department?.employees?.find(
                        (emp) => emp.employeeId === memberId
                      );
                    // Then try to find in allMembers (for newly added members)
                    const allMembersMember = allMembers.find(
                      (m) => m.employeeId === memberId
                    );
                    // Use department member name if available, otherwise use allMembers, fallback to ID
                    const memberName =
                      departmentMember?.fullName ||
                      allMembersMember?.fullName ||
                      memberId;

                    return (
                      <div
                        key={memberId}
                        className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                      >
                        <span>{memberName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(memberId)}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          disabled={loading.update}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Member Dropdown */}
                <Select
                  onValueChange={handleMemberToggle}
                  disabled={loading.update}
                >
                  <SelectTrigger className="w-full border-dashed border-gray-300">
                    <SelectValue placeholder="Add member(s)" />
                  </SelectTrigger>
                  <SelectContent>
                    {allMembers
                      .filter((m) => !departmentMembers.includes(m.employeeId))
                      .map((member) => (
                        <SelectItem
                          key={member.employeeId}
                          value={member.employeeId}
                        >
                          {member.fullName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-gray-500 mt-2">
                  {departmentLoading
                    ? "Loading current members..."
                    : `Current members: ${departmentMembers.length}. Use the dropdown above to add/remove members.`}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-6"
                disabled={loading.update}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6"
                disabled={
                  loading.update ||
                  departmentLoading ||
                  !departmentName.trim()
                }
              >
                {loading.update
                  ? "Updating..."
                  : departmentLoading
                    ? "Loading..."
                    : "Update Department"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDepartmentDialog;
