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
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";
import { useStrategicPeriods } from "@/hooks/objectives/useStrategicPeriods";
import { Objective, ObjectiveType, ObjectiveStatus } from "@/types/graphql";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";

interface EditObjectiveDialogProps {
  children?: React.ReactNode;
  objective: Objective;
  onEditSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const EditObjectiveDialog: React.FC<EditObjectiveDialogProps> = ({
  children,
  objective,
  onEditSuccess,
  open: externalOpen,
  onOpenChange: setExternalOpen,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;
  const { updateObjective, loading } = useObjectiveMutations();
  const { strategicPeriods, loading: periodsLoading } = useStrategicPeriods();
  const user = useAuthStore((state) => state.user);

  // Form state
  const [objectiveName, setObjectiveName] = useState("");
  const [objectiveType, setObjectiveType] =
    useState<ObjectiveType>("CORPORATE");
  const [objectiveStatus, setObjectiveStatus] =
    useState<ObjectiveStatus>("NOT_SUBMITTED");
  const [strategicPeriodId, setStrategicPeriodId] = useState("");

  // Check if user is at corporate level (ADMIN or SUPER_ADMIN)
  const isCorporateUser =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isNonCorporateUser = !isCorporateUser;

  // Initialize form with objective data when dialog opens
  useEffect(() => {
    if (open && objective) {
      setObjectiveName(objective.name);
      setObjectiveType(objective.type);
      setObjectiveStatus(objective.status);
      setStrategicPeriodId(objective.strategicPeriod?.strategicPeriodId || "");
    }
  }, [open, objective]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For non-corporate users, only validate name since other fields are disabled
    if (!objectiveName.trim()) {
      toast.error("Please fill in the objective name");
      return;
    }

    // For corporate users, validate strategic period as well
    if (isCorporateUser && !strategicPeriodId) {
      toast.error("Please select a strategic period");
      return;
    }

    try {
      // Normalize legacy UI value if it ever sneaks in
      const normalizedType =
        (objectiveType as unknown as string) === "INDIVIDUAL"
          ? ("PERSONNEL" as ObjectiveType)
          : objectiveType;

      // For non-corporate users, keep original status and strategic period
      const updateInput = {
        objectiveId: objective.objectiveId,
        name: objectiveName.trim(),
        type: normalizedType,
        status: isNonCorporateUser ? objective.status : objectiveStatus,
        strategicPeriodId: isNonCorporateUser
          ? objective.strategicPeriod?.strategicPeriodId || ""
          : strategicPeriodId,
      };

      await updateObjective({
        input: updateInput,
      });

      toast.success("Objective updated successfully");
      setOpen(false);
      onEditSuccess?.();
    } catch (error) {
      console.error("Failed to update objective:", error);
      toast.error("Failed to update objective");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    // Reset form to original values
    if (objective) {
      setObjectiveName(objective.name);
      setObjectiveType(objective.type);
      setObjectiveStatus(objective.status);
      setStrategicPeriodId(objective.strategicPeriod?.strategicPeriodId || "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[520px] rounded-xl p-0 overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <DialogHeader className="p-6">
            <DialogTitle className="text-xl font-semibold text-[#0F1327]">
              Edit Objective
            </DialogTitle>
          </DialogHeader>

          {/* Form */}
          <form className="p-6 pt-0 space-y-4" onSubmit={handleSubmit}>
            {/* Objective Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objective Name *
              </label>
              <Input
                placeholder="Enter objective name"
                value={objectiveName}
                onChange={(e) => setObjectiveName(e.target.value)}
                className="w-full"
                required
                disabled={loading}
              />
            </div>

            {/* Type and Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <Select
                  value={objectiveType}
                  onValueChange={(value: ObjectiveType) =>
                    setObjectiveType(value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORPORATE">Corporate</SelectItem>
                    <SelectItem value="DIVISION">Division</SelectItem>
                    <SelectItem value="DEPARTMENT">Department</SelectItem>
                    <SelectItem value="PERSONNEL">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <Select
                  value={objectiveStatus}
                  onValueChange={(value: ObjectiveStatus) =>
                    setObjectiveStatus(value)
                  }
                  disabled={loading || isNonCorporateUser}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_SUBMITTED">Not Submitted</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                {isNonCorporateUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    Status is managed by the approval process
                  </p>
                )}
              </div>
            </div>

            {/* Strategic Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strategic Period *
              </label>
              <Select
                value={strategicPeriodId}
                onValueChange={setStrategicPeriodId}
                disabled={loading || periodsLoading || isNonCorporateUser}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Strategic Period" />
                </SelectTrigger>
                <SelectContent>
                  {periodsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading periods...
                    </SelectItem>
                  ) : (
                    strategicPeriods.map((period) => (
                      <SelectItem
                        key={period.strategicPeriodId}
                        value={period.strategicPeriodId}
                      >
                        {new Date(period.startDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            year: "numeric",
                          }
                        )}{" "}
                        -{" "}
                        {new Date(period.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        ({period.length}{" "}
                        {period.length === 1 ? "year" : "years"})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {isNonCorporateUser && (
                <p className="text-xs text-gray-500 mt-1">
                  Strategic period is inherited from the parent objective
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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
                  periodsLoading ||
                  !objectiveName.trim() ||
                  (isCorporateUser && !strategicPeriodId)
                }
              >
                {loading ? "Updating..." : "Update Objective"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditObjectiveDialog;
