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
import { useCompetencyMutations } from "@/hooks/competencies/useCompetencies";
import { toast } from "sonner";

interface CreateIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competencyId: string;
  competencyName?: string;
}

export default function CreateIndicatorDialog({
  open,
  onOpenChange,
  competencyId,
  competencyName,
}: CreateIndicatorDialogProps) {
  const [description, setDescription] = useState("");
  const [ratingScaleMin, setRatingScaleMin] = useState("1");
  const [ratingScaleMax, setRatingScaleMax] = useState("5");
  const [loading, setLoading] = useState(false);

  const organizationId = getOrganizationId();
  const { createIndicator } = useCompetencyMutations(organizationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description) {
      toast.error("Please enter a description");
      return;
    }

    if (!organizationId) {
      toast.error("Organization context is missing");
      return;
    }

    const min = parseInt(ratingScaleMin);
    const max = parseInt(ratingScaleMax);

    if (min >= max) {
      toast.error("Maximum rating must be greater than minimum");
      return;
    }

    setLoading(true);

    try {
      await createIndicator({
        competencyId,
        description,
        ratingScaleMin: min,
        ratingScaleMax: max,
        organizationId: getOrganizationId(),
      });

      toast.success("Indicator created successfully");
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create indicator");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setRatingScaleMin("1");
    setRatingScaleMax("5");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Indicator</DialogTitle>
          {competencyName && (
            <p className="text-sm text-gray-600 mt-1">For: {competencyName}</p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Indicator Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Aligns team priorities with organizational objectives"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min">Min Rating</Label>
              <Input
                id="min"
                type="number"
                value={ratingScaleMin}
                onChange={(e) => setRatingScaleMin(e.target.value)}
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max">Max Rating</Label>
              <Input
                id="max"
                type="number"
                value={ratingScaleMax}
                onChange={(e) => setRatingScaleMax(e.target.value)}
                min="1"
                max="10"
              />
            </div>
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
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
