"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useKPIMutations } from "@/hooks/useKPIMutations";
import { useKPI } from "@/hooks/useKPIs";
import {
  KpiWeightType,
  KpiTargetInput,
  Objective as GraphQLObjective,
} from "@/types/graphql";
import { toast } from "sonner";

interface KPIFormProps {
  objectiveId: string;
  kpiId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  objective?: GraphQLObjective; // Objective data for validation
}

export default function KPIForm({
  objectiveId,
  kpiId,
  onSuccess,
  onCancel,
  objective,
}: KPIFormProps) {
  const isEditing = Boolean(kpiId);
  const { createKpi, updateKpi, loading } = useKPIMutations();
  const { kpi, loading: kpiLoading } = useKPI(
    kpiId ? { kpiId } : { kpiId: "" }
  );

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    baseline: "",
    weight: "",
    weightType: "NUMBER" as KpiWeightType,
  });

  // Use a string for target during input to avoid prefilling 0
  const [targets, setTargets] = useState<
    Array<{ timeline: string; target: string }>
  >([{ timeline: "", target: "" }]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing KPI data when editing
  useEffect(() => {
    if (isEditing && kpi && !kpiLoading) {
      setFormData({
        name: kpi.name,
        baseline: kpi.baseline.toString(),
        weight: kpi.weight.toString(),
        weightType: kpi.weightType,
      });
      setTargets(
        kpi.targets.length > 0
          ? kpi.targets.map((t) => ({
              timeline: t.timeline,
              target: t.target.toString(),
            }))
          : [{ timeline: "", target: "" }]
      );
    }
  }, [isEditing, kpi, kpiLoading]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTargetChange = (
    index: number,
    field: "timeline" | "target",
    value: string
  ) => {
    setTargets((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const addTarget = () => {
    setTargets((prev) => [...prev, { timeline: "", target: "" }]);
  };

  const removeTarget = (index: number) => {
    if (targets.length > 1) {
      setTargets((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("KPI name is required");
      return false;
    }

    if (!formData.baseline || isNaN(Number(formData.baseline))) {
      toast.error("Please enter a valid baseline value");
      return false;
    }

    if (!formData.weight || isNaN(Number(formData.weight))) {
      toast.error("Please enter a valid weight value");
      return false;
    }

    const validTargets = targets
      .map((t) => ({ ...t, target: Number(t.target) }))
      .filter((t) => t.timeline.trim() && !isNaN(t.target) && t.target > 0);

    if (validTargets.length === 0) {
      toast.error(
        "Please add at least one valid target with a timeline and target value greater than 0"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const validTargets = targets
        .map((t) => ({ ...t, target: Number(t.target) }))
        .filter((t) => t.timeline.trim() && !isNaN(t.target) && t.target > 0);

      const kpiData = {
        name: formData.name.trim(),
        baseline: Number(formData.baseline),
        weight: Number(formData.weight),
        weightType: formData.weightType,
        targets: validTargets as KpiTargetInput[],
        objectiveId,
      };

      // Debug logging
      console.log("KPI Data being sent:", kpiData);
      console.log("Valid targets:", validTargets);
      console.log("Objective ID:", objectiveId);

      // Additional validation
      if (!objectiveId) {
        toast.error(
          "Objective ID is missing. Please refresh the page and try again."
        );
        return;
      }

      if (!objective) {
        toast.error(
          "Objective data is missing. Please refresh the page and try again."
        );
        return;
      }

      if (isNaN(kpiData.baseline) || isNaN(kpiData.weight)) {
        toast.error("Baseline and weight must be valid numbers.");
        return;
      }

      if (isEditing && kpiId) {
        await updateKpi({
          input: {
            kpiId,
            ...kpiData,
          },
        });
        toast.success("KPI updated successfully!");
      } else {
        await createKpi({
          input: kpiData,
        });
        toast.success("KPI created successfully!");
      }

      onSuccess();
    } catch (error: unknown) {
      const err = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(`Error ${isEditing ? "updating" : "creating"} KPI:`, error);

      // Enhanced error logging
      if (err?.networkError) {
        console.error("Network error:", err.networkError);
      }
      if (err?.graphQLErrors) {
        console.error("GraphQL errors:", err.graphQLErrors);
      }

      // More specific error messages
      let errorMessage = `Failed to ${
        isEditing ? "update" : "create"
      } KPI. Please try again.`;

      if (typeof err?.message === "string") {
        errorMessage += ` Error: ${err.message}`;
      }

      if (err?.graphQLErrors && err.graphQLErrors.length > 0) {
        const graphQLError = err.graphQLErrors[0];
        errorMessage = `GraphQL Error: ${graphQLError.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && kpiLoading) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-[#3F3F46]">
          {isEditing ? "Edit KPI" : "Add New KPI"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>KPI Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">KPI Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter KPI name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="baseline">Baseline Value *</Label>
                <Input
                  id="baseline"
                  type="number"
                  step="0.01"
                  value={formData.baseline}
                  onChange={(e) =>
                    handleInputChange("baseline", e.target.value)
                  }
                  placeholder="Enter baseline value"
                  required
                />
              </div>

              <div>
                <Label htmlFor="weight">Weight *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="Enter weight"
                  required
                />
              </div>

              <div>
                <Label htmlFor="weightType">Weight Type *</Label>
                <Select
                  value={formData.weightType}
                  onValueChange={(value: KpiWeightType) =>
                    handleInputChange("weightType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weight type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMBER">Number</SelectItem>
                    <SelectItem value="PERCENT">Percent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targets */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {targets.map((target, index) => (
                <div
                  key={index}
                  className="flex items-end gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <Label htmlFor={`timeline-${index}`}>Timeline</Label>
                    <Input
                      id={`timeline-${index}`}
                      value={target.timeline}
                      onChange={(e) =>
                        handleTargetChange(index, "timeline", e.target.value)
                      }
                      placeholder="e.g., Q1 2024, 2024/25"
                    />
                  </div>

                  <div className="flex-1">
                    <Label htmlFor={`target-${index}`}>Target Value</Label>
                    <Input
                      id={`target-${index}`}
                      type="number"
                      step="0.01"
                      value={target.target}
                      onChange={(e) =>
                        handleTargetChange(index, "target", e.target.value)
                      }
                      placeholder="Enter target value"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeTarget(index)}
                    disabled={targets.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addTarget}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Target
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#3838EC] hover:bg-[#2e2ed6]"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update KPI"
              : "Create KPI"}
          </Button>
        </div>
      </form>
    </div>
  );
}
