import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Objective } from "../objectives/ObjectiveTable";
import { Kpi } from "@/types/graphql";

interface RejectObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective | null;
  kpis: Kpi[];
  onReject: (
    objective: Objective,
    selectedKPIs: string[],
    reason: string
  ) => void;
}

export default function RejectObjectiveDialog({
  open,
  onOpenChange,
  objective,
  kpis,
  onReject,
}: RejectObjectiveDialogProps) {
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");

  // Get KPIs for the current objective
  const objectiveKPIs = kpis.filter(
    (kpi) => kpi.objective?.objectiveId === objective?.objectiveId
  );

  const handleKPIToggle = (kpiId: string) => {
    setSelectedKPIs((prev) =>
      prev.includes(kpiId)
        ? prev.filter((id) => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  const handleConfirm = () => {
    if (objective) {
      onReject(objective, selectedKPIs, rejectionReason);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedKPIs([]);
    setRejectionReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Reject Objective
          </DialogTitle>
      
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI Selection Section */}
          {objectiveKPIs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Select a KPI for Rejection (Optional)
              </h3>
              <div className="space-y-3">
                {objectiveKPIs.map((kpi) => (
                  <div key={kpi.kpiId} className="flex items-center space-x-2">
                    <Checkbox
                      id={kpi.kpiId}
                      checked={selectedKPIs.includes(kpi.kpiId)}
                      onCheckedChange={() => handleKPIToggle(kpi.kpiId)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={kpi.kpiId}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {kpi.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Reason Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Add a Rejection Reason
            </h3>
            <Textarea
              placeholder="Write..."
              value={rejectionReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRejectionReason(e.target.value)
              }
              className="min-h-[80px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
