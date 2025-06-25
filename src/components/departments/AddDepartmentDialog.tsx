import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
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

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentName: string;
  setDepartmentName: (name: string) => void;
  departmentManager: string;
  setDepartmentManager: (manager: string) => void;
  departmentMembers: string[];
  setDepartmentMembers: (members: string[]) => void;
  managers: string[];
  allMembers: string[];
  onSubmit: () => void;
}

const AddDepartmentDialog: React.FC<AddDepartmentDialogProps> = ({
  open,
  onOpenChange,
  departmentName,
  setDepartmentName,
  departmentManager,
  setDepartmentManager,
  departmentMembers,
  setDepartmentMembers,
  managers,
  allMembers,
  onSubmit,
}) => {
  const handleMemberToggle = (member: string) => {
    setDepartmentMembers(
      departmentMembers.includes(member)
        ? departmentMembers.filter((m) => m !== member)
        : [...departmentMembers, member]
    );
  };

  const handleRemoveMember = (member: string) => {
    setDepartmentMembers(departmentMembers.filter((m) => m !== member));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl text-center font-semibold">
            Add Department
          </DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              ×
            </button>
          </DialogClose>
        </DialogHeader>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Department Name</label>
              <Input
                placeholder="Enter department name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">
                Department Manager
              </label>
              <Select
                value={departmentManager}
                onValueChange={setDepartmentManager}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager} value={manager}>
                      {manager}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Department(s)</label>
            <div className="border rounded-md px-2 py-2 min-h-[44px] flex flex-wrap gap-2 bg-white">
              {departmentMembers.length === 0 && (
                <span className="text-muted-foreground">Add member(s)</span>
              )}
              {departmentMembers.map((member) => (
                <span
                  key={member}
                  className="flex items-center bg-muted px-2 py-1 rounded-full text-sm"
                >
                  {member}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => handleRemoveMember(member)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <Select onValueChange={handleMemberToggle}>
                <SelectTrigger className="w-auto min-w-[150px]">
                  <SelectValue placeholder="Add member(s)" />
                </SelectTrigger>
                <SelectContent>
                  {allMembers
                    .filter((m) => !departmentMembers.includes(m))
                    .map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#3838EC] text-white">
              Add Department
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDepartmentDialog;
