import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentName: string;
  setDepartmentName: (name: string) => void;
  departmentManager: string;
  setDepartmentManager: (manager: string) => void;
  selectedDivision: string;
  setSelectedDivision: (division: string) => void;
  departmentMembers: string[];
  setDepartmentMembers: (members: string[]) => void;
  managers: Array<{ employeeId: string; fullName: string }>;
  divisions: Array<{ divisionId: string; name: string }>;
  allMembers: Array<{ employeeId: string; fullName: string }>;
  onSubmit: () => void;
  loading?: boolean;
}

const AddDepartmentDialog: React.FC<AddDepartmentDialogProps> = ({
  open,
  onOpenChange,
  departmentName,
  setDepartmentName,
  departmentManager,
  setDepartmentManager,
  selectedDivision,
  setSelectedDivision,
  departmentMembers,
  setDepartmentMembers,
  managers = [],
  divisions = [],
  allMembers = [],
  onSubmit,
  loading = false,
}) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] sm:max-w-[650px] rounded-xl p-0 overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <DialogHeader className="p-6 ">
            <div className="flex items-center justify-center relative">
              <DialogTitle className="text-xl font-semibold text-[#0F1327]">
                Add Department
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
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Manager
                </label>
                <SearchableSelect
                  value={departmentManager}
                  onValueChange={setDepartmentManager}
                  placeholder="Select Manager"
                  searchPlaceholder="Search managers..."
                  emptyMessage={managers.length === 0 && !isAdmin ? "No managers available. Contact an admin to add employees." : "No managers found"}
                  disabled={loading}
                  options={managers.map((manager) => ({
                    value: manager.employeeId,
                    label: manager.fullName,
                  }))}
                  customContent={
                    managers.length === 0 && isAdmin ? (
                      <div className="px-2 py-1.5 pointer-events-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10 pointer-events-auto"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenChange(false);
                            router.push("/dashboard/employees?action=add");
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          New Manager
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
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
              <SearchableSelect
                value={selectedDivision}
                onValueChange={setSelectedDivision}
                placeholder="Select Division (Optional)"
                searchPlaceholder="Search divisions..."
                emptyMessage={divisions.length === 0 && !isAdmin ? "No divisions available. Contact an admin to create one." : "No divisions found"}
                disabled={loading}
                clearable
                options={divisions.map((division) => ({
                  value: division.divisionId,
                  label: division.name,
                }))}
                customContent={
                  divisions.length === 0 && isAdmin ? (
                    <div className="px-2 py-1.5 pointer-events-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10 pointer-events-auto"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenChange(false);
                          router.push("/dashboard/divisions?action=add");
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Division
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            </div>

            {/* Member(s) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member(s)
              </label>
              <div className="border border-gray-300 rounded-md p-3 min-h-[100px] bg-white">
                {/* Selected Members Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {departmentMembers.map((memberId) => {
                    const member = allMembers.find(
                      (m) => m.employeeId === memberId
                    );
                    return (
                      <div
                        key={memberId}
                        className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                      >
                        <span>{member?.fullName || memberId}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(memberId)}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Member Dropdown */}
                <Select onValueChange={handleMemberToggle} disabled={loading}>
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
                disabled={loading || !departmentName.trim()}
              >
                {loading ? "Adding..." : "Add Department"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDepartmentDialog;
