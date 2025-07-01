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
import { useDivisionMutations } from "@/hooks/useDivisionMutations";

interface EditDivisionDialogProps {
  children: React.ReactNode;
  division: {
    id: string | number;
    divisionName: string;
    managedBy: string;
  };
  managers: Array<{ id: string; name: string }>;
}

const EditDivisionDialog: React.FC<EditDivisionDialogProps> = ({
  children,
  division,
  managers,
}) => {
  const [open, setOpen] = useState(false);
  const { updateDivision, loading } = useDivisionMutations();

  // Form state
  const [divisionName, setDivisionName] = useState("");
  const [divisionManager, setDivisionManager] = useState("");

  // Initialize form with division data when dialog opens
  useEffect(() => {
    if (open && division) {
      setDivisionName(division.divisionName);

      // Find manager ID by name
      const manager = managers.find((m) => m.name === division.managedBy);
      setDivisionManager(manager?.id || "");
    }
  }, [open, division, managers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!divisionName.trim() || !divisionManager) {
      return;
    }

    try {
      await updateDivision({
        input: {
          divisionId: String(division.id),
          name: divisionName.trim(),
          managerId: divisionManager,
        },
      });

      setOpen(false);
    } catch (error) {
      console.error("Failed to update division:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[450px] rounded-xl p-0 overflow-hidden">
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
                disabled={loading.update}
              />
            </div>

            {/* Division Manager */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division Manager
              </label>
              <Select
                value={divisionManager}
                onValueChange={setDivisionManager}
                disabled={loading.update}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
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
                disabled={loading.update}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6"
                disabled={
                  loading.update || !divisionName.trim() || !divisionManager
                }
              >
                {loading.update ? "Updating..." : "Update Division"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDivisionDialog;
