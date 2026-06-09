"use client";

import { useState } from "react";
import { getOrganizationId } from "@/lib/constants/organization";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEvaluationCycleMutations } from "@/hooks/evaluations/useEvaluationCycles";
import { EvaluationCycleStatus } from "@/types/evaluation";

import { toast } from "sonner";

interface CreateEvaluationCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveCycle?: boolean;
}

export default function CreateEvaluationCycleDialog({
  open,
  onOpenChange,
  hasActiveCycle = false,
}: CreateEvaluationCycleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalEvaluationWeight, setTotalEvaluationWeight] = useState("25");
  const [loading, setLoading] = useState(false);

  const { createCycle } = useEvaluationCycleMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasActiveCycle) {
      toast.error(
        "Complete the active evaluation cycle before creating another one.",
      );
      return;
    }

    if (!name || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    const weight = parseFloat(totalEvaluationWeight);
    if (isNaN(weight) || weight < 1 || weight > 100) {
      toast.error("Total evaluation weight must be between 1% and 100%");
      return;
    }

    setLoading(true);

    try {
      await createCycle({
        name,
        description,
        startDate,
        endDate,
        status: EvaluationCycleStatus.ACTIVE,
        organizationId: getOrganizationId(),
        totalEvaluationWeight: parseFloat(totalEvaluationWeight),
      });

      toast.success("Evaluation cycle created successfully");
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create evaluation cycle");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setTotalEvaluationWeight("25");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Evaluation Cycle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Cycle Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q2 2025 Performance Review"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this evaluation cycle"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalEvaluationWeight">
              Total 360 Evaluation Weight <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="totalEvaluationWeight"
                type="number"
                value={totalEvaluationWeight}
                onChange={(e) => setTotalEvaluationWeight(e.target.value)}
                min="1"
                max="100"
                step="0.01"
                required
                className="flex-1"
              />
              <span className="text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-500">
              Total weight for 360 evaluation. All enabled evaluator types must sum to this value. (Default: 25%)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || hasActiveCycle}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Creating..." : "Create Cycle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
