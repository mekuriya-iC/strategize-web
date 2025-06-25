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

interface AddDivisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divisionName: string;
  setDivisionName: (name: string) => void;
  divisionManager: string;
  setDivisionManager: (manager: string) => void;
  departments: string[];
  setDepartments: (departments: string[]) => void;
  managers: string[];
  allDepartments: string[];
  onSubmit: () => void;
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
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl text-center font-semibold">
            Add Division
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
              <label className="block mb-1 font-medium">Division Name</label>
              <Input
                placeholder="Enter division name"
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Division Manager</label>
              <Select
                value={divisionManager}
                onValueChange={setDivisionManager}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division manager" />
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
            <Select
              value={departments[0] || ""}
              onValueChange={(val) => setDepartments(val ? [val] : [])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add Department(s)" />
              </SelectTrigger>
              <SelectContent>
                {allDepartments.map((dep) => (
                  <SelectItem key={dep} value={dep}>
                    {dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              Add Division
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDivisionDialog;
